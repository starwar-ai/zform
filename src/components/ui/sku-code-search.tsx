/**
 * SkuCodeSearch
 *
 * 产品编号搜索组件：
 * - 单个编号精确搜索
 * - 批量编号搜索（弹窗多行输入，最多 200 项）
 */

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { ListFilter } from "lucide-react"
import { cn } from "@/lib/utils"

const MAX_BATCH_COUNT = 200

/** 将批量文本解析为去重后的编号数组 */
function parseBatchText(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(/[\n,;，；\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  )
}

export interface SkuCodeSearchProps {
  /** 单个编号搜索值 */
  value?: string
  /** 值变更回调 */
  onChange?: (value: string) => void
  /** 批量搜索回调，传入去重后的编号数组 */
  onBatchSearch?: (codes: string[]) => void
  /** 占位提示 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 额外 className */
  className?: string
}

export function SkuCodeSearch({
  value = "",
  onChange,
  onBatchSearch,
  placeholder = "产品编号",
  disabled,
  className,
}: SkuCodeSearchProps) {
  const [open, setOpen] = React.useState(false)
  const [batchText, setBatchText] = React.useState("")

  const parsedCodes = React.useMemo(() => parseBatchText(batchText), [batchText])
  const isOverLimit = parsedCodes.length > MAX_BATCH_COUNT

  const handleBatchConfirm = () => {
    if (!onBatchSearch) return
    onBatchSearch(parsedCodes.slice(0, MAX_BATCH_COUNT))
    setBatchText("")
    setOpen(false)
  }

  return (
    <div className={cn("flex", className)}>
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="rounded-r-none"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled}
            className="rounded-l-none border-l-0"
            aria-label="批量搜索"
          >
            <ListFilter className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96" align="start">
          <div className="space-y-3">
            <div className="text-xs font-medium">批量编号搜索</div>
            <Textarea
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder={`编号搜索，一行一项，最多 ${MAX_BATCH_COUNT} 项\n支持换行、逗号、分号分隔`}
              rows={6}
              className="font-mono text-xs"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {isOverLimit ? (
                  <span className="text-destructive">
                    已超过 {MAX_BATCH_COUNT} 项，将截取前 {MAX_BATCH_COUNT} 项
                  </span>
                ) : (
                  `已输入 ${parsedCodes.length} 项`
                )}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setBatchText("")}>
                  清空
                </Button>
                <Button size="sm" onClick={handleBatchConfirm}>
                  确认搜索
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
