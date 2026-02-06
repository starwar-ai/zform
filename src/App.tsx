import { useState } from "react"
import { DocumentList } from "@/components/document-list"
import { DocumentForm } from "@/components/document-form"
import { setupExampleSchemas } from "@/examples/setup"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

// 初始化注册
setupExampleSchemas()

export default function App() {
  const [currentDocId, setCurrentDocId] = useState<string | null>(null)

  const handleOpenDocument = (docId: string) => {
    setCurrentDocId(docId)
  }

  const handleBack = () => {
    setCurrentDocId(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          {currentDocId && (
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Button>
          )}
          <h1 className="text-lg font-bold">ZForm</h1>
          <span className="text-sm text-muted-foreground">
            企业单据管理系统
          </span>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {currentDocId ? (
          <DocumentForm
            docId={currentDocId}
            onNavigate={handleOpenDocument}
          />
        ) : (
          <DocumentList onOpenDocument={handleOpenDocument} />
        )}
      </main>
    </div>
  )
}
