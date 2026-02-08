/**
 * FilterRow
 *
 * 筛选行组件，渲染在表头行下方。
 * 每一列显示一个 FilterCell，用户可录入筛选条件。
 */

import type { Header, HeaderGroup } from "@tanstack/react-table"
import { TableHead, TableRow } from "@/components/ui/table"
import { FilterCell } from "./filter-cell"
import type { ColumnFilter, ListTableColumn } from "./types"

interface FilterRowProps<T> {
  /** TanStack Table 的 headerGroup */
  headerGroups: HeaderGroup<T>[]
  /** 列定义映射 (columnId -> ListTableColumn) */
  columnDefs: Map<string, ListTableColumn<T>>
  /** 当前筛选状态 */
  filters: ColumnFilter[]
  /** 筛选变更回调 */
  onFiltersChange: (filters: ColumnFilter[]) => void
}

export function FilterRow<T>({
  headerGroups,
  columnDefs,
  filters,
  onFiltersChange,
}: FilterRowProps<T>) {
  const handleFilterChange = (
    columnId: string,
    filter: ColumnFilter | undefined
  ) => {
    const newFilters = filters.filter((f) => f.columnId !== columnId)
    if (filter) {
      newFilters.push(filter)
    }
    onFiltersChange(newFilters)
  }

  // 取第一个 headerGroup (通常只有一个)
  const headerGroup = headerGroups[0]
  if (!headerGroup) return null

  return (
    <TableRow className="bg-muted/30 hover:bg-muted/30">
      {headerGroup.headers.map((header: Header<T, unknown>) => {
        const colDef = columnDefs.get(header.id)

        // 非数据列 (如序号列) 不渲染筛选
        if (!colDef || colDef.filterable === false) {
          return (
            <TableHead
              key={header.id}
              style={{ width: header.getSize() }}
              className="py-1 px-1"
            />
          )
        }

        const currentFilter = filters.find((f) => f.columnId === header.id)

        return (
          <TableHead
            key={header.id}
            style={{ width: header.getSize() }}
            className="py-1 px-1"
          >
            <FilterCell
              columnId={header.id}
              fieldType={colDef.type}
              options={colDef.options}
              filter={currentFilter}
              onFilterChange={(f) => handleFilterChange(header.id, f)}
            />
          </TableHead>
        )
      })}
    </TableRow>
  )
}
