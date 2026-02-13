/**
 * 业务工具函数
 * 
 * 提供跨模块复用的业务逻辑函数
 */

import { Decimal } from '@prisma/client/runtime/library';

// ============================================================
// 柜型计算
// ============================================================

/**
 * 柜型容积常量（立方米）
 */
export const CONTAINER_VOLUMES = {
  TWENTY_FOOT: 28,      // 20尺柜
  FORTY_FOOT: 58,       // 40尺柜
  FORTY_FOOT_HQ: 68,    // 40尺高柜
} as const;

/**
 * 柜型计算结果
 */
export interface ContainerCalculationResult {
  container20ft: number;
  container40ft: number;
  container40hq: number;
  bulkCargo: number;
}

/**
 * 计算柜型数量
 * 
 * 根据总体积计算各种柜型的数量
 * 算法: 优先填充 40尺高柜 → 40尺柜 → 20尺柜 → 剩余为散货
 * 
 * @param totalVolume - 总体积（立方米）
 * @returns 各类型柜的数量
 * @throws 如果体积为负数或非法值
 * 
 * @example
 * ```typescript
 * const result = calculateContainers(150);
 * // { container40hq: 2, container40ft: 0, container20ft: 0, bulkCargo: 14 }
 * ```
 */
export function calculateContainers(totalVolume: number): ContainerCalculationResult {
  // 参数验证
  if (totalVolume < 0) {
    throw new Error('总体积不能为负数');
  }
  if (!isFinite(totalVolume)) {
    throw new Error('总体积必须是有效数字');
  }

  let remainingVolume = totalVolume;

  const result: ContainerCalculationResult = {
    container40hq: 0,
    container40ft: 0,
    container20ft: 0,
    bulkCargo: 0,
  };

  // 优先填充40尺高柜
  if (remainingVolume >= CONTAINER_VOLUMES.FORTY_FOOT_HQ) {
    result.container40hq = Math.floor(remainingVolume / CONTAINER_VOLUMES.FORTY_FOOT_HQ);
    remainingVolume = remainingVolume % CONTAINER_VOLUMES.FORTY_FOOT_HQ;
  }

  // 填充40尺柜
  if (remainingVolume >= CONTAINER_VOLUMES.FORTY_FOOT) {
    result.container40ft = Math.floor(remainingVolume / CONTAINER_VOLUMES.FORTY_FOOT);
    remainingVolume = remainingVolume % CONTAINER_VOLUMES.FORTY_FOOT;
  }

  // 填充20尺柜
  if (remainingVolume >= CONTAINER_VOLUMES.TWENTY_FOOT) {
    result.container20ft = Math.floor(remainingVolume / CONTAINER_VOLUMES.TWENTY_FOOT);
    remainingVolume = remainingVolume % CONTAINER_VOLUMES.TWENTY_FOOT;
  }

  // 剩余为散货
  result.bulkCargo = Number(remainingVolume.toFixed(2));

  return result;
}

// ============================================================
// 金额计算
// ============================================================

/**
 * 明细项汇总配置
 */
export interface SummaryFieldConfig {
  sourceField: string;              // 源字段名
  destField: string;                // 目标字段名
  type: 'sum' | 'multiply';         // 计算类型
  multiplyFields?: [string, string]; // 乘法的两个字段
}

/**
 * 通用单据明细汇总函数
 * 
 * @param prismaClient - Prisma 客户端
 * @param modelName - 明细表模型名（如 'salesContractItem'）
 * @param parentIdField - 父单据ID字段名（如 'salesContractId'）
 * @param parentId - 父单据ID值
 * @param fields - 要汇总的字段配置
 * @returns 汇总结果对象
 * 
 * @example
 * ```typescript
 * const summary = await calculateDocumentSummary(
 *   prisma,
 *   'salesContractItem',
 *   'salesContractId',
 *   contractId,
 *   [
 *     { sourceField: 'quantity', destField: 'totalQuantity', type: 'sum' },
 *     { sourceField: 'amount', destField: 'totalAmount', type: 'sum' },
 *     { 
 *       sourceField: null, 
 *       destField: 'totalAmount', 
 *       type: 'multiply',
 *       multiplyFields: ['quantity', 'unitPrice']
 *     }
 *   ]
 * );
 * ```
 */
export async function calculateDocumentSummary(
  prismaClient: any,
  modelName: string,
  parentIdField: string,
  parentId: string,
  fields: SummaryFieldConfig[]
): Promise<Record<string, number>> {
  const items = await prismaClient[modelName].findMany({
    where: {
      [parentIdField]: parentId,
      deletedAt: null,
    },
  });

  const result: Record<string, Decimal> = {};

  // 初始化所有字段为 0
  for (const field of fields) {
    result[field.destField] = new Decimal(0);
  }

  // 遍历明细项计算
  for (const item of items) {
    for (const field of fields) {
      if (field.type === 'sum') {
        const value = new Decimal(item[field.sourceField] || 0);
        result[field.destField] = result[field.destField].add(value);
      } else if (field.type === 'multiply' && field.multiplyFields) {
        const [field1, field2] = field.multiplyFields;
        const value1 = new Decimal(item[field1] || 0);
        const value2 = new Decimal(item[field2] || 0);
        result[field.destField] = result[field.destField].add(value1.mul(value2));
      }
    }
  }

  // 转换为普通数字
  const finalResult: Record<string, number> = {};
  for (const [key, value] of Object.entries(result)) {
    finalResult[key] = value.toNumber();
  }

  return finalResult;
}

/**
 * 汇总明细项金额
 * 
 * @param items - 明细项数组
 * @param quantityField - 数量字段名，默认 'quantity'
 * @param priceField - 单价字段名，默认 'unitPrice'
 * @returns 总金额
 * 
 * @example
 * ```typescript
 * const total = sumItemAmounts([
 *   { quantity: 10, unitPrice: 5.5 },
 *   { quantity: 20, unitPrice: 3.2 }
 * ]);
 * // 119
 * ```
 */
export function sumItemAmounts(
  items: any[],
  quantityField = 'quantity',
  priceField = 'unitPrice'
): number {
  let total = new Decimal(0);

  for (const item of items) {
    const quantity = new Decimal(item[quantityField] || 0);
    const price = new Decimal(item[priceField] || 0);
    total = total.add(quantity.mul(price));
  }

  return total.toNumber();
}

/**
 * 汇总明细项指定字段
 * 
 * @param items - 明细项数组
 * @param field - 要汇总的字段名
 * @returns 汇总值
 * 
 * @example
 * ```typescript
 * const totalWeight = sumItemField(items, 'weight');
 * ```
 */
export function sumItemField(items: any[], field: string): number {
  let total = new Decimal(0);

  for (const item of items) {
    total = total.add(new Decimal(item[field] || 0));
  }

  return total.toNumber();
}

/**
 * 计算汇总数据（通用）
 * 
 * @param items - 明细项数组
 * @param config - 汇总配置
 * @returns 汇总结果
 * 
 * @example
 * ```typescript
 * const summary = calculateSummary(items, {
 *   amount: { type: 'multiply', fields: ['quantity', 'unitPrice'] },
 *   quantity: { type: 'sum', field: 'quantity' },
 *   weight: { type: 'sum', field: 'weight' },
 *   count: { type: 'count' }
 * });
 * ```
 */
export function calculateSummary(
  items: any[],
  config: Record<string, { type: 'sum' | 'multiply' | 'count'; field?: string; fields?: string[] }>
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const [key, cfg] of Object.entries(config)) {
    if (cfg.type === 'count') {
      result[key] = items.length;
    } else if (cfg.type === 'sum' && cfg.field) {
      result[key] = sumItemField(items, cfg.field);
    } else if (cfg.type === 'multiply' && cfg.fields) {
      result[key] = sumItemAmounts(items, cfg.fields[0], cfg.fields[1]);
    }
  }

  return result;
}

// ============================================================
// 状态流转验证
// ============================================================

/**
 * 单据状态枚举
 */
export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

/**
 * 审批状态枚举
 */
export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * 状态流转配置
 */
export interface StatusTransitionConfig {
  /** 允许的状态转换映射 */
  transitions: Record<string, string[]>;
  /** 自定义验证规则 */
  customRules?: Array<{
    from: string;
    to: string;
    validate: (context: any) => boolean | string;
  }>;
}

/**
 * 默认单据状态流转规则
 */
export const DEFAULT_STATUS_TRANSITIONS: Record<string, string[]> = {
  [DocumentStatus.DRAFT]: [DocumentStatus.PENDING, DocumentStatus.CANCELLED],
  [DocumentStatus.PENDING]: [DocumentStatus.APPROVED, DocumentStatus.DRAFT, DocumentStatus.CANCELLED, DocumentStatus.REJECTED],
  [DocumentStatus.APPROVED]: [DocumentStatus.IN_PROGRESS, DocumentStatus.CANCELLED],
  [DocumentStatus.IN_PROGRESS]: [DocumentStatus.COMPLETED, DocumentStatus.CANCELLED],
  [DocumentStatus.COMPLETED]: [],
  [DocumentStatus.CANCELLED]: [],
  [DocumentStatus.REJECTED]: [DocumentStatus.DRAFT],
};

/**
 * 验证状态流转
 * 
 * @param currentStatus - 当前状态
 * @param newStatus - 目标状态
 * @param config - 状态流转配置（可选）
 * @param context - 额外上下文（用于自定义验证）
 * @throws 如果状态转换不合法
 * 
 * @example
 * ```typescript
 * validateStatusTransition('DRAFT', 'PENDING');
 * 
 * // 带自定义规则
 * validateStatusTransition('APPROVED', 'IN_PROGRESS', {
 *   transitions: DEFAULT_STATUS_TRANSITIONS,
 *   customRules: [{
 *     from: 'APPROVED',
 *     to: 'IN_PROGRESS',
 *     validate: (ctx) => ctx.approvalStatus === 'APPROVED' || '必须审核通过'
 *   }]
 * }, { approvalStatus: 'APPROVED' });
 * ```
 */
export function validateStatusTransition(
  currentStatus: string,
  newStatus: string,
  config?: StatusTransitionConfig,
  context?: any
): void {
  const transitions = config?.transitions || DEFAULT_STATUS_TRANSITIONS;
  const allowedNext = transitions[currentStatus] || [];

  // 检查基本状态转换规则
  if (!allowedNext.includes(newStatus)) {
    throw new Error(
      `不允许从状态 ${currentStatus} 转换到 ${newStatus}。允许的状态: ${allowedNext.join(', ')}`
    );
  }

  // 执行自定义验证规则
  if (config?.customRules) {
    for (const rule of config.customRules) {
      if (rule.from === currentStatus && rule.to === newStatus) {
        const result = rule.validate(context || {});
        if (result === false) {
          throw new Error(`状态转换验证失败: ${currentStatus} → ${newStatus}`);
        }
        if (typeof result === 'string') {
          throw new Error(result);
        }
      }
    }
  }
}

/**
 * 销售合同状态流转配置
 */
export const SALES_CONTRACT_STATUS_CONFIG: StatusTransitionConfig = {
  transitions: DEFAULT_STATUS_TRANSITIONS,
  customRules: [
    {
      from: DocumentStatus.APPROVED,
      to: DocumentStatus.IN_PROGRESS,
      validate: (ctx) => ctx.approvalStatus === ApprovalStatus.APPROVED || '只有审核通过的合同才能进入执行中状态',
    },
  ],
};

// ============================================================
// 数字处理
// ============================================================

/**
 * Decimal 精确比较（保留指定小数位）
 * 
 * @param a - 数字 A
 * @param b - 数字 B
 * @param precision - 精度（小数位数），默认 2
 * @returns 是否相等
 * 
 * @example
 * ```typescript
 * decimalEqual(10.001, 10.002, 2) // true
 * decimalEqual(10.001, 10.002, 3) // false
 * ```
 */
export function decimalEqual(a: number, b: number, precision = 2): boolean {
  const threshold = Math.pow(10, -precision);
  return Math.abs(a - b) < threshold;
}

/**
 * 安全的除法运算（避免除零）
 * 
 * @param dividend - 被除数
 * @param divisor - 除数
 * @param defaultValue - 除数为0时的默认值
 * @returns 商
 */
export function safeDivide(dividend: number, divisor: number, defaultValue = 0): number {
  if (divisor === 0 || !isFinite(divisor)) {
    return defaultValue;
  }
  return dividend / divisor;
}

/**
 * 计算百分比
 * 
 * @param value - 值
 * @param total - 总值
 * @param precision - 保留小数位数
 * @returns 百分比（0-100）
 */
export function calculatePercentage(value: number, total: number, precision = 2): number {
  const percentage = safeDivide(value, total, 0) * 100;
  return Number(percentage.toFixed(precision));
}

// ============================================================
// 数据验证
// ============================================================

/**
 * 验证必填字段
 * 
 * @param data - 数据对象
 * @param requiredFields - 必填字段数组
 * @throws 如果有字段缺失
 */
export function validateRequiredFields(data: any, requiredFields: string[]): void {
  const missing: string[] = [];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    throw new Error(`缺少必填字段: ${missing.join(', ')}`);
  }
}

/**
 * 验证数字范围
 * 
 * @param value - 数值
 * @param min - 最小值
 * @param max - 最大值
 * @param fieldName - 字段名（用于错误提示）
 * @throws 如果超出范围
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName = '数值'
): void {
  if (value < min || value > max) {
    throw new Error(`${fieldName} 必须在 ${min} 到 ${max} 之间，当前值: ${value}`);
  }
}

/**
 * 验证日期范围
 * 
 * @param date - 日期
 * @param startDate - 开始日期
 * @param endDate - 结束日期
 * @param fieldName - 字段名
 * @throws 如果超出范围
 */
export function validateDateRange(
  date: Date,
  startDate: Date,
  endDate: Date,
  fieldName = '日期'
): void {
  if (date < startDate || date > endDate) {
    throw new Error(`${fieldName} 必须在 ${startDate.toISOString()} 到 ${endDate.toISOString()} 之间`);
  }
}

// ============================================================
// 批量操作助手
// ============================================================

/**
 * 批量操作结果
 */
export interface BatchOperationResult<T = any> {
  results: Array<{ id: string; data?: T; success: boolean }>;
  errors: Array<{ id: string; error: string; code?: string }>;
  successCount: number;
  errorCount: number;
}

/**
 * 执行批量操作
 * 
 * @param ids - ID 数组
 * @param operation - 对每个 ID 执行的操作
 * @param options - 配置选项
 * @returns 批量操作结果
 * 
 * @example
 * ```typescript
 * const result = await executeBatchOperation(
 *   ['id1', 'id2', 'id3'],
 *   async (id) => {
 *     return await prisma.contract.update({
 *       where: { id },
 *       data: { status: 'APPROVED' }
 *     });
 *   },
 *   { 
 *     getCode: (id, index) => `Contract-${index + 1}`,
 *     continueOnError: true 
 *   }
 * );
 * ```
 */
export async function executeBatchOperation<T>(
  ids: string[],
  operation: (id: string, index: number) => Promise<T>,
  options?: {
    getCode?: (id: string, index: number) => string;
    continueOnError?: boolean;
  }
): Promise<BatchOperationResult<T>> {
  const results: Array<{ id: string; data?: T; success: boolean }> = [];
  const errors: Array<{ id: string; error: string; code?: string }> = [];

  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const code = options?.getCode?.(id, i) || id;

    try {
      const data = await operation(id, i);
      results.push({ id, data, success: true });
    } catch (error: any) {
      const errorInfo = {
        id,
        code,
        error: error.message || '未知错误',
      };
      errors.push(errorInfo);

      if (!options?.continueOnError) {
        break;
      }
    }
  }

  return {
    results,
    errors,
    successCount: results.length,
    errorCount: errors.length,
  };
}

// ============================================================
// 关联单据查询
// ============================================================

/**
 * 关联单据查询配置
 */
export interface RelatedDocumentQuery {
  model: string;                    // Prisma 模型名
  where: Record<string, any>;       // 查询条件
  select: Record<string, any>;      // 选择字段
  label: string;                    // 标签（用于结果）
  orderBy?: Record<string, string>; // 排序
}

/**
 * 查询关联单据（通用）
 * 
 * @param prisma - Prisma 客户端
 * @param queries - 查询配置数组
 * @returns 关联单据结果
 * 
 * @example
 * ```typescript
 * const result = await queryRelatedDocuments(prisma, [
 *   {
 *     model: 'purchaseContract',
 *     where: { salesContractId: id, deletedAt: null },
 *     select: { id: true, code: true, status: true },
 *     label: 'purchaseContracts',
 *     orderBy: { createdAt: 'desc' }
 *   },
 *   {
 *     model: 'warehouseOutbound',
 *     where: { salesContractId: id, deletedAt: null },
 *     select: { id: true, code: true },
 *     label: 'outbounds'
 *   }
 * ]);
 * // {
 * //   purchaseContracts: [...],
 * //   outbounds: [...],
 * //   summary: { purchaseContractsCount: 5, outboundsCount: 3 }
 * // }
 * ```
 */
export async function queryRelatedDocuments(
  prisma: any,
  queries: RelatedDocumentQuery[]
): Promise<{ [key: string]: any; summary: Record<string, number> }> {
  const results = await Promise.all(
    queries.map((query) =>
      prisma[query.model].findMany({
        where: query.where,
        select: query.select,
        orderBy: query.orderBy || { createdAt: 'desc' },
      })
    )
  );

  const data: any = {};
  const summary: Record<string, number> = {};

  queries.forEach((query, index) => {
    data[query.label] = results[index];
    summary[`${query.label}Count`] = results[index].length;
  });

  return { ...data, summary };
}
