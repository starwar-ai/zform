const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api"

export interface SupplierPaymentTermStep {
  id: string
  stepOrder: number
  ratio?: number | null
  description?: string | null
  dateBase?: number | null
  daysOffset: number
}

export interface SupplierPaymentPlanItem {
  id: string
  periodIndex: number
  supplierPaymentTermId?: string
  supplierPaymentTerm?: {
    id: string
    name: string
    nameEng: string | null
    steps?: SupplierPaymentTermStep[]
  }
  paymentRatio?: number
  paymentDescription?: string
  paymentDateBase?: number
  daysOffset: number
}

export interface SupplierPaymentPlan {
  id: string
  supplierId: string
  name: string
  isDefault: boolean
  remark?: string
  items: SupplierPaymentPlanItem[]
}

/** 获取供应商的所有付款方案 */
export async function fetchSupplierPaymentPlans(supplierId: string): Promise<SupplierPaymentPlan[]> {
  const res = await fetch(`${API_BASE}/suppliers/${supplierId}/payment-plans`)
  if (!res.ok) throw new Error("获取付款方案失败")
  const json = await res.json()
  return json.data ?? []
}

/** 获取单个付款方案详情 */
export async function fetchSupplierPaymentPlan(supplierId: string, planId: string): Promise<SupplierPaymentPlan> {
  const res = await fetch(`${API_BASE}/suppliers/${supplierId}/payment-plans/${planId}`)
  if (!res.ok) throw new Error("获取付款方案详情失败")
  const json = await res.json()
  return json.data
}
