import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { persist } from "zustand/middleware"
import { nanoid } from "nanoid"
import type { Role, CreateRoleInput, UpdateRoleInput } from "@/types/role"

interface RoleStoreState {
  roles: Record<string, Role>

  // CRUD 操作
  createRole: (input: CreateRoleInput) => Role
  updateRole: (id: string, input: UpdateRoleInput) => void
  deleteRole: (id: string) => void
  getRole: (id: string) => Role | undefined
  getAllRoles: () => Role[]
  getRoleByCode: (code: string) => Role | undefined
}

export const useRoleStore = create<RoleStoreState>()(
  persist(
    immer((set, get) => ({
      roles: {},

      createRole: (input) => {
        const role: Role = {
          id: nanoid(),
          code: input.code,
          name: input.name,
          description: input.description,
          permissions: input.permissions ?? [],
          status: input.status ?? "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        set((draft) => {
          draft.roles[role.id] = role
        })

        return role
      },

      updateRole: (id, input) => {
        set((draft) => {
          const role = draft.roles[id]
          if (!role) return

          if (input.name !== undefined) role.name = input.name
          if (input.description !== undefined)
            role.description = input.description
          if (input.permissions !== undefined)
            role.permissions = input.permissions
          if (input.status !== undefined) role.status = input.status

          role.updatedAt = Date.now()
        })
      },

      deleteRole: (id) => {
        set((draft) => {
          delete draft.roles[id]
        })
      },

      getRole: (id) => {
        return get().roles[id]
      },

      getAllRoles: () => {
        return Object.values(get().roles)
      },

      getRoleByCode: (code) => {
        return Object.values(get().roles).find((role) => role.code === code)
      },
    })),
    {
      name: "zform-role-storage",
    }
  )
)
