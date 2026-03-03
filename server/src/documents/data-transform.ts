/**
 * Document Data Transformation Utilities
 *
 * 处理前后端数据格式转换：
 * - 前端使用 masterData + detailTables 嵌套结构
 * - 后端 Prisma 使用扁平化结构
 */

import { Prisma } from '@prisma/client';
import type { DocumentTypeAdapter } from './types';

/**
 * 前端结构字段（必须过滤）
 */
const FRONTEND_STRUCTURE_FIELDS = new Set([
  'typeId',       // 前端文档类型标识
  'masterData',   // 前端主数据容器
  'detailTables', // 前端明细表容器
  '_isNew',       // 前端新建标记
]);

/**
 * 获取 Prisma 模型的有效字段列表
 * 使用 Prisma 的 DMMF (Data Model Meta Format) 来获取模型定义
 */
function getPrismaModelFields(modelName: string): Set<string> | null {
  try {
    // @ts-ignore - 访问 Prisma 内部 DMMF
    const dmmf = Prisma.dmmf;
    const model = dmmf.datamodel.models.find((m: any) => m.name.toLowerCase() === modelName.toLowerCase());
    
    if (!model) return null;
    
    // 提取所有字段名（包括标量字段和关系字段）
    const fields = new Set<string>();
    model.fields.forEach((field: any) => {
      fields.add(field.name);
    });
    
    return fields;
  } catch (error) {
    // 如果无法获取 DMMF，返回 null 使用回退逻辑
    console.warn(`Cannot get Prisma model fields for ${modelName}:`, error);
    return null;
  }
}

/**
 * 从前端数据结构转换为 Prisma 可用的扁平结构
 * 
 * 策略：
 * 1. 如果提供了 prismaModel，则使用白名单模式（只保留 Prisma schema 中定义的字段）
 * 2. 否则使用黑名单模式（排除已知的前端结构字段）
 * 
 * @param data 前端传来的数据
 * @param options.prismaModel Prisma 模型名称（如 'product', 'salesContract'）
 * @param options.additionalExcludes 额外需要排除的字段
 * @returns 扁平化的数据对象
 */
export function transformFromFrontend(
  data: any,
  options: {
    prismaModel?: string;
    additionalExcludes?: string[];
  } = {}
): Record<string, unknown> {
  const { masterData, detailTables, ...topLevelFields } = data;
  
  // 展开 masterData 到顶层
  const flatData = {
    ...topLevelFields,
    ...(masterData || {}),
  };
  
  // 策略1：白名单模式 - 如果提供了 prismaModel，只保留 schema 中的字段
  if (options.prismaModel) {
    const validFields = getPrismaModelFields(options.prismaModel);
    
    if (validFields) {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(flatData)) {
        if (validFields.has(key)) {
          result[key] = value;
        }
      }
      return result;
    }
    // 如果无法获取 schema，继续使用黑名单模式
  }
  
  // 策略2：黑名单模式 - 排除已知的前端结构字段
  const excludeFields = new Set([
    ...FRONTEND_STRUCTURE_FIELDS,
    ...(options.additionalExcludes || []),
  ]);
  
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(flatData)) {
    if (!excludeFields.has(key)) {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * 提取明细表数据
 * 
 * @param data 前端传来的数据
 * @param tableId 明细表 ID
 * @returns 明细表行数据数组
 */
export function extractDetailTable(data: any, tableId: string): any[] {
  const { detailTables } = data;
  if (!Array.isArray(detailTables)) return [];
  
  const table = detailTables.find((t: any) => t.tableId === tableId);
  return table?.rows || [];
}

/**
 * 判断是否包含前端数据结构特征
 * 
 * @param data 要检查的数据
 * @returns 是否为前端格式数据
 */
export function isFrontendFormat(data: any): boolean {
  return data && (
    typeof data.masterData === 'object' ||
    Array.isArray(data.detailTables)
  );
}

// ============================================================
// 后端 → 前端：Prisma 扁平结构 → DocumentData 嵌套结构
// ============================================================

/** 系统字段（不放入 masterData） */
const SYSTEM_FIELDS = new Set([
  'id', 'code', 'status', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy',
  'deletedAt', 'version',
]);

/**
 * 递归地将 Prisma Decimal 转为 number
 */
function convertDecimals(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  // Prisma Decimal 实例有 toNumber 方法
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

/**
 * 从 adapter.detailIncludes 的 key 推导出所有关系字段名
 */
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
 *
 * 逻辑：
 * 1. 提取系统字段 (id, code, status, createdAt, etc.)
 * 2. 根据 detailIncludes 推导关系字段，构建 detailTables 数组
 * 3. 剩余字段放入 masterData
 * 4. Prisma Decimal → number
 * 5. status 大写 → 小写
 */
export function transformToFrontend(
  prismaData: any,
  typeId: string,
  adapter: DocumentTypeAdapter,
): any {
  if (!prismaData) return prismaData;

  // 先处理 Decimal 转换
  const data = convertDecimals(prismaData) as Record<string, unknown>;

  // 推导关系字段
  const relationKeys = getDetailRelationKeys(adapter);
  const mapping = adapter.detailTableMapping || {};

  // 构建 detailTables
  const detailTables: Array<{ tableId: string; rows: any[] }> = [];
  for (const relationKey of relationKeys) {
    const rawItems = data[relationKey];
    if (!Array.isArray(rawItems)) continue;

    // 映射：prisma 关系名 → 前端 tableId
    const tableId = mapping[relationKey] || relationKey;

    detailTables.push({
      tableId,
      rows: rawItems.map((item: any) => {
        const { id: itemId, ...itemFields } = item;
        // 移除关系反向引用的外键和系统字段
        const rowData: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(itemFields)) {
          if (k === 'deletedAt' || k === 'createdAt' || k === 'updatedAt' ||
              k === 'createdBy' || k === 'updatedBy' || k === 'version') {
            continue;
          }
          rowData[k] = v;
        }
        return {
          id: itemId,
          data: rowData,
        };
      }),
    });
  }

  // 构建 masterData（排除系统字段和关系字段）
  const masterData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SYSTEM_FIELDS.has(key) || relationKeys.has(key)) continue;
    masterData[key] = value;
  }

  // status 直接使用后端大写值，与前端 DocumentStatus 统一
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
