import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "@/types/user"
import { loginApi } from "@/lib/user-api"

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
        try {
          const user = await loginApi(username, password)

          set({
            currentUser: user,
            isAuthenticated: true,
          })

          return {
            success: true,
          }
        } catch (error) {
          return {
            success: false,
            message: error instanceof Error ? error.message : "登录失败",
          }
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
