/**
 * Document Data Transform
 *
 * 将服务端返回的 Prisma 数据转换为前端 DocumentData 格式
 */

import type { DocumentData, DetailTableData, FieldDef } from '@/core/types'
import { registry } from '@/core/registry'
import { nanoid } from 'nanoid'

/**
 * 将服务端返回的 Prisma 数据转换为前端 DocumentData 格式
 * 
 * 服务端返回格式示例：
 * {
 *   id: '...',
 *   code: 'SC-2024001',        // 后端数据库字段
 *   status: 'DRAFT',
 *   customerName: '...',
 *   items: [{ id, lineNumber, productCode, ... }],
 *   createdAt, updatedAt, ...
 * }
 * 
 * 转换为前端 DocumentData：
 * {
 *   id, typeId,
 *   code: 'SC-2024001',   // 直接使用 code 字段
 *   masterData: { code, customerName, ... },
 *   detailTables: [{ tableId, rows: [...] }],
 *   status, createdAt, updatedAt
 * }
 */
export function normalizeDocumentData(
  typeId: string,
  rawDoc: any
): DocumentData {
  const schema = registry.getSchema(typeId)
  if (!schema) throw new Error(`Schema not found: ${typeId}`)

  // 客户类型：后端 Prisma 字段名与前端 detailTable id 的映射
  const customerDetailKeyMap: Record<string, string> = {
    bank_accounts: 'bankAccounts',
    contacts: 'contacts',
    payment_terms: 'customerPaymentTerms',
  }
  const customerTypes = ['domestic_customer', 'international_customer', 'customer']

  // 收款计划：前端 receiptPlanItems 对应后端 collectionPlans（表名映射，字段名已统一）
  const receiptPlanBackendKey = 'collectionPlans'

  // 提取明细表数据（根据 schema.detailTables 配置）
  const detailTables: DetailTableData[] = schema.detailTables.map((tableDef) => {
    let itemsKey = customerTypes.includes(typeId)
      ? (customerDetailKeyMap[tableDef.id] ?? tableDef.id)
      : tableDef.id
    if (tableDef.id === 'receiptPlanItems') {
      itemsKey = receiptPlanBackendKey
    }
    const rawItems = rawDoc[itemsKey] || []
    const isReceiptPlan = tableDef.id === 'receiptPlanItems'

    return {
      tableId: tableDef.id,
      rows: rawItems.map((item: any) => ({
        id: item.id || nanoid(),
        data: isReceiptPlan
          ? extractReceiptPlanRowData(tableDef.fields, item)
          : extractDetailRowData(tableDef.fields, item),
        sourceRef: item.sourceRef,
      })),
    }
  })

  // 提取主数据（排除明细表和系统字段）
  const excludeKeys = new Set([
    'id', 'status', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'deletedAt',
    ...schema.detailTables.map(t => t.id),
    // 客户类型：同时排除后端 Prisma 的关联字段名
    ...(customerTypes.includes(typeId)
      ? ['bankAccounts', 'contacts', 'customerPaymentTerms']
      : []),
    // 收款计划：前端 receiptPlanItems 对应后端 collectionPlans
    ...(schema.detailTables.some(t => t.id === 'receiptPlanItems') ? [receiptPlanBackendKey] : []),
  ])
  
  const masterData: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(rawDoc)) {
    if (!excludeKeys.has(key)) {
      masterData[key] = value
    }
  }

  // 客户产品/自营产品：如果自身没有 skuType，从基础产品继承
  const derivedTypes = ['customer_product', 'self_owned_product']
  if (derivedTypes.includes(typeId) && masterData.skuType == null && rawDoc.baseProduct) {
    masterData.skuType = rawDoc.baseProduct.skuType ?? null
    masterData.isAgent = rawDoc.baseProduct.isAgent ?? false
  }

  // 产品类型：status 是业务生命周期状态（ACTIVE/INACTIVE/DRAFT），
  // 操作可见性判断应使用 approvalStatus（审批流状态）
  const productTypes = ['standard_product', 'customer_product', 'self_owned_product']
  const rawStatus = productTypes.includes(typeId)
    ? resolveProductApprovalStatus(rawDoc.approvalStatus)
    : rawDoc.status?.toLowerCase() || 'draft'

  return {
    id: rawDoc.id,
    typeId,
    code: rawDoc.code || '',
    masterData,
    detailTables,
    status: rawStatus as DocumentData['status'],
    createdBy: rawDoc.createdBy,
    updatedBy: rawDoc.updatedBy,
    createdAt: rawDoc.createdAt,
    updatedAt: rawDoc.updatedAt,
  }
}

/**
 * 产品 approvalStatus 映射到 DocumentStatus
 *
 * 产品的 approvalStatus 是审批流状态，需要映射到通用单据状态
 */
function resolveProductApprovalStatus(approvalStatus?: string): string {
  switch (approvalStatus?.toUpperCase()) {
    case 'SUBMITTED': return 'submitted'
    case 'APPROVED':  return 'approved'
    case 'REJECTED':  return 'draft'
    case 'PENDING':
    default:          return 'draft'
  }
}

/**
 * 从原始明细行数据中提取字段值
 */
function extractDetailRowData(fields: FieldDef[], item: any): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (const field of fields) {
    if (field.id in item) {
      data[field.id] = item[field.id]
    }
  }
  return data
}

/**
 * 收款计划：从后端 collectionPlans 行数据提取（字段名已统一，仅做 checkbox 0/1→boolean）
 */
function extractReceiptPlanRowData(fields: FieldDef[], item: any): Record<string, unknown> {
  const data = extractDetailRowData(fields, item)
  if (item.blockPurchaseUntilPaid !== undefined) {
    data.blockPurchaseUntilPaid = Boolean(item.blockPurchaseUntilPaid)
  }
  if (item.blockShipmentUntilPaid !== undefined) {
    data.blockShipmentUntilPaid = Boolean(item.blockShipmentUntilPaid)
  }
  return data
}
