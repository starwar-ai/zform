/**
 * UserSettingsDialog
 * 个人设置对话框 - 用于修改用户信息和密码
 */

import { useState } from "react"
import { useAuthStore } from "@/stores/auth-store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Check, Loader2, User, Lock } from "lucide-react"
import { updateUserApi, changePasswordApi } from "@/apis/user-api"

interface UserSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserSettingsDialog({ open, onOpenChange }: UserSettingsDialogProps) {
  const { currentUser, setCurrentUser } = useAuthStore()
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    department: currentUser?.department || "",
  })
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  
  const [profileSaving, setProfileSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  
  // Reset forms when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open && currentUser) {
      setProfileForm({
        name: currentUser.name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        department: currentUser.department || "",
      })
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setProfileError("")
      setPasswordError("")
      setPasswordSuccess(false)
    }
    onOpenChange(open)
  }
  
  const handleProfileSubmit = async () => {
    if (!currentUser) return
    
    setProfileError("")
    
    if (!profileForm.name.trim()) {
      setProfileError("姓名不能为空")
      return
    }
    
    setProfileSaving(true)
    
    try {
      const updatedUser = await updateUserApi(currentUser.id, {
        name: profileForm.name,
        email: profileForm.email || undefined,
        phone: profileForm.phone || undefined,
        department: profileForm.department || undefined,
      })
      
      // Update auth store with new user info
      setCurrentUser(updatedUser)
      
      // Close dialog on success
      onOpenChange(false)
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "保存失败")
    } finally {
      setProfileSaving(false)
    }
  }
  
  const handlePasswordSubmit = async () => {
    if (!currentUser) return
    
    setPasswordError("")
    setPasswordSuccess(false)
    
    if (!passwordForm.oldPassword) {
      setPasswordError("请输入当前密码")
      return
    }
    
    if (!passwordForm.newPassword) {
      setPasswordError("请输入新密码")
      return
    }
    
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("新密码至少需要6个字符")
      return
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("两次输入的新密码不一致")
      return
    }
    
    setPasswordSaving(true)
    
    try {
      await changePasswordApi(currentUser.id, {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      })
      
      setPasswordSuccess(true)
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "密码修改失败")
    } finally {
      setPasswordSaving(false)
    }
  }
  
  if (!currentUser) return null
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>个人设置</DialogTitle>
          <DialogDescription>
            修改您的个人信息和密码
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="profile" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              个人信息
            </TabsTrigger>
            <TabsTrigger value="password" className="gap-2">
              <Lock className="h-4 w-4" />
              修改密码
            </TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            {profileError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{profileError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={currentUser.username}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">用户名不可修改</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">姓名 *</Label>
              <Input
                id="name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="您的姓名"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">电话</Label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="手机号码"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">部门</Label>
              <Input
                id="department"
                value={profileForm.department}
                onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                placeholder="所属部门"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button onClick={handleProfileSubmit} disabled={profileSaving}>
                {profileSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                保存
              </Button>
            </div>
          </TabsContent>
          
          {/* Password Tab */}
          <TabsContent value="password" className="space-y-4 mt-4">
            {passwordError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            
            {passwordSuccess && (
              <Alert className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  密码修改成功
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="oldPassword">当前密码</Label>
              <Input
                id="oldPassword"
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                placeholder="请输入当前密码"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="请输入新密码（至少6位）"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="请再次输入新密码"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button onClick={handlePasswordSubmit} disabled={passwordSaving}>
                {passwordSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                修改密码
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
