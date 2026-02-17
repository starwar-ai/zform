const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api"

export interface PaymentTermStep {
  id: string
  stepOrder: number
  ratio?: number | null
  description?: string | null
  dateBase?: number | null
  daysOffset: number
}

export interface PaymentPlanItem {
  id: string
  periodIndex: number
  paymentTermId?: string
  paymentTerm?: {
    id: string
    name: string
    nameEng: string
    steps?: PaymentTermStep[]
  }
}

export interface CustomerPaymentPlan {
  id: string
  customerId: string
  name: string
  isDefault: boolean
  remark?: string
  items: PaymentPlanItem[]
}

/** 获取客户的所有付款方案 */
export async function fetchCustomerPaymentPlans(customerId: string): Promise<CustomerPaymentPlan[]> {
  const res = await fetch(`${API_BASE}/customers/${customerId}/payment-plans`)
  if (!res.ok) throw new Error("获取付款方案失败")
  const json = await res.json()
  return json.data ?? []
}

/** 获取单个付款方案详情 */
export async function fetchCustomerPaymentPlan(customerId: string, planId: string): Promise<CustomerPaymentPlan> {
  const res = await fetch(`${API_BASE}/customers/${customerId}/payment-plans/${planId}`)
  if (!res.ok) throw new Error("获取付款方案详情失败")
  const json = await res.json()
  return json.data
}
