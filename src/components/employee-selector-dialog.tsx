/**
 * Employee Selector Dialog
 *
 * 员工选择对话框 - 支持单选和多选模式
 */

import { useState, useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, User, Check, X } from "lucide-react"
import { fetchEmployeesApi } from "@/apis/employee-api"
import type { Employee } from "@/types/employee"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

interface EmployeeSelectorDialogProps {
  /** 对话框是否打开 */
  open: boolean
  /** 控制对话框开关 */
  onOpenChange: (open: boolean) => void
  /** 选择模式: single(单选) | multiple(多选) */
  mode?: "single" | "multiple"
  /** 已选择的员工ID */
  selectedIds?: string[]
  /** 选择回调 */
  onSelect: (employees: Employee[]) => void
  /** 对话框标题 */
  title?: string
  /** 对话框描述 */
  description?: string
  /** 显示的列 */
  columns?: Array<"name" | "username" | "email" | "phone" | "department" | "status">
  /** 状态过滤 */
  statusFilter?: "active" | "inactive" | "all"
}

export function EmployeeSelectorDialog({
  open,
  onOpenChange,
  mode = "multiple",
  selectedIds = [],
  onSelect,
  title = "选择员工",
  description = "请选择需要的员工",
  columns = ["name", "username", "email", "department", "status"],
  statusFilter = "active",
}: EmployeeSelectorDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEmployees, setSelectedEmployees] = useState<Record<string, Employee>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  // 初始化已选择的员工
  useEffect(() => {
    if (open && selectedIds.length > 0) {
      // 如果已经有选中的员工，在打开时初始化
      const initialSelected: Record<string, Employee> = {}
      selectedIds.forEach(id => {
        // 这里可能需要通过API获取员工详情，暂时用ID构造对象
        initialSelected[id] = { 
          id, 
          username: '', 
          name: '', 
          status: 'active',
          createdAt: '',
          updatedAt: ''
        } as Employee
      })
      setSelectedEmployees(initialSelected)
    }
  }, [open, selectedIds])

  // 获取员工列表
  const { data, isLoading, isError } = useQuery({
    queryKey: ["employees", searchTerm, statusFilter, currentPage],
    queryFn: () => fetchEmployeesApi({
      search: searchTerm,
      status: statusFilter,
      page: currentPage,
      pageSize,
    }),
    enabled: open,
  })

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  // 切换员工选择
  const toggleEmployeeSelection = (employee: Employee) => {
    setSelectedEmployees(prev => {
      const newSelected = { ...prev }
      
      if (mode === "single") {
        // 单选模式：清空其他选择，只保留当前选择
        return { [employee.id]: employee }
      } else {
        // 多选模式：切换选择状态
        if (newSelected[employee.id]) {
          delete newSelected[employee.id]
        } else {
          newSelected[employee.id] = employee
        }
        return newSelected
      }
    })
  }

  // 检查员工是否被选中
  const isEmployeeSelected = (employeeId: string) => {
    return !!selectedEmployees[employeeId]
  }

  // 全选/取消全选
  const toggleAll = () => {
    if (mode === "single") return
    
    if (Object.keys(selectedEmployees).length === data?.records.length) {
      // 如果已经全选，则取消全选
      setSelectedEmployees({})
    } else {
      // 否则全选当前页
      const newSelected: Record<string, Employee> = {}
      data?.records.forEach(emp => {
        newSelected[emp.id] = emp
      })
      setSelectedEmployees(newSelected)
    }
  }

  // 确认选择
  const handleConfirm = () => {
    onSelect(Object.values(selectedEmployees))
    onOpenChange(false)
    // 重置状态
    setSelectedEmployees({})
    setSearchTerm("")
    setCurrentPage(1)
  }

  // 取消选择
  const handleCancel = () => {
    onOpenChange(false)
    // 重置状态
    setSelectedEmployees({})
    setSearchTerm("")
    setCurrentPage(1)
  }

  // 计算已选择数量
  const selectedCount = Object.keys(selectedEmployees).length

  // 获取显示的员工列表
  const displayedEmployees = data?.records || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
            {mode === "multiple" && selectedCount > 0 && (
              <span className="ml-2 text-primary">
                (已选择 {selectedCount} 人)
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* 搜索栏 */}
        <div className="flex items-center gap-2 py-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索员工姓名、用户名或邮箱..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          {mode === "multiple" && displayedEmployees.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAll}
            >
              {Object.keys(selectedEmployees).length === displayedEmployees.length
                ? "取消全选"
                : "全选"}
            </Button>
          )}
        </div>

        {/* 员工表格 */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">加载中...</p>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-destructive">加载失败，请重试</p>
            </div>
          ) : displayedEmployees.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">暂无员工数据</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden h-full flex flex-col">
              <div className="overflow-auto flex-1">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      {mode === "multiple" && (
                        <TableHead className="w-12">
                          <Checkbox
                            checked={Object.keys(selectedEmployees).length === displayedEmployees.length && displayedEmployees.length > 0}
                            onCheckedChange={toggleAll}
                          />
                        </TableHead>
                      )}
                      {columns.includes("name") && <TableHead className="w-32">姓名</TableHead>}
                      {columns.includes("username") && <TableHead className="w-32">用户名</TableHead>}
                      {columns.includes("email") && <TableHead className="w-40">邮箱</TableHead>}
                      {columns.includes("phone") && <TableHead className="w-32">电话</TableHead>}
                      {columns.includes("department") && <TableHead className="w-32">部门</TableHead>}
                      {columns.includes("status") && <TableHead className="w-20">状态</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedEmployees.map((employee) => (
                      <TableRow
                        key={employee.id}
                        className={`cursor-pointer ${
                          isEmployeeSelected(employee.id)
                            ? "bg-primary/10 hover:bg-primary/20"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleEmployeeSelection(employee)}
                      >
                        {mode === "multiple" && (
                          <TableCell>
                            <Checkbox
                              checked={isEmployeeSelected(employee.id)}
                              onCheckedChange={() => toggleEmployeeSelection(employee)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                        )}
                        {columns.includes("name") && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              <span className="font-medium">{employee.name || "-"}</span>
                            </div>
                          </TableCell>
                        )}
                        {columns.includes("username") && (
                          <TableCell className="text-muted-foreground">
                            {employee.username || "-"}
                          </TableCell>
                        )}
                        {columns.includes("email") && (
                          <TableCell className="text-muted-foreground">
                            {employee.email || "-"}
                          </TableCell>
                        )}
                        {columns.includes("phone") && (
                          <TableCell className="text-muted-foreground">
                            {employee.phone || "-"}
                          </TableCell>
                        )}
                        {columns.includes("department") && (
                          <TableCell>
                            {employee.department ? (
                              <Badge variant="secondary" className="text-xs">
                                {employee.department}
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        )}
                        {columns.includes("status") && (
                          <TableCell>
                            <Badge
                              variant={employee.status === "active" ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {employee.status === "active" ? "启用" : "停用"}
                            </Badge>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* 分页 */}
              {data && data.total > pageSize && (
                <div className="border-t px-4 py-2 flex items-center justify-between bg-muted/30">
                  <div className="text-sm text-muted-foreground">
                    共 {data.total} 条记录
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    >
                      上一页
                    </Button>
                    <span className="text-sm">
                      第 {currentPage} 页 / 共 {Math.ceil(data.total / pageSize)} 页
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= Math.ceil(data.total / pageSize)}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部操作按钮 */}
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4 mr-2" />
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
          >
            <Check className="w-4 h-4 mr-2" />
            确认选择 ({selectedCount})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}