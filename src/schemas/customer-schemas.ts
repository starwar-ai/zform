/**
 * Customer Management Schemas
 *
 * 客户管理单据定义（基于后端 Prisma Schema）
 * 客户类型: 潜在客户(POTENTIAL) → 正式客户(FORMAL) / 退休客户(RETIRED)
 */

import type { DocumentSchema, ChangeRule, ComboboxOption } from "@/core/types"
import type { CustomerCategoryTreeNode, TransportMethod } from "@/types/parameter"
import { CURRENCY_OPTIONS } from "@/lib/currency"

// ============================================================
// 客户分类下拉选项获取函数
// ============================================================

/** 获取客户分类下拉选项（树形结构扁平化） */
const fetchCustomerCategoryOptions = async (): Promise<ComboboxOption[]> => {
  const { fetchParameterListApi } = await import("@/apis/business-entity-api")
  const categories = await fetchParameterListApi<CustomerCategoryTreeNode>("customer")

  const flattenTree = (
    nodes: CustomerCategoryTreeNode[],
    depth = 0
  ): ComboboxOption[] => {
    const result: ComboboxOption[] = []
    for (const node of nodes) {
      const hasChildren = node.children && node.children.length > 0
      result.push({
        label: node.name,
        value: node.id,
        depth,
        isLeaf: !hasChildren,
      })
      if (hasChildren) {
        result.push(...flattenTree(node.children, depth + 1))
      }
    }
    return result
  }

  return flattenTree(categories)
}

// ============================================================
// 国内客户 (Domestic Customer)
// ============================================================

export const domesticCustomerSchema: DocumentSchema = {
  typeId: "domestic_customer",
  typeName: "国内客户",
  masterFields: [
    // === 基本信息 ===
    {
      id: "code",
      label: "客户编号",
      type: "text",
      readOnly: true,
      required: true,
      group: "基本信息",
    },
    {
      id: "name",
      label: "企业名称",
      type: "text",
      required: true,
      group: "基本信息",
    },
    {
      id: "shortName",
      label: "简称",
      type: "text",
      group: "基本信息",
    },
    {
      id: "website",
      label: "官网",
      type: "text",
      placeholder: "https://example.com",
      group: "基本信息",
    },
    {
      id: "email",
      label: "电子邮件",
      type: "text",
      placeholder: "contact@example.com",
      group: "基本信息",
    },

    // === 客户阶段与分类 ===
    {
      id: "stage",
      label: "客户阶段",
      type: "select",
      options: [
        { label: "潜在客户", value: "POTENTIAL" },
        { label: "正式客户", value: "FORMAL" },
        { label: "退休客户", value: "RETIRED" },
      ],
      defaultValue: "POTENTIAL",
      required: true,
      group: "客户分类",
    },
    {
      id: "customerCategoryId",
      label: "客户类型",
      type: "combobox",
      placeholder: "请选择客户类型",
      group: "客户分类",
      comboboxConfig: {
        isTree: true,
        fetchOptions: fetchCustomerCategoryOptions,
      },
    },
    {
      id: "isAgent",
      label: "是否代理",
      type: "checkbox",
      defaultValue: false,
      group: "客户分类",
    },
    {
      id: "isInternalEnterprise",
      label: "内部企业",
      type: "checkbox",
      defaultValue: false,
      group: "客户分类",
    },

    // === 业务信息 ===
    {
      id: "shippingMethod",
      label: "运输方式",
      type: "combobox",
      placeholder: "请选择运输方式",
      group: "业务信息",
      comboboxConfig: {
        fetchOptions: async () => {
          const { fetchParameterListApi } = await import("@/apis/business-entity-api");
          const methods = await fetchParameterListApi<TransportMethod>("transport-method");
          return methods
            .filter(method => method.isEnabled)
            .map(method => ({
              value: method.code,
              label: method.name
            }));
        },
        isTree: false
      }
    },
    {
      id: "currency",
      label: "币种",
      type: "select",
      options: [
        { label: "CNY", value: "CNY" },
      ],
      defaultValue: "CNY",
      group: "业务信息",
    },
    {
      id: "salesRep",
      label: "主业务员",
      type: "employeeSelector",
      placeholder: "选择业务员",
      group: "业务信息",
      employeeSelectorConfig: {
        mode: "multiple",
        columns: ["name", "username", "department"],
        statusFilter: "active"
      }
    },

    // === 地址与联系信息 ===
    {
      id: "businessAddress",
      label: "营业地址",
      type: "textarea",
      span: 2,
      placeholder: "详细营业地址",
      group: "地址信息",
    },
    {
      id: "mailingAddress",
      label: "寄件地址",
      type: "textarea",
      span: 2,
      placeholder: "邮寄地址",
      group: "地址信息",
    },
    {
      id: "phone",
      label: "联系电话",
      type: "text",
      placeholder: "010-12345678",
      group: "地址信息",
    },

    // === 财务信息 ===
    {
      id: "enableCreditLimit",
      label: "启用信用额度",
      type: "checkbox",
      defaultValue: false,
      group: "财务信息",
    },
    {
      id: "creditLimit",
      label: "信用额度",
      type: "number",
      placeholder: "0.00",
      group: "财务信息",
      visibleWhen: (data) => data.enableCreditLimit === true,
    },
    {
      id: "paymentType",
      label: "收款类型",
      type: "text",
      placeholder: "选择收款类型",
      group: "财务信息",
    },
    {
      id: "invoiceTitle",
      label: "开票抬头",
      type: "text",
      group: "财务信息",
    },
    {
      id: "taxRate",
      label: "税率 (%)",
      type: "number",
      defaultValue: 13,
      placeholder: "13.00",
      group: "财务信息",
    },

    // === 客户来源 ===
    {
      id: "customerSource",
      label: "客户来源",
      type: "combobox",
      placeholder: "请选择客户来源",
      group: "其他信息",
      comboboxConfig: {
        fetchOptions: async () => {
  const { fetchParameterListApi } = await import("@/apis/business-entity-api")
  const sources = await fetchParameterListApi("customer-source")
          return sources.map((source: any) => ({
            value: source.id,
            label: source.name
          }))
        },
        isTree: false
      }
    },
    {
      id: "relatedCustomerCode",
      label: "关联客户编号",
      type: "text",
      placeholder: "关联的其他客户编号",
      group: "其他信息",
    },

    // === 启用状态 ===
    {
      id: "isEnabled",
      label: "是否启用",
      type: "checkbox",
      defaultValue: true,
      group: "其他信息",
    },

    // === 备注 ===
    {
      id: "remark",
      label: "备注",
      type: "textarea",
      span: 4,
      placeholder: "其他备注信息...",
      group: "其他信息",
    },
  ],
  detailTables: [
    {
      id: "bank_accounts",
      label: "银行账户",
      editable: true,
      fields: [
        {
          id: "bankName",
          label: "开户行",
          type: "text",
          required: true,
        },
        {
          id: "bankAccount",
          label: "银行账户",
          type: "text",
        },
        {
          id: "accountNumber",
          label: "银行账号",
          type: "text",
          required: true,
        },
        {
          id: "branchAddress",
          label: "开户行地址",
          type: "text",
        },
        {
          id: "branchContact",
          label: "开户行联系人",
          type: "text",
        },
        {
          id: "isDefault",
          label: "默认账户",
          type: "checkbox",
        },
      ],
    },
    {
      id: "contacts",
      label: "联系人",
      editable: true,
      fields: [
        {
          id: "name",
          label: "联系人姓名",
          type: "text",
          required: true,
        },
        {
          id: "position",
          label: "职位",
          type: "text",
        },
        {
          id: "email",
          label: "电子邮件",
          type: "text",
        },
        {
          id: "mobile",
          label: "手机",
          type: "text",
        },
        {
          id: "phone",
          label: "座机",
          type: "text",
        },
        {
          id: "address",
          label: "住宅地址",
          type: "text",
        },
        {
          id: "wechat",
          label: "微信",
          type: "text",
        },
        {
          id: "qq",
          label: "QQ",
          type: "text",
        },
        {
          id: "isDefault",
          label: "默认联系人",
          type: "checkbox",
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
// 国外客户 (International Customer)
// ============================================================

export const internationalCustomerSchema: DocumentSchema = {
  typeId: "international_customer",
  typeName: "国外客户",
  masterFields: [
    // === 基本信息 ===
    {
      id: "code",
      label: "客户编号",
      type: "text",
      readOnly: true,
      required: true,
      group: "基本信息",
    },
    {
      id: "name",
      label: "企业名称",
      type: "text",
      required: true,
      group: "基本信息",
    },
    {
      id: "nameEn",
      label: "英文名称",
      type: "text",
      required: true,
      group: "基本信息",
    },
    {
      id: "shortName",
      label: "简称",
      type: "text",
      group: "基本信息",
    },
    {
      id: "countryId",
      label: "国家/地区",
      type: "combobox",
      placeholder: "请选择国家/地区",
      span: 2,
      required: true,
      group: "基本信息",
      comboboxConfig: {
        fetchOptions: async () => {
          const { fetchCountriesApi } = await import("@/apis/business-parameter-api")
          const countries = await fetchCountriesApi()
          return countries.map((country: any) => ({
            value: country.id,
            label: country.name
          }))
        },
        isTree: false
      }
    },
    {
      id: "countryCode",
      label: "国家编码",
      type: "text",
      placeholder: "例如: US, JP, DE",
      required: true,
      group: "基本信息",
    },
    {
      id: "website",
      label: "官网",
      type: "text",
      placeholder: "https://example.com",
      group: "基本信息",
    },
    {
      id: "email",
      label: "电子邮件",
      type: "text",
      placeholder: "contact@example.com",
      group: "基本信息",
    },

    // === 客户阶段与分类 ===
    {
      id: "stage",
      label: "客户阶段",
      type: "select",
      options: [
        { label: "潜在客户", value: "POTENTIAL" },
        { label: "正式客户", value: "FORMAL" },
        { label: "退休客户", value: "RETIRED" },
      ],
      defaultValue: "POTENTIAL",
      required: true,
      group: "客户分类",
    },
    {
      id: "customerCategoryId",
      label: "客户类型",
      type: "combobox",
      placeholder: "请选择客户类型",
      group: "客户分类",
      comboboxConfig: {
        isTree: true,
        fetchOptions: fetchCustomerCategoryOptions,
      },
    },
    {
      id: "isAgent",
      label: "是否代理",
      type: "checkbox",
      defaultValue: false,
      group: "客户分类",
    },

    // === 业务信息 ===
    {
      id: "shippingMethod",
      label: "运输方式",
      type: "combobox",
      placeholder: "请选择运输方式",
      group: "业务信息",
      comboboxConfig: {
        fetchOptions: async () => {
          const { fetchParameterListApi } = await import("@/apis/business-entity-api");
          const methods = await fetchParameterListApi<TransportMethod>("transport-method");
          return methods
            .filter(method => method.isEnabled)
            .map(method => ({
              value: method.code,
              label: method.name
            }));
        },
        isTree: false
      }
    },
    {
      id: "currency",
      label: "币种",
      type: "select",
      options: CURRENCY_OPTIONS,
      defaultValue: "USD",
      group: "业务信息",
    },
    {
      id: "salesRep",
      label: "主业务员",
      type: "employeeSelector",
      placeholder: "选择业务员",
      group: "业务信息",
      employeeSelectorConfig: {
        mode: "multiple",
        columns: ["name", "username", "department"],
        statusFilter: "active"
      }
    },

    // === 地址与联系信息 ===
    {
      id: "businessAddress",
      label: "营业地址",
      type: "textarea",
      span: 2,
      placeholder: "详细营业地址",
      group: "地址信息",
    },
    {
      id: "mailingAddress",
      label: "寄件地址",
      type: "textarea",
      span: 2,
      placeholder: "邮寄地址",
      group: "地址信息",
    },
    {
      id: "phone",
      label: "联系电话",
      type: "text",
      placeholder: "+1-212-555-0101",
      group: "地址信息",
    },

    // === 唛头信息 ===
    {
      id: "frontMark",
      label: "正面唛头",
      type: "textarea",
      span: 2,
      group: "唛头信息",
    },
    {
      id: "sideMark",
      label: "侧面唛头",
      type: "textarea",
      span: 2,
      group: "唛头信息",
    },

    // === 收货人/通知人 ===
    {
      id: "consignee",
      label: "收货人",
      type: "textarea",
      span: 2,
      group: "物流信息",
    },
    {
      id: "notifyParty",
      label: "通知人",
      type: "textarea",
      span: 2,
      group: "物流信息",
    },

    // === 财务信息 ===
    {
      id: "enableCreditLimit",
      label: "启用信用额度",
      type: "checkbox",
      defaultValue: false,
      group: "财务信息",
    },
    {
      id: "creditLimit",
      label: "信用额度",
      type: "number",
      placeholder: "0.00",
      group: "财务信息",
      visibleWhen: (data) => data.enableCreditLimit === true,
    },
    {
      id: "paymentType",
      label: "收款类型",
      type: "text",
      placeholder: "选择收款类型",
      group: "财务信息",
    },
    {
      id: "invoiceTitle",
      label: "开票抬头",
      type: "text",
      group: "财务信息",
    },
    {
      id: "taxRate",
      label: "税率 (%)",
      type: "number",
      placeholder: "0.00",
      group: "财务信息",
    },

    // === 客户来源 ===
    {
      id: "customerSource",
      label: "客户来源",
      type: "combobox",
      placeholder: "请选择客户来源",
      group: "其他信息",
      comboboxConfig: {
        fetchOptions: async () => {
  const { fetchParameterListApi } = await import("@/apis/business-entity-api")
  const sources = await fetchParameterListApi("customer-source")
          return sources.map((source: any) => ({
            value: source.id,
            label: source.name
          }))
        },
        isTree: false
      }
    },
    {
      id: "relatedCustomerCode",
      label: "关联客户编号",
      type: "text",
      placeholder: "关联的其他客户编号",
      group: "其他信息",
    },

    // === 启用状态 ===
    {
      id: "isEnabled",
      label: "是否启用",
      type: "checkbox",
      defaultValue: true,
      group: "其他信息",
    },

    // === 备注 ===
    {
      id: "remark",
      label: "备注",
      type: "textarea",
      span: 4,
      placeholder: "其他备注信息...",
      group: "其他信息",
    },
  ],
  detailTables: [
    {
      id: "bank_accounts",
      label: "银行账户",
      editable: true,
      fields: [
        {
          id: "bankName",
          label: "开户行",
          type: "text",
          required: true,
        },
        {
          id: "bankAccount",
          label: "银行账户",
          type: "text",
        },
        {
          id: "accountNumber",
          label: "银行账号",
          type: "text",
          required: true,
        },
        {
          id: "branchAddress",
          label: "开户行地址",
          type: "text",
        },
        {
          id: "branchContact",
          label: "开户行联系人",
          type: "text",
        },
        {
          id: "isDefault",
          label: "默认账户",
          type: "checkbox",
        },
      ],
    },
    {
      id: "contacts",
      label: "联系人",
      editable: true,
      fields: [
        {
          id: "name",
          label: "联系人姓名",
          type: "text",
          required: true,
        },
        {
          id: "position",
          label: "职位",
          type: "text",
        },
        {
          id: "email",
          label: "电子邮件",
          type: "text",
        },
        {
          id: "mobile",
          label: "手机",
          type: "text",
        },
        {
          id: "phone",
          label: "座机",
          type: "text",
        },
        {
          id: "address",
          label: "住宅地址",
          type: "text",
        },
        {
          id: "wechat",
          label: "微信",
          type: "text",
        },
        {
          id: "qq",
          label: "QQ",
          type: "text",
        },
        {
          id: "isDefault",
          label: "默认联系人",
          type: "checkbox",
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
// 通用客户 Schema (保留向后兼容)
// ============================================================

export const customerSchema: DocumentSchema = {
  typeId: "customer",
  typeName: "客户",
  masterFields: [
    // === 基本信息 ===
    {
      id: "code",
      label: "客户编号",
      type: "text",
      readOnly: true,
      required: true,
      group: "基本信息",
    },
    {
      id: "name",
      label: "企业名称",
      type: "text",
      required: true,
      group: "基本信息",
    },
    {
      id: "shortName",
      label: "简称",
      type: "text",
      group: "基本信息",
    },
    {
      id: "countryCode",
      label: "国家编码",
      type: "text",
      placeholder: "例如: CN, US, JP",
      group: "基本信息",
    },
    {
      id: "website",
      label: "官网",
      type: "text",
      placeholder: "https://example.com",
      group: "基本信息",
    },
    {
      id: "email",
      label: "电子邮件",
      type: "text",
      placeholder: "contact@example.com",
      group: "基本信息",
    },

    // === 客户阶段与分类 ===
    {
      id: "stage",
      label: "客户阶段",
      type: "select",
      options: [
        { label: "潜在客户", value: "POTENTIAL" },
        { label: "正式客户", value: "FORMAL" },
        { label: "退休客户", value: "RETIRED" },
      ],
      defaultValue: "POTENTIAL",
      required: true,
      group: "客户分类",
    },
    {
      id: "customerCategoryId",
      label: "客户类型",
      type: "combobox",
      placeholder: "请选择客户类型",
      group: "客户分类",
      comboboxConfig: {
        isTree: true,
        fetchOptions: fetchCustomerCategoryOptions,
      },
    },
    {
      id: "isAgent",
      label: "是否代理",
      type: "checkbox",
      defaultValue: false,
      group: "客户分类",
    },
    {
      id: "isForeign",
      label: "国外客户",
      type: "checkbox",
      defaultValue: false,
      group: "客户分类",
    },
    {
      id: "isInternalEnterprise",
      label: "内部企业",
      type: "checkbox",
      defaultValue: false,
      group: "客户分类",
    },

    // === 业务信息 ===
    {
      id: "shippingMethod",
      label: "运输方式",
      type: "combobox",
      placeholder: "请选择运输方式",
      group: "业务信息",
      comboboxConfig: {
        fetchOptions: async () => {
          const { fetchParameterListApi } = await import("@/apis/business-entity-api");
          const methods = await fetchParameterListApi<TransportMethod>("transport-method");
          return methods
            .filter(method => method.isEnabled)
            .map(method => ({
              value: method.code,
              label: method.name
            }));
        },
        isTree: false
      }
    },
    {
      id: "countryId",
      label: "国家/地区",
      type: "combobox",
      placeholder: "请选择国家/地区",
      span: 2,
      group: "其他信息",
      comboboxConfig: {
        fetchOptions: async () => {
          const { fetchCountriesApi } = await import("@/apis/business-parameter-api")
          const countries = await fetchCountriesApi()
          return countries.map((country: any) => ({
            value: country.id,
            label: country.name
          }))
        },
        isTree: false
      }
    },
    {
      id: "currency",
      label: "币种",
      type: "select",
      options: CURRENCY_OPTIONS,
      defaultValue: "CNY",
      group: "业务信息",
    },
    {
      id: "salesRep",
      label: "主业务员",
      type: "employeeSelector",
      placeholder: "选择业务员",
      group: "业务信息",
      employeeSelectorConfig: {
        mode: "multiple",
        columns: ["name", "username", "department"],
        statusFilter: "active"
      }
    },

    // === 地址与联系信息 ===
    {
      id: "businessAddress",
      label: "营业地址",
      type: "textarea",
      span: 2,
      placeholder: "详细营业地址",
      group: "地址信息",
    },
    {
      id: "mailingAddress",
      label: "寄件地址",
      type: "textarea",
      span: 2,
      placeholder: "邮寄地址",
      group: "地址信息",
    },
    {
      id: "phone",
      label: "联系电话",
      type: "text",
      placeholder: "010-12345678",
      group: "地址信息",
    },

    // === 唛头信息 ===
    {
      id: "frontMark",
      label: "正面唛头",
      type: "textarea",
      span: 2,
      group: "唛头信息",
    },
    {
      id: "sideMark",
      label: "侧面唛头",
      type: "textarea",
      span: 2,
      group: "唛头信息",
    },

    // === 收货人/通知人 ===
    {
      id: "consignee",
      label: "收货人",
      type: "textarea",
      span: 2,
      group: "物流信息",
    },
    {
      id: "notifyParty",
      label: "通知人",
      type: "textarea",
      span: 2,
      group: "物流信息",
    },

    // === 财务信息 ===
    {
      id: "enableCreditLimit",
      label: "启用信用额度",
      type: "checkbox",
      defaultValue: false,
      group: "财务信息",
    },
    {
      id: "creditLimit",
      label: "信用额度",
      type: "number",
      placeholder: "0.00",
      group: "财务信息",
      visibleWhen: (data) => data.enableCreditLimit === true,
    },
    {
      id: "paymentType",
      label: "收款类型",
      type: "text",
      placeholder: "选择收款类型",
      group: "财务信息",
    },
    {
      id: "invoiceTitle",
      label: "开票抬头",
      type: "text",
      group: "财务信息",
    },
    {
      id: "taxRate",
      label: "税率 (%)",
      type: "number",
      placeholder: "13.00",
      group: "财务信息",
    },

    // === 客户来源 ===
    {
      id: "customerSource",
      label: "客户来源",
      type: "combobox",
      placeholder: "请选择客户来源",
      group: "其他信息",
      comboboxConfig: {
        fetchOptions: async () => {
  const { fetchParameterListApi } = await import("@/apis/business-entity-api")
  const sources = await fetchParameterListApi("customer-source")
          return sources.map((source: any) => ({
            value: source.id,
            label: source.name
          }))
        },
        isTree: false
      }
    },
    {
      id: "relatedCustomerCode",
      label: "关联客户编号",
      type: "text",
      placeholder: "关联的其他客户编号",
      group: "其他信息",
    },

    // === 启用状态 ===
    {
      id: "isEnabled",
      label: "是否启用",
      type: "checkbox",
      defaultValue: true,
      group: "其他信息",
    },

    // === 备注 ===
    {
      id: "remark",
      label: "备注",
      type: "textarea",
      span: 4,
      placeholder: "其他备注信息...",
      group: "其他信息",
    },
  ],
  detailTables: [
    {
      id: "bank_accounts",
      label: "银行账户",
      editable: true,
      fields: [
        {
          id: "bankName",
          label: "开户行",
          type: "text",
          required: true,
        },
        {
          id: "bankAccount",
          label: "银行账户",
          type: "text",
        },
        {
          id: "accountNumber",
          label: "银行账号",
          type: "text",
          required: true,
        },
        {
          id: "branchAddress",
          label: "开户行地址",
          type: "text",
        },
        {
          id: "branchContact",
          label: "开户行联系人",
          type: "text",
        },
        {
          id: "isDefault",
          label: "默认账户",
          type: "checkbox",
        },
      ],
    },
    {
      id: "contacts",
      label: "联系人",
      editable: true,
      fields: [
        {
          id: "name",
          label: "联系人姓名",
          type: "text",
          required: true,
        },
        {
          id: "position",
          label: "职位",
          type: "text",
        },
        {
          id: "email",
          label: "电子邮件",
          type: "text",
        },
        {
          id: "mobile",
          label: "手机",
          type: "text",
        },
        {
          id: "phone",
          label: "座机",
          type: "text",
        },
        {
          id: "address",
          label: "住宅地址",
          type: "text",
        },
        {
          id: "wechat",
          label: "微信",
          type: "text",
        },
        {
          id: "qq",
          label: "QQ",
          type: "text",
        },
        {
          id: "isDefault",
          label: "默认联系人",
          type: "checkbox",
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
// 变更规则
// ============================================================

/** 客户变更规则 */
export const customerChangeRule: ChangeRule = {
  typeId: "customer",
  watchFields: [
    "master.name",
    "master.shortName",
    "master.stage",
    "master.isEnabled",
    "master.creditLimit",
    "master.taxRate",
  ],
  evaluate: (oldDoc, newDoc, downstreamDocs) => {
    const impacts = []

    // 客户名称变更
    if (oldDoc.masterData.name !== newDoc.masterData.name) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "warning" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "name",
          description: `客户名称已变更 (${oldDoc.masterData.name} → ${newDoc.masterData.name}), 下游单据需要同步更新。`,
        })
      }
    }

    // 客户阶段变更
    if (oldDoc.masterData.stage !== newDoc.masterData.stage) {
      const oldStage = oldDoc.masterData.stage as string
      const newStage = newDoc.masterData.stage as string
      const stageMap: Record<string, string> = {
        POTENTIAL: "潜在客户",
        FORMAL: "正式客户",
        RETIRED: "退休客户",
      }

      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "warning" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "stage",
          description: `客户阶段已变更 (${stageMap[oldStage]} → ${stageMap[newStage]}), 可能影响下游业务流程。`,
        })
      }
    }

    // 客户停用
    if (
      oldDoc.masterData.isEnabled === true &&
      newDoc.masterData.isEnabled === false
    ) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "critical" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "isEnabled",
          description: `客户已停用, 下游单据 ${downstream.docNumber} 可能无法继续执行, 请及时处理。`,
        })
      }
    }

    // 信用额度变更
    if (oldDoc.masterData.creditLimit !== newDoc.masterData.creditLimit) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "info" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "creditLimit",
          description: `客户信用额度已变更 (${oldDoc.masterData.creditLimit} → ${newDoc.masterData.creditLimit}), 建议重新评估下游订单风险。`,
        })
      }
    }

    // 税率变更
    if (oldDoc.masterData.taxRate !== newDoc.masterData.taxRate) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "warning" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "taxRate",
          description: `客户税率已变更 (${oldDoc.masterData.taxRate}% → ${newDoc.masterData.taxRate}%), 可能影响下游单据的开票和税额计算。`,
        })
      }
    }

    return impacts
  },
}
