/**
 * DocumentPermissionPanel
 *
 * 文档级权限管理面板，嵌入右侧边栏。
 * 展示已授权用户列表，支持添加用户、修改权限、删除权限。
 * 仅文档所有者可执行写操作。
 */

import { useState, useEffect, useCallback } from "react"
import { useAuthStore } from "@/stores/auth-store"
import {
  fetchDocPermissions,
  upsertDocPermission,
  removeDocPermission,
  type DocPermissionRecord,
} from "@/apis/doc-permission-api"
import { fetchUsersApi } from "@/apis/user-api"
import type { User } from "@/types/user"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Crown, Plus, Trash2, Search, Shield, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface DocumentPermissionPanelProps {
  docType: string
  docId: string
  createdBy?: string
}

const permissionLabels: Record<string, string> = {
  read: "只读",
  write: "读写",
}

export function DocumentPermissionPanel({
  docType,
  docId,
  createdBy,
}: DocumentPermissionPanelProps) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const isOwner = !!(currentUser && createdBy && currentUser.id === createdBy)

  const [permissions, setPermissions] = useState<DocPermissionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 添加用户相关
  const [addOpen, setAddOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedPermission, setSelectedPermission] = useState<"read" | "write">("read")

  // 加载权限列表
  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchDocPermissions(docType, docId)
      setPermissions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败")
    } finally {
      setLoading(false)
    }
  }, [docType, docId])

  useEffect(() => {
    loadPermissions()
  }, [loadPermissions])

  // 加载用户列表（打开添加弹窗时）
  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true)
      const data = await fetchUsersApi()
      setUsers(data)
    } catch {
      // 忽略
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (addOpen) {
      loadUsers()
      setSearchTerm("")
      setSelectedUser(null)
      setSelectedPermission("read")
    }
  }, [addOpen, loadUsers])

  // 过滤用户列表：排除已有权限的用户和文档所有者
  const filteredUsers = users.filter((u) => {
    // 排除所有者
    if (u.id === createdBy) return false
    // 排除已有权限的用户
    if (permissions.some((p) => p.userId === u.id)) return false
    // 搜索过滤
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return (
        u.name.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term)
      )
    }
    return true
  })

  // 添加权限
  const handleAdd = async () => {
    if (!selectedUser) return
    try {
      await upsertDocPermission(
        docType,
        docId,
        selectedUser.id,
        selectedUser.name,
        selectedPermission
      )
      setAddOpen(false)
      await loadPermissions()
    } catch (err) {
      setError(err instanceof Error ? err.message : "添加失败")
    }
  }

  // 修改权限
  const handleChangePermission = async (
    userId: string,
    userName: string,
    newPermission: "read" | "write"
  ) => {
    try {
      await upsertDocPermission(docType, docId, userId, userName, newPermission)
      await loadPermissions()
    } catch (err) {
      setError(err instanceof Error ? err.message : "修改失败")
    }
  }

  // 删除权限
  const handleRemove = async (userId: string) => {
    try {
      await removeDocPermission(docType, docId, userId)
      await loadPermissions()
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        加载中...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <span className="text-sm text-destructive">{error}</span>
        <Button variant="ghost" size="sm" onClick={loadPermissions}>
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 所有者信息 */}
      <div className="flex items-center gap-2 text-sm">
        <Crown className="h-4 w-4 text-amber-500" />
        <span className="text-muted-foreground">所有者</span>
        <Badge variant="outline" className="ml-auto">
          {isOwner ? currentUser?.name : createdBy || "未知"}
        </Badge>
      </div>

      <Separator />

      {/* 权限列表 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          授权用户 ({permissions.length})
        </span>
        {isOwner && (
          <Popover open={addOpen} onOpenChange={setAddOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <Plus className="h-3.5 w-3.5 mr-1" />
                添加
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="end">
              <div className="flex flex-col gap-3">
                <div className="text-sm font-medium">添加用户权限</div>

                {/* 用户搜索 */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="搜索用户..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 pl-8 text-sm"
                  />
                </div>

                {/* 用户列表 */}
                <ScrollArea className="max-h-40">
                  {usersLoading ? (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      加载中...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      无可用用户
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left hover:bg-accent transition-colors",
                            selectedUser?.id === user.id && "bg-accent"
                          )}
                          onClick={() => setSelectedUser(user)}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="truncate font-medium">{user.name}</span>
                            <span className="truncate text-xs text-muted-foreground">
                              {user.username}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {selectedUser && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground shrink-0">
                        {selectedUser.name}
                      </span>
                      <Select
                        value={selectedPermission}
                        onValueChange={(v) =>
                          setSelectedPermission(v as "read" | "write")
                        }
                      >
                        <SelectTrigger className="h-7 text-xs flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="read">只读</SelectItem>
                          <SelectItem value="write">读写</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" className="h-7" onClick={handleAdd}>
                        确定
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {permissions.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-4">
          暂无授权用户
        </div>
      ) : (
        <ScrollArea className="max-h-60">
          <div className="flex flex-col gap-1">
            {permissions.map((perm) => (
              <div
                key={perm.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 group"
              >
                {perm.permission === "write" ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-green-500 shrink-0" />
                ) : (
                  <Shield className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                )}
                <span className="text-sm truncate flex-1">{perm.userName}</span>

                {isOwner ? (
                  <div className="flex items-center gap-1">
                    <Select
                      value={perm.permission}
                      onValueChange={(v) =>
                        handleChangePermission(
                          perm.userId,
                          perm.userName,
                          v as "read" | "write"
                        )
                      }
                    >
                      <SelectTrigger className="h-6 w-16 text-xs border-0 bg-transparent px-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read">只读</SelectItem>
                        <SelectItem value="write">读写</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => handleRemove(perm.userId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Badge
                    variant="secondary"
                    className="text-xs shrink-0"
                  >
                    {permissionLabels[perm.permission] || perm.permission}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
