import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/types/user"
import { useUserStore } from "./user-store"

interface AuthStoreState {
  currentUser: User | null
  isAuthenticated: boolean

  // 认证操作
  login: (username: string, password: string) => Promise<{
    success: boolean
    message?: string
  }>
  logout: () => void
  setCurrentUser: (user: User | null) => void
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,

      login: async (username: string, password: string) => {
        // 简化版登录：仅验证用户名存在且用户状态为激活
        // 实际项目中应该调用后端 API 验证密码
        const userStore = useUserStore.getState()
        const allUsers = userStore.getAllUsers()

        const user = allUsers.find((u) => u.username === username)

        if (!user) {
          return {
            success: false,
            message: "用户名不存在",
          }
        }

        if (user.status !== "active") {
          return {
            success: false,
            message: "用户已被停用",
          }
        }

        // 简化版：不验证密码（实际项目中需要验证）
        // 这里假设密码正确

        set({
          currentUser: user,
          isAuthenticated: true,
        })

        return {
          success: true,
        }
      },

      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
        })
      },

      setCurrentUser: (user) => {
        set({
          currentUser: user,
          isAuthenticated: !!user,
        })
      },
    }),
    {
      name: "zform-auth-storage",
    }
  )
)
