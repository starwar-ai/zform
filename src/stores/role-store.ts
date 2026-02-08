import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import type { Role, CreateRoleInput, UpdateRoleInput } from "@/types/role"
import {
  fetchRolesApi,
  createRoleApi,
  updateRoleApi,
  deleteRoleApi,
  fetchRoleMenuIdsApi,
  assignRoleMenusApi,
} from "@/lib/role-api"

interface RoleStoreState {
  roles: Role[]
  loading: boolean
  error: string | null

  // 异步操作
  fetchRoles: () => Promise<void>
  createRole: (input: CreateRoleInput) => Promise<Role>
  updateRole: (id: string, input: UpdateRoleInput) => Promise<void>
  deleteRole: (id: string) => Promise<void>
  assignMenus: (roleId: string, menuIds: string[]) => Promise<void>
  getRoleMenuIds: (roleId: string) => Promise<string[]>

  // 辅助方法
  getRole: (id: string) => Role | undefined
  getAllRoles: () => Role[]
  getRoleByCode: (code: string) => Role | undefined
}

export const useRoleStore = create<RoleStoreState>()(
  immer((set, get) => ({
    roles: [],
    loading: false,
    error: null,

    fetchRoles: async () => {
      set((draft) => {
        draft.loading = true
        draft.error = null
      })
      try {
        const roles = await fetchRolesApi()
        set((draft) => {
          draft.roles = roles
          draft.loading = false
        })
      } catch (err) {
        set((draft) => {
          draft.error = err instanceof Error ? err.message : "获取角色失败"
          draft.loading = false
        })
      }
    },

    createRole: async (input) => {
      const role = await createRoleApi({
        code: input.code,
        name: input.name,
        description: input.description,
        status: input.status,
      })
      await get().fetchRoles()
      return role
    },

    updateRole: async (id, input) => {
      await updateRoleApi(id, {
        name: input.name,
        description: input.description,
        status: input.status,
      })
      await get().fetchRoles()
    },

    deleteRole: async (id) => {
      await deleteRoleApi(id)
      await get().fetchRoles()
    },

    assignMenus: async (roleId, menuIds) => {
      await assignRoleMenusApi(roleId, menuIds)
    },

    getRoleMenuIds: async (roleId) => {
      return fetchRoleMenuIdsApi(roleId)
    },

    getRole: (id) => {
      return get().roles.find((r) => r.id === id)
    },

    getAllRoles: () => {
      return get().roles
    },

    getRoleByCode: (code) => {
      return get().roles.find((role) => role.code === code)
    },
  }))
)
