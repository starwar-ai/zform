/**
 * 库存查询 API
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

export interface InventoryQueryParams {
  page?: number
  pageSize?: number
  search?: string
  warehouseId?: string
  skuCode?: string
  skuId?: string
  supplierId?: string
  customerId?: string
  batchNumber?: string
}

export interface InventoryDetail {
  id: string
  selfOwnedProductNo?: string
  isSeparateBox: boolean
  specification?: string
  containerTransferQuantity?: number
  buyer?: string
  buyerDepartment?: string
  stocktakingDifference?: number
  remainingTotalAmount?: number
  workInProgressQuantity?: number
  inboundOrderId?: string
  inboundOrderCode?: string
  batchNumber?: string
  skuId?: string
  skuCode?: string
  skuName?: string
  customerProductNo?: string
  inboundTime?: string
  initialQuantity: number
  usedQuantity: number
  lockedQuantity: number
  availableQuantity: number
  outerBoxLength?: number
  outerBoxWidth?: number
  outerBoxHeight?: number
  outerBoxVolume?: number
  outerBoxGrossWeight?: number
  purchaseContractId?: string
  purchaseContractCode?: string
  salesContractId?: string
  salesContractCode?: string
  warehouseId?: string
  warehouseCode?: string
  warehouseName?: string
  warehouseLocation?: string
  supplierId?: string
  supplierCode?: string
  supplierName?: string
  customerId?: string
  customerCode?: string
  customerName?: string
  remark?: string
  createdBy?: string
  createdAt: string
  updatedBy?: string
  updatedAt: string
  deletedAt?: string
}

export interface InventoryListResult {
  data: InventoryDetail[]
  total: number
  page: number
  pageSize: number
}

export async function fetchInventoryListApi(params: InventoryQueryParams): Promise<InventoryListResult> {
  const queryParams = new URLSearchParams()
  
  if (params.page) queryParams.append('page', String(params.page))
  if (params.pageSize) queryParams.append('pageSize', String(params.pageSize))
  if (params.search) queryParams.append('search', params.search)
  if (params.warehouseId) queryParams.append('warehouseId', params.warehouseId)
  if (params.skuCode) queryParams.append('skuCode', params.skuCode)
  if (params.skuId) queryParams.append('skuId', params.skuId)
  if (params.supplierId) queryParams.append('supplierId', params.supplierId)
  if (params.customerId) queryParams.append('customerId', params.customerId)
  if (params.batchNumber) queryParams.append('batchNumber', params.batchNumber)

  const res = await fetch(`${API_BASE}/inventory?${queryParams}`, {
    credentials: 'include',
  })
  
  if (!res.ok) throw new Error('查询库存列表失败')
  return res.json()
}

export async function fetchInventoryByIdApi(id: string): Promise<InventoryDetail> {
  const res = await fetch(`${API_BASE}/inventory/${id}`, {
    credentials: 'include',
  })
  
  if (!res.ok) throw new Error('获取库存明细失败')
  return res.json()
}

export interface InventorySummary {
  totalRecords: number
  totalInitialQuantity: number
  totalUsedQuantity: number
  totalLockedQuantity: number
  totalAvailableQuantity: number
}

export async function fetchInventorySummaryApi(params: Partial<InventoryQueryParams>): Promise<InventorySummary> {
  const queryParams = new URLSearchParams()
  
  if (params.warehouseId) queryParams.append('warehouseId', params.warehouseId)
  if (params.skuId) queryParams.append('skuId', params.skuId)
  if (params.supplierId) queryParams.append('supplierId', params.supplierId)
  if (params.customerId) queryParams.append('customerId', params.customerId)

  const res = await fetch(`${API_BASE}/inventory/summary?${queryParams}`, {
    credentials: 'include',
  })
  
  if (!res.ok) throw new Error('获取库存汇总失败')
  return res.json()
}
