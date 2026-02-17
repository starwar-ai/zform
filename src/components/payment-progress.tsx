/**
 * 付款进度组件
 * 展示单个采购合同的付款进度时间轴
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
import { getPaymentProgressApi, type PaymentProgress as ProgressData } from "@/apis/payment-workbench-api"

interface PaymentProgressProps {
  purchaseContractId: string
}

export function PaymentProgress({ purchaseContractId }: PaymentProgressProps) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getPaymentProgressApi(purchaseContractId)
        setProgress(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "获取付款进度失败")
      } finally {
        setLoading(false)
      }
    }

    if (purchaseContractId) {
      fetchProgress()
    }
  }, [purchaseContractId])

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
        return <Badge variant="secondary">部分付款</Badge>
      case "overdue":
        return <Badge variant="destructive">已逾期</Badge>
      default:
        return <Badge variant="outline">待付款</Badge>
    }
  }

  const getEarlyDaysBadge = (plan: ProgressData["plans"][0]) => {
    if (plan.paymentTiming === null) return null
    if (plan.paymentTiming === "early") {
      return <Badge className="bg-green-500">提前{plan.earlyDays}天</Badge>
    } else if (plan.paymentTiming === "late") {
      return <Badge variant="destructive">逾期{Math.abs(plan.earlyDays)}天</Badge>
    }
    return <Badge className="bg-blue-500">准时</Badge>
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
          <CardTitle className="text-base font-medium">付款进度</CardTitle>
          <span className="text-xl font-bold">{progress.progressRate.toFixed(1)}%</span>
        </div>
        <Progress value={progress.progressRate} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>已付: {formatCurrency(progress.totalPaid)}</span>
          <span>待付: {formatCurrency(progress.totalRemaining)}</span>
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
                  {getEarlyDaysBadge(plan)}
                  {plan.status === "overdue" && plan.overdueDays > 0 && (
                    <span className="text-xs text-destructive">
                      逾期 {plan.overdueDays} 天
                    </span>
                  )}
                </div>

                {plan.paymentDescription && (
                  <p className="text-sm text-muted-foreground mb-1">
                    {plan.paymentDescription}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">预计付款日:</span>
                    <span>{formatDate(plan.expectedPaymentDate)}</span>
                  </div>
                  {plan.actualPaymentDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">实际付款日:</span>
                      <span>{formatDate(plan.actualPaymentDate)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">应付金额:</span>
                    <span>{formatCurrency(plan.payable)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">已付金额:</span>
                    <span className={plan.paid > 0 ? "text-green-600" : ""}>
                      {formatCurrency(plan.paid)}
                    </span>
                  </div>
                </div>

                {plan.remaining > 0 && (
                  <div className="mt-2">
                    <Progress value={plan.ratio} className="h-1.5" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                      <span>付款进度</span>
                      <span>{plan.ratio.toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {progress.plans.length === 0 && (
          <p className="text-center text-muted-foreground py-4">暂无付款计划</p>
        )}
      </CardContent>
    </Card>
  )
}
