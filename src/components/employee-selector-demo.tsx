/**
 * Employee Selector Demo
 *
 * 员工选择器使用示例
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Users } from "lucide-react"
import { EmployeeSelectorDialog } from "@/components/employee-selector-dialog"
import type { Employee } from "@/types/employee"

export function EmployeeSelectorDemo() {
  const [singleSelectOpen, setSingleSelectOpen] = useState(false)
  const [multipleSelectOpen, setMultipleSelectOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([])

  // 单选示例
  const handleSingleSelect = (employees: Employee[]) => {
    if (employees.length > 0) {
      setSelectedEmployee(employees[0])
    }
  }

  // 多选示例
  const handleMultipleSelect = (employees: Employee[]) => {
    setSelectedEmployees(employees)
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">员工选择器演示</h1>
        <p className="text-muted-foreground mt-2">
          展示如何使用员工选择对话框进行单选和多选操作
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 单选示例 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              单选模式
            </CardTitle>
            <CardDescription>
              只能选择一个员工，点击员工行即可选择
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => setSingleSelectOpen(true)}>
              选择员工
            </Button>
            
            {selectedEmployee && (
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-medium mb-2">已选择的员工：</h3>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">姓名：</span>
                    <span className="font-medium">{selectedEmployee.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">用户名：</span>
                    {selectedEmployee.username}
                  </div>
                  {selectedEmployee.email && (
                    <div>
                      <span className="text-muted-foreground">邮箱：</span>
                      {selectedEmployee.email}
                    </div>
                  )}
                  {selectedEmployee.department && (
                    <div>
                      <span className="text-muted-foreground">部门：</span>
                      <Badge variant="secondary">{selectedEmployee.department}</Badge>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 多选示例 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              多选模式
            </CardTitle>
            <CardDescription>
              可以选择多个员工，支持复选框和全选功能
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => setMultipleSelectOpen(true)}>
              选择员工 ({selectedEmployees.length})
            </Button>
            
            {selectedEmployees.length > 0 && (
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-medium mb-2">
                  已选择 {selectedEmployees.length} 个员工：
                </h3>
                <div className="space-y-2">
                  {selectedEmployees.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between p-2 bg-background rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-3 h-3 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{emp.name}</div>
                          <div className="text-xs text-muted-foreground">{emp.username}</div>
                        </div>
                      </div>
                      {emp.department && (
                        <Badge variant="secondary" className="text-xs">
                          {emp.department}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">主要特性：</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>支持单选和多选两种模式</li>
              <li>提供搜索功能，可按姓名、用户名、邮箱搜索</li>
              <li>支持分页加载大量数据</li>
              <li>可自定义显示的列</li>
              <li>支持状态过滤（启用/停用/全部）</li>
              <li>响应式设计，适配不同屏幕尺寸</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">基本用法：</h3>
            <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`import { EmployeeSelectorDialog } from "@/components/employee-selector-dialog"

// 单选模式
<EmployeeSelectorDialog
  open={open}
  onOpenChange={setOpen}
  mode="single"
  onSelect={handleSelect}
/>

// 多选模式
<EmployeeSelectorDialog
  open={open}
  onOpenChange={setOpen}
  mode="multiple"
  onSelect={handleSelect}
/>`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* 对话框组件 */}
      <EmployeeSelectorDialog
        open={singleSelectOpen}
        onOpenChange={setSingleSelectOpen}
        mode="single"
        onSelect={handleSingleSelect}
        title="选择负责人"
        description="请选择一个员工作为项目负责人"
        columns={["name", "username", "email", "department"]}
        statusFilter="active"
      />

      <EmployeeSelectorDialog
        open={multipleSelectOpen}
        onOpenChange={setMultipleSelectOpen}
        mode="multiple"
        onSelect={handleMultipleSelect}
        title="选择参与人员"
        description="请选择参与该项目的所有员工"
        columns={["name", "username", "department", "status"]}
        statusFilter="all"
      />
    </div>
  )
}