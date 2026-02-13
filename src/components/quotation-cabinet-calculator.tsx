/**
 * Quotation Cabinet Calculator
 * 
 * 报价单柜型计算辅助组件
 * 为报价单明细表提供柜型自动计算功能
 */

import { useState } from "react"
import { executeDocumentAction } from "@/apis/document-api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calculator } from "lucide-react"

interface CabinetResult {
  container20ft: number
  container40ft: number
  container40hq: number
  bulkCargo: number
  totalVolume: number
}

interface QuotationItem {
  boxCount?: number
  outerBoxVolume?: number
}

interface CabinetCalculatorProps {
  /** 报价单明细行数据 */
  items: QuotationItem[]
  /** 计算完成后的回调 */
  onCalculated?: (results: CabinetResult[]) => void
}

/**
 * 柜型计算器组件
 */
export function CabinetCalculator({ items, onCalculated }: CabinetCalculatorProps) {
  const [open, setOpen] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [results, setResults] = useState<CabinetResult[]>([])

  const handleCalculate = async () => {
    if (!items || items.length === 0) {
      alert("请先添加产品明细")
      return
    }

    setCalculating(true)
    try {
      // 调用后端计算接口
      const response = await executeDocumentAction(
        "quotation",
        "temp", // 对于未保存的单据，使用临时ID
        "calculateContainers",
        { items }
      )

      setResults(response.results || [])
      setOpen(true)

      if (onCalculated) {
        onCalculated(response.results)
      }
    } catch (error: any) {
      alert(`计算失败: ${error.message || "计算柜型时发生错误"}`)
    } finally {
      setCalculating(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCalculate}
        disabled={calculating || !items || items.length === 0}
      >
        <Calculator className="h-4 w-4 mr-2" />
        {calculating ? "计算中..." : "计算柜型"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>柜型计算结果</DialogTitle>
            <DialogDescription>
              根据箱数和外箱体积自动计算的集装箱配置
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-2 text-left">行号</th>
                  <th className="p-2 text-right">总体积(m³)</th>
                  <th className="p-2 text-right">20尺柜</th>
                  <th className="p-2 text-right">40尺柜</th>
                  <th className="p-2 text-right">40尺高柜</th>
                  <th className="p-2 text-right">散货(m³)</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2 text-right">{result.totalVolume.toFixed(2)}</td>
                    <td className="p-2 text-right">{result.container20ft}</td>
                    <td className="p-2 text-right">{result.container40ft}</td>
                    <td className="p-2 text-right">{result.container40hq}</td>
                    <td className="p-2 text-right">{result.bulkCargo.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg mt-4">
            <h4 className="font-medium mb-2">计算规则说明：</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 20尺柜标准容量：28 m³</li>
              <li>• 40尺柜标准容量：58 m³</li>
              <li>• 40尺高柜标准容量：68 m³</li>
              <li>• 优先顺序：40尺高柜 → 40尺柜 → 20尺柜 → 散货</li>
              <li>• 不足一个柜的余量计入散货</li>
            </ul>
          </div>

          <DialogFooter>
            <Button onClick={() => setOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * 使用示例：
 * 
 * ```tsx
 * import { CabinetCalculator } from "@/components/quotation-cabinet-calculator"
 * 
 * // 在明细表上方添加计算按钮
 * <div className="flex gap-2 mb-4">
 *   <CabinetCalculator 
 *     items={detailTableData}
 *     onCalculated={(results) => {
 *       // 将计算结果更新到明细表
 *       results.forEach((result, index) => {
 *         updateDetailRow(index, {
 *           container20ft: result.container20ft,
 *           container40ft: result.container40ft,
 *           container40hq: result.container40hq,
 *           bulkCargo: result.bulkCargo,
 *         })
 *       })
 *     }}
 *   />
 * </div>
 * ```
 */
