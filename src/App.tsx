import { AppLayout } from "@/components/app-layout"
import { LoginPage } from "@/components/login-page"
import { useAuthStore } from "@/stores/auth-store"
import { setupSchemas } from "@/schemas/setup"
import { registerRowSelectors } from "@/registrations/row-selectors"
import { registerExtraTabs } from "@/registrations/extra-tabs"

// 初始化注册
setupSchemas()
registerRowSelectors()
registerExtraTabs()

export default function App() {
  const { isAuthenticated } = useAuthStore()

  // 认证守卫：未登录显示登录页，已登录显示主应用
  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <AppLayout />
}
