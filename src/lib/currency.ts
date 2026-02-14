/**
 * 币种常量 - 统一管理
 *
 * 所有表单、价格组件等需要币种选项的地方，均从此处引用。
 * 修改此处即可全局生效。
 */

export interface CurrencyOption {
  label: string
  value: string
}

/** 可选币种列表（统一管理） */
export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { label: "USD", value: "USD" },
  { label: "CNY", value: "CNY" },
  { label: "EUR", value: "EUR" },
  { label: "GBP", value: "GBP" },
  { label: "JPY", value: "JPY" },
]

/** 默认币种 */
export const DEFAULT_CURRENCY = "USD"
