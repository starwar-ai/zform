import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { persist } from "zustand/middleware"
import { nanoid } from "nanoid"
import type { User, CreateUserInput, UpdateUserInput } from "@/types/user"

interface UserStoreState {
  users: Record<string, User>

  // CRUD 操作
  createUser: (input: CreateUserInput) => User
  updateUser: (id: string, input: UpdateUserInput) => void
  deleteUser: (id: string) => void
  getUser: (id: string) => User | undefined
  getAllUsers: () => User[]
  getUsersByRole: (roleId: string) => User[]
}

export const useUserStore = create<UserStoreState>()(
  persist(
    immer((set, get) => ({
      users: {},

      createUser: (input) => {
        const user: User = {
          id: nanoid(),
          username: input.username,
          name: input.name,
          email: input.email,
          phone: input.phone,
          roleIds: input.roleIds,
          department: input.department,
          status: input.status ?? "active",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }

        set((draft) => {
          draft.users[user.id] = user
        })

        return user
      },

      updateUser: (id, input) => {
        set((draft) => {
          const user = draft.users[id]
          if (!user) return

          if (input.name !== undefined) user.name = input.name
          if (input.email !== undefined) user.email = input.email
          if (input.phone !== undefined) user.phone = input.phone
          if (input.roleIds !== undefined) user.roleIds = input.roleIds
          if (input.department !== undefined) user.department = input.department
          if (input.status !== undefined) user.status = input.status

          user.updatedAt = Date.now()
        })
      },

      deleteUser: (id) => {
        set((draft) => {
          delete draft.users[id]
        })
      },

      getUser: (id) => {
        return get().users[id]
      },

      getAllUsers: () => {
        return Object.values(get().users)
      },

      getUsersByRole: (roleId) => {
        return Object.values(get().users).filter((user) =>
          user.roleIds.includes(roleId)
        )
      },
    })),
    {
      name: "zform-user-storage",
    }
  )
)
