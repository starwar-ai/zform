/**
 * OtherConfigPanel
 *
 * 其他配置面板。显示配置列表，点击可打开参数编辑弹框。
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Loader2, RefreshCw, Plus, X, Coins, Trash2 } from "lucide-react"

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

function validateParameter(
  value: string | string[],
  type: string,
  validation?: ValidationRule
): string | null {
  if (!validation) return null

  // 必填校验
  if (validation.required) {
    if (type === 'array') {
      if (!value || (value as string[]).length === 0) {
        return '此字段为必填项'
      }
    } else if (!value) {
      return '此字段为必填项'
    }
  }

  if (!value) return null

  switch (type) {
    case 'number': {
      const num = Number(value)
      if (isNaN(num)) return '请输入有效的数字'
      if (validation.min !== undefined && num < validation.min) {
        return `最小值为 ${validation.min}`
      }
      if (validation.max !== undefined && num > validation.max) {
        return `最大值为 ${validation.max}`
      }
      if (validation.integer && !Number.isInteger(num)) {
        return '必须为整数'
      }
      break
    }
    case 'date': {
      const date = new Date(value as string)
      if (isNaN(date.getTime())) return '请输入有效的日期'
      if (validation.minDate && date < new Date(validation.minDate)) {
        return `日期不能早于 ${validation.minDate}`
      }
      if (validation.maxDate && date > new Date(validation.maxDate)) {
        return `日期不能晚于 ${validation.maxDate}`
      }
      break
    }
    case 'text': {
      const str = value as string
      if (validation.minLength && str.length < validation.minLength) {
        return `最少 ${validation.minLength} 个字符`
      }
      if (validation.maxLength && str.length > validation.maxLength) {
        return `最多 ${validation.maxLength} 个字符`
      }
      if (validation.pattern) {
        const regex = new RegExp(validation.pattern)
        if (!regex.test(str)) {
          return '格式不正确'
        }
      }
      break
    }
    case 'array': {
      const arr = value as string[]
      if (validation.minItems && arr.length < validation.minItems) {
        return `至少需要 ${validation.minItems} 个元素`
      }
      if (validation.maxItems && arr.length > validation.maxItems) {
        return `最多允许 ${validation.maxItems} 个元素`
      }
      break
    }
  }
  return null
}

// ==================== 币种数组编辑器组件 ====================

import { fetchCurrencyInfoApi, type CurrencyInfo } from "@/apis/currency-api"

function CurrencyArrayEditor({
  value,
  onChange,
  disabled,
}: {
  value: string[]
  onChange: (v: string[]) => void
  disabled?: boolean
}) {
  const [currencyInfo, setCurrencyInfo] = useState<Record<string, CurrencyInfo>>({})
  const [loading, setLoading] = useState(false)

  // 加载币种信息
  useEffect(() => {
    const loadCurrencyInfo = async () => {
      setLoading(true)
      try {
        const currencies = await fetchCurrencyInfoApi()
        const infoMap: Record<string, CurrencyInfo> = {}
        currencies.forEach(currency => {
          infoMap[currency.code] = currency
        })
        setCurrencyInfo(infoMap)
      } catch (error) {
        console.error('加载币种信息失败:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadCurrencyInfo()
  }, [])

  const addItem = () => onChange([...value, ''])
  const removeItem = (index: number) => onChange(value.filter((_, i) => i !== index))
  const updateItem = (index: number, v: string) => {
    const newList = [...value]
    newList[index] = v.toUpperCase()
    onChange(newList)
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {value.map((code, index) => {
          const info = currencyInfo[code] || { name: '未知', symbol: code, isCommon: false, isEnabled: true }
          return (
            <div key={index} className="flex gap-2 items-center">
              <div className="flex-1 grid grid-cols-12 gap-2">
                <div className="col-span-3">
                  <Input
                    value={code}
                    onChange={(e) => updateItem(index, e.target.value)}
                    disabled={disabled}
                    placeholder="币种代码"
                    className="uppercase"
                  />
                </div>
                <div className="col-span-4">
                  <Input
                    value={info.name}
                    disabled
                    placeholder="币种名称"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    value={info.symbol}
                    disabled
                    placeholder="符号"
                  />
                </div>
                <div className="col-span-2 flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={disabled}
                    type="button"
                    className="h-9 w-9"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={addItem}
        disabled={disabled || loading}
        type="button"
        className="w-full"
      >
        {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
        <Plus className="h-4 w-4 mr-1" /> 添加币种
      </Button>
      <p className="text-sm text-muted-foreground mt-2">
        输入3位字母代码，如: USD, CNY, EUR
      </p>
    </div>
  )
}

// ==================== 标准数组编辑器组件 ====================

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
            onChange={(e) => updateItem(index, e.target.value)}
            disabled={disabled}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeItem(index)}
            disabled={disabled}
            type="button"
          >
            <X className="h-4 w-4" />
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
        <Plus className="h-4 w-4 mr-1" /> 添加
      </Button>
    </div>
  )
}

// ==================== 主组件 ====================

export function OtherConfigPanel() {
  const [configs, setConfigs] = useState<OtherConfigWithParameters[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 弹框状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<OtherConfigWithParameters | null>(null)
  const [parameterValues, setParameterValues] = useState<Record<string, string | string[]>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

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
  const handleEdit = (config: OtherConfigWithParameters) => {
    setEditingConfig(config)
    // 初始化参数值
    const values: Record<string, string | string[]> = {}
    config.parameters.forEach((param) => {
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
      const error = validateParameter(value ?? (param.type === 'array' ? [] : ''), param.type, validation)
      if (error) {
        errors[param.id] = error
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

  return (
    <Card>
      <CardContent className="p-6">
        {/* 工具栏 */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">其他配置</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
            {error}
          </div>
        )}

        {/* 数据表格 */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>配置名称</TableHead>
                <TableHead>配置说明</TableHead>
                <TableHead>参数数量</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
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
              ) : configs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                configs.map((config) => (
                  <TableRow key={config.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {config.name === '币种配置' ? (
                          <Coins className="h-4 w-4 text-primary" />
                        ) : (
                          <Settings className="h-4 w-4 text-muted-foreground" />
                        )}
                        {config.name}
                      </div>
                    </TableCell>
                    <TableCell>{config.description || '-'}</TableCell>
                    <TableCell>{config.parameters?.length || 0}</TableCell>
                    <TableCell>{formatDate(config.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(config)}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        配置参数
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* 参数编辑弹框 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingConfig?.name}</DialogTitle>
              <DialogDescription>
                {editingConfig?.description || '配置参数设置'}
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
                      editingConfig?.name === '币种配置' && param.name === '币种列表' ? (
                        <CurrencyArrayEditor
                          value={value as string[]}
                          onChange={(v) => updateParameterValue(param.id, v)}
                          disabled={saving}
                        />
                      ) : (
                        <ArrayEditor
                          elementType={param.elementType as 'text' | 'number' | 'date'}
                          value={value as string[]}
                          onChange={(v) => updateParameterValue(param.id, v)}
                          disabled={saving}
                        />
                      )
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
                  </div>
                )
              })}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
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
