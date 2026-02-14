/**
 * SKU / 产品编号 API
 *
 * 产品编号生成与相关接口。
 * 路由约定: GET /api/pms/sku/generate-code?categoryId=${id}
 */

import { request } from "@/lib/api-client"

/**
 * 根据产品分类 ID 生成产品编号
 *
 * 返回格式: 前缀 + 3位序号 (如 "ABC001")
 * 前端解析: preCode = 前缀部分, xhCode = 最后3位序号
 *
 * @param categoryId 产品分类 ID
 * @returns 自动生成的完整编号
 */
export async function generateSkuCodeApi(categoryId: string): Promise<string> {
  const code = await request<string>(
    `/pms/sku/generate-code?categoryId=${encodeURIComponent(categoryId)}`
  )
  return String(code ?? "")
}

/**
 * 解析自动生成的编号为 preCode + xhCode
 *
 * 规则: 最后3位为序号(xhCode)，其余为前缀(preCode)
 *
 * @param autoCode 接口返回的完整编号
 * @returns { preCode, xhCode }
 */
export function parseSkuCode(autoCode: string): { preCode: string; xhCode: string } {
  if (!autoCode || autoCode.length < 3) {
    return { preCode: "", xhCode: "" }
  }
  const xhCode = autoCode.substring(autoCode.length - 3)
  const preCode = autoCode.substring(0, autoCode.length - 3)
  return { preCode, xhCode }
}

/**
 * 组装完整产品编号
 *
 * @param preCode 前缀
 * @param xhCode 序号(3位)
 * @param afterCode 用户自定义后缀
 */
export function formatSkuCode(preCode: string, xhCode: string, afterCode: string): string {
  return `${preCode}${xhCode}${afterCode || ""}`
}
