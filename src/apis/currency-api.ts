/**
 * 币种信息 API
 * 提供币种代码到详细信息的映射
 */

export interface CurrencyInfo {
  code: string        // 币种代码
  name: string        // 币种名称
  symbol: string      // 货币符号
  isCommon: boolean   // 是否常用
  isEnabled: boolean  // 是否启用
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

/** 获取所有币种信息 */
export async function fetchCurrencyInfoApi(): Promise<CurrencyInfo[]> {
  // 临时使用静态数据，后续可以改为从数据库获取
  const staticData: CurrencyInfo[] = [
    { code: 'USD', name: '美元', symbol: '$', isCommon: true, isEnabled: true },
    { code: 'CNY', name: '人民币', symbol: '¥', isCommon: true, isEnabled: true },
    { code: 'EUR', name: '欧元', symbol: '€', isCommon: true, isEnabled: true },
    { code: 'GBP', name: '英镑', symbol: '£', isCommon: false, isEnabled: true },
    { code: 'JPY', name: '日元', symbol: '¥', isCommon: false, isEnabled: true },
    { code: 'HKD', name: '港币', symbol: 'HK$', isCommon: false, isEnabled: true },
    { code: 'AUD', name: '澳元', symbol: 'A$', isCommon: false, isEnabled: true },
    { code: 'CAD', name: '加元', symbol: 'C$', isCommon: false, isEnabled: true },
    { code: 'CHF', name: '瑞士法郎', symbol: 'CHF', isCommon: false, isEnabled: true },
    { code: 'SGD', name: '新加坡元', symbol: 'S$', isCommon: false, isEnabled: true },
    { code: 'KRW', name: '韩元', symbol: '₩', isCommon: false, isEnabled: true },
    { code: 'RUB', name: '卢布', symbol: '₽', isCommon: false, isEnabled: true },
  ]
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 100))
  return staticData
  
  // TODO: 后续改为真实API调用
  /*
  const res = await fetch(`${API_BASE}/currency-info`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('获取币种信息失败')
  return res.json()
  */
}

/** 根据代码获取单个币种信息 */
export async function fetchCurrencyByCodeApi(code: string): Promise<CurrencyInfo | null> {
  const allCurrencies = await fetchCurrencyInfoApi()
  return allCurrencies.find(c => c.code === code.toUpperCase()) || null
}