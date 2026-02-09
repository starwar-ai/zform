import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type { User, CreateUserInput, UpdateUserInput } from "@/types/user"
import {
  fetchUsersApi,
  createUserApi,
  updateUserApi,
  deleteUserApi,
  assignUserRolesApi,
} from "@/apis/user-api"

interface UserStoreState {
  users: User[]
  loading: boolean
  error: string | null

  // 异步操作
  fetchUsers: () => Promise<void>
  createUser: (input: CreateUserInput) => Promise<User>
  updateUser: (id: string, input: UpdateUserInput) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  assignRoles: (userId: string, roleIds: string[]) => Promise<void>

  // 辅助方法
  getUser: (id: string) => User | undefined
  getAllUsers: () => User[]
  getUsersByRole: (roleId: string) => User[]
}

export const useUserStore = create<UserStoreState>()(
  immer((set, get) => ({
    users: [],
    loading: false,
    error: null,

    fetchUsers: async () => {
      set((draft) => {
        draft.loading = true
        draft.error = null
      })
      try {
        const users = await fetchUsersApi()
        set((draft) => {
          draft.users = users
          draft.loading = false
        })
      } catch (err) {
        set((draft) => {
          draft.error = err instanceof Error ? err.message : "获取用户失败"
          draft.loading = false
        })
      }
    },

    createUser: async (input) => {
      const user = await createUserApi({
        username: input.username,
        password: input.password,
        name: input.name,
        email: input.email,
        phone: input.phone,
        roleIds: input.roleIds,
        department: input.department,
        status: input.status,
      })
      await get().fetchUsers()
      return user
    },

    updateUser: async (id, input) => {
      await updateUserApi(id, {
        name: input.name,
        password: input.password,
        email: input.email,
        phone: input.phone,
        department: input.department,
        status: input.status,
      })
      await get().fetchUsers()
    },

    deleteUser: async (id) => {
      await deleteUserApi(id)
      await get().fetchUsers()
    },

    assignRoles: async (userId, roleIds) => {
      await assignUserRolesApi(userId, roleIds)
      await get().fetchUsers()
    },

    getUser: (id) => {
      return get().users.find((u) => u.id === id)
    },

    getAllUsers: () => {
      return get().users
    },

    getUsersByRole: (roleId) => {
      return get().users.filter((user) => user.roleIds.includes(roleId))
    },
  }))
)
