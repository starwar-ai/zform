/**
 * Product Image API Client
 *
 * 产品图片上传、查询、设置主图、排序、删除。
 *
 * 路由约定:
 *   POST   /api/product-images/:productId/upload  - 上传图片 (multipart/form-data)
 *   GET    /api/product-images/:productId          - 获取产品所有图片
 *   PUT    /api/product-images/:imageId/primary     - 设置主图
 *   PUT    /api/product-images/:imageId/sort         - 更新排序
 *   DELETE /api/product-images/:imageId              - 删除图片
 */

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api"

/** 服务端基础 URL (用于拼接图片访问路径) */
const SERVER_BASE = import.meta.env.VITE_SERVER_BASE || "http://localhost:3001"

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

/** 产品图片数据 */
export interface ProductImage {
  id: string
  productId: string
  originalName: string
  filePath: string
  thumbnailPath: string | null
  isPrimary: boolean
  sortOrder: number
  fileSize: number | null
  mimeType: string | null
  createdAt: string
}

/** 获取认证 Headers */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { useAuthStore } = await import("@/stores/auth-store")
  const currentUser = useAuthStore.getState().currentUser
  const headers: Record<string, string> = {}
  if (currentUser) {
    headers["x-user-id"] = currentUser.id
    headers["x-user-name"] = encodeURIComponent(currentUser.name)
    headers["x-user-roles"] = currentUser.roleIds.join(",")
  }
  return headers
}

/**
 * 获取图片完整访问 URL
 *
 * filePath 是相对于 uploads/ 目录的路径，服务端通过 /uploads/ 静态路由暴露
 */
export function getImageUrl(filePath: string): string {
  return `${SERVER_BASE}/uploads/${filePath}`
}

/**
 * 获取缩略图完整访问 URL
 */
export function getThumbnailUrl(thumbnailPath: string | null): string | null {
  if (!thumbnailPath) return null
  return `${SERVER_BASE}/uploads/${thumbnailPath}`
}

/**
 * 上传产品图片
 *
 * POST /api/product-images/:productId/upload
 */
export async function uploadProductImagesApi(
  productId: string,
  files: File[]
): Promise<ProductImage[]> {
  const authHeaders = await getAuthHeaders()

  const formData = new FormData()
  for (const file of files) {
    formData.append("images", file)
  }

  const res = await fetch(`${API_BASE}/product-images/${productId}/upload`, {
    method: "POST",
    headers: authHeaders, // 不设置 Content-Type，让浏览器自动设置 multipart boundary
    body: formData,
  })

  const json: ApiResponse<ProductImage[]> = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.message || `上传失败: ${res.status}`)
  }

  return json.data
}

/**
 * 获取产品所有图片
 *
 * GET /api/product-images/:productId
 */
export async function fetchProductImagesApi(
  productId: string
): Promise<ProductImage[]> {
  const authHeaders = await getAuthHeaders()

  const res = await fetch(`${API_BASE}/product-images/${productId}`, {
    headers: { "Content-Type": "application/json", ...authHeaders },
  })

  const json: ApiResponse<ProductImage[]> = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.message || `查询失败: ${res.status}`)
  }

  return json.data
}

/**
 * 设置主图
 *
 * PUT /api/product-images/:imageId/primary
 */
export async function setPrimaryImageApi(imageId: string): Promise<ProductImage> {
  const authHeaders = await getAuthHeaders()

  const res = await fetch(`${API_BASE}/product-images/${imageId}/primary`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders },
  })

  const json: ApiResponse<ProductImage> = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.message || `设置主图失败: ${res.status}`)
  }

  return json.data
}

/**
 * 更新图片排序
 *
 * PUT /api/product-images/:imageId/sort
 */
export async function updateImageSortApi(
  imageId: string,
  sortOrder: number
): Promise<ProductImage> {
  const authHeaders = await getAuthHeaders()

  const res = await fetch(`${API_BASE}/product-images/${imageId}/sort`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ sortOrder }),
  })

  const json: ApiResponse<ProductImage> = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.message || `排序更新失败: ${res.status}`)
  }

  return json.data
}

/**
 * 删除图片
 *
 * DELETE /api/product-images/:imageId
 */
export async function deleteProductImageApi(imageId: string): Promise<void> {
  const authHeaders = await getAuthHeaders()

  const res = await fetch(`${API_BASE}/product-images/${imageId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders },
  })

  const json: ApiResponse<null> = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json.message || `删除失败: ${res.status}`)
  }
}
