/**
 * CompanyEditDialog
 *
 * 子公司编辑对话框（含主信息和银行账号两个Tab）
 */

import { useState, useEffect } from "react"
import type { Company, CompanyBankAccount } from "@/types/business-config"
import { CompanyNature, CompanyNatureLabels } from "@/types/business-config"
import {
  createCompanyApi,
  updateCompanyApi,
  createBankAccountApi,
  updateBankAccountApi,
  deleteBankAccountApi,
} from "@/lib/business-config-api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Loader2, Upload, Plus, Edit, Trash2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
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

interface CompanyEditDialogProps {
  company: Company | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CompanyEditDialog({ company, open, onClose, onSuccess }: CompanyEditDialogProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'bankAccounts'>('basic')
  const [saving, setSaving] = useState(false)

  // 主信息表单
  const [formData, setFormData] = useState<Partial<Company>>({
    name: '',
    nameEn: '',
    abbreviation: '',
    unitAbbreviation: '',
    nature: CompanyNature.EXPORT_COMPANY,
    taxNumber: '',
    customsCode: '',
    legalPerson: '',
    phone: '',
    fax: '',
    address: '',
    addressEn: '',
    adminName: '',
    adminEmail: '',
    adminMobile: '',
    businessLicenseNumber: '',
    businessLicenseImage: '',
    officialSealImage: '',
    isEnabled: true,
  })

  // 银行账号列表
  const [bankAccounts, setBankAccounts] = useState<CompanyBankAccount[]>([])
  const [bankDialogOpen, setBankDialogOpen] = useState(false)
  const [editingBank, setEditingBank] = useState<CompanyBankAccount | null>(null)
  const [deletingBankId, setDeletingBankId] = useState<string | null>(null)
  const [deleteBankDialogOpen, setDeleteBankDialogOpen] = useState(false)

  // 银行账号表单
  const [bankFormData, setBankFormData] = useState<Partial<CompanyBankAccount>>({
    companyNameCn: '',
    companyNameEn: '',
    bankNameCn: '',
    bankNameEn: '',
    bankAddress: '',
    bankAddressEn: '',
    accountNumber: '',
    swiftCode: '',
    isDefault: false,
  })

  // 初始化表单
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        nameEn: company.nameEn || '',
        abbreviation: company.abbreviation || '',
        unitAbbreviation: company.unitAbbreviation || '',
        nature: company.nature,
        taxNumber: company.taxNumber || '',
        customsCode: company.customsCode || '',
        legalPerson: company.legalPerson || '',
        phone: company.phone || '',
        fax: company.fax || '',
        address: company.address || '',
        addressEn: company.addressEn || '',
        adminName: company.adminName || '',
        adminEmail: company.adminEmail || '',
        adminMobile: company.adminMobile || '',
        businessLicenseNumber: company.businessLicenseNumber || '',
        businessLicenseImage: company.businessLicenseImage || '',
        officialSealImage: company.officialSealImage || '',
        isEnabled: company.isEnabled,
      })
      setBankAccounts(company.bankAccounts || [])
    } else {
      setFormData({
        name: '',
        nameEn: '',
        abbreviation: '',
        unitAbbreviation: '',
        nature: CompanyNature.EXPORT_COMPANY,
        taxNumber: '',
        customsCode: '',
        legalPerson: '',
        phone: '',
        fax: '',
        address: '',
        addressEn: '',
        adminName: '',
        adminEmail: '',
        adminMobile: '',
        businessLicenseNumber: '',
        businessLicenseImage: '',
        officialSealImage: '',
        isEnabled: true,
      })
      setBankAccounts([])
    }
    setActiveTab('basic')
  }, [company, open])

  // 保存主信息
  const handleSaveBasic = async () => {
    if (!formData.name) {
      alert('请填写企业名称')
      return
    }

    setSaving(true)
    try {
      if (company) {
        await updateCompanyApi(company.id, formData)
      } else {
        await createCompanyApi(formData)
      }
      onSuccess()
    } catch (err) {
      console.error('保存失败:', err)
      alert(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 文件上传（TODO: 实际上传功能）
  const handleFileUpload = (field: 'businessLicenseImage' | 'officialSealImage') => {
    alert('文件上传功能待实现')
    // TODO: 实现文件上传逻辑
  }

  // ==================== 银行账号管理 ====================

  const handleCreateBank = () => {
    setEditingBank(null)
    setBankFormData({
      companyNameCn: formData.name || '',
      companyNameEn: formData.nameEn || '',
      bankNameCn: '',
      bankNameEn: '',
      bankAddress: '',
      bankAddressEn: '',
      accountNumber: '',
      swiftCode: '',
      isDefault: bankAccounts.length === 0,
    })
    setBankDialogOpen(true)
  }

  const handleEditBank = (bank: CompanyBankAccount) => {
    setEditingBank(bank)
    setBankFormData({
      companyNameCn: bank.companyNameCn || '',
      companyNameEn: bank.companyNameEn || '',
      bankNameCn: bank.bankNameCn || '',
      bankNameEn: bank.bankNameEn || '',
      bankAddress: bank.bankAddress || '',
      bankAddressEn: bank.bankAddressEn || '',
      accountNumber: bank.accountNumber || '',
      swiftCode: bank.swiftCode || '',
      isDefault: bank.isDefault,
    })
    setBankDialogOpen(true)
  }

  const handleDeleteBank = (bankId: string) => {
    setDeletingBankId(bankId)
    setDeleteBankDialogOpen(true)
  }

  const handleConfirmDeleteBank = async () => {
    if (!deletingBankId || !company) return
    setSaving(true)
    try {
      await deleteBankAccountApi(company.id, deletingBankId)
      setBankAccounts(bankAccounts.filter((b) => b.id !== deletingBankId))
      setDeleteBankDialogOpen(false)
      setDeletingBankId(null)
    } catch (err) {
      console.error('删除失败:', err)
      alert(err instanceof Error ? err.message : '删除银行账号失败')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBank = async () => {
    if (!bankFormData.accountNumber) {
      alert('请填写银行账号')
      return
    }

    if (!company) {
      alert('请先保存子公司基本信息')
      return
    }

    setSaving(true)
    try {
      if (editingBank) {
        const updated = await updateBankAccountApi(company.id, editingBank.id, bankFormData)
        setBankAccounts(bankAccounts.map((b) => (b.id === editingBank.id ? updated : b)))
      } else {
        const created = await createBankAccountApi(company.id, bankFormData)
        setBankAccounts([...bankAccounts, created])
      }
      setBankDialogOpen(false)
    } catch (err) {
      console.error('保存失败:', err)
      alert(err instanceof Error ? err.message : '保存银行账号失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{company ? '编辑子公司' : '新建子公司'}</DialogTitle>
            <DialogDescription>
              {company ? '修改子公司信息和银行账号' : '创建新子公司'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'basic' | 'bankAccounts')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="bankAccounts" disabled={!company}>
                银行账号 {bankAccounts.length > 0 && `(${bankAccounts.length})`}
              </TabsTrigger>
            </TabsList>

            {/* 基本信息Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    企业名称<span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="企业中文名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label>企业英文名称</Label>
                  <Input
                    value={formData.nameEn || ''}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="Enterprise Name (EN)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>简称</Label>
                  <Input
                    value={formData.abbreviation || ''}
                    onChange={(e) => setFormData({ ...formData, abbreviation: e.target.value })}
                    placeholder="企业简称"
                  />
                </div>
                <div className="space-y-2">
                  <Label>单位名称简称</Label>
                  <Input
                    value={formData.unitAbbreviation || ''}
                    onChange={(e) => setFormData({ ...formData, unitAbbreviation: e.target.value })}
                    placeholder="例如: ABC"
                  />
                </div>
                <div className="space-y-2">
                  <Label>公司性质</Label>
                  <Select
                    value={formData.nature || CompanyNature.EXPORT_COMPANY}
                    onValueChange={(v) => setFormData({ ...formData, nature: v as CompanyNature })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(CompanyNature).map((nature) => (
                        <SelectItem key={nature} value={nature}>
                          {CompanyNatureLabels[nature]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>税号</Label>
                  <Input
                    value={formData.taxNumber || ''}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    placeholder="统一社会信用代码"
                  />
                </div>
                <div className="space-y-2">
                  <Label>海关编号</Label>
                  <Input
                    value={formData.customsCode || ''}
                    onChange={(e) => setFormData({ ...formData, customsCode: e.target.value })}
                    placeholder="海关编号"
                  />
                </div>
                <div className="space-y-2">
                  <Label>营业执照号</Label>
                  <Input
                    value={formData.businessLicenseNumber || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, businessLicenseNumber: e.target.value })
                    }
                    placeholder="营业执照号"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>法人</Label>
                  <Input
                    value={formData.legalPerson || ''}
                    onChange={(e) => setFormData({ ...formData, legalPerson: e.target.value })}
                    placeholder="法定代表人"
                  />
                </div>
                <div className="space-y-2">
                  <Label>企业电话</Label>
                  <Input
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="021-12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label>企业传真</Label>
                  <Input
                    value={formData.fax || ''}
                    onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                    placeholder="021-12345679"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>企业地址</Label>
                  <Input
                    value={formData.address || ''}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="中文地址"
                  />
                </div>
                <div className="space-y-2">
                  <Label>企业英文地址</Label>
                  <Input
                    value={formData.addressEn || ''}
                    onChange={(e) => setFormData({ ...formData, addressEn: e.target.value })}
                    placeholder="Address (EN)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>管理员</Label>
                  <Input
                    value={formData.adminName || ''}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    placeholder="管理员姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label>管理员邮箱</Label>
                  <Input
                    type="email"
                    value={formData.adminEmail || ''}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder="admin@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>管理员手机号</Label>
                  <Input
                    value={formData.adminMobile || ''}
                    onChange={(e) => setFormData({ ...formData, adminMobile: e.target.value })}
                    placeholder="13800138000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>营业执照图片</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.businessLicenseImage || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, businessLicenseImage: e.target.value })
                      }
                      placeholder="图片路径（暂时）"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileUpload('businessLicenseImage')}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      上传
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>公章图片</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.officialSealImage || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, officialSealImage: e.target.value })
                      }
                      placeholder="图片路径（暂时）"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileUpload('officialSealImage')}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      上传
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.isEnabled || false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isEnabled: Boolean(checked) })
                  }
                />
                <Label className="cursor-pointer">启用</Label>
              </div>
            </TabsContent>

            {/* 银行账号Tab */}
            <TabsContent value="bankAccounts" className="space-y-4 mt-4">
              <div className="flex justify-end">
                <Button size="sm" onClick={handleCreateBank}>
                  <Plus className="h-4 w-4 mr-1" />
                  新增银行账号
                </Button>
              </div>

              {bankAccounts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>银行中文名称</TableHead>
                      <TableHead>银行账号</TableHead>
                      <TableHead>SWIFT Code</TableHead>
                      <TableHead>默认</TableHead>
                      <TableHead className="w-[160px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bankAccounts.map((bank) => (
                      <TableRow key={bank.id}>
                        <TableCell className="font-medium">{bank.bankNameCn || '-'}</TableCell>
                        <TableCell>{bank.accountNumber || '-'}</TableCell>
                        <TableCell>{bank.swiftCode || '-'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={bank.isDefault ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {bank.isDefault ? "是" : "否"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditBank(bank)}>
                              <Edit className="h-3 w-3 mr-1" />
                              编辑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBank(bank.id)}
                            >
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
                  暂无银行账号，请点击"新增银行账号"添加。
                </p>
              )}
            </TabsContent>
          </Tabs>

          {activeTab === 'basic' && (
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button onClick={handleSaveBasic} disabled={saving || !formData.name}>
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {company ? '保存' : '创建'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* 银行账号编辑对话框 */}
      <Dialog open={bankDialogOpen} onOpenChange={setBankDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingBank ? '编辑银行账号' : '新增银行账号'}</DialogTitle>
            <DialogDescription>
              {editingBank ? '修改银行账号信息' : '添加新的银行账号'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>企业中文名称</Label>
                <Input
                  value={bankFormData.companyNameCn || ''}
                  onChange={(e) =>
                    setBankFormData({ ...bankFormData, companyNameCn: e.target.value })
                  }
                  placeholder="企业中文名称"
                />
              </div>
              <div className="space-y-2">
                <Label>企业英文名称</Label>
                <Input
                  value={bankFormData.companyNameEn || ''}
                  onChange={(e) =>
                    setBankFormData({ ...bankFormData, companyNameEn: e.target.value })
                  }
                  placeholder="Company Name (EN)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>银行中文名称</Label>
                <Input
                  value={bankFormData.bankNameCn || ''}
                  onChange={(e) => setBankFormData({ ...bankFormData, bankNameCn: e.target.value })}
                  placeholder="例如: 中国工商银行"
                />
              </div>
              <div className="space-y-2">
                <Label>银行英文名称</Label>
                <Input
                  value={bankFormData.bankNameEn || ''}
                  onChange={(e) => setBankFormData({ ...bankFormData, bankNameEn: e.target.value })}
                  placeholder="Bank Name (EN)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>银行地址</Label>
                <Input
                  value={bankFormData.bankAddress || ''}
                  onChange={(e) =>
                    setBankFormData({ ...bankFormData, bankAddress: e.target.value })
                  }
                  placeholder="银行中文地址"
                />
              </div>
              <div className="space-y-2">
                <Label>银行英文地址</Label>
                <Input
                  value={bankFormData.bankAddressEn || ''}
                  onChange={(e) =>
                    setBankFormData({ ...bankFormData, bankAddressEn: e.target.value })
                  }
                  placeholder="Bank Address (EN)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  银行账号<span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  value={bankFormData.accountNumber || ''}
                  onChange={(e) =>
                    setBankFormData({ ...bankFormData, accountNumber: e.target.value })
                  }
                  placeholder="银行账号"
                />
              </div>
              <div className="space-y-2">
                <Label>银行识别代码 (SWIFT)</Label>
                <Input
                  value={bankFormData.swiftCode || ''}
                  onChange={(e) =>
                    setBankFormData({ ...bankFormData, swiftCode: e.target.value })
                  }
                  placeholder="SWIFT Code"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={bankFormData.isDefault || false}
                onCheckedChange={(checked) =>
                  setBankFormData({ ...bankFormData, isDefault: Boolean(checked) })
                }
              />
              <Label className="cursor-pointer">设为默认账户</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBankDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSaveBank}
              disabled={saving || !bankFormData.accountNumber}
            >
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingBank ? '保存' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除银行账号确认对话框 */}
      <AlertDialog open={deleteBankDialogOpen} onOpenChange={setDeleteBankDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。确定要删除该银行账号吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteBank} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
