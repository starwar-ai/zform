/**
 * Customer SalesRep Test
 *
 * 测试客户表单中主业务员字段使用员工选择器的效果
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmployeeSelectorField } from "@/components/employee-selector-field"
import type { Employee } from "@/types/employee"

export function CustomerSalesRepTest() {
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([])
  const [singleEmployee, setSingleEmployee] = useState<Employee | null>(null)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">客户主业务员测试</h1>
        <p className="text-muted-foreground mt-2">
          测试客户表单中主业务员字段使用员工选择器的功能
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 多选模式测试 */}
        <Card>
          <CardHeader>
            <CardTitle>多选模式（客户表单默认）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <EmployeeSelectorField
              label="主业务员"
              required
              mode="multiple"
              value={selectedEmployees}
              onChange={(value) => setSelectedEmployees(value as Employee[])}
              placeholder="请选择主业务员"
              columns={["name", "username", "department"]}
              statusFilter="active"
            />
            
            {selectedEmployees.length > 0 && (
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-medium mb-2">已选择的业务员：</h3>
                <div className="space-y-2">
                  {selectedEmployees.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between p-2 bg-background rounded">
                      <div>
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-sm text-muted-foreground">{emp.username}</div>
                      </div>
                      {emp.department && (
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                          {emp.department}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 单选模式测试 */}
        <Card>
          <CardHeader>
            <CardTitle>单选模式（对比）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <EmployeeSelectorField
              label="主业务员"
              mode="single"
              value={singleEmployee || undefined}
              onChange={(value) => setSingleEmployee(value as Employee | null)}
              placeholder="请选择主业务员"
              columns={["name", "username", "email", "department"]}
              statusFilter="all"
            />
            
            {singleEmployee && (
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-medium mb-2">已选择的业务员：</h3>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">姓名：</span>
                    <span className="font-medium">{singleEmployee.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">用户名：</span>
                    {singleEmployee.username}
                  </div>
                  {singleEmployee.email && (
                    <div>
                      <span className="text-muted-foreground">邮箱：</span>
                      {singleEmployee.email}
                    </div>
                  )}
                  {singleEmployee.department && (
                    <div>
                      <span className="text-muted-foreground">部门：</span>
                      {singleEmployee.department}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>配置说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">客户表单配置：</h3>
            <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
{`{
  id: "salesRep",
  label: "主业务员",
  type: "employeeSelector",
  placeholder: "选择业务员",
  group: "业务信息",
  employeeSelectorConfig: {
    mode: "multiple",           // 支持多选
    columns: ["name", "username", "department"],  // 显示姓名、用户名、部门
    statusFilter: "active"      // 只显示启用状态的员工
  }
}`}
            </pre>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">功能特点：</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>支持多选模式，可同时选择多个业务员</li>
              <li>提供搜索功能，可快速查找员工</li>
              <li>可配置显示的字段列</li>
              <li>支持按员工状态过滤</li>
              <li>与现有表单系统无缝集成</li>
              <li>保持原有的表单验证和数据绑定机制</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}