/**
 * CurrencyConfigPanel
 *
 * 币种配置面板。从"其他配置"中读取和管理币种列表。
 */

import { useState, useEffect, useCallback } from "react"
import type {
  OtherConfigWithParameters,
  ValidationRule,
} from "@/types/other-config"
import {
  fetchOtherConfigsApi,
  updateConfigParametersApi,
} from "@/apis/other-config-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  RefreshCw,
  CheckCircle,
  XCircle
} from "lucide-react"

// ==================== 类型定义 ====================

interface CurrencyItem {
  code: string        // 币种代码 (如: USD)
  name: string        // 币种名称 (如: 美元)
  symbol: string      // 货币符号 (如: $)
  isCommon: boolean   // 是否常用
  isEnabled: boolean  // 是否启用
}

// ==================== 币种数据 ====================

// 币种详细信息映射
const CURRENCY_DETAILS: Record<string, Omit<CurrencyItem, 'code'>> = {
  'USD': { name: '美元', symbol: '$', isCommon: true, isEnabled: true },
  'CNY': { name: '人民币', symbol: '¥', isCommon: true, isEnabled: true },
  'EUR': { name: '欧元', symbol: '€', isCommon: true, isEnabled: true },
  'GBP': { name: '英镑', symbol: '£', isCommon: false, isEnabled: true },
  'JPY': { name: '日元', symbol: '¥', isCommon: false, isEnabled: true },
  'HKD': { name: '港币', symbol: 'HK$', isCommon: false, isEnabled: true },
  'AUD': { name: '澳元', symbol: 'A$', isCommon: false, isEnabled: true },
  'CAD': { name: '加元', symbol: 'C$', isCommon: false, isEnabled: true },
  'CHF': { name: '瑞士法郎', symbol: 'CHF', isCommon: false, isEnabled: true },
  'SGD': { name: '新加坡元', symbol: 'S$', isCommon: false, isEnabled: true },
  'KRW': { name: '韩元', symbol: '₩', isCommon: false, isEnabled: true },
  'RUB': { name: '卢布', symbol: '₽', isCommon: false, isEnabled: true },
}

// ==================== 验证函数 ====================

function parseValue(value: string | null, type: string, _elementType?: string | null): string | string[] {
  if (!value) {
    return type === 'array' ? [] : ''
  }
  if (type === 'array') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return value
}

function parseValidation(validation: string | null | undefined): ValidationRule | undefined {
  if (!validation) return undefined
  try {
    return JSON.parse(validation)
  } catch {
    return undefined
  }
}

// ==================== 数组编辑器组件 ====================

function ArrayEditor({
  elementType = 'text',
  value,
  onChange,
  disabled,
}: {
  elementType?: 'text' | 'number' | 'date'
  value: string[]
  onChange: (v: string[]) => void
  disabled?: boolean
}) {
  const addItem = () => onChange([...value, ''])
  const removeItem = (index: number) => onChange(value.filter((_, i) => i !== index))
  const updateItem = (index: number, v: string) => {
    const newList = [...value]
    newList[index] = v
    onChange(newList)
  }

  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div key={index} className="flex gap-2 items-center">
          <Input
            type={elementType}
            value={item}
            onChange={(e) => updateItem(index, e.target.value.toUpperCase())}
            disabled={disabled}
            className="flex-1"
            placeholder="如: USD"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeItem(index)}
            disabled={disabled}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={addItem}
        disabled={disabled}
        type="button"
      >
        <Plus className="h-4 w-4 mr-1" /> 添加币种
      </Button>
    </div>
  )
}

// ==================== 主组件 ====================

export function CurrencyConfigPanel() {
  const [configs, setConfigs] = useState<OtherConfigWithParameters[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 弹框状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<OtherConfigWithParameters | null>(null)
  const [parameterValues, setParameterValues] = useState<Record<string, string | string[]>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // 找到币种配置项
  const currencyConfig = configs.find(config => config.name === '币种配置')

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchOtherConfigsApi()
      setConfigs(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 打开编辑弹框
  const handleEdit = () => {
    if (!currencyConfig) return
    
    setEditingConfig(currencyConfig)
    // 初始化参数值
    const values: Record<string, string | string[]> = {}
    currencyConfig.parameters.forEach((param) => {
      values[param.id] = parseValue(param.value, param.type, param.elementType)
    })
    setParameterValues(values)
    setValidationErrors({})
    setDialogOpen(true)
  }

  // 更新参数值
  const updateParameterValue = (paramId: string, value: string | string[]) => {
    setParameterValues((prev) => ({ ...prev, [paramId]: value }))
    // 清除该字段的错误
    setValidationErrors((prev) => {
      const next = { ...prev }
      delete next[paramId]
      return next
    })
  }

  // 保存
  const handleSave = async () => {
    if (!editingConfig) return

    // 验证所有参数
    const errors: Record<string, string> = {}
    let hasError = false

    editingConfig.parameters.forEach((param) => {
      const value = parameterValues[param.id]
      const validation = parseValidation(param.validation)
      // 简单验证：必填且不能为空数组
      if (validation?.minItems && Array.isArray(value) && value.length < validation.minItems) {
        errors[param.id] = `至少需要 ${validation.minItems} 个币种`
        hasError = true
      }
      if (Array.isArray(value) && value.length === 0) {
        errors[param.id] = '币种列表不能为空'
        hasError = true
      }
    })

    if (hasError) {
      setValidationErrors(errors)
      return
    }

    // 准备保存数据
    const parameters = editingConfig.parameters.map((param) => ({
      id: param.id,
      value: param.type === 'array'
        ? JSON.stringify(parameterValues[param.id] || [])
        : String(parameterValues[param.id] || ''),
    }))

    setSaving(true)
    try {
      await updateConfigParametersApi(editingConfig.id, { parameters })
      setDialogOpen(false)
      loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  // 获取币种详情
  const getCurrencyDetails = (code: string) => {
    return CURRENCY_DETAILS[code] || { 
      name: code, 
      symbol: code, 
      isCommon: false, 
      isEnabled: true 
    }
  }

  // 从参数值中提取币种代码列表
  const currencyCodes = currencyConfig 
    ? parseValue(
        currencyConfig.parameters.find(p => p.name === '币种列表')?.value || null, 
        'array'
      ) as string[]
    : []

  return (
    <Card>
      <CardContent className="p-6">
        {/* 工具栏 */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-primary rounded-sm flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">$</span>
            </div>
            <h2 className="text-lg font-semibold">币种配置</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            {currencyConfig && (
              <Button size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-1" />
                配置币种
              </Button>
            )}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
            {error}
          </div>
        )}

        {/* 配置信息卡片 */}
        {currencyConfig && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">配置名称</p>
                <p className="font-medium">{currencyConfig.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">配置说明</p>
                <p>{currencyConfig.description || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">更新时间</p>
                <p>{formatDate(currencyConfig.updatedAt)}</p>
              </div>
            </div>
          </div>
        )}

        {/* 币种列表 */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>币种代码</TableHead>
                <TableHead>币种名称</TableHead>
                <TableHead>货币符号</TableHead>
                <TableHead>常用</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="mt-2 text-sm text-muted-foreground">加载中...</p>
                  </TableCell>
                </TableRow>
              ) : currencyCodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    暂无币种配置
                  </TableCell>
                </TableRow>
              ) : (
                currencyCodes.map((code) => {
                  const details = getCurrencyDetails(code)
                  return (
                    <TableRow key={code}>
                      <TableCell className="font-medium">{code}</TableCell>
                      <TableCell>{details.name}</TableCell>
                      <TableCell>{details.symbol}</TableCell>
                      <TableCell>
                        {details.isCommon ? (
                          <Badge variant="default">是</Badge>
                        ) : (
                          <Badge variant="secondary">否</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {details.isEnabled ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>启用</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span>禁用</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* 参数编辑弹框 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingConfig?.name}</DialogTitle>
              <DialogDescription>
                {editingConfig?.description || '配置币种列表'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {editingConfig?.parameters.map((param) => {
                const value = parameterValues[param.id] ?? (param.type === 'array' ? [] : '')
                const error = validationErrors[param.id]

                return (
                  <div key={param.id} className="space-y-2">
                    <Label htmlFor={param.id}>
                      {param.name}
                      {parseValidation(param.validation)?.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>

                    {param.type === 'array' ? (
                      <ArrayEditor
                        elementType={param.elementType as 'text' | 'number' | 'date'}
                        value={value as string[]}
                        onChange={(v) => updateParameterValue(param.id, v)}
                        disabled={saving}
                      />
                    ) : (
                      <Input
                        id={param.id}
                        type={param.type}
                        value={value as string}
                        onChange={(e) => updateParameterValue(param.id, e.target.value)}
                        disabled={saving}
                      />
                    )}

                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}
                    
                    <p className="text-sm text-muted-foreground">
                      输入3位字母代码，如: USD, CNY, EUR
                    </p>
                  </div>
                )
              })}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}