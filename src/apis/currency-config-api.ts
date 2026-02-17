/**
 * 币种配置 API
 */

export interface CurrencyItem {
  id: string
  code: string        // 币种代码 (如: USD)
  name: string        // 币种名称 (如: 美元)
  symbol: string      // 货币符号 (如: $)
  isCommon: boolean   // 是否常用
  isEnabled: boolean  // 是否启用
  orderNum: number    // 排序号
  remark: string      // 备注
  createdAt: string
  updatedAt: string
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

/** 获取所有币种配置 */
export async function fetchCurrenciesApi(): Promise<CurrencyItem[]> {
  const res = await fetch(`${API_BASE}/currencies`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('获取币种列表失败')
  return res.json()
}

/** 根据ID获取币种 */
export async function fetchCurrencyByIdApi(id: string): Promise<CurrencyItem> {
  const res = await fetch(`${API_BASE}/currencies/${id}`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('获取币种失败')
  return res.json()
}

/** 创建币种 */
export async function createCurrencyApi(data: Omit<CurrencyItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<CurrencyItem> {
  const res = await fetch(`${API_BASE}/currencies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || '创建币种失败')
  }
  return res.json()
}

/** 更新币种 */
export async function updateCurrencyApi(id: string, data: Partial<CurrencyItem>): Promise<CurrencyItem> {
  const res = await fetch(`${API_BASE}/currencies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || '更新币种失败')
  }
  return res.json()
}

/** 删除币种 */
export async function deleteCurrencyApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/currencies/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || '删除币种失败')
  }
}

/** 批量更新币种排序 */
export async function updateCurrencyOrderApi(updates: { id: string; orderNum: number }[]): Promise<void> {
  const res = await fetch(`${API_BASE}/currencies/order`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ updates }),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || '更新排序失败')
  }
}