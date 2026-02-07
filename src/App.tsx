import { AppLayout } from "@/components/app-layout"
import { setupExampleSchemas } from "@/examples/setup"

// 初始化注册
setupExampleSchemas()

export default function App() {
  return <AppLayout />
}
