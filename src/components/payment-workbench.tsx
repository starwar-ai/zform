/**
 * 付款工作台
 * 展示付款统计、本周待付、逾期列表等付款管理功能
 */

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Loader2,
  RefreshCw,
  TrendingUp,
} from "lucide-react"
import {
  getPaymentDashboardApi,
  getPaymentThisWeekDueApi,
  getPaymentOverdueListApi,
  type PaymentWorkbenchDashboard,
  type PaymentPlanItem,
} from "@/apis/payment-workbench-api"

interface PaymentWorkbenchProps {
  onOpenContract?: (contractId: string) => void
}

export function PaymentWorkbench({ onOpenContract }: PaymentWorkbenchProps) {
  const [loading, setLoading] = useState(false)
  const [dashboard, setDashboard] = useState<PaymentWorkbenchDashboard | null>(null)
  const [thisWeekList, setThisWeekList] = useState<PaymentPlanItem[]>([])
  const [overdueList, setOverdueList] = useState<PaymentPlanItem[]>([])
  const [activeTab, setActiveTab] = useState("this-week")

  const fetchData = async () => {
    setLoading(true)
    try {
      const [dashboardData, thisWeekData, overdueData] = await Promise.all([
        getPaymentDashboardApi(),
        getPaymentThisWeekDueApi({ pageSize: 10 }),
        getPaymentOverdueListApi({ pageSize: 10 }),
      ])
      setDashboard(dashboardData)
      setThisWeekList(thisWeekData.data)
      setOverdueList(overdueData.data)
    } catch (error) {
      console.error("获取付款工作台数据失败:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

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

  const getEarlyDaysBadge = (item: PaymentPlanItem) => {
    if (item.exeStatus !== 2 || !item.actualPaymentDate) return null
    if (item.earlyDays > 0) {
      return <Badge className="bg-green-500">提前{item.earlyDays}天</Badge>
    } else if (item.earlyDays < 0) {
      return <Badge variant="destructive">逾期{Math.abs(item.earlyDays)}天</Badge>
    }
    return <Badge className="bg-blue-500">准时</Badge>
  }

  return (
    <div className="space-y-6 p-6">
      {/* 标题区 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">付款工作台</h1>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待付总额</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard ? formatCurrency(dashboard.totalRemaining) : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              总应付 {dashboard ? formatCurrency(dashboard.totalPayable) : "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本周到期</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard ? formatCurrency(dashboard.thisWeekPayable) : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard?.thisWeekCount ?? 0} 笔待付款
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已逾期</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {dashboard ? formatCurrency(dashboard.overduePayable) : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard?.overdueCount ?? 0} 笔逾期
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboard?.completedCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">笔已完成付款</p>
          </CardContent>
        </Card>
      </div>

      {/* 整体进度 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              整体付款进度
            </CardTitle>
            <span className="text-2xl font-bold">
              {dashboard ? `${dashboard.progressRate.toFixed(1)}%` : "-"}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={dashboard?.progressRate ?? 0} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>已付: {dashboard ? formatCurrency(dashboard.totalPaid) : "-"}</span>
            <span>待付: {dashboard ? formatCurrency(dashboard.totalRemaining) : "-"}</span>
          </div>
        </CardContent>
      </Card>

      {/* 列表区域 */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="this-week" className="gap-1">
                <Clock className="h-4 w-4" />
                本周待付
                {thisWeekList.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {thisWeekList.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="overdue" className="gap-1">
                <AlertTriangle className="h-4 w-4" />
                已逾期
                {overdueList.length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {overdueList.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="this-week">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : thisWeekList.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>合同编号</TableHead>
                      <TableHead>供应商</TableHead>
                      <TableHead>期序</TableHead>
                      <TableHead>预计付款日</TableHead>
                      <TableHead className="text-right">应付金额</TableHead>
                      <TableHead className="text-right">已付金额</TableHead>
                      <TableHead className="text-right">待付金额</TableHead>
                      <TableHead>付款时效</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {thisWeekList.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.purchaseContract?.code ?? "-"}
                        </TableCell>
                        <TableCell>{item.purchaseContract?.supplierName ?? "-"}</TableCell>
                        <TableCell>第 {item.periodIndex} 期</TableCell>
                        <TableCell>{formatDate(item.expectedPaymentDate)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.periodPayable)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.periodPaid)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.periodPayable - item.periodPaid)}
                        </TableCell>
                        <TableCell>{getEarlyDaysBadge(item)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenContract?.(item.purchaseContractId)}
                          >
                            查看
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">本周暂无待付款</p>
              )}
            </TabsContent>

            <TabsContent value="overdue">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : overdueList.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>合同编号</TableHead>
                      <TableHead>供应商</TableHead>
                      <TableHead>期序</TableHead>
                      <TableHead>预计付款日</TableHead>
                      <TableHead>逾期天数</TableHead>
                      <TableHead className="text-right">应付金额</TableHead>
                      <TableHead className="text-right">待付金额</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueList.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.purchaseContract?.code ?? "-"}
                        </TableCell>
                        <TableCell>{item.purchaseContract?.supplierName ?? "-"}</TableCell>
                        <TableCell>第 {item.periodIndex} 期</TableCell>
                        <TableCell>{formatDate(item.expectedPaymentDate)}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{item.overdueDays} 天</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.periodPayable)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          {formatCurrency(item.periodPayable - item.periodPaid)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenContract?.(item.purchaseContractId)}
                          >
                            查看
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">暂无逾期付款</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
