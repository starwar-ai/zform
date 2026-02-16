/**
 * 筛选操作符配置
 *
 * 根据字段类型返回可用的筛选操作符列表。
 */

import type { FieldType } from "@/core/types"
import type { FilterOperator, OperatorMeta } from "./types"

/** 所有操作符元数据 */
const ALL_OPERATORS: Record<FilterOperator, OperatorMeta> = {
  eq:         { id: "eq",         label: "等于",     symbol: "=",  needsValue: true,  needsSecondValue: false },
  neq:        { id: "neq",        label: "不等于",   symbol: "≠",  needsValue: true,  needsSecondValue: false },
  contains:   { id: "contains",   label: "包含",     symbol: "∋",  needsValue: true,  needsSecondValue: false },
  startsWith: { id: "startsWith", label: "开头是",   symbol: "A…", needsValue: true,  needsSecondValue: false },
  endsWith:   { id: "endsWith",   label: "结尾是",   symbol: "…Z", needsValue: true,  needsSecondValue: false },
  gt:         { id: "gt",         label: "大于",     symbol: ">",  needsValue: true,  needsSecondValue: false },
  gte:        { id: "gte",        label: "大于等于", symbol: "≥",  needsValue: true,  needsSecondValue: false },
  lt:         { id: "lt",         label: "小于",     symbol: "<",  needsValue: true,  needsSecondValue: false },
  lte:        { id: "lte",        label: "小于等于", symbol: "≤",  needsValue: true,  needsSecondValue: false },
  between:    { id: "between",    label: "区间",     symbol: "⟷",  needsValue: true,  needsSecondValue: true },
  before:     { id: "before",     label: "早于",     symbol: "<",  needsValue: true,  needsSecondValue: false },
  after:      { id: "after",      label: "晚于",     symbol: ">",  needsValue: true,  needsSecondValue: false },
  in:         { id: "in",         label: "在列表中", symbol: "∈",  needsValue: true,  needsSecondValue: false },
  isEmpty:    { id: "isEmpty",    label: "为空",     symbol: "∅",  needsValue: false, needsSecondValue: false },
  isNotEmpty: { id: "isNotEmpty", label: "不为空",   symbol: "∅̸",  needsValue: false, needsSecondValue: false },
}

/** 按字段类型分组的操作符列表 */
const OPERATORS_BY_TYPE: Record<FieldType, FilterOperator[]> = {
  text:           ["eq", "neq", "contains", "startsWith", "endsWith", "isEmpty", "isNotEmpty"],
  textarea:       ["eq", "neq", "contains", "startsWith", "endsWith", "isEmpty", "isNotEmpty"],
  skuCode:        ["eq", "neq", "contains", "startsWith", "endsWith", "isEmpty", "isNotEmpty"],
  number:         ["eq", "neq", "gt", "gte", "lt", "lte", "between", "isEmpty", "isNotEmpty"],
  date:           ["eq", "before", "after", "between", "isEmpty", "isNotEmpty"],
  select:         ["eq", "neq", "in", "isEmpty", "isNotEmpty"],
  checkbox:       ["eq"],
  computed:       ["eq", "neq", "contains", "isEmpty", "isNotEmpty"],
  combobox:       ["eq", "neq", "in", "isEmpty", "isNotEmpty"],
  dimensions:     ["eq", "neq", "contains", "isEmpty", "isNotEmpty"],
  price:          ["eq", "neq", "gt", "gte", "lt", "lte", "between", "isEmpty", "isNotEmpty"],
  ratio:          ["eq", "neq", "gt", "gte", "lt", "lte", "isEmpty", "isNotEmpty"],
  employeeSelector: ["eq", "neq", "in", "isEmpty", "isNotEmpty"],
  productSelector: ["eq", "neq", "in", "isEmpty", "isNotEmpty"],
}

/** 按字段类型获取可用操作符元数据列表 */
export function getOperatorsByFieldType(type: FieldType): OperatorMeta[] {
  const operatorIds = OPERATORS_BY_TYPE[type] ?? OPERATORS_BY_TYPE.text
  return operatorIds.map((id) => ALL_OPERATORS[id])
}

/** 获取单个操作符的元数据 */
export function getOperatorMeta(operator: FilterOperator): OperatorMeta {
  return ALL_OPERATORS[operator]
}

/** 获取字段类型的默认操作符 */
export function getDefaultOperator(type: FieldType): FilterOperator {
  switch (type) {
    case "text":
    case "textarea":
    case "skuCode":
      return "contains"
    case "number":
      return "eq"
    case "date":
      return "eq"
    case "select":
      return "eq"
    case "checkbox":
      return "eq"
    case "computed":
      return "contains"
    default:
      return "contains"
  }
}
