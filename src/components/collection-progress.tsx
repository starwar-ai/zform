/**
 * 收款进度组件
 * 展示单个销售合同的收款进度时间轴
 */

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
} from "lucide-react"
import { getProgressApi, type CollectionProgress as ProgressData } from "@/apis/collection-workbench-api"

interface CollectionProgressProps {
  salesContractId: string
}

export function CollectionProgress({ salesContractId }: CollectionProgressProps) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getProgressApi(salesContractId)
        setProgress(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "获取收款进度失败")
      } finally {
        setLoading(false)
      }
    }

    if (salesContractId) {
      fetchProgress()
    }
  }, [salesContractId])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("zh-CN", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("zh-CN")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "partial":
        return <Clock className="h-5 w-5 text-blue-500" />
      case "overdue":
        return <AlertTriangle className="h-5 w-5 text-destructive" />
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">已完成</Badge>
      case "partial":
        return <Badge variant="secondary">部分收款</Badge>
      case "overdue":
        return <Badge variant="destructive">已逾期</Badge>
      default:
        return <Badge variant="outline">待收款</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-destructive">
          {error}
        </CardContent>
      </Card>
    )
  }

  if (!progress) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">收款进度</CardTitle>
          <span className="text-xl font-bold">{progress.progressRate.toFixed(1)}%</span>
        </div>
        <Progress value={progress.progressRate} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>已收: {formatCurrency(progress.totalReceived)}</span>
          <span>待收: {formatCurrency(progress.totalRemaining)}</span>
        </div>
      </CardHeader>

      <CardContent>
        {/* 时间轴 */}
        <div className="space-y-0">
          {progress.plans.map((plan, index) => (
            <div key={plan.id} className="relative flex gap-4 pb-6 last:pb-0">
              {/* 连接线 */}
              {index < progress.plans.length - 1 && (
                <div className="absolute left-[10px] top-[28px] h-full w-[2px] bg-border" />
              )}

              {/* 状态图标 */}
              <div className="relative z-10 flex-shrink-0 bg-background">
                {getStatusIcon(plan.status)}
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">第 {plan.periodIndex} 期</span>
                  {getStatusBadge(plan.status)}
                  {plan.status === "overdue" && plan.overdueDays > 0 && (
                    <span className="text-xs text-destructive">
                      逾期 {plan.overdueDays} 天
                    </span>
                  )}
                </div>

                {plan.receiptDescription && (
                  <p className="text-sm text-muted-foreground mb-1">
                    {plan.receiptDescription}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">预计收款日:</span>
                    <span>{formatDate(plan.expectedReceiptDate)}</span>
                  </div>
                  {plan.actualReceiptDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">实际收款日:</span>
                      <span>{formatDate(plan.actualReceiptDate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">应收金额:</span>
                    <span>{formatCurrency(plan.receivable)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">已收金额:</span>
                    <span className={plan.received > 0 ? "text-green-600" : ""}>
                      {formatCurrency(plan.received)}
                    </span>
                  </div>
                </div>

                {plan.remaining > 0 && (
                  <div className="mt-2">
                    <Progress value={plan.ratio} className="h-1.5" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                      <span>收款进度</span>
                      <span>{plan.ratio.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {progress.plans.length === 0 && (
          <p className="text-center text-muted-foreground py-4">暂无收款计划</p>
        )}
      </CardContent>
    </Card>
  )
}
