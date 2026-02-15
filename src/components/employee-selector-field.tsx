/**
 * Employee Selector Field
 *
 * 员工选择表单字段组件 - 用于表单中嵌入员工选择功能
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, X, Users } from "lucide-react"
import { EmployeeSelectorDialog } from "@/components/employee-selector-dialog"
import type { Employee } from "@/types/employee"

interface EmployeeSelectorFieldProps {
  /** 字段标签 */
  label?: string
  /** 是否必填 */
  required?: boolean
  /** 选择模式 */
  mode?: "single" | "multiple"
  /** 已选择的员工 */
  value?: Employee | Employee[]
  /** 值改变回调 */
  onChange?: (value: Employee | Employee[] | null) => void
  /** 占位符文本 */
  placeholder?: string
  /** 错误信息 */
  error?: string
  /** 禁用状态 */
  disabled?: boolean
  /** 显示的列 */
  columns?: Array<"name" | "username" | "email" | "phone" | "department" | "status">
  /** 状态过滤 */
  statusFilter?: "active" | "inactive" | "all"
}

export function EmployeeSelectorField({
  label,
  required = false,
  mode = "single",
  value,
  onChange,
  placeholder = mode === "single" ? "请选择员工" : "请选择员工",
  error,
  disabled = false,
  columns = ["name", "username", "department"],
  statusFilter = "active",
}: EmployeeSelectorFieldProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (employees: Employee[]) => {
    if (mode === "single") {
      onChange?.(employees[0] || null)
    } else {
      onChange?.(employees)
    }
  }

  const handleClear = () => {
    if (mode === "single") {
      onChange?.(null)
    } else {
      onChange?.([])
    }
  }

  // 格式化显示值
  const getDisplayValue = () => {
    if (mode === "single") {
      const emp = value as Employee | undefined
      return emp ? `${emp.name} (${emp.username})` : ""
    } else {
      const emps = value as Employee[] || []
      if (emps.length === 0) return ""
      if (emps.length === 1) return `${emps[0].name} (${emps[0].username})`
      return `${emps.length} 个员工已选择`
    }
  }

  const selectedIds = mode === "single" 
    ? (value ? [(value as Employee).id] : []) 
    : (value as Employee[] || []).map(emp => emp.id)

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            value={getDisplayValue()}
            placeholder={placeholder}
            readOnly
            disabled={disabled}
            className={error ? "border-destructive" : ""}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={() => setOpen(true)}
            disabled={disabled}
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
        
        {(mode === "single" && value) || (mode === "multiple" && (value as Employee[] || []).length > 0) ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <EmployeeSelectorDialog
        open={open}
        onOpenChange={setOpen}
        mode={mode}
        selectedIds={selectedIds}
        onSelect={handleSelect}
        title={mode === "single" ? "选择员工" : "选择员工"}
        description={mode === "single" ? "请选择一个员工" : "请选择需要的员工"}
        columns={columns}
        statusFilter={statusFilter}
      />
    </div>
  )
}