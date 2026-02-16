/**
 * 逾期报表组件
 * 展示逾期收款的详细报表，支持筛选和导出
 */

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Download,
  Filter,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react"
import {
  getOverdueReportApi,
  type CollectionPlanItem,
  type OverdueReportSummary,
} from "@/apis/collection-workbench-api"

interface OverdueReportProps {
  onOpenContract?: (contractId: string) => void
}

interface Filters {
  customerId?: string
  salesmanId?: string
  minOverdueDays?: number
  maxOverdueDays?: number
}

const OVERDUE_DAYS_OPTIONS = [
  { label: "全部", min: undefined, max: undefined },
  { label: "1-7天", min: 1, max: 7 },
  { label: "8-30天", min: 8, max: 30 },
  { label: "31-60天", min: 31, max: 60 },
  { label: "60天以上", min: 60, max: undefined },
]

export function OverdueReport({ onOpenContract }: OverdueReportProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<CollectionPlanItem[]>([])
  const [summary, setSummary] = useState<OverdueReportSummary | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [filters, setFilters] = useState<Filters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [overdueDaysIndex, setOverdueDaysIndex] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getOverdueReportApi({
        page,
        pageSize,
        ...filters,
      })
      setData(result.data)
      setSummary(result.summary)
      setTotal(result.total)
    } catch (error) {
      console.error("获取逾期报表失败:", error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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

  const handleOverdueDaysChange = (index: string) => {
    const idx = parseInt(index)
    setOverdueDaysIndex(idx)
    const option = OVERDUE_DAYS_OPTIONS[idx]
    setFilters((prev) => ({
      ...prev,
      minOverdueDays: option.min,
      maxOverdueDays: option.max,
    }))
    setPage(1)
  }

  const handleClearFilters = () => {
    setFilters({})
    setOverdueDaysIndex(0)
    setPage(1)
  }

  const handleExport = () => {
    // 生成 CSV 数据
    const headers = [
      "合同编号",
      "客户编码",
      "客户名称",
      "期序",
      "预计收款日",
      "逾期天数",
      "应收金额",
      "已收金额",
      "待收金额",
    ]

    const rows = data.map((item) => [
      item.salesContract?.code ?? "",
      item.salesContract?.customerCode ?? "",
      item.salesContract?.customerName ?? "",
      `第${item.periodIndex}期`,
      formatDate(item.expectedReceiptDate),
      item.overdueDays,
      item.periodReceivable,
      item.periodReceived,
      item.periodReceivable - item.periodReceived,
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => (typeof cell === "string" ? `"${cell}"` : cell)).join(",")
      ),
    ].join("\n")

    // 添加 BOM 以支持中文
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `逾期报表_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6 p-6">
      {/* 标题区 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          逾期报表
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-1" />
            筛选
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={data.length === 0}>
            <Download className="h-4 w-4 mr-1" />
            导出
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 汇总统计 */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                逾期总额
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(summary.totalOverdueAmount)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                逾期笔数
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{summary.totalOverdueCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                最长逾期
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{summary.maxOverdueDays} 天</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                平均逾期
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{summary.avgOverdueDays} 天</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 筛选区域 */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>客户编码</Label>
                <Input
                  placeholder="输入客户编码"
                  value={filters.customerId ?? ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      customerId: e.target.value || undefined,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>业务员</Label>
                <Input
                  placeholder="输入业务员ID"
                  value={filters.salesmanId ?? ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      salesmanId: e.target.value || undefined,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>逾期天数</Label>
                <Select
                  value={String(overdueDaysIndex)}
                  onValueChange={handleOverdueDaysChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OVERDUE_DAYS_OPTIONS.map((opt, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  清除筛选
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 数据表格 */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>合同编号</TableHead>
                    <TableHead>客户编码</TableHead>
                    <TableHead>客户名称</TableHead>
                    <TableHead>期序</TableHead>
                    <TableHead>预计收款日</TableHead>
                    <TableHead>逾期天数</TableHead>
                    <TableHead className="text-right">应收金额</TableHead>
                    <TableHead className="text-right">已收金额</TableHead>
                    <TableHead className="text-right">待收金额</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.salesContract?.code ?? "-"}
                      </TableCell>
                      <TableCell>{item.salesContract?.customerCode ?? "-"}</TableCell>
                      <TableCell>{item.salesContract?.customerName ?? "-"}</TableCell>
                      <TableCell>第 {item.periodIndex} 期</TableCell>
                      <TableCell>{formatDate(item.expectedReceiptDate)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={item.overdueDays > 30 ? "destructive" : "secondary"}
                        >
                          {item.overdueDays} 天
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.periodReceivable)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.periodReceived)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        {formatCurrency(item.periodReceivable - item.periodReceived)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenContract?.(item.salesContractId)}
                        >
                          查看
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    共 {total} 条，第 {page} / {totalPages} 页
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">暂无逾期收款</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
