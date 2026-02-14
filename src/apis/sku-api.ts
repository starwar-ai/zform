/**
 * SKU / 产品编号 API
 *
 * 产品编号生成与相关接口。
 * 路由约定: GET /api/pms/sku/generate-code?categoryId=${id}
 *
 * 后端使用 ProductCategory.codePrefix 作为前缀，serialLength 作为序号长度。
 */

import { request } from "@/lib/api-client"

export interface GenerateSkuCodeResult {
  code: string
  preCode: string
  xhCode: string
  serialLength: number
}

/**
 * 根据产品分类 ID 生成产品编号
 *
 * 后端返回: { code, preCode, xhCode, serialLength }
 * 前缀取自 ProductCategory.code_prefix，序号长度取自 serial_length
 */
export async function generateSkuCodeApi(
  categoryId: string
): Promise<GenerateSkuCodeResult> {
  const result = await request<GenerateSkuCodeResult>(
    `/pms/sku/generate-code?categoryId=${encodeURIComponent(categoryId)}`
  )
  return result
}

/**
 * 组装完整产品编号
 *
 * @param preCode 前缀
 * @param xhCode 序号
 * @param afterCode 用户自定义后缀
 */
export function formatSkuCode(
  preCode: string,
  xhCode: string,
  afterCode: string
): string {
  return `${preCode}${xhCode}${afterCode || ""}`
}
