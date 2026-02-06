/**
 * ImpactDialog
 *
 * 变更影响评估对话框。
 * 显示影响列表, 让用户决定是否继续。
 */

import type { ImpactAssessment } from "@/core/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, AlertCircle, Info } from "lucide-react"

interface ImpactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assessment: ImpactAssessment | null
  onConfirm: () => void
  onCancel: () => void
}

const levelConfig = {
  critical: {
    icon: AlertCircle,
    color: "text-red-600",
    badge: "destructive" as const,
    label: "严重",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-yellow-600",
    badge: "outline" as const,
    label: "警告",
  },
  info: {
    icon: Info,
    color: "text-blue-600",
    badge: "secondary" as const,
    label: "提示",
  },
}

export function ImpactDialog({
  open,
  onOpenChange,
  assessment,
  onConfirm,
  onCancel,
}: ImpactDialogProps) {
  if (!assessment) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            变更影响评估
          </AlertDialogTitle>
          <AlertDialogDescription>{assessment.summary}</AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="max-h-[300px]">
          <div className="space-y-3 pr-4">
            {assessment.impacts.map((impact, index) => {
              const config = levelConfig[impact.level]
              const Icon = config.icon
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-md border"
                >
                  <Icon className={`h-4 w-4 mt-0.5 ${config.color}`} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={config.badge}>{config.label}</Badge>
                      <span className="text-sm font-medium">
                        {impact.affectedDocNumber}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {impact.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>取消变更</AlertDialogCancel>
          {assessment.canProceed && (
            <AlertDialogAction onClick={onConfirm}>
              确认变更
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
