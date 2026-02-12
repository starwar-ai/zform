/**
 * ApprovalFlowManagement
 *
 * 流程配置管理页面。提供规则列表、新建/编辑/删除规则、流程图预览。
 * 新建/编辑通过 openTab 跳转到独立的编辑器页面。
 */

import { useState, useEffect, useCallback } from "react"
import {
  getApprovalRulesApi,
  deleteApprovalRuleApi,
  type ApprovalRuleResponse,
} from "@/apis/approval-api"
import { useTabStore } from "@/stores/tab-store"
import { ApprovalFlowVisualizer } from "./approval-flow-visualizer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
  GitBranch,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================
// DocType Label Map
// ============================================================

const docTypeLabels: Record<string, string> = {
  sales_contract: "销售合同",
  export_sales_contract: "出口销售合同",
  domestic_sales_contract: "内销合同",
  purchase_plan: "采购计划",
  purchase_contract: "采购合同",
  inspection_order: "检验单",
  invoicing_notice: "开票通知",
  payment_apply: "付款申请",
}

// ============================================================
// Component
// ============================================================

export function ApprovalFlowManagement() {
  const { openTab } = useTabStore()
  const [rules, setRules] = useState<ApprovalRuleResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [filterDocType, setFilterDocType] = useState<string>("all")
  const [deleteTarget, setDeleteTarget] = useState<ApprovalRuleResponse | null>(
    null
  )
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null)

  const fetchRules = useCallback(async () => {
    setLoading(true)
    try {
      const docType =
        filterDocType === "all" ? undefined : filterDocType
      const data = await getApprovalRulesApi(docType)
      setRules(data)
    } catch (err) {
      alert(`加载失败: ${(err as Error).message}`)
    } finally {
      setLoading(false)
    }
  }, [filterDocType])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const handleCreate = () => {
    openTab("approval-flow-editor", {}, "新建审批规则")
  }

  const handleEdit = (rule: ApprovalRuleResponse) => {
    openTab(
      "approval-flow-editor",
      { ruleId: rule.id },
      `编辑规则 - ${rule.name}`
    )
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteApprovalRuleApi(deleteTarget.id)
      setDeleteTarget(null)
      fetchRules()
    } catch (err) {
      alert(`删除失败: ${(err as Error).message}`)
    }
  }

  const toggleExpand = (ruleId: string) => {
    setExpandedRuleId((prev) => (prev === ruleId ? null : ruleId))
  }

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              审批流程配置
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterDocType} onValueChange={setFilterDocType}>
                <SelectTrigger className="h-8 w-[160px] text-sm">
                  <SelectValue placeholder="全部类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  {Object.entries(docTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={fetchRules}
                disabled={loading}
              >
                <RefreshCw
                  className={cn("h-4 w-4", loading && "animate-spin")}
                />
              </Button>
              <Button size="sm" onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-1" />
                新建规则
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && rules.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              暂无审批规则，点击"新建规则"创建
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>编码</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>单据类型</TableHead>
                  <TableHead className="text-center">级别数</TableHead>
                  <TableHead className="text-center">状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => {
                  const isExpanded = expandedRuleId === rule.id
                  return (
                    <>
                      <TableRow
                        key={rule.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleExpand(rule.id)}
                      >
                        <TableCell>
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              isExpanded && "rotate-90"
                            )}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {rule.code}
                        </TableCell>
                        <TableCell>{rule.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {docTypeLabels[rule.docType] ?? rule.docType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {rule.levels.length}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={rule.enabled ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {rule.enabled ? "启用" : "禁用"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(rule)
                              }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteTarget(rule)
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <tr key={`${rule.id}-preview`}>
                          <td colSpan={7} className="p-0">
                            <div className="h-[180px] border-t bg-muted/30 px-4 py-2">
                              <ApprovalFlowVisualizer
                                levels={rule.levels}
                                compact
                                interactive={false}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除审批规则「{deleteTarget?.name}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
