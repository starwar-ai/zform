/**
 * 统一单据 API —— 通用 DocumentService
 *
 * 根据 DocumentTypeAdapter 的描述，使用 Prisma 动态操作对应的模型。
 * 处理查询、筛选、排序、分页、聚合、CRUD、明细行操作。
 */

import prisma from '../config/database';
import { documentTypeRegistry } from './registry';
import type {
  DocumentTypeAdapter,
  DocumentListParams,
  DocumentListResult,
  FilterCondition,
  SortingItem,
  AggregateResult,
} from './types';

// ============================================================
// 数据转换辅助函数
// ============================================================

/** 系统字段（不放入 masterData） */
const SYSTEM_FIELDS = new Set([
  'id', 'code', 'status', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy',
  'deletedAt', 'version',
]);

/** 递归地将 Prisma Decimal 转为 number */
function convertDecimals(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === 'object' && value !== null && 'toNumber' in value && typeof (value as any).toNumber === 'function') {
    return (value as any).toNumber();
  }

  if (Array.isArray(value)) {
    return value.map(convertDecimals);
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = convertDecimals(v);
    }
    return result;
  }

  return value;
}

/** 从 adapter.detailIncludes 的 key 推导出所有关系字段名 */
function getDetailRelationKeys(adapter: DocumentTypeAdapter): Set<string> {
  const keys = new Set<string>();
  if (adapter.detailIncludes) {
    for (const key of Object.keys(adapter.detailIncludes)) {
      keys.add(key);
    }
  }
  return keys;
}

/**
 * 将 Prisma 查询结果转为前端 DocumentData 格式
 */
export function transformToFrontend(
  prismaData: any,
  typeId: string,
  adapter: DocumentTypeAdapter,
): any {
  if (!prismaData) return prismaData;

  const data = convertDecimals(prismaData) as Record<string, unknown>;
  const relationKeys = getDetailRelationKeys(adapter);
  const mapping = adapter.detailTableMapping || {};

  // 构建 detailTables
  const detailTables: Array<{ tableId: string; rows: any[] }> = [];
  for (const relationKey of relationKeys) {
    const rawItems = data[relationKey];
    if (!Array.isArray(rawItems)) continue;

    const tableId = mapping[relationKey] || relationKey;

    detailTables.push({
      tableId,
      rows: rawItems.map((item: any) => {
        const { id: itemId, ...itemFields } = item;
        const rowData: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(itemFields)) {
          if (k === 'deletedAt' || k === 'createdAt' || k === 'updatedAt' ||
              k === 'createdBy' || k === 'updatedBy' || k === 'version') {
            continue;
          }
          rowData[k] = v;
        }
        return { id: itemId, data: rowData };
      }),
    });
  }

  // 构建 masterData（排除系统字段和关系字段）
  const masterData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SYSTEM_FIELDS.has(key) || relationKeys.has(key)) continue;
    masterData[key] = value;
  }

  const status = (data.status as string) || 'DRAFT';

  return {
    id: data.id,
    typeId,
    code: data.code || '',
    masterData,
    detailTables,
    status,
    createdBy: data.createdBy,
    updatedBy: data.updatedBy,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/** 展开前端 masterData 到顶层扁平结构 */
function flattenFrontendData(data: any): Record<string, unknown> {
  const { masterData, detailTables, ...topLevelFields } = data;
  return { ...topLevelFields, ...(masterData || {}) };
}

/** 判断是否包含前端数据结构特征 */
function isFrontendFormat(data: any): boolean {
  return data && (typeof data.masterData === 'object' || Array.isArray(data.detailTables));
}

// ============================================================
// 辅助：获取 Prisma model delegate
// ============================================================

/**
 * 通过 adapter.prismaModel 名称拿到 prisma 的 model delegate。
 * 例如 adapter.prismaModel = 'salesContract' → prisma.salesContract
 */
function getModelDelegate(modelName: string): any {
  const delegate = (prisma as any)[modelName];
  if (!delegate) {
    throw new Error(`Prisma model "${modelName}" not found`);
  }
  return delegate;
}

// ============================================================
// 辅助：将前端 columnId 翻译为 Prisma 字段名
// ============================================================

function resolveField(adapter: DocumentTypeAdapter, columnId: string): string {
  return columnId;
}

// ============================================================
// 辅助：将 FilterCondition[] 转为 Prisma where
// ============================================================

function buildFilterWhere(
  adapter: DocumentTypeAdapter,
  filters: FilterCondition[]
): Record<string, any> {
  if (filters.length === 0) return {};

  const conditions: Record<string, any>[] = [];

  for (const filter of filters) {
    const prismaField = resolveField(adapter, filter.columnId);
    const cond = buildSingleFilter(prismaField, filter);
    if (cond) {
      conditions.push(cond);
    }
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { AND: conditions };
}

function buildSingleFilter(
  field: string,
  filter: FilterCondition
): Record<string, any> | null {
  const { operator, value, secondValue } = filter;

  switch (operator) {
    case 'eq':
      return { [field]: value };
    case 'neq':
      return { [field]: { not: value } };
    case 'contains':
      return { [field]: { contains: String(value), mode: 'insensitive' } };
    case 'startsWith':
      return { [field]: { startsWith: String(value), mode: 'insensitive' } };
    case 'endsWith':
      return { [field]: { endsWith: String(value), mode: 'insensitive' } };
    case 'gt':
      return { [field]: { gt: value } };
    case 'gte':
      return { [field]: { gte: value } };
    case 'lt':
      return { [field]: { lt: value } };
    case 'lte':
      return { [field]: { lte: value } };
    case 'between':
      return { [field]: { gte: value, lte: secondValue } };
    case 'in':
      return { [field]: { in: Array.isArray(value) ? value : [value] } };
    case 'isEmpty':
      return { OR: [{ [field]: null }, { [field]: '' }] };
    case 'isNotEmpty':
      return { NOT: { OR: [{ [field]: null }, { [field]: '' }] } };
    default:
      return null;
  }
}

// ============================================================
// 辅助：将 SortingItem[] 转为 Prisma orderBy
// ============================================================

function buildOrderBy(
  adapter: DocumentTypeAdapter,
  sorting: SortingItem[]
): Record<string, 'asc' | 'desc'>[] {
  if (sorting.length === 0) {
    // 使用默认排序
    if (adapter.defaultOrderBy) {
      return [adapter.defaultOrderBy];
    }
    return [{ createdAt: 'desc' }];
  }

  return sorting.map((s) => ({
    [resolveField(adapter, s.id)]: s.desc ? 'desc' : 'asc',
  }));
}

// ============================================================
// 辅助：构建关键字搜索 where
// ============================================================

function buildSearchWhere(
  adapter: DocumentTypeAdapter,
  search?: string
): Record<string, any> {
  if (!search || adapter.searchFields.length === 0) return {};

  return {
    OR: adapter.searchFields.map((field) => ({
      [field]: { contains: search, mode: 'insensitive' },
    })),
  };
}

// ============================================================
// 辅助：执行聚合查询
// ============================================================

async function executeAggregates(
  adapter: DocumentTypeAdapter,
  where: Record<string, any>
): Promise<AggregateResult[]> {
  if (!adapter.aggregateFields || adapter.aggregateFields.length === 0) {
    return [];
  }

  const model = getModelDelegate(adapter.prismaModel);

  // 构建 Prisma aggregate 参数
  const aggregateArgs: Record<string, any> = { where };

  // 按聚合类型分组
  const sumFields: string[] = [];
  const avgFields: string[] = [];
  const minFields: string[] = [];
  const maxFields: string[] = [];

  for (const af of adapter.aggregateFields) {
    switch (af.type) {
      case 'sum':
        sumFields.push(af.field);
        break;
      case 'avg':
        avgFields.push(af.field);
        break;
      case 'min':
        minFields.push(af.field);
        break;
      case 'max':
        maxFields.push(af.field);
        break;
      // count 单独处理
    }
  }

  if (sumFields.length > 0) {
    aggregateArgs._sum = Object.fromEntries(sumFields.map((f) => [f, true]));
  }
  if (avgFields.length > 0) {
    aggregateArgs._avg = Object.fromEntries(avgFields.map((f) => [f, true]));
  }
  if (minFields.length > 0) {
    aggregateArgs._min = Object.fromEntries(minFields.map((f) => [f, true]));
  }
  if (maxFields.length > 0) {
    aggregateArgs._max = Object.fromEntries(maxFields.map((f) => [f, true]));
  }

  // 如果只有 count 类型的聚合
  const countFields = adapter.aggregateFields.filter((af) => af.type === 'count');

  let aggResult: any = null;
  if (Object.keys(aggregateArgs).length > 1) {
    // 有 sum/avg/min/max
    aggResult = await model.aggregate(aggregateArgs);
  }

  // 组装结果
  const results: AggregateResult[] = [];

  for (const af of adapter.aggregateFields) {
    const columnId = af.columnId || af.field;

    if (af.type === 'count') {
      // count 用 prisma.model.count
      const countValue = await model.count({ where });
      results.push({ columnId, type: 'count', value: countValue });
    } else if (aggResult) {
      const typeKey = `_${af.type}`;
      const rawValue = aggResult[typeKey]?.[af.field];
      // Prisma Decimal → number
      const numValue = rawValue !== null && rawValue !== undefined
        ? Number(rawValue)
        : null;
      results.push({ columnId, type: af.type, value: numValue });
    }
  }

  return results;
}

// ============================================================
// DocumentService
// ============================================================

export class DocumentService {
  /**
   * 统一列表查询
   *
   * 支持: 关键字搜索、列筛选、排序、分页、聚合、数据权限过滤
   *
   * @param dataPermissionWhere 数据权限附加的 where 条件（由 DataPermissionService 生成）
   */
  async list(
    typeId: string,
    params: DocumentListParams,
    search?: string,
    dataPermissionWhere?: Record<string, any>
  ): Promise<DocumentListResult> {
    const adapter = documentTypeRegistry.getOrThrow(typeId);
    const model = getModelDelegate(adapter.prismaModel);

    // 构建 where
    const baseWhere = {
      deletedAt: null,
      ...(adapter.baseWhere || {}),
    };
    const searchWhere = buildSearchWhere(adapter, search);
    const filterWhere = buildFilterWhere(adapter, params.filters);
    const where = {
      ...baseWhere,
      ...searchWhere,
      ...filterWhere,
      ...(dataPermissionWhere || {}),
    };

    // 构建 orderBy
    const orderBy = buildOrderBy(adapter, params.sorting);

    // 分页
    const { pageIndex, pageSize } = params.pagination;

    if (params.mode === 'detail' && adapter.prismaItemModel && adapter.parentForeignKey) {
      // ---- 明细模式 ----
      return this.listDetailMode(adapter, where, orderBy, pageIndex, pageSize);
    }

    // ---- 单据模式 ----
    const [rows, total, aggregates] = await Promise.all([
      model.findMany({
        where,
        skip: pageIndex * pageSize,
        take: pageSize,
        include: adapter.listIncludes || undefined,
        orderBy,
      }),
      model.count({ where }),
      executeAggregates(adapter, where),
    ]);

    // 扁平化
    const data = rows.map((row: any) => adapter.flattenRow(row));

    return { data, total, aggregates };
  }

  /**
   * 明细模式列表
   */
  private async listDetailMode(
    adapter: DocumentTypeAdapter,
    masterWhere: Record<string, any>,
    orderBy: Record<string, 'asc' | 'desc'>[],
    pageIndex: number,
    pageSize: number
  ): Promise<DocumentListResult> {
    if (!adapter.prismaItemModel || !adapter.parentForeignKey || !adapter.flattenDetailRow) {
      throw new Error(`单据类型 ${adapter.typeId} 不支持明细模式`);
    }

    const masterModel = getModelDelegate(adapter.prismaModel);
    const itemModel = getModelDelegate(adapter.prismaItemModel);

    // 先查出符合条件的主表 ID
    const masterIds = await masterModel.findMany({
      where: masterWhere,
      select: { id: true },
    });
    const idList = masterIds.map((m: any) => m.id);

    // 查明细行 (外键 in 主表 ID)
    const itemWhere = {
      [adapter.parentForeignKey]: { in: idList },
      deletedAt: null,
    };

    const [items, total] = await Promise.all([
      itemModel.findMany({
        where: itemWhere,
        skip: pageIndex * pageSize,
        take: pageSize,
        orderBy: [{ lineNumber: 'asc' }],
        include: {
          // 包含主表数据
          [adapter.itemRelationName ? '' : '']: undefined,
        },
      }),
      itemModel.count({ where: itemWhere }),
    ]);

    // 对于明细模式，需要拿到主表数据来扁平化
    // 批量查主表
    const itemParentIds = [...new Set(items.map((i: any) => i[adapter.parentForeignKey!]))];
    const masters = await masterModel.findMany({
      where: { id: { in: itemParentIds } },
    });
    const masterMap = new Map(masters.map((m: any) => [m.id, m]));

    const data = items.map((item: any) => {
      const master = masterMap.get(item[adapter.parentForeignKey!]);
      return adapter.flattenDetailRow!(master, item);
    });

    return { data, total };
  }

  /**
   * 获取单据详情
   *
   * 返回前端 DocumentData 格式：{ id, typeId, code, masterData, detailTables, status, ... }
   */
  async getById(typeId: string, id: string): Promise<any> {
    const adapter = documentTypeRegistry.getOrThrow(typeId);
    const model = getModelDelegate(adapter.prismaModel);

    const doc = await model.findUnique({
      where: { id },
      include: adapter.detailIncludes || adapter.listIncludes || undefined,
    });

    if (!doc) {
      throw new Error(`${adapter.typeName}不存在`);
    }

    // 转换为前端 DocumentData 格式
    if (adapter.transformToFrontend) {
      return adapter.transformToFrontend(doc, typeId);
    }
    return transformToFrontend(doc, typeId, adapter);
  }

  /**
   * 创建单据
   *
   * 统一入站转换：如果收到前端格式数据（含 masterData/detailTables），
   * 先用 transformFromFrontend 提取扁平主数据，再传给适配器。
   */
  async create(typeId: string, data: any, userId: string): Promise<any> {
    const adapter = documentTypeRegistry.getOrThrow(typeId);

    // 如果 adapter 有自定义创建逻辑，由 adapter 自行处理转换
    if (adapter.onCreate) {
      return adapter.onCreate(data, userId, prisma);
    }

    // 通用路径：统一转换前端格式
    const cleanData = isFrontendFormat(data)
      ? flattenFrontendData(data)
      : data;

    const model = getModelDelegate(adapter.prismaModel);
    return model.create({
      data: {
        ...cleanData,
        createdBy: userId,
        updatedBy: userId,
      },
      include: adapter.detailIncludes || adapter.listIncludes || undefined,
    });
  }

  /**
   * 更新单据
   *
   * 统一入站转换：如果收到前端格式数据（含 masterData/detailTables），
   * 先用 transformFromFrontend 提取扁平主数据，再传给适配器。
   */
  async update(typeId: string, id: string, data: any, userId: string): Promise<any> {
    const adapter = documentTypeRegistry.getOrThrow(typeId);

    // 如果 adapter 有自定义更新逻辑，由 adapter 自行处理转换
    if (adapter.onUpdate) {
      return adapter.onUpdate(id, data, userId, prisma);
    }

    // 通用路径：统一转换前端格式
    const cleanData = isFrontendFormat(data)
      ? flattenFrontendData(data)
      : data;

    const model = getModelDelegate(adapter.prismaModel);

    // 先验证存在
    const existing = await model.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`${adapter.typeName}不存在`);
    }

    return model.update({
      where: { id },
      data: {
        ...cleanData,
        updatedBy: userId,
        version: { increment: 1 },
      },
      include: adapter.detailIncludes || adapter.listIncludes || undefined,
    });
  }

  /**
   * 软删除单据
   */
  async delete(typeId: string, id: string, userId: string): Promise<any> {
    const adapter = documentTypeRegistry.getOrThrow(typeId);

    // 删除前校验
    if (adapter.beforeDelete) {
      await adapter.beforeDelete(id, prisma);
    }

    const model = getModelDelegate(adapter.prismaModel);

    return model.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  // ---- 明细行操作 ----

  /**
   * 获取明细行列表
   */
  async getItems(typeId: string, docId: string): Promise<any[]> {
    const adapter = documentTypeRegistry.getOrThrow(typeId);
    if (!adapter.prismaItemModel || !adapter.parentForeignKey) {
      throw new Error(`单据类型 ${typeId} 没有明细表`);
    }

    const itemModel = getModelDelegate(adapter.prismaItemModel);
    return itemModel.findMany({
      where: {
        [adapter.parentForeignKey]: docId,
        deletedAt: null,
      },
      orderBy: { lineNumber: 'asc' },
    });
  }

  /**
   * 添加明细行
   */
  async addItem(typeId: string, docId: string, data: any, userId: string): Promise<any> {
    const adapter = documentTypeRegistry.getOrThrow(typeId);
    if (!adapter.prismaItemModel || !adapter.parentForeignKey) {
      throw new Error(`单据类型 ${typeId} 没有明细表`);
    }

    const itemModel = getModelDelegate(adapter.prismaItemModel);

    // 获取当前最大行号
    const maxLine = await itemModel.aggregate({
      where: { [adapter.parentForeignKey]: docId, deletedAt: null },
      _max: { lineNumber: true },
    });
    const lineNumber = (maxLine._max.lineNumber || 0) + 1;

    return itemModel.create({
      data: {
        ...data,
        [adapter.parentForeignKey]: docId,
        lineNumber,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  /**
   * 更新明细行
   */
  async updateItem(typeId: string, itemId: string, data: any, userId: string): Promise<any> {
    const adapter = documentTypeRegistry.getOrThrow(typeId);
    if (!adapter.prismaItemModel) {
      throw new Error(`单据类型 ${typeId} 没有明细表`);
    }

    const itemModel = getModelDelegate(adapter.prismaItemModel);
    return itemModel.update({
      where: { id: itemId },
      data: {
        ...data,
        updatedBy: userId,
      },
    });
  }

  /**
   * 软删除明细行
   */
  async deleteItem(typeId: string, itemId: string, userId: string): Promise<any> {
    const adapter = documentTypeRegistry.getOrThrow(typeId);
    if (!adapter.prismaItemModel) {
      throw new Error(`单据类型 ${typeId} 没有明细表`);
    }

    const itemModel = getModelDelegate(adapter.prismaItemModel);
    return itemModel.update({
      where: { id: itemId },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  // ---- 自定义 Action ----

  /**
   * 执行类型特有操作
   */
  async executeAction(
    typeId: string,
    id: string,
    action: string,
    body: any,
    userId: string
  ): Promise<{ data: any; message: string }> {
    const adapter = documentTypeRegistry.getOrThrow(typeId);

    if (!adapter.actions || !adapter.actions[action]) {
      throw new Error(`单据类型 ${typeId} 不支持操作: ${action}`);
    }

    return adapter.actions[action]({ id, body, userId, prisma });
  }
}
