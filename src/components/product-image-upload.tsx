/**
 * ProductImageUpload
 *
 * 产品图片上传管理组件。
 * 支持: 多图上传、设置主图、生成缩略图、拖拽排序、删除。
 */

import { useState, useCallback, useRef, useEffect } from "react"
import type { ProductImage } from "@/apis/product-image-api"
import {
  uploadProductImagesApi,
  fetchProductImagesApi,
  setPrimaryImageApi,
  deleteProductImageApi,
  getImageUrl,
  getThumbnailUrl,
} from "@/apis/product-image-api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Upload, Star, Trash2, ZoomIn, ImageIcon, Loader2 } from "lucide-react"

interface ProductImageUploadProps {
  /** 产品 ID (已保存的产品才有) */
  productId: string | null
  /** 是否可编辑 */
  disabled?: boolean
}

export function ProductImageUpload({ productId, disabled }: ProductImageUploadProps) {
  const [images, setImages] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductImage | null>(null)
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /** 加载图片列表 */
  const loadImages = useCallback(async () => {
    if (!productId) return
    setLoading(true)
    try {
      const data = await fetchProductImagesApi(productId)
      setImages(data)
    } catch (err) {
      console.error("加载产品图片失败:", err)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    loadImages()
  }, [loadImages])

  /** 触发文件选择 */
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  /** 处理文件选择 */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !productId) return

    setUploading(true)
    try {
      const fileArray = Array.from(files)
      await uploadProductImagesApi(productId, fileArray)
      await loadImages()
    } catch (err) {
      console.error("上传失败:", err)
      alert(`上传失败: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setUploading(false)
      // 重置 input，允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  /** 设置主图 */
  const handleSetPrimary = async (image: ProductImage) => {
    if (image.isPrimary) return
    setSettingPrimary(image.id)
    try {
      await setPrimaryImageApi(image.id)
      await loadImages()
    } catch (err) {
      console.error("设置主图失败:", err)
      alert(`设置主图失败: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSettingPrimary(null)
    }
  }

  /** 确认删除 */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteProductImageApi(deleteTarget.id)
      await loadImages()
    } catch (err) {
      console.error("删除失败:", err)
      alert(`删除失败: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setDeleteTarget(null)
    }
  }

  /** 格式化文件大小 */
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "未知"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // 未保存的新产品: 提示需要先保存
  if (!productId) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
        <ImageIcon className="h-10 w-10 mb-2" />
        <p className="text-sm">请先保存产品后再上传图片</p>
      </div>
    )
  }

  if (loading && images.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        加载图片中...
      </div>
    )
  }

  const primaryImage = images.find((img) => img.isPrimary)

  return (
    <div className="space-y-4">
      {/* 操作栏 */}
      {!disabled && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1" />
            )}
            {uploading ? "上传中..." : "上传图片"}
          </Button>
          <span className="text-xs text-muted-foreground">
            支持 JPG、PNG、GIF、WebP，单文件不超过 10MB
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* 主图预览 */}
      {primaryImage && (
        <div className="flex gap-4 p-3 bg-muted/30 rounded-lg border">
          <div
            className="relative w-[120px] h-[120px] flex-shrink-0 rounded-md overflow-hidden border cursor-pointer group"
            onClick={() => setPreviewUrl(getImageUrl(primaryImage.filePath))}
          >
            <img
              src={getThumbnailUrl(primaryImage.thumbnailPath) ?? getImageUrl(primaryImage.filePath)}
              alt={primaryImage.originalName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex flex-col justify-center gap-1">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs">主图</Badge>
              {primaryImage.thumbnailPath && (
                <Badge variant="secondary" className="text-xs">已生成缩略图</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
              {primaryImage.originalName}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(primaryImage.fileSize)}
            </p>
          </div>
        </div>
      )}

      {/* 图片网格 */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className={`
                relative group rounded-lg border overflow-hidden
                ${image.isPrimary ? "ring-2 ring-primary" : ""}
              `}
            >
              {/* 图片 */}
              <div
                className="aspect-square cursor-pointer"
                onClick={() => setPreviewUrl(getImageUrl(image.filePath))}
              >
                <img
                  src={getImageUrl(image.filePath)}
                  alt={image.originalName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* 主图标记 */}
              {image.isPrimary && (
                <div className="absolute top-1 left-1">
                  <Badge variant="default" className="text-[10px] px-1 py-0">
                    主图
                  </Badge>
                </div>
              )}

              {/* 悬浮操作 */}
              {!disabled && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  <TooltipProvider>
                    {/* 设为主图 */}
                    {!image.isPrimary && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7"
                            disabled={settingPrimary === image.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSetPrimary(image)
                            }}
                          >
                            {settingPrimary === image.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Star className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>设为主图</TooltipContent>
                      </Tooltip>
                    )}

                    {/* 预览 */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewUrl(getImageUrl(image.filePath))
                          }}
                        >
                          <ZoomIn className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>查看大图</TooltipContent>
                    </Tooltip>

                    {/* 删除 */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteTarget(image)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>删除</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}

              {/* 文件名 */}
              <div className="p-1.5">
                <p className="text-[11px] text-muted-foreground truncate" title={image.originalName}>
                  {image.originalName}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground border-2 border-dashed rounded-lg">
            <ImageIcon className="h-8 w-8 mb-2" />
            <p className="text-sm">暂无图片</p>
          </div>
        )
      )}

      {/* 图片预览弹窗 */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="图片预览"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除图片</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除图片「{deleteTarget?.originalName}」吗？此操作不可恢复。
              {deleteTarget?.isPrimary && (
                <span className="block mt-1 text-destructive font-medium">
                  注意：该图片为主图，删除后将自动将下一张图片设为主图。
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
