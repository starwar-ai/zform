/**
 * CompanyConfigPanel
 *
 * 子公司配置面板（含银行账号管理）
 */

import { useState, useEffect, useCallback } from "react"
import type { Company } from "@/types/business-config"
import { CompanyNature, CompanyNatureLabels } from "@/types/business-config"
import {
  fetchCompaniesApi,
  createCompanyApi,
  updateCompanyApi,
  deleteCompanyApi,
  fetchCompanyByIdApi,
} from "@/lib/business-config-api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Plus, Edit, Trash2, Loader2, RefreshCw, Building2 } from "lucide-react"
import { CompanyEditDialog } from "./company-edit-dialog"

export function CompanyConfigPanel() {
  const [data, setData] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 对话框状态
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchCompaniesApi()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 新建
  const handleCreate = () => {
    setEditingCompany(null)
    setEditDialogOpen(true)
  }

  // 编辑
  const handleEdit = async (company: Company) => {
    try {
      // 重新加载完整数据（含银行账号）
      const fullData = await fetchCompanyByIdApi(company.id)
      setEditingCompany(fullData)
      setEditDialogOpen(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : '加载子公司详情失败')
    }
  }

  // 删除
  const handleDelete = (companyId: string) => {
    setDeletingCompanyId(companyId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingCompanyId) return
    setDeleting(true)
    try {
      await deleteCompanyApi(deletingCompanyId)
      await loadData()
    } catch (err) {
      console.error('删除失败:', err)
      alert(err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setDeletingCompanyId(null)
    }
  }

  const handleEditSuccess = async () => {
    setEditDialogOpen(false)
    await loadData()
  }

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            共 {data.length} 条
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-1" />
            新建子公司
          </Button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3">
          {error}
        </div>
      )}

      {/* 数据表格 */}
      <Card>
        <CardContent className="p-0">
          {loading && data.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">加载中...</span>
            </div>
          ) : data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>企业名称</TableHead>
                  <TableHead>简称</TableHead>
                  <TableHead>公司性质</TableHead>
                  <TableHead>税号</TableHead>
                  <TableHead>海关编号</TableHead>
                  <TableHead>法人</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="w-[160px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.abbreviation || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {CompanyNatureLabels[item.nature]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{item.taxNumber || '-'}</TableCell>
                    <TableCell className="text-sm">{item.customsCode || '-'}</TableCell>
                    <TableCell>{item.legalPerson || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={item.isEnabled ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {item.isEnabled ? "启用" : "停用"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                          <Edit className="h-3 w-3 mr-1" />
                          编辑
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-3 w-3 mr-1" />
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              暂无数据，请点击"新建子公司"创建。
            </p>
          )}
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      {editDialogOpen && (
        <CompanyEditDialog
          company={editingCompany}
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。确定要删除该子公司吗？如果该子公司下有银行账号，将无法删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
