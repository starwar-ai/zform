import { create } from "zustand"
import { persist } from "zustand/middleware"

interface DashboardState {
  favoriteButtonTypeIds: string[]
  favoriteListTypeIds: string[]
  widgetOrder: string[]
  setFavoriteButtonTypeIds: (typeIds: string[]) => void
  setFavoriteListTypeIds: (typeIds: string[]) => void
  setWidgetOrder: (order: string[]) => void
}

const MAX_FAVORITE_BUTTONS = 5

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      favoriteButtonTypeIds: [],
      favoriteListTypeIds: [],
      widgetOrder: [],
      setFavoriteButtonTypeIds: (typeIds) =>
        set({
          favoriteButtonTypeIds: [...typeIds].slice(0, MAX_FAVORITE_BUTTONS),
        }),
      setFavoriteListTypeIds: (typeIds) =>
        set({
          favoriteListTypeIds: [...typeIds],
        }),
      setWidgetOrder: (order) =>
        set({
          widgetOrder: [...order],
        }),
    }),
    {
      name: "zform-dashboard-storage",
    }
  )
)

