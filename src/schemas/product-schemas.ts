/**
 * Product Management Schemas
 *
 * 产品管理单据定义（基于后端 Prisma Schema）
 * 产品类型: 标准产品(STANDARD) → 客户产品(CUSTOMER) / 自营产品(SELF_OWNED)
 */

import type { DocumentSchema, PushDownRule, ChangeRule, ComboboxOption } from "@/core/types"
import type { HsCode, ProductCategoryTreeNode } from "@/types/category"
import type { DepartmentTreeNode } from "@/types/department"
import { fetchCategoryListApi } from "@/lib/category-api"
import { fetchBrandsApi } from "@/lib/business-config-api"
import { fetchDepartmentTreeApi } from "@/lib/department-api"

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

/** 获取产品分类选项（供 Combobox 使用） */
async function fetchProductCategoryOptions(): Promise<ComboboxOption[]> {
  const tree = await fetchCategoryListApi<ProductCategoryTreeNode>("product")
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
// 标准产品 (Standard Product)
// ProductType.STANDARD
// ============================================================

export const standardProductSchema: DocumentSchema = {
  typeId: "standard_product",
  typeName: "标准产品",
  masterFields: [
    // === 基本信息 ===
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
      group: "基本信息",
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

    // === 分类与品牌 ===
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
    },

    // === 规格尺寸 ===
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
    },
    {
      id: "netWeight",
      label: "净重 (kg)",
      type: "number",
      placeholder: "0.000",
      group: "规格尺寸",
    },

    // === 材料信息 ===
    {
      id: "source",
      label: "来源",
      type: "select",
      options: [
        { label: "公司开发", value: "COMPANY_DEV" },
        { label: "采购开发", value: "PURCHASE_DEV" },
        { label: "部门开发", value: "DEPARTMENT_DEV" },
      ],
      group: "材料信息",
    },
    {
      id: "material",
      label: "材质",
      type: "text",
      group: "材料信息",
    },
    {
      id: "accessoryMaterial",
      label: "配件材质",
      type: "text",
      group: "材料信息",
    },

    // === 价格与加工 ===
    {
      id: "unitProcessingFee",
      label: "单件加工费",
      type: "number",
      placeholder: "0.00",
      group: "价格信息",
    },
    {
      id: "salePrice",
      label: "销售价格",
      type: "number",
      placeholder: "0.00",
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
      id: "processingNote",
      label: "加工说明",
      type: "textarea",
      span: 4,
      group: "价格信息",
    },

    // === 报关信息 ===
    {
      id: "hsCodeId",
      label: "海关编码",
      type: "combobox",
      placeholder: "选择海关编码",
      group: "报关信息",
      comboboxConfig: {
        fetchOptions: fetchHsCodeOptions,
      },
    },
    {
      id: "isCustomsInspection",
      label: "是否报关商检",
      type: "checkbox",
      defaultValue: false,
      group: "报关信息",
    },
    {
      id: "customsNameCn",
      label: "报关中文名",
      type: "text",
      group: "报关信息",
    },
    {
      id: "customsNameEn",
      label: "报关英文名",
      type: "text",
      group: "报关信息",
    },

    // === 包装信息 ===
    {
      id: "packageMethodId",
      label: "包装方式",
      type: "text",
      placeholder: "选择包装方式",
      group: "包装信息",
    },

    // === 标识字段 ===
    {
      id: "isSelfBrand",
      label: "是否自有品牌",
      type: "checkbox",
      defaultValue: false,
      group: "其他信息",
    },
    {
      id: "isAdvantage",
      label: "是否优势产品",
      type: "checkbox",
      defaultValue: false,
      group: "其他信息",
    },
    {
      id: "isAgent",
      label: "是否代理",
      type: "checkbox",
      defaultValue: false,
      group: "其他信息",
    },
    {
      id: "isCommonAccessory",
      label: "是否通用辅料",
      type: "checkbox",
      defaultValue: false,
      group: "其他信息",
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
      label: "BOM 清单",
      editable: true,
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
        {
          id: "productType",
          label: "产品类型",
          type: "text",
        },
      ],
    },
    {
      id: "accessories",
      label: "辅料清单",
      editable: true,
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
        {
          id: "remark",
          label: "备注",
          type: "text",
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
      group: "基本信息",
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

    // === 规格尺寸（可调整）===
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
    },
    {
      id: "netWeight",
      label: "净重 (kg)",
      type: "number",
      placeholder: "0.000",
      group: "规格尺寸",
    },

    // === 报关信息 ===
    {
      id: "customsNameCn",
      label: "报关中文名",
      type: "text",
      group: "报关信息",
    },
    {
      id: "customsNameEn",
      label: "报关英文名",
      type: "text",
      group: "报关信息",
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
      group: "基本信息",
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

    // === 规格尺寸 ===
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
    },
    {
      id: "netWeight",
      label: "净重 (kg)",
      type: "number",
      placeholder: "0.000",
      group: "规格尺寸",
    },

    // === 包装信息 ===
    {
      id: "packageMethodId",
      label: "包装方式",
      type: "text",
      placeholder: "选择包装方式",
      group: "包装信息",
    },

    // === 报关信息 ===
    {
      id: "customsNameCn",
      label: "报关中文名",
      type: "text",
      group: "报关信息",
    },
    {
      id: "customsNameEn",
      label: "报关英文名",
      type: "text",
      group: "报关信息",
    },
    {
      id: "hsCodeId",
      label: "海关编码",
      type: "text",
      placeholder: "选择海关编码",
      group: "报关信息",
    },

    // === 优势标识 ===
    {
      id: "isAdvantage",
      label: "优势产品",
      type: "checkbox",
      defaultValue: false,
      group: "其他信息",
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
