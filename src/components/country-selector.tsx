/**
 * CountrySelector
 *
 * 国家选择器组件，从实体配置中获取国家列表。
 * 基于 Combobox 组件实现，支持搜索过滤。
 */

import { Combobox } from "@/components/ui/combobox"
import type { ComboboxOption } from "@/core/types"
import { fetchCountriesApi } from "@/apis/business-parameter-api"

interface CountrySelectorProps {
  /** 当前选中的国家 ID */
  value?: string
  /** 值变更回调 */
  onChange: (value: string | undefined) => void
  /** 占位提示文本 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
}

/**
 * 国家选择器组件
 */
export function CountrySelector({
  value,
  onChange,
  placeholder = "请选择国家",
  disabled = false,
}: CountrySelectorProps) {
  // 获取国家选项的异步函数
  const fetchCountryOptions = async (): Promise<ComboboxOption[]> => {
    try {
      const countries = await fetchCountriesApi()
      return countries.map(country => ({
        value: country.id,
        label: country.name,
        // 国家数据通常是扁平结构，不是树形
        isLeaf: true,
        depth: 0
      }))
    } catch (error) {
      console.error("获取国家列表失败:", error)
      return []
    }
  }

  return (
    <Combobox
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      fetchOptions={fetchCountryOptions}
      isTree={false}
    />
  )
}