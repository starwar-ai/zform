/**
 * ChangeRequestDialog
 * 
 * 产品变更申请对话框
 */

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface ChangeRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (changeReason: string) => void
  loading?: boolean
}

export function ChangeRequestDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: ChangeRequestDialogProps) {
  const [changeReason, setChangeReason] = useState("")

  const handleConfirm = () => {
    if (!changeReason.trim()) {
      alert("请填写变更理由")
      return
    }
    onConfirm(changeReason)
    setChangeReason("")
  }

  const handleCancel = () => {
    setChangeReason("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>申请产品变更</DialogTitle>
          <DialogDescription>
            产品已审批通过，需要修改时必须申请变更。请说明变更理由，提交后需重新审批。
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="changeReason">
              变更理由 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="changeReason"
              placeholder="请详细说明变更原因..."
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "提交中..." : "提交变更申请"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
