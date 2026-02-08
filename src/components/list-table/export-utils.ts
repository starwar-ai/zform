/**
 * 导出工具
 *
 * 将表格数据导出为 CSV 文件并下载。
 */

import type { ListTableColumn } from "./types"

/**
 * 将数据导出为 CSV 并触发浏览器下载
 */
export function exportToCsv<T>(
  columns: ListTableColumn<T>[],
  data: T[],
  filename: string = "export"
) {
  if (data.length === 0) return

  // 过滤出可见列
  const visibleColumns = columns

  // 构建 CSV 头
  const headers = visibleColumns.map((col) => escapeCsvField(col.label))

  // 构建 CSV 行
  const rows = data.map((row) =>
    visibleColumns.map((col) => {
      const value = (row as Record<string, unknown>)[col.id]
      return escapeCsvField(formatCsvValue(value, col))
    })
  )

  // 加 BOM 头以支持 Excel 中文显示
  const BOM = "\uFEFF"
  const csvContent =
    BOM +
    [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

  // 创建 Blob 并下载
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `${filename}.csv`)
  link.style.display = "none"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** 转义 CSV 字段值 */
function escapeCsvField(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** 格式化值为 CSV 可读字符串 */
function formatCsvValue<T>(value: unknown, column: ListTableColumn<T>): string {
  if (value === null || value === undefined) return ""

  // 选择型字段：显示 label 而非 value
  if (column.type === "select" && column.options) {
    const option = column.options.find((opt) => opt.value === value)
    return option ? option.label : String(value)
  }

  // 复选框
  if (column.type === "checkbox") {
    return value ? "是" : "否"
  }

  // 数值
  if (column.type === "number" && typeof value === "number") {
    return value.toString()
  }

  return String(value)
}
