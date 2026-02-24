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

import type { DocumentSchema, PushDownRule, ChangeRule, ComboboxOption, FieldEffect, DetailTableDef } from "@/core/types"
import type { HsCode, ProductCategoryTreeNode } from "@/types/parameter"
import type { DepartmentTreeNode } from "@/types/department"
import { fetchParameterListApi } from "@/apis/business-entity-api"
import { fetchBrandsApi } from "@/apis/business-parameter-api"
import { fetchDepartmentTreeApi } from "@/apis/department-api"
import { generateSkuCodeApi, formatSkuCode } from "@/apis/sku-api"
import { DEFAULT_CURRENCY } from "@/lib/currency"

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
  const tree = await fetchParameterListApi<ProductCategoryTreeNode>("product-category")
  return flattenCategoryTree(tree)
}

/** 获取海关编码选项（供 Combobox 使用） */
async function fetchHsCodeOptions(): Promise<ComboboxOption[]> {
  const hsCodes = await fetchParameterListApi<HsCode>("product")
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
/** 是否自研产品 */
const isSelfDeveloped = (d: FormData) => Boolean(d.isSelfDeveloped)

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
// 共享明细表：供应商报价列表
// ============================================================

/** 供应商报价列表明细表定义（标准产品、客户产品、自营产品共用） */
const supplierQuotationsTable: DetailTableDef = {
  id: "supplier_quotations",
  label: "供应商报价列表",
  editable: true,
  visibleWhen: notAuxiliary,
  addRowSelector: {
    type: "supplier",
    multiple: false,
    buttonLabel: "选择供应商",
    mapToRowData: (item: Record<string, unknown>) => ({
      // 供应商信息
      supplierId: item._id,
      supplierCode: item._docNumber,
      supplierName: item.name,
      // 采购员信息（从供应商主采购员获取）
      buyerId: item.buyer ?? null,
      buyerName: null,
      buyerDepartmentId: null,
      buyerDepartmentName: null,
      // 报价信息
      currency: item.currency ?? "CNY",
      purchaseUnitPrice: null,
      includeTax: false,
      taxRate: item.taxRate ?? null,
      taxIncludedUnitPrice: null,
      includePackaging: false,
      packagingPrice: null,
      includeFreight: false,
      freight: null,
      fullUnitPrice: null,
      moq: null,
      leadTime: null,
      quotationDate: new Date().toISOString().slice(0, 10),
      // 工厂与采购信息
      factoryProductNo: null,
      purchaseLink: null,
      // 包装信息
      packageMethod: null,
      innerBoxQty: null,
      outerBoxQty: null,
      packageLength: null,
      packageWidth: null,
      packageHeight: null,
      outerBoxLength: null,
      outerBoxWidth: null,
      outerBoxHeight: null,
      outerBoxVolume: null,
      outerBoxNetWeight: null,
      itemGrossWeight: null,
      outerBoxGrossWeight: null,
      // 柜量信息
      bulkCargo: false,
      container20ftQty: null,
      container40ftQty: null,
      container40hqQty: null,
      // 开票信息
      invoiceProductName: null,
      // 状态
      isDefault: false,
      isActive: true,
      // 备注与附件
      remark: null,
      attachments: null,
      images: null,
    }),
  },
  fields: [
    // === 供应商信息 ===
    {
      id: "supplierCode",
      label: "供应商编码",
      type: "text",
      readOnly: true,
      width: "120px",
    },
    {
      id: "supplierName",
      label: "供应商名称",
      type: "text",
      readOnly: true,
      width: "150px",
    },
    {
      id: "factoryProductNo",
      label: "工厂货号",
      type: "text",
      width: "120px",
    },
    // === 采购员信息 ===
    {
      id: "buyerName",
      label: "采购员",
      type: "text",
      readOnly: true,
      width: "100px",
    },
    {
      id: "buyerDepartmentName",
      label: "采购员部门",
      type: "text",
      readOnly: true,
      width: "120px",
    },
    // === 报价日期 ===
    {
      id: "quotationDate",
      label: "报价日期",
      type: "date",
      width: "120px",
    },
    // === 价格信息 ===
    {
      id: "currency",
      label: "币种",
      type: "select",
      options: [
        { label: "CNY", value: "CNY" },
        { label: "USD", value: "USD" },
        { label: "EUR", value: "EUR" },
        { label: "GBP", value: "GBP" },
        { label: "JPY", value: "JPY" },
      ],
      defaultValue: "CNY",
      width: "80px",
    },
    {
      id: "purchaseUnitPrice",
      label: "采购单价",
      type: "number",
      required: true,
      placeholder: "0.0000",
      width: "100px",
    },
    {
      id: "includeTax",
      label: "含税",
      type: "checkbox",
      defaultValue: false,
      width: "60px",
    },
    {
      id: "taxRate",
      label: "税率(%)",
      type: "number",
      placeholder: "0.00",
      width: "80px",
    },
    {
      id: "taxIncludedUnitPrice",
      label: "含税单价",
      type: "number",
      placeholder: "0.0000",
      width: "100px",
    },
    {
      id: "includePackaging",
      label: "含包装",
      type: "checkbox",
      defaultValue: false,
      width: "70px",
    },
    {
      id: "packagingPrice",
      label: "包装价",
      type: "number",
      placeholder: "0.0000",
      width: "90px",
    },
    {
      id: "includeFreight",
      label: "含运费",
      type: "checkbox",
      defaultValue: false,
      width: "70px",
    },
    {
      id: "freight",
      label: "运费",
      type: "number",
      placeholder: "0.0000",
      width: "90px",
    },
    {
      id: "fullUnitPrice",
      label: "含税含包装含运费单价",
      type: "number",
      placeholder: "0.0000",
      width: "160px",
    },
    // === 采购条件 ===
    {
      id: "moq",
      label: "最小起购量",
      type: "number",
      placeholder: "0",
      width: "100px",
    },
    {
      id: "leadTime",
      label: "交期(天)",
      type: "number",
      placeholder: "0",
      width: "90px",
    },
    {
      id: "purchaseLink",
      label: "采购链接",
      type: "text",
      width: "150px",
    },
    // === 包装方式 ===
    {
      id: "packageMethod",
      label: "包装方式",
      type: "text",
      width: "100px",
    },
    {
      id: "innerBoxQty",
      label: "内箱装量",
      type: "number",
      placeholder: "0",
      width: "90px",
    },
    {
      id: "outerBoxQty",
      label: "外箱装量",
      type: "number",
      placeholder: "0",
      width: "90px",
    },
    // === 包装规格 ===
    {
      id: "packageLength",
      label: "包装长(cm)",
      type: "number",
      placeholder: "0.00",
      width: "100px",
    },
    {
      id: "packageWidth",
      label: "包装宽(cm)",
      type: "number",
      placeholder: "0.00",
      width: "100px",
    },
    {
      id: "packageHeight",
      label: "包装高(cm)",
      type: "number",
      placeholder: "0.00",
      width: "100px",
    },
    // === 外箱规格 ===
    {
      id: "outerBoxLength",
      label: "外箱长(cm)",
      type: "number",
      placeholder: "0.00",
      width: "100px",
    },
    {
      id: "outerBoxWidth",
      label: "外箱宽(cm)",
      type: "number",
      placeholder: "0.00",
      width: "100px",
    },
    {
      id: "outerBoxHeight",
      label: "外箱高(cm)",
      type: "number",
      placeholder: "0.00",
      width: "100px",
    },
    {
      id: "outerBoxVolume",
      label: "外箱体积(m³)",
      type: "number",
      placeholder: "0.000000",
      width: "110px",
    },
    // === 重量信息 ===
    {
      id: "outerBoxNetWeight",
      label: "外箱净重(kg)",
      type: "number",
      placeholder: "0.00",
      width: "110px",
    },
    {
      id: "itemGrossWeight",
      label: "单品毛重(kg)",
      type: "number",
      placeholder: "0.00",
      width: "110px",
    },
    {
      id: "outerBoxGrossWeight",
      label: "外箱毛重(kg)",
      type: "number",
      placeholder: "0.00",
      width: "110px",
    },
    // === 柜量信息 ===
    {
      id: "bulkCargo",
      label: "是否分箱",
      type: "checkbox",
      defaultValue: false,
      width: "80px",
    },
    {
      id: "container20ftQty",
      label: "20尺柜装数量",
      type: "number",
      placeholder: "0",
      width: "110px",
    },
    {
      id: "container40ftQty",
      label: "40尺柜装数量",
      type: "number",
      placeholder: "0",
      width: "110px",
    },
    {
      id: "container40hqQty",
      label: "40高柜装数量",
      type: "number",
      placeholder: "0",
      width: "110px",
    },
    // === 开票信息 ===
    {
      id: "invoiceProductName",
      label: "开票品名",
      type: "text",
      width: "150px",
    },
    // === 状态 ===
    {
      id: "isDefault",
      label: "是否默认",
      type: "checkbox",
      defaultValue: false,
      width: "80px",
    },
    {
      id: "isActive",
      label: "是否有效",
      type: "checkbox",
      defaultValue: true,
      width: "80px",
    },
    // === 备注与附件 ===
    {
      id: "remark",
      label: "备注",
      type: "text",
      width: "200px",
    },
    {
      id: "attachments",
      label: "附件",
      type: "text",
      width: "100px",
    },
    {
      id: "images",
      label: "图片",
      type: "text",
      width: "100px",
    },
  ],
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
      validationField: "code",
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
      required: true,
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

    // === 描述与备注 ===
    {
      id: "description",
      label: "产品描述",
      type: "textarea",
      span: 2,
      rows: 6,
      copyable: true,
      placeholder: "详细描述产品特性、用途等...",
      group: "描述信息",
    },
    {
      id: "descriptionEn",
      label: "英文描述",
      type: "textarea",
      span: 2,
      rows: 6,
      copyable: true,
      placeholder: "English description...",
      group: "描述信息",
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
    {
      id: "barcode",
      label: "条形码",
      type: "text",
      group: "其他信息",
      visibleWhen: notAuxiliary,
    },

    // === 规格尺寸（辅料、代理产品不需要）===
    {
      id: "dimensions",
      label: "规格尺寸(cm)",
      type: "dimensions",
      group: "其他信息",
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
      group: "其他信息",
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
      group: "其他信息",
      visibleWhen: isFullInputMode,
    },

    // === 价格与加工（组合产品才需要）===
    // 单件加工费币种（隐藏字段，由 price 组件管理）
    {
      id: "unitProcessingFeeCurrency",
      label: "单件加工费币种",
      type: "text",
      hidden: true,
      defaultValue: DEFAULT_CURRENCY,
      group: "其他信息",
    },
    {
      id: "unitProcessingFee",
      label: "单件加工费",
      type: "price",
      group: "其他信息",
      visibleWhen: isProductMix,
      priceConfig: {
        amountField: "unitProcessingFee",
        currencyField: "unitProcessingFeeCurrency",
      },
    },
    // 公司指导价币种（隐藏字段，由 price 组件管理）
    {
      id: "salePriceCurrency",
      label: "公司指导价币种",
      type: "text",
      hidden: true,
      defaultValue: DEFAULT_CURRENCY,
      group: "其他信息",
    },
    {
      id: "salePrice",
      label: "公司指导价",
      type: "price",
      group: "其他信息",
      visibleWhen: notAuxiliary,
      priceConfig: {
        amountField: "salePrice",
        currencyField: "salePriceCurrency",
      },
    },
    // 最低成本价币种（隐藏字段，由 price 组件管理）
    {
      id: "companyPriceCurrency",
      label: "最低成本价币种",
      type: "text",
      hidden: true,
      defaultValue: DEFAULT_CURRENCY,
      group: "其他信息",
    },
    {
      id: "companyPrice",
      label: "最低成本价",
      type: "price",
      group: "其他信息",
      visibleWhen: (d) => notAuxiliary(d) && isSelfDeveloped(d),
      priceConfig: {
        amountField: "companyPrice",
        currencyField: "companyPriceCurrency",
      },
    },
    {
      id: "processingNote",
      label: "加工说明",
      type: "textarea",
      span: 4,
      group: "其他信息",
      visibleWhen: isProductMix,
    },

    // === 标识字段（辅料、代理产品不需要）===
    {
      id: "isSelfDeveloped",
      label: "是否自研产品",
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

    // === 备注 ===
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
      addRowSelector: {
        type: "accessory",
        multiple: true,
        buttonLabel: "选择辅料",
        mapToRowData: (item: Record<string, unknown>) => ({
          accessoryId: item._id,
          accessoryCode: item._docNumber,
          accessoryName: item.name,
          unit: item.unit,
          productRatio: 1,
          accessoryRatio: 1,
        }),
      },
      fields: [
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
          id: "unit",
          label: "单位",
          type: "text",
          readOnly: true,
          width: "80px",
        },
        {
          id: "ratio",
          label: "产品:辅料比例",
          type: "ratio",
          width: "180px",
          ratioConfig: {
            productRatioField: "productRatio",
            accessoryRatioField: "accessoryRatio",
          },
        },
        {
          id: "description",
          label: "说明",
          type: "text",
          width: "150px",
        },
      ],
    },
    supplierQuotationsTable,
  ],
  extraTabKeys: ["product_images"],
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
    // 公司指导价币种（隐藏字段，由 price 组件管理）
    {
      id: "salePriceCurrency",
      label: "公司指导价币种",
      type: "text",
      hidden: true,
      defaultValue: DEFAULT_CURRENCY,
      group: "其他信息",
    },
    {
      id: "salePrice",
      label: "公司指导价",
      type: "price",
      required: true,
      placeholder: "针对该客户的销售价格",
      group: "其他信息",
      priceConfig: {
        amountField: "salePrice",
        currencyField: "salePriceCurrency",
      },
    },
    // 最低成本价币种（隐藏字段，由 price 组件管理）
    {
      id: "companyPriceCurrency",
      label: "最低成本价币种",
      type: "text",
      hidden: true,
      defaultValue: DEFAULT_CURRENCY,
      group: "其他信息",
    },
    {
      id: "companyPrice",
      label: "最低成本价",
      type: "price",
      group: "其他信息",
      visibleWhen: isSelfDeveloped,
      priceConfig: {
        amountField: "companyPrice",
        currencyField: "companyPriceCurrency",
      },
    },
    // 单件加工费币种（隐藏字段，由 price 组件管理）
    {
      id: "unitProcessingFeeCurrency",
      label: "单件加工费币种",
      type: "text",
      hidden: true,
      defaultValue: DEFAULT_CURRENCY,
      group: "其他信息",
    },
    {
      id: "unitProcessingFee",
      label: "单件加工费",
      type: "price",
      group: "其他信息",
      priceConfig: {
        amountField: "unitProcessingFee",
        currencyField: "unitProcessingFeeCurrency",
      },
    },

    // === 规格尺寸（辅料、代理不需要）===
    {
      id: "dimensions",
      label: "规格尺寸(cm)",
      type: "dimensions",
      group: "其他信息",
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
      group: "其他信息",
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
      id: "isSelfDeveloped",
      label: "是否自研产品",
      type: "checkbox",
      defaultValue: false,
      group: "其他信息",
    },
    {
      id: "description",
      label: "产品描述",
      type: "textarea",
      span: 4,
      copyable: true,
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
      addRowSelector: {
        type: "accessory",
        multiple: true,
        buttonLabel: "选择辅料",
        mapToRowData: (item: Record<string, unknown>) => ({
          accessoryId: item._id,
          accessoryCode: item._docNumber,
          accessoryName: item.name,
          unit: item.unit,
          productRatio: 1,
          accessoryRatio: 1,
        }),
      },
      fields: [
        {
          id: "accessoryCode",
          label: "辅料编码",
          type: "text",
          readOnly: true,
        },
        {
          id: "accessoryName",
          label: "辅料名称",
          type: "text",
          readOnly: true,
        },
        {
          id: "unit",
          label: "单位",
          type: "text",
          readOnly: true,
        },
        {
          id: "ratio",
          label: "产品:辅料比例",
          type: "ratio",
          ratioConfig: {
            productRatioField: "productRatio",
            accessoryRatioField: "accessoryRatio",
          },
        },
        {
          id: "description",
          label: "说明",
          type: "text",
        },
      ],
    },
    supplierQuotationsTable,
  ],
  extraTabKeys: ["product_images"],
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
    // 公司指导价币种（隐藏字段，由 price 组件管理）
    {
      id: "salePriceCurrency",
      label: "公司指导价币种",
      type: "text",
      hidden: true,
      defaultValue: DEFAULT_CURRENCY,
      group: "其他信息",
    },
    {
      id: "salePrice",
      label: "公司指导价",
      type: "price",
      required: true,
      placeholder: "市场建议零售价",
      group: "其他信息",
      priceConfig: {
        amountField: "salePrice",
        currencyField: "salePriceCurrency",
      },
    },
    // 最低成本价币种（隐藏字段，由 price 组件管理）
    {
      id: "companyPriceCurrency",
      label: "最低成本价币种",
      type: "text",
      hidden: true,
      defaultValue: DEFAULT_CURRENCY,
      group: "其他信息",
    },
    {
      id: "companyPrice",
      label: "最低成本价",
      type: "price",
      placeholder: "批发渠道价格",
      group: "其他信息",
      visibleWhen: isSelfDeveloped,
      priceConfig: {
        amountField: "companyPrice",
        currencyField: "companyPriceCurrency",
      },
    },
    // 单件加工费币种（隐藏字段，由 price 组件管理）
    {
      id: "unitProcessingFeeCurrency",
      label: "单件加工费币种",
      type: "text",
      hidden: true,
      defaultValue: DEFAULT_CURRENCY,
      group: "其他信息",
    },
    {
      id: "unitProcessingFee",
      label: "单件加工费",
      type: "price",
      group: "其他信息",
      priceConfig: {
        amountField: "unitProcessingFee",
        currencyField: "unitProcessingFeeCurrency",
      },
    },

    // === 规格尺寸（辅料、代理不需要）===
    {
      id: "dimensions",
      label: "规格尺寸(cm)",
      type: "dimensions",
      group: "其他信息",
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
      group: "其他信息",
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
      id: "isSelfDeveloped",
      label: "是否自研产品",
      type: "checkbox",
      defaultValue: false,
      group: "其他信息",
      visibleWhen: isFullInputMode,
    },
    {
      id: "isAdvantage",
      label: "优势产品",
      type: "checkbox",
      defaultValue: false,
      group: "其他信息",
      visibleWhen: isFullInputMode,
    },

    // === 备注 ===
    {
      id: "remark",
      label: "备注",
      type: "textarea",
      span: 4,
      group: "其他信息",
    },

    // === 描述 ===
    {
      id: "description",
      label: "产品描述",
      type: "textarea",
      span: 2,
      rows: 6,
      copyable: true,
      placeholder: "面向消费者的产品描述...",
      group: "描述信息",
    },
    {
      id: "descriptionEn",
      label: "英文描述",
      type: "textarea",
      span: 2,
      rows: 6,
      copyable: true,
      placeholder: "English description...",
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
      addRowSelector: {
        type: "accessory",
        multiple: true,
        buttonLabel: "选择辅料",
        mapToRowData: (item: Record<string, unknown>) => ({
          accessoryId: item._id,
          accessoryCode: item._docNumber,
          accessoryName: item.name,
          unit: item.unit,
          productRatio: 1,
          accessoryRatio: 1,
        }),
      },
      fields: [
        {
          id: "accessoryCode",
          label: "辅料编码",
          type: "text",
          readOnly: true,
        },
        {
          id: "accessoryName",
          label: "辅料名称",
          type: "text",
          readOnly: true,
        },
        {
          id: "unit",
          label: "单位",
          type: "text",
          readOnly: true,
        },
        {
          id: "ratio",
          label: "产品:辅料比例",
          type: "ratio",
          ratioConfig: {
            productRatioField: "productRatio",
            accessoryRatioField: "accessoryRatio",
          },
        },
        {
          id: "description",
          label: "说明",
          type: "text",
        },
      ],
    },
    supplierQuotationsTable,
  ],
  extraTabKeys: ["product_images"],
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
    { sourceField: "master.salePrice", targetField: "salePrice" },
    { sourceField: "master.salePriceCurrency", targetField: "salePriceCurrency" },
    { sourceField: "master.companyPrice", targetField: "companyPrice" },
    { sourceField: "master.companyPriceCurrency", targetField: "companyPriceCurrency" },
    { sourceField: "master.unitProcessingFee", targetField: "unitProcessingFee" },
    { sourceField: "master.unitProcessingFeeCurrency", targetField: "unitProcessingFeeCurrency" },
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
    {
      sourceTableId: "supplier_quotations",
      targetTableId: "supplier_quotations",
      fieldMappings: [
        // 供应商信息
        { sourceField: "supplierId", targetField: "supplierId" },
        { sourceField: "supplierCode", targetField: "supplierCode" },
        { sourceField: "supplierName", targetField: "supplierName" },
        // 采购员信息
        { sourceField: "buyerId", targetField: "buyerId" },
        { sourceField: "buyerName", targetField: "buyerName" },
        { sourceField: "buyerDepartmentId", targetField: "buyerDepartmentId" },
        { sourceField: "buyerDepartmentName", targetField: "buyerDepartmentName" },
        // 报价信息
        { sourceField: "quotationDate", targetField: "quotationDate" },
        { sourceField: "currency", targetField: "currency" },
        { sourceField: "purchaseUnitPrice", targetField: "purchaseUnitPrice" },
        { sourceField: "includeTax", targetField: "includeTax" },
        { sourceField: "taxRate", targetField: "taxRate" },
        { sourceField: "taxIncludedUnitPrice", targetField: "taxIncludedUnitPrice" },
        { sourceField: "includePackaging", targetField: "includePackaging" },
        { sourceField: "packagingPrice", targetField: "packagingPrice" },
        { sourceField: "includeFreight", targetField: "includeFreight" },
        { sourceField: "freight", targetField: "freight" },
        { sourceField: "fullUnitPrice", targetField: "fullUnitPrice" },
        { sourceField: "moq", targetField: "moq" },
        { sourceField: "leadTime", targetField: "leadTime" },
        // 工厂与采购信息
        { sourceField: "factoryProductNo", targetField: "factoryProductNo" },
        { sourceField: "purchaseLink", targetField: "purchaseLink" },
        // 包装信息
        { sourceField: "packageMethod", targetField: "packageMethod" },
        { sourceField: "innerBoxQty", targetField: "innerBoxQty" },
        { sourceField: "outerBoxQty", targetField: "outerBoxQty" },
        { sourceField: "packageLength", targetField: "packageLength" },
        { sourceField: "packageWidth", targetField: "packageWidth" },
        { sourceField: "packageHeight", targetField: "packageHeight" },
        { sourceField: "outerBoxLength", targetField: "outerBoxLength" },
        { sourceField: "outerBoxWidth", targetField: "outerBoxWidth" },
        { sourceField: "outerBoxHeight", targetField: "outerBoxHeight" },
        { sourceField: "outerBoxVolume", targetField: "outerBoxVolume" },
        { sourceField: "outerBoxNetWeight", targetField: "outerBoxNetWeight" },
        { sourceField: "itemGrossWeight", targetField: "itemGrossWeight" },
        { sourceField: "outerBoxGrossWeight", targetField: "outerBoxGrossWeight" },
        // 柜量信息
        { sourceField: "bulkCargo", targetField: "bulkCargo" },
        { sourceField: "container20ftQty", targetField: "container20ftQty" },
        { sourceField: "container40ftQty", targetField: "container40ftQty" },
        { sourceField: "container40hqQty", targetField: "container40hqQty" },
        // 开票信息
        { sourceField: "invoiceProductName", targetField: "invoiceProductName" },
        // 状态
        { sourceField: "isDefault", targetField: "isDefault" },
        { sourceField: "isActive", targetField: "isActive" },
        // 备注与附件
        { sourceField: "remark", targetField: "remark" },
        { sourceField: "attachments", targetField: "attachments" },
        { sourceField: "images", targetField: "images" },
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
    {
      sourceField: "master.salePrice",
      targetField: "salePrice",
      transform: (value) => {
        // 建议零售价 = 销售价格 * 1.5 (默认50%加价)
        const basePrice = typeof value === "number" ? value : 0
        return Math.round(basePrice * 1.5 * 100) / 100
      },
    },
    { sourceField: "master.salePriceCurrency", targetField: "salePriceCurrency" },
    {
      sourceField: "master.companyPrice",
      targetField: "companyPrice",
      transform: (value) => {
        // 批发价 = 公司价格 * 1.3 (默认30%加价)
        const basePrice = typeof value === "number" ? value : 0
        return Math.round(basePrice * 1.3 * 100) / 100
      },
    },
    { sourceField: "master.companyPriceCurrency", targetField: "companyPriceCurrency" },
    { sourceField: "master.unitProcessingFee", targetField: "unitProcessingFee" },
    { sourceField: "master.unitProcessingFeeCurrency", targetField: "unitProcessingFeeCurrency" },
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
    {
      sourceTableId: "supplier_quotations",
      targetTableId: "supplier_quotations",
      fieldMappings: [
        // 供应商信息
        { sourceField: "supplierId", targetField: "supplierId" },
        { sourceField: "supplierCode", targetField: "supplierCode" },
        { sourceField: "supplierName", targetField: "supplierName" },
        // 采购员信息
        { sourceField: "buyerId", targetField: "buyerId" },
        { sourceField: "buyerName", targetField: "buyerName" },
        { sourceField: "buyerDepartmentId", targetField: "buyerDepartmentId" },
        { sourceField: "buyerDepartmentName", targetField: "buyerDepartmentName" },
        // 报价信息
        { sourceField: "quotationDate", targetField: "quotationDate" },
        { sourceField: "currency", targetField: "currency" },
        { sourceField: "purchaseUnitPrice", targetField: "purchaseUnitPrice" },
        { sourceField: "includeTax", targetField: "includeTax" },
        { sourceField: "taxRate", targetField: "taxRate" },
        { sourceField: "taxIncludedUnitPrice", targetField: "taxIncludedUnitPrice" },
        { sourceField: "includePackaging", targetField: "includePackaging" },
        { sourceField: "packagingPrice", targetField: "packagingPrice" },
        { sourceField: "includeFreight", targetField: "includeFreight" },
        { sourceField: "freight", targetField: "freight" },
        { sourceField: "fullUnitPrice", targetField: "fullUnitPrice" },
        { sourceField: "moq", targetField: "moq" },
        { sourceField: "leadTime", targetField: "leadTime" },
        // 工厂与采购信息
        { sourceField: "factoryProductNo", targetField: "factoryProductNo" },
        { sourceField: "purchaseLink", targetField: "purchaseLink" },
        // 包装信息
        { sourceField: "packageMethod", targetField: "packageMethod" },
        { sourceField: "innerBoxQty", targetField: "innerBoxQty" },
        { sourceField: "outerBoxQty", targetField: "outerBoxQty" },
        { sourceField: "packageLength", targetField: "packageLength" },
        { sourceField: "packageWidth", targetField: "packageWidth" },
        { sourceField: "packageHeight", targetField: "packageHeight" },
        { sourceField: "outerBoxLength", targetField: "outerBoxLength" },
        { sourceField: "outerBoxWidth", targetField: "outerBoxWidth" },
        { sourceField: "outerBoxHeight", targetField: "outerBoxHeight" },
        { sourceField: "outerBoxVolume", targetField: "outerBoxVolume" },
        { sourceField: "outerBoxNetWeight", targetField: "outerBoxNetWeight" },
        { sourceField: "itemGrossWeight", targetField: "itemGrossWeight" },
        { sourceField: "outerBoxGrossWeight", targetField: "outerBoxGrossWeight" },
        // 柜量信息
        { sourceField: "bulkCargo", targetField: "bulkCargo" },
        { sourceField: "container20ftQty", targetField: "container20ftQty" },
        { sourceField: "container40ftQty", targetField: "container40ftQty" },
        { sourceField: "container40hqQty", targetField: "container40hqQty" },
        // 开票信息
        { sourceField: "invoiceProductName", targetField: "invoiceProductName" },
        // 状态
        { sourceField: "isDefault", targetField: "isDefault" },
        { sourceField: "isActive", targetField: "isActive" },
        // 备注与附件
        { sourceField: "remark", targetField: "remark" },
        { sourceField: "attachments", targetField: "attachments" },
        { sourceField: "images", targetField: "images" },
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
