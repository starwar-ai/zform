import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SidebarStoreState {
  isExpanded: boolean
  toggle: () => void
  setExpanded: (expanded: boolean) => void
}

export const useSidebarStore = create<SidebarStoreState>()(
  persist(
    (set) => ({
      isExpanded: true,

      toggle: () => {
        set((state) => ({ isExpanded: !state.isExpanded }))
      },

      setExpanded: (expanded) => {
        set({ isExpanded: expanded })
      },
    }),
    {
      name: "zform-sidebar-storage",
    }
  )
)
