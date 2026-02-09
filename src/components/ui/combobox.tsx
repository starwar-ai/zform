/**
 * Combobox
 *
 * 通用可搜索下拉选择组件，基于 Popover + Command 实现。
 * 支持：
 * - 异步加载选项（首次展开时获取）
 * - 模糊搜索过滤（cmdk 内置）
 * - 树形选项缩进显示
 * - 仅叶子节点可选（树形模式下）
 */

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import type { ComboboxOption } from "@/core/types"

interface ComboboxProps {
  /** 当前选中的值 */
  value?: string
  /** 值变更回调 */
  onChange: (value: string | undefined) => void
  /** 占位提示文本 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 选项获取函数（异步） */
  fetchOptions: () => Promise<ComboboxOption[]>
  /** 是否为树形数据（启用缩进 + 仅叶子可选） */
  isTree?: boolean
}

/** 每层缩进的像素数 */
const INDENT_PX = 20

export function Combobox({
  value,
  onChange,
  placeholder = "请选择...",
  disabled = false,
  fetchOptions,
  isTree = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [options, setOptions] = React.useState<ComboboxOption[]>([])
  const [loading, setLoading] = React.useState(false)
  const [loaded, setLoaded] = React.useState(false)

  // 加载选项数据（首次打开时触发）
  const loadOptions = React.useCallback(async () => {
    if (loaded || loading) return
    setLoading(true)
    try {
      const data = await fetchOptions()
      setOptions(data)
      setLoaded(true)
    } catch (err) {
      console.error("Combobox: 加载选项失败", err)
    } finally {
      setLoading(false)
    }
  }, [fetchOptions, loaded, loading])

  // Popover 打开时加载数据
  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen)
      if (nextOpen) {
        loadOptions()
      }
    },
    [loadOptions]
  )

  // 查找当前选中项的显示文本
  const selectedLabel = React.useMemo(() => {
    if (!value) return undefined
    const found = options.find((opt) => opt.value === value)
    return found?.label
  }, [value, options])

  // 如果有初始值但还没加载选项，需要预加载一次
  React.useEffect(() => {
    if (value && !loaded && !loading) {
      loadOptions()
    }
  }, [value, loaded, loading, loadOptions])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <span className="truncate">
            {selectedLabel ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="搜索..." />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
              </div>
            ) : (
              <>
                <CommandEmpty>未找到匹配项</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => {
                    const isNonLeaf = isTree && option.isLeaf === false
                    const isSelected = value === option.value

                    return (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        disabled={isNonLeaf}
                        onSelect={() => {
                          if (isNonLeaf) return
                          // 点击已选中的项则取消选择
                          onChange(isSelected ? undefined : option.value)
                          setOpen(false)
                        }}
                        className={cn(
                          isNonLeaf && "opacity-60 cursor-default font-medium"
                        )}
                        style={{
                          paddingLeft: isTree && option.depth
                            ? `${option.depth * INDENT_PX + 8}px`
                            : undefined,
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate">{option.label}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
