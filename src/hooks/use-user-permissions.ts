/**
 * User Permissions Hook
 *
 * 获取并缓存当前用户的权限标识集合。
 * 权限标识格式: "typeId:action"，对应 SysMenu.permission 字段。
 */

import { useState, useEffect, useMemo, useCallback } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { fetchUserPermissionsApi } from "@/apis/user-api"

/** 权限缓存 (避免重复请求) */
let cachedPermissions: string[] | null = null
let cachedUserId: string | null = null

export function useUserPermissions() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const [permissionList, setPermissionList] = useState<string[]>(
    cachedUserId === currentUser?.id ? (cachedPermissions ?? []) : []
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!currentUser) {
      // 未登录时清空
      cachedPermissions = null
      cachedUserId = null
      setPermissionList([])
      return
    }

    // 用户未变且已有缓存，直接使用
    if (cachedUserId === currentUser.id && cachedPermissions) {
      setPermissionList(cachedPermissions)
      return
    }

    // 请求权限列表
    setLoading(true)
    fetchUserPermissionsApi()
      .then((perms) => {
        cachedPermissions = perms
        cachedUserId = currentUser.id
        setPermissionList(perms)
      })
      .catch((err) => {
        console.error("[useUserPermissions] 获取权限失败:", err)
        setPermissionList([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [currentUser?.id])

  const permissions = useMemo(() => new Set(permissionList), [permissionList])

  const hasPermission = useCallback(
    (permission: string) => permissions.has(permission),
    [permissions]
  )

  /** 刷新权限缓存 */
  const refresh = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const perms = await fetchUserPermissionsApi()
      cachedPermissions = perms
      cachedUserId = currentUser.id
      setPermissionList(perms)
    } catch (err) {
      console.error("[useUserPermissions] 刷新权限失败:", err)
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id])

  return { permissions, hasPermission, loading, refresh }
}
