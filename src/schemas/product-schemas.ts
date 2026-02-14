/**
 * Product Management Schemas
 *
 * 产品管理单据定义（基于后端 Prisma Schema）
 * 产品类型: 标准产品(STANDARD) → 客户产品(CUSTOMER) / 自营产品(SELF_OWNED)
 *
 * 产品分类（参考 zexport SkuTypeEnum）：
 * - 普通产品(GENERAL_PRODUCTS)
 * - 组合产品(PRODUCT_MIX)
 * - 配件(ACCESSORIES)
 * - 辅料(AUXILIARY_MATERIALS)
 *
 * 普通产品、组合产品下可有「是否代理」属性，代理产品录入内容更少。
 */

import type { DocumentSchema, PushDownRule, ChangeRule, ComboboxOption, FieldEffect } from "@/core/types"
import type { HsCode, ProductCategoryTreeNode } from "@/types/category"
import type { DepartmentTreeNode } from "@/types/department"
import { fetchCategoryListApi } from "@/apis/category-api"
import { fetchBrandsApi } from "@/apis/business-config-api"
import { fetchDepartmentTreeApi } from "@/apis/department-api"
import { generateSkuCodeApi, formatSkuCode } from "@/apis/sku-api"

// ============================================================
// 工具函数：将树形分类拍平为 ComboboxOption[]
// ============================================================

/** 将产品分类树递归拍平为带 depth + isLeaf 的选项列表 */
function flattenCategoryTree(
  nodes: ProductCategoryTreeNode[],
  depth = 0
): ComboboxOption[] {
  const result: ComboboxOption[] = []
  for (const node of nodes) {
    const hasChildren = node.children && node.children.length > 0
    result.push({
      value: node.id,
      label: node.name,
      depth,
      isLeaf: !hasChildren,
    })
    if (hasChildren) {
      result.push(...flattenCategoryTree(node.children, depth + 1))
    }
  }
  return result
}

/** 获取产品分类选项（供 Combobox 使用，树形结构，仅叶子可选） */
async function fetchProductCategoryOptions(): Promise<ComboboxOption[]> {
  const tree = await fetchCategoryListApi<ProductCategoryTreeNode>("product-category")
  return flattenCategoryTree(tree)
}

/** 获取海关编码选项（供 Combobox 使用） */
async function fetchHsCodeOptions(): Promise<ComboboxOption[]> {
  const hsCodes = await fetchCategoryListApi<HsCode>("product")
  return hsCodes.map((item) => ({
    value: item.id,
    label: `${item.hsCode} ${item.name}`,
  }))
}

/** 将部门树递归拍平为带 depth + isLeaf 的选项列表 */
function flattenDepartmentTree(
  nodes: DepartmentTreeNode[],
  depth = 0
): ComboboxOption[] {
  const result: ComboboxOption[] = []
  for (const node of nodes) {
    const hasChildren = node.children && node.children.length > 0
    result.push({
      value: node.id,
      label: node.name,
      depth,
      isLeaf: !hasChildren,
    })
    if (hasChildren) {
      result.push(...flattenDepartmentTree(node.children, depth + 1))
    }
  }
  return result
}

/** 获取品牌选项（供 Combobox 使用） */
async function fetchBrandOptions(): Promise<ComboboxOption[]> {
  const brands = await fetchBrandsApi()
  return brands.map((brand) => ({
    value: brand.id,
    label: brand.name,
  }))
}

/** 获取部门选项（供 Combobox 使用） */
async function fetchDepartmentOptions(): Promise<ComboboxOption[]> {
  const tree = await fetchDepartmentTreeApi()
  return flattenDepartmentTree(tree)
}

// ============================================================
// 产品分类与代理 - 条件显示辅助函数（参考 zexport SkuTypeEnum）
// ============================================================

type FormData = Record<string, unknown>

/** 产品分类枚举值 */
const SKU_TYPE = {
  GENERAL: "GENERAL_PRODUCTS",
  MIX: "PRODUCT_MIX",
  ACCESSORIES: "ACCESSORIES",
  AUXILIARY: "AUXILIARY_MATERIALS",
} as const

const getSkuType = (d: FormData) => String(d.skuType ?? SKU_TYPE.GENERAL)

// ---- 原子谓词 ----
/** 辅料 */
const isAuxiliary = (d: FormData) => getSkuType(d) === SKU_TYPE.AUXILIARY
/** 组合产品 */
const isProductMix = (d: FormData) => getSkuType(d) === SKU_TYPE.MIX
/** 普通产品或组合产品 */
const isGeneralOrMix = (d: FormData) =>
  getSkuType(d) === SKU_TYPE.GENERAL || getSkuType(d) === SKU_TYPE.MIX
/** 是否勾选了代理（仅普通/组合产品下有意义） */
const isAgentProduct = (d: FormData) => Boolean(d.isAgent) && isGeneralOrMix(d)

// ---- 组合谓词（供 visibleWhen 直接引用，避免每处重复写箭头函数）----
/** 非辅料 */
const notAuxiliary = (d: FormData) => !isAuxiliary(d)
/** 完整录入模式：非辅料、非配件的代理 */
const isFullInputMode = (d: FormData) => !isAuxiliary(d) && !isAgentProduct(d)
/** 需要自动编码（非辅料、非代理） */
const needsAutoCode = isFullInputMode
/** 需要手动编码（辅料 或 代理产品） */
const needsManualCode = (d: FormData) => isAuxiliary(d) || isAgentProduct(d)
/** 显示辅料清单（普通/组合 + 非代理） */
const showAccessoryList = (d: FormData) => isGeneralOrMix(d) && !isAgentProduct(d)

// ============================================================
// 产品编号自动生成 Effect
// ============================================================

/**
 * 当 categoryId 变化时，调用后端生成产品编号并填充 preCode / xhCode / code
 */
const skuCodeGenerationEffect: FieldEffect = {
  watchFields: ["categoryId"],
  modes: ["create", "copy"],
  handler: async (data, onChange) => {
    const categoryId = String(data.categoryId ?? "").trim()
    if (!categoryId) return

    try {
      const result = await generateSkuCodeApi(categoryId)
      const { preCode, xhCode } = result
      const afterCode = String(data.afterCode ?? "").trim()
      const code = formatSkuCode(preCode, xhCode, afterCode)

      onChange("preCode", preCode)
      onChange("xhCode", xhCode)
      onChange("code", code)
      onChange("serialLength", result.serialLength)
    } catch (err) {
      console.warn("[SkuCode] 编号生成失败:", err)
    }
  },
}

// ============================================================
// 标准产品 (Standard Product)
// ProductType.STANDARD
// ============================================================

export const standardProductSchema: DocumentSchema = {
  typeId: "standard_product",
  typeName: "标准产品",
  masterFields: [
    // === 产品分类（优先选择，决定后续录入内容）===
    {
      id: "skuType",
      label: "产品分类",
      type: "select",
      required: true,
      defaultValue: "GENERAL_PRODUCTS",
      group: "基本信息",
      options: [
        { label: "普通产品", value: "GENERAL_PRODUCTS" },
        { label: "组合产品", value: "PRODUCT_MIX" },
        { label: "配件", value: "ACCESSORIES" },
        { label: "辅料", value: "AUXILIARY_MATERIALS" },
      ],
    },
    {
      id: "isAgent",
      label: "是否代理产品",
      type: "checkbox",
      defaultValue: false,
      group: "基本信息",
      visibleWhen: isGeneralOrMix,
    },
    // === 产品编号子字段（由 skuCode 复合控件管理，隐藏不单独渲染）===
    { id: "preCode", label: "前缀码", type: "text", hidden: true, group: "基本信息" },
    { id: "xhCode", label: "序号", type: "text", hidden: true, group: "基本信息" },
    { id: "afterCode", label: "后缀", type: "text", hidden: true, group: "基本信息" },
    { id: "serialLength", label: "序号长度", type: "number", hidden: true, defaultValue: 3, group: "基本信息" },
    {
      id: "code",
      label: "产品编码",
      type: "text",
      required: true,
      group: "基本信息",
      placeholder: "请手动输入产品编码",
      visibleWhen: needsManualCode,
    },
    {
      id: "skuCode",
      label: "产品编码",
      type: "skuCode",
      required: true,
      readOnlyModes: ["edit"],
      group: "基本信息",
      skuCodeConfig: {
        categoryIdField: "categoryId",
        preCodeField: "preCode",
        xhCodeField: "xhCode",
        afterCodeField: "afterCode",
        codeField: "code",
        serialLengthField: "serialLength",
      },
      effect: skuCodeGenerationEffect,
      visibleWhen: needsAutoCode,
    },
    {
      id: "barcode",
      label: "条形码",
      type: "text",
      group: "其他信息",
      visibleWhen: notAuxiliary,
    },
    {
      id: "name",
      label: "产品名称",
      type: "text",
      required: true,
      group: "基本信息",
    },
    {
      id: "nameEn",
      label: "英文名称",
      type: "text",
      group: "基本信息",
    },
    {
      id: "status",
      label: "产品状态",
      type: "select",
      options: [
        { label: "活跃", value: "ACTIVE" },
        { label: "停用", value: "INACTIVE" },
        { label: "草稿", value: "DRAFT" },
        { label: "停产", value: "DISCONTINUED" },
      ],
      defaultValue: "ACTIVE",
      required: true,
      group: "基本信息",
      visibleWhen: notAuxiliary,
    },
    {
      id: "unit",
      label: "计量单位",
      type: "combobox",
      required: true,
      placeholder: "搜索或选择计量单位",
      comboboxConfig: {
        fetchOptions: async () => [
          { label: "PCS", value: "PCS" },
          { label: "SET", value: "SET" },
          { label: "KG", value: "KG" },
          { label: "TON", value: "TON" },
          { label: "METER", value: "METER" },
          { label: "LITER", value: "LITER" },
        ],
      },
      defaultValue: "PCS",
      group: "基本信息",
    },

    // === 分类与品牌（辅料不需要）===
    {
      id: "categoryId",
      label: "产品分类",
      type: "combobox",
      placeholder: "搜索或选择产品分类",
      group: "分类信息",
      comboboxConfig: {
        fetchOptions: fetchProductCategoryOptions,
        isTree: true,
      },
      visibleWhen: notAuxiliary,
    },
    {
      id: "brandId",
      label: "品牌",
      type: "combobox",
      placeholder: "搜索或选择品牌",
      group: "分类信息",
      comboboxConfig: {
        fetchOptions: fetchBrandOptions,
      },
      visibleWhen: isFullInputMode,
    },
    {
      id: "departmentId",
      label: "所属部门",
      type: "combobox",
      placeholder: "搜索或选择部门",
      group: "分类信息",
      comboboxConfig: {
        fetchOptions: fetchDepartmentOptions,
        isTree: true,
      },
      visibleWhen: isFullInputMode,
    },

    // === 规格尺寸（辅料、代理产品不需要）===
    {
      id: "dimensions",
      label: "规格尺寸(cm)",
      type: "dimensions",
      group: "规格尺寸",
      dimensionConfig: {
        lengthId: "length",
        widthId: "width",
        heightId: "height",
        placeholders: {
          length: "长",
          width: "宽",
          height: "高",
        },
      },
      visibleWhen: isFullInputMode,
    },
    {
      id: "netWeight",
      label: "净重 (kg)",
      type: "number",
      placeholder: "0.000",
      group: "规格尺寸",
      visibleWhen: isFullInputMode,
    },

    // === 材料信息（辅料、代理产品不需要）===
    {
      id: "source",
      label: "来源",
      type: "select",
      options: [
        { label: "公司开发", value: "COMPANY_DEV" },
        { label: "采购开发", value: "PURCHASE_DEV" },
        { label: "部门开发", value: "DEPARTMENT_DEV" },
      ],
      group: "其他信息",
      visibleWhen: isFullInputMode,
    },
    {
      id: "material",
      label: "材质",
      type: "text",
      group: "材料信息",
      visibleWhen: isFullInputMode,
    },
    {
      id: "accessoryMaterial",
      label: "配件材质",
      type: "text",
      group: "材料信息",
      visibleWhen: isFullInputMode,
    },

    // === 价格与加工（组合产品才需要）===
    {
      id: "currency",
      label: "币种",
      type: "select",
      options: [
        { label: "USD", value: "USD" },
        { label: "CNY", value: "CNY" },
        { label: "EUR", value: "EUR" },
        { label: "GBP", value: "GBP" },
        { label: "JPY", value: "JPY" },
      ],
      defaultValue: "USD",
      group: "价格信息",
      visibleWhen: notAuxiliary,
    },
    {
      id: "unitProcessingFee",
      label: "单件加工费",
      type: "number",
      placeholder: "0.00",
      group: "价格信息",
      visibleWhen: isProductMix,
    },
    {
      id: "salePrice",
      label: "销售价格",
      type: "number",
      placeholder: "0.00",
      group: "价格信息",
      visibleWhen: notAuxiliary,
    },
    {
      id: "companyPrice",
      label: "公司价格",
      type: "number",
      placeholder: "0.00",
      group: "价格信息",
      visibleWhen: notAuxiliary,
    },
    {
      id: "processingNote",
      label: "加工说明",
      type: "textarea",
      span: 4,
      group: "价格信息",
      visibleWhen: isProductMix,
    },

    // === 报关信息（辅料不需要）===
    {
      id: "hsCodeId",
      label: "海关编码",
      type: "combobox",
      placeholder: "选择海关编码",
      group: "报关信息",
      comboboxConfig: {
        fetchOptions: fetchHsCodeOptions,
      },
      visibleWhen: notAuxiliary,
    },
    {
      id: "isCustomsInspection",
      label: "是否报关商检",
      type: "checkbox",
      defaultValue: false,
      group: "报关信息",
      visibleWhen: isFullInputMode,
    },
    {
      id: "customsNameCn",
      label: "报关中文名",
      type: "text",
      group: "报关信息",
      visibleWhen: notAuxiliary,
    },
    {
      id: "customsNameEn",
      label: "报关英文名",
      type: "text",
      group: "报关信息",
      visibleWhen: notAuxiliary,
    },

    // === 包装信息（辅料、代理产品不需要）===
    {
      id: "packageMethodId",
      label: "包装方式",
      type: "text",
      placeholder: "选择包装方式",
      group: "包装信息",
      visibleWhen: isFullInputMode,
    },

    // === 标识字段（辅料、代理产品不需要）===
    {
      id: "isSelfBrand",
      label: "是否自有品牌",
      type: "checkbox",
      defaultValue: false,
      group: "其他信息",
      visibleWhen: isFullInputMode,
    },
    {
      id: "isAdvantage",
      label: "是否优势产品",
      type: "checkbox",
      defaultValue: false,
      group: "其他信息",
      visibleWhen: isFullInputMode,
    },
    {
      id: "isCommonAccessory",
      label: "是否通用辅料",
      type: "checkbox",
      defaultValue: false,
      group: "其他信息",
      visibleWhen: isAuxiliary,
    },

    // === 描述与备注 ===
    {
      id: "description",
      label: "产品描述",
      type: "textarea",
      span: 4,
      placeholder: "详细描述产品特性、用途等...",
      group: "描述信息",
    },
    {
      id: "descriptionEn",
      label: "英文描述",
      type: "textarea",
      span: 4,
      placeholder: "English description...",
      group: "描述信息",
    },
    {
      id: "remark",
      label: "备注",
      type: "textarea",
      span: 4,
      group: "描述信息",
    },
  ],
  detailTables: [
    {
      id: "bom_items",
      label: "BOM 清单（组合产品）",
      editable: true,
      visibleWhen: (d) => isProductMix(d),
      fields: [
        {
          id: "childProductId",
          label: "子产品",
          type: "productSelector",
          required: true,
          width: "300px",
          productSelectorConfig: {
            productType: "standard",
          },
        },
        {
          id: "childProductCode",
          label: "子产品编码",
          type: "text",
          readOnly: true,
          width: "150px",
        },
        {
          id: "childProductName",
          label: "子产品名称",
          type: "text",
          readOnly: true,
          width: "200px",
        },
        {
          id: "quantity",
          label: "用量",
          type: "number",
          required: true,
          width: "100px",
        },
        {
          id: "unit",
          label: "单位",
          type: "text",
          readOnly: true,
          width: "80px",
        },
      ],
    },
    {
      id: "accessories",
      label: "辅料清单",
      editable: true,
      visibleWhen: showAccessoryList,
      fields: [
        {
          id: "accessoryId",
          label: "辅料",
          type: "accessorySelector",
          required: true,
          width: "300px",
        },
        {
          id: "accessoryCode",
          label: "辅料编码",
          type: "text",
          readOnly: true,
          width: "150px",
        },
        {
          id: "accessoryName",
          label: "辅料名称",
          type: "text",
          readOnly: true,
          width: "200px",
        },
        {
          id: "productRatio",
          label: "产品比例",
          type: "number",
          width: "100px",
        },
        {
          id: "accessoryRatio",
          label: "辅料比例",
          type: "number",
          width: "100px",
        },
        {
          id: "description",
          label: "说明",
          type: "text",
          width: "150px",
        },
        {
          id: "remark",
          label: "备注",
          type: "text",
          width: "150px",
        },
      ],
    },
  ],
}

// ============================================================
// 客户产品 (Customer Product)
// ProductType.CUSTOMER
// ============================================================

export const customerProductSchema: DocumentSchema = {
  typeId: "customer_product",
  typeName: "客户产品",
  masterFields: [
    // === 产品分类（继承自标准产品，只读显示）===
    {
      id: "skuType",
      label: "产品分类",
      type: "select",
      readOnly: true,
      group: "基本信息",
      options: [
        { label: "普通产品", value: "GENERAL_PRODUCTS" },
        { label: "组合产品", value: "PRODUCT_MIX" },
        { label: "配件", value: "ACCESSORIES" },
        { label: "辅料", value: "AUXILIARY_MATERIALS" },
      ],
    },
    {
      id: "isAgent",
      label: "是否代理产品",
      type: "checkbox",
      readOnly: true,
      group: "基本信息",
      visibleWhen: isGeneralOrMix,
    },
    // === 基本信息（继承自标准产品，只读）===
    {
      id: "code",
      label: "产品编码",
      type: "text",
      readOnly: true,
      required: true,
      group: "基本信息",
    },
    {
      id: "barcode",
      label: "条形码",
      type: "text",
      readOnly: true,
      group: "其他信息",
      visibleWhen: notAuxiliary,
    },
    {
      id: "name",
      label: "产品名称",
      type: "text",
      readOnly: true,
      group: "基本信息",
    },
    {
      id: "nameEn",
      label: "英文名称",
      type: "text",
      readOnly: true,
      group: "基本信息",
    },
    {
      id: "unit",
      label: "计量单位",
      type: "select",
      readOnly: true,
      options: [
        { label: "PCS", value: "PCS" },
        { label: "SET", value: "SET" },
        { label: "KG", value: "KG" },
        { label: "TON", value: "TON" },
        { label: "METER", value: "METER" },
        { label: "LITER", value: "LITER" },
      ],
      group: "基本信息",
    },
    {
      id: "status",
      label: "产品状态",
      type: "select",
      options: [
        { label: "活跃", value: "ACTIVE" },
        { label: "停用", value: "INACTIVE" },
        { label: "草稿", value: "DRAFT" },
        { label: "停产", value: "DISCONTINUED" },
      ],
      defaultValue: "ACTIVE",
      required: true,
      group: "基本信息",
    },

    // === 客户信息（客户产品专用字段）===
    {
      id: "customerId",
      label: "客户ID",
      type: "text",
      required: true,
      placeholder: "选择客户",
      group: "客户信息",
    },
    {
      id: "customerCode",
      label: "客户编码",
      type: "text",
      required: true,
      group: "客户信息",
    },
    {
      id: "customerProductNo",
      label: "客户产品编号",
      type: "text",
      placeholder: "客户指定的产品编号",
      group: "客户信息",
    },

    // === 价格信息 ===
    {
      id: "currency",
      label: "币种",
      type: "select",
      options: [
        { label: "USD", value: "USD" },
        { label: "CNY", value: "CNY" },
        { label: "EUR", value: "EUR" },
        { label: "GBP", value: "GBP" },
        { label: "JPY", value: "JPY" },
      ],
      defaultValue: "USD",
      group: "价格信息",
    },
    {
      id: "salePrice",
      label: "销售价格",
      type: "number",
      required: true,
      placeholder: "针对该客户的销售价格",
      group: "价格信息",
    },
    {
      id: "companyPrice",
      label: "公司价格",
      type: "number",
      placeholder: "0.00",
      group: "价格信息",
    },
    {
      id: "unitProcessingFee",
      label: "单件加工费",
      type: "number",
      placeholder: "0.00",
      group: "价格信息",
    },

    // === 规格尺寸（辅料、代理不需要）===
    {
      id: "dimensions",
      label: "规格尺寸(cm)",
      type: "dimensions",
      group: "规格尺寸",
      span: 3,
      dimensionConfig: {
        lengthId: "length",
        widthId: "width",
        heightId: "height",
        placeholders: {
          length: "长",
          width: "宽",
          height: "高",
        },
      },
      visibleWhen: isFullInputMode,
    },
    {
      id: "netWeight",
      label: "净重 (kg)",
      type: "number",
      placeholder: "0.000",
      group: "规格尺寸",
      visibleWhen: isFullInputMode,
    },

    // === 报关信息（辅料不需要）===
    {
      id: "customsNameCn",
      label: "报关中文名",
      type: "text",
      group: "报关信息",
      visibleWhen: notAuxiliary,
    },
    {
      id: "customsNameEn",
      label: "报关英文名",
      type: "text",
      group: "报关信息",
      visibleWhen: notAuxiliary,
    },

    // === 其他信息 ===
    {
      id: "description",
      label: "产品描述",
      type: "textarea",
      span: 4,
      placeholder: "客户特殊要求、注意事项等...",
      group: "其他信息",
    },
    {
      id: "remark",
      label: "备注",
      type: "textarea",
      span: 4,
      group: "其他信息",
    },
  ],
  detailTables: [
    {
      id: "bom_items",
      label: "BOM 清单",
      editable: true,
      visibleWhen: isProductMix,
      fields: [
        {
          id: "childProductCode",
          label: "子产品编码",
          type: "text",
          required: true,
        },
        {
          id: "childProductName",
          label: "子产品名称",
          type: "text",
          readOnly: true,
        },
        {
          id: "quantity",
          label: "用量",
          type: "number",
          required: true,
        },
        {
          id: "unit",
          label: "单位",
          type: "text",
          readOnly: true,
        },
      ],
    },
    {
      id: "accessories",
      label: "辅料清单",
      editable: true,
      visibleWhen: showAccessoryList,
      fields: [
        {
          id: "accessoryCode",
          label: "辅料编码",
          type: "text",
          required: true,
        },
        {
          id: "accessoryName",
          label: "辅料名称",
          type: "text",
          readOnly: true,
        },
        {
          id: "productRatio",
          label: "产品比例",
          type: "number",
        },
        {
          id: "accessoryRatio",
          label: "辅料比例",
          type: "number",
        },
        {
          id: "description",
          label: "说明",
          type: "text",
        },
      ],
    },
  ],
}

// ============================================================
// 自营产品 (Self-Owned Brand Product)
// ProductType.SELF_OWNED
// ============================================================

export const selfOwnedProductSchema: DocumentSchema = {
  typeId: "self_owned_product",
  typeName: "自营产品",
  masterFields: [
    // === 产品分类（继承自标准产品，只读显示）===
    {
      id: "skuType",
      label: "产品分类",
      type: "select",
      readOnly: true,
      group: "基本信息",
      options: [
        { label: "普通产品", value: "GENERAL_PRODUCTS" },
        { label: "组合产品", value: "PRODUCT_MIX" },
        { label: "配件", value: "ACCESSORIES" },
        { label: "辅料", value: "AUXILIARY_MATERIALS" },
      ],
    },
    {
      id: "isAgent",
      label: "是否代理产品",
      type: "checkbox",
      readOnly: true,
      group: "基本信息",
      visibleWhen: isGeneralOrMix,
    },
    // === 基本信息（继承自标准产品，只读）===
    {
      id: "code",
      label: "产品编码",
      type: "text",
      readOnly: true,
      required: true,
      group: "基本信息",
    },
    {
      id: "barcode",
      label: "条形码",
      type: "text",
      group: "其他信息",
      visibleWhen: notAuxiliary,
    },
    {
      id: "name",
      label: "产品名称",
      type: "text",
      readOnly: true,
      group: "基本信息",
    },
    {
      id: "nameEn",
      label: "英文名称",
      type: "text",
      readOnly: true,
      group: "基本信息",
    },
    {
      id: "unit",
      label: "计量单位",
      type: "select",
      readOnly: true,
      options: [
        { label: "PCS", value: "PCS" },
        { label: "SET", value: "SET" },
        { label: "KG", value: "KG" },
        { label: "TON", value: "TON" },
        { label: "METER", value: "METER" },
        { label: "LITER", value: "LITER" },
      ],
      group: "基本信息",
    },
    {
      id: "status",
      label: "产品状态",
      type: "select",
      options: [
        { label: "活跃", value: "ACTIVE" },
        { label: "停用", value: "INACTIVE" },
        { label: "草稿", value: "DRAFT" },
        { label: "停产", value: "DISCONTINUED" },
      ],
      defaultValue: "ACTIVE",
      required: true,
      group: "基本信息",
    },

    // === 自营产品专用字段 ===
    {
      id: "selfOwnedProductNo",
      label: "自营产品编号",
      type: "text",
      required: true,
      placeholder: "自营品牌型号",
      group: "品牌信息",
    },
    {
      id: "isSelfBrand",
      label: "自有品牌标识",
      type: "checkbox",
      defaultValue: true,
      readOnly: true,
      group: "品牌信息",
    },
    {
      id: "brandId",
      label: "品牌",
      type: "text",
      required: true,
      placeholder: "选择品牌",
      group: "品牌信息",
    },

    // === 价格信息 ===
    {
      id: "currency",
      label: "币种",
      type: "select",
      options: [
        { label: "USD", value: "USD" },
        { label: "CNY", value: "CNY" },
        { label: "EUR", value: "EUR" },
        { label: "GBP", value: "GBP" },
        { label: "JPY", value: "JPY" },
      ],
      defaultValue: "USD",
      group: "价格信息",
    },
    {
      id: "salePrice",
      label: "建议零售价",
      type: "number",
      required: true,
      placeholder: "市场建议零售价",
      group: "价格信息",
    },
    {
      id: "companyPrice",
      label: "批发价格",
      type: "number",
      placeholder: "批发渠道价格",
      group: "价格信息",
    },
    {
      id: "unitProcessingFee",
      label: "单件加工费",
      type: "number",
      placeholder: "0.00",
      group: "价格信息",
    },

    // === 规格尺寸（辅料、代理不需要）===
    {
      id: "dimensions",
      label: "规格尺寸(cm)",
      type: "dimensions",
      group: "规格尺寸",
      span: 3,
      dimensionConfig: {
        lengthId: "length",
        widthId: "width",
        heightId: "height",
        placeholders: {
          length: "长",
          width: "宽",
          height: "高",
        },
      },
      visibleWhen: isFullInputMode,
    },
    {
      id: "netWeight",
      label: "净重 (kg)",
      type: "number",
      placeholder: "0.000",
      group: "规格尺寸",
      visibleWhen: isFullInputMode,
    },

    // === 包装信息（辅料、代理不需要）===
    {
      id: "packageMethodId",
      label: "包装方式",
      type: "text",
      placeholder: "选择包装方式",
      group: "包装信息",
      visibleWhen: isFullInputMode,
    },

    // === 报关信息（辅料不需要）===
    {
      id: "customsNameCn",
      label: "报关中文名",
      type: "text",
      group: "报关信息",
      visibleWhen: notAuxiliary,
    },
    {
      id: "customsNameEn",
      label: "报关英文名",
      type: "text",
      group: "报关信息",
      visibleWhen: notAuxiliary,
    },
    {
      id: "hsCodeId",
      label: "海关编码",
      type: "text",
      placeholder: "选择海关编码",
      group: "报关信息",
      visibleWhen: notAuxiliary,
    },

    // === 优势标识（辅料、代理不需要）===
    {
      id: "isAdvantage",
      label: "优势产品",
      type: "checkbox",
      defaultValue: false,
      group: "其他信息",
      visibleWhen: isFullInputMode,
    },

    // === 描述 ===
    {
      id: "description",
      label: "产品描述",
      type: "textarea",
      span: 4,
      placeholder: "面向消费者的产品描述...",
      group: "描述信息",
    },
    {
      id: "descriptionEn",
      label: "英文描述",
      type: "textarea",
      span: 4,
      placeholder: "English description...",
      group: "描述信息",
    },
    {
      id: "remark",
      label: "备注",
      type: "textarea",
      span: 4,
      group: "描述信息",
    },
  ],
  detailTables: [
    {
      id: "bom_items",
      label: "BOM 清单",
      editable: true,
      visibleWhen: isProductMix,
      fields: [
        {
          id: "childProductCode",
          label: "子产品编码",
          type: "text",
          required: true,
        },
        {
          id: "childProductName",
          label: "子产品名称",
          type: "text",
          readOnly: true,
        },
        {
          id: "quantity",
          label: "用量",
          type: "number",
          required: true,
        },
        {
          id: "unit",
          label: "单位",
          type: "text",
          readOnly: true,
        },
      ],
    },
    {
      id: "accessories",
      label: "辅料清单",
      editable: true,
      visibleWhen: showAccessoryList,
      fields: [
        {
          id: "accessoryCode",
          label: "辅料编码",
          type: "text",
          required: true,
        },
        {
          id: "accessoryName",
          label: "辅料名称",
          type: "text",
          readOnly: true,
        },
        {
          id: "productRatio",
          label: "产品比例",
          type: "number",
        },
        {
          id: "accessoryRatio",
          label: "辅料比例",
          type: "number",
        },
        {
          id: "description",
          label: "说明",
          type: "text",
        },
      ],
    },
  ],
}

// ============================================================
// 下推规则
// ============================================================

/** 标准产品 → 客户产品 */
export const standardToCustomerProductRule: PushDownRule = {
  sourceTypeId: "standard_product",
  targetTypeId: "customer_product",
  name: "创建客户产品",
  masterFieldMappings: [
    { sourceField: "master.code", targetField: "code" },
    { sourceField: "master.barcode", targetField: "barcode" },
    { sourceField: "master.name", targetField: "name" },
    { sourceField: "master.nameEn", targetField: "nameEn" },
    { sourceField: "master.unit", targetField: "unit" },
    { sourceField: "master.length", targetField: "length" },
    { sourceField: "master.width", targetField: "width" },
    { sourceField: "master.height", targetField: "height" },
    { sourceField: "master.netWeight", targetField: "netWeight" },
    { sourceField: "master.currency", targetField: "currency" },
    { sourceField: "master.salePrice", targetField: "salePrice" },
    { sourceField: "master.companyPrice", targetField: "companyPrice" },
    { sourceField: "master.unitProcessingFee", targetField: "unitProcessingFee" },
    { sourceField: "master.customsNameCn", targetField: "customsNameCn" },
    { sourceField: "master.customsNameEn", targetField: "customsNameEn" },
    { sourceField: "master.description", targetField: "description" },
  ],
  detailMappings: [
    {
      sourceTableId: "bom_items",
      targetTableId: "bom_items",
      fieldMappings: [
        { sourceField: "childProductCode", targetField: "childProductCode" },
        { sourceField: "childProductName", targetField: "childProductName" },
        { sourceField: "quantity", targetField: "quantity" },
        { sourceField: "unit", targetField: "unit" },
      ],
    },
    {
      sourceTableId: "accessories",
      targetTableId: "accessories",
      fieldMappings: [
        { sourceField: "accessoryCode", targetField: "accessoryCode" },
        { sourceField: "accessoryName", targetField: "accessoryName" },
        { sourceField: "productRatio", targetField: "productRatio" },
        { sourceField: "accessoryRatio", targetField: "accessoryRatio" },
        { sourceField: "description", targetField: "description" },
      ],
    },
  ],
}

/** 标准产品 → 自营产品 */
export const standardToSelfOwnedProductRule: PushDownRule = {
  sourceTypeId: "standard_product",
  targetTypeId: "self_owned_product",
  name: "创建自营产品",
  masterFieldMappings: [
    { sourceField: "master.code", targetField: "code" },
    { sourceField: "master.barcode", targetField: "barcode" },
    { sourceField: "master.name", targetField: "name" },
    { sourceField: "master.nameEn", targetField: "nameEn" },
    { sourceField: "master.unit", targetField: "unit" },
    { sourceField: "master.length", targetField: "length" },
    { sourceField: "master.width", targetField: "width" },
    { sourceField: "master.height", targetField: "height" },
    { sourceField: "master.netWeight", targetField: "netWeight" },
    { sourceField: "master.currency", targetField: "currency" },
    {
      sourceField: "master.salePrice",
      targetField: "salePrice",
      transform: (value) => {
        // 建议零售价 = 销售价格 * 1.5 (默认50%加价)
        const basePrice = typeof value === "number" ? value : 0
        return Math.round(basePrice * 1.5 * 100) / 100
      },
    },
    {
      sourceField: "master.companyPrice",
      targetField: "companyPrice",
      transform: (value) => {
        // 批发价 = 公司价格 * 1.3 (默认30%加价)
        const basePrice = typeof value === "number" ? value : 0
        return Math.round(basePrice * 1.3 * 100) / 100
      },
    },
    { sourceField: "master.unitProcessingFee", targetField: "unitProcessingFee" },
    { sourceField: "master.packageMethodId", targetField: "packageMethodId" },
    { sourceField: "master.customsNameCn", targetField: "customsNameCn" },
    { sourceField: "master.customsNameEn", targetField: "customsNameEn" },
    { sourceField: "master.hsCodeId", targetField: "hsCodeId" },
    { sourceField: "master.description", targetField: "description" },
    { sourceField: "master.descriptionEn", targetField: "descriptionEn" },
  ],
  detailMappings: [
    {
      sourceTableId: "bom_items",
      targetTableId: "bom_items",
      fieldMappings: [
        { sourceField: "childProductCode", targetField: "childProductCode" },
        { sourceField: "childProductName", targetField: "childProductName" },
        { sourceField: "quantity", targetField: "quantity" },
        { sourceField: "unit", targetField: "unit" },
      ],
    },
    {
      sourceTableId: "accessories",
      targetTableId: "accessories",
      fieldMappings: [
        { sourceField: "accessoryCode", targetField: "accessoryCode" },
        { sourceField: "accessoryName", targetField: "accessoryName" },
        { sourceField: "productRatio", targetField: "productRatio" },
        { sourceField: "accessoryRatio", targetField: "accessoryRatio" },
        { sourceField: "description", targetField: "description" },
      ],
    },
  ],
}

// ============================================================
// 变更规则
// ============================================================

/** 标准产品变更规则 */
export const standardProductChangeRule: ChangeRule = {
  typeId: "standard_product",
  watchFields: [
    "master.name",
    "master.nameEn",
    "master.salePrice",
    "master.companyPrice",
    "master.status",
    "master.length",
    "master.width",
    "master.height",
    "master.netWeight",
  ],
  evaluate: (oldDoc, newDoc, downstreamDocs) => {
    const impacts = []

    // 产品名称变更
    if (oldDoc.masterData.name !== newDoc.masterData.name) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "warning" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "name",
          description: `标准产品名称已变更 (${oldDoc.masterData.name} → ${newDoc.masterData.name}), 下游${downstream.typeId === "customer_product" ? "客户产品" : "自营产品"}需要同步更新。`,
        })
      }
    }

    // 规格尺寸变更
    const dimensionFields = ["length", "width", "height", "netWeight"]
    const changedDimensions = dimensionFields.filter(
      (field) => oldDoc.masterData[field] !== newDoc.masterData[field]
    )
    if (changedDimensions.length > 0) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "warning" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: changedDimensions.join(", "),
          description: `标准产品规格尺寸已变更 (${changedDimensions.join(", ")}), 可能影响下游产品包装和运输成本。`,
        })
      }
    }

    // 销售价格变更
    if (oldDoc.masterData.salePrice !== newDoc.masterData.salePrice) {
      for (const downstream of downstreamDocs) {
        const isCustomerProduct = downstream.typeId === "customer_product"
        impacts.push({
          level: "info" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "salePrice",
          description: `标准产品销售价变更 (${oldDoc.masterData.salePrice} → ${newDoc.masterData.salePrice}), 建议重新评估下游${isCustomerProduct ? "客户产品" : "自营产品"}价格。`,
        })
      }
    }

    // 产品停产
    if (
      oldDoc.masterData.status !== "DISCONTINUED" &&
      newDoc.masterData.status === "DISCONTINUED"
    ) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "critical" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "status",
          description: `标准产品已停产, 下游${downstream.typeId === "customer_product" ? "客户产品" : "自营产品"} ${downstream.docNumber} 将无法继续销售, 请及时处理。`,
        })
      }
    }

    return impacts
  },
}
