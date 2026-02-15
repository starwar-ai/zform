# Employee Selector Components

员工选择组件库 - 提供完整的员工选择功能，支持单选和多选模式。

## 组件列表

### 1. EmployeeSelectorDialog (核心对话框组件)

基础的员工选择对话框，提供完整的员工列表展示和选择功能。

#### Props

```typescript
interface EmployeeSelectorDialogProps {
  open: boolean                    // 对话框是否打开
  onOpenChange: (open: boolean) => void  // 控制对话框开关
  mode?: "single" | "multiple"     // 选择模式，默认 "multiple"
  selectedIds?: string[]           // 已选择的员工ID
  onSelect: (employees: Employee[]) => void  // 选择回调
  title?: string                   // 对话框标题
  description?: string             // 对话框描述
  columns?: Array<"name" | "username" | "email" | "phone" | "department" | "status">  // 显示的列
  statusFilter?: "active" | "inactive" | "all"  // 状态过滤
}
```

#### 基本用法

```tsx
import { EmployeeSelectorDialog } from "@/components/employee-selector-dialog"
import type { Employee } from "@/types/employee"

function MyComponent() {
  const [open, setOpen] = useState(false)
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([])

  const handleSelect = (employees: Employee[]) => {
    setSelectedEmployees(employees)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        选择员工 ({selectedEmployees.length})
      </Button>
      
      <EmployeeSelectorDialog
        open={open}
        onOpenChange={setOpen}
        mode="multiple"
        onSelect={handleSelect}
        title="选择项目成员"
        description="请选择参与该项目的所有员工"
        columns={["name", "username", "email", "department"]}
        statusFilter="active"
      />
    </>
  )
}
```

### 2. EmployeeSelectorField (表单字段组件)

专为表单设计的员工选择字段，可以直接集成到表单中使用。

#### Props

```typescript
interface EmployeeSelectorFieldProps {
  label?: string                   // 字段标签
  required?: boolean               // 是否必填
  mode?: "single" | "multiple"     // 选择模式
  value?: Employee | Employee[]    // 已选择的员工
  onChange?: (value: Employee | Employee[] | null) => void  // 值改变回调
  placeholder?: string             // 占位符文本
  error?: string                   // 错误信息
  disabled?: boolean               // 禁用状态
  columns?: Array<"name" | "username" | "email" | "phone" | "department" | "status">
  statusFilter?: "active" | "inactive" | "all"
}
```

#### 基本用法

```tsx
import { EmployeeSelectorField } from "@/components/employee-selector-field"
import { useForm } from "react-hook-form"

function MyForm() {
  const { control, handleSubmit } = useForm()
  const [manager, setManager] = useState<Employee | null>(null)
  const [teamMembers, setTeamMembers] = useState<Employee[]>([])

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* 单选示例 */}
      <EmployeeSelectorField
        label="项目经理"
        required
        mode="single"
        value={manager}
        onChange={setManager}
        placeholder="请选择项目经理"
        columns={["name", "username", "department"]}
      />

      {/* 多选示例 */}
      <EmployeeSelectorField
        label="团队成员"
        mode="multiple"
        value={teamMembers}
        onChange={setTeamMembers}
        placeholder="请选择团队成员"
        columns={["name", "username", "email"]}
      />
    </form>
  )
}
```

### 3. EmployeeSelectorDemo (演示组件)

展示如何使用员工选择器的完整示例组件。

## 类型定义

### Employee 接口

```typescript
interface Employee {
  id: string
  username: string
  name: string
  email?: string | null
  phone?: string | null
  department?: string | null
  departmentId?: string | null
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

interface EmployeeWithDetails extends Employee {
  roles?: Array<{
    id: string
    name: string
    code: string
  }>
  stores?: Array<{
    id: string
    name: string
    isManager: boolean
  }>
  departments?: Array<{
    id: string
    name: string
    isManager: boolean
  }>
}
```

## API 接口

### employee-api.ts

提供完整的员工管理 API 封装：

```typescript
// 获取员工列表
fetchEmployeesApi(params?: {
  status?: 'active' | 'inactive' | 'all'
  search?: string
  departmentId?: string
  page?: number
  pageSize?: number
})

// 获取员工详情
fetchEmployeeByIdApi(id: string)

// 创建员工
createEmployeeApi(data: {
  username: string
  password: string
  name: string
  email?: string
  phone?: string
  departmentId?: string
  roleIds?: string[]
})

// 更新员工
updateEmployeeApi(id: string, data: {
  name?: string
  email?: string
  phone?: string
  departmentId?: string
  status?: 'active' | 'inactive'
})

// 删除员工
deleteEmployeeApi(id: string)

// 分配角色
assignEmployeeRolesApi(employeeId: string, roleIds: string[])
```

## 主要特性

✅ **双模式支持** - 单选和多选模式灵活切换  
✅ **搜索功能** - 支持按姓名、用户名、邮箱搜索  
✅ **分页加载** - 自动分页处理大量数据  
✅ **自定义列** - 可配置显示的字段列  
✅ **状态过滤** - 支持按员工状态筛选  
✅ **响应式设计** - 适配各种屏幕尺寸  
✅ **表单集成** - 提供专门的表单字段组件  
✅ **类型安全** - 完整的 TypeScript 类型定义  
✅ **无障碍访问** - 支持键盘导航和屏幕阅读器  

## 使用场景

- 项目管理 - 选择项目负责人和团队成员
- 审批流程 - 指定审批人
- 任务分配 - 分配任务给特定员工
- 部门管理 - 管理部门成员
- 角色分配 - 为员工分配系统角色

## 安装依赖

确保项目中已安装以下依赖：

```bash
npm install @tanstack/react-query lucide-react
```

## 注意事项

1. 需要配置正确的 API 基础路径
2. 员工数据通过 TanStack Query 进行缓存管理
3. 组件使用相对路径导入，请根据实际项目结构调整
4. 建议在使用前先确保员工数据接口可用

## 自定义样式

可以通过 Tailwind CSS 类名自定义组件外观：

```tsx
<EmployeeSelectorDialog
  className="max-w-6xl"  // 自定义对话框宽度
  // ...其他 props
/>
```