/**
 * Sales Contract Schemas
 *
 * 销售合同单据定义（基于后端 Prisma Schema）
 */

import type { DocumentSchema, ChangeRule } from "@/core/types"

// ============================================================
// 销售合同 (Sales Contract)
// ============================================================

export const salesContractSchema: DocumentSchema = {
  typeId: "sales_contract",
  typeName: "销售合同",
  masterFields: [
    // === 基本信息 ===
    {
      id: "code",
      label: "合同编号",
      type: "text",
      readOnly: true,
      required: true,
      group: "基本信息",
    },
    {
      id: "internalCode",
      label: "内部编号",
      type: "text",
      readOnly: true,
      group: "基本信息",
    },
    {
      id: "customerPoNo",
      label: "客户PO号",
      type: "text",
      group: "基本信息",
    },
    {
      id: "contractType",
      label: "合同类型",
      type: "select",
      options: [
        { label: "标准合同", value: "STANDARD" },
        { label: "样品合同", value: "SAMPLE" },
        { label: "试单", value: "TRIAL" },
        { label: "返单", value: "REPEAT" },
      ],
      defaultValue: "STANDARD",
      required: true,
      group: "基本信息",
    },
    {
      id: "status",
      label: "合同状态",
      type: "select",
      options: [
        { label: "草稿", value: "DRAFT" },
        { label: "待审核", value: "PENDING" },
        { label: "已审核", value: "APPROVED" },
        { label: "执行中", value: "IN_PROGRESS" },
        { label: "已完成", value: "COMPLETED" },
        { label: "已取消", value: "CANCELLED" },
      ],
      defaultValue: "DRAFT",
      required: true,
      group: "基本信息",
    },
    {
      id: "approvalStatus",
      label: "审核状态",
      type: "select",
      options: [
        { label: "待审核", value: "PENDING" },
        { label: "已审核", value: "APPROVED" },
        { label: "已拒绝", value: "REJECTED" },
      ],
      defaultValue: "PENDING",
      required: true,
      group: "基本信息",
    },
    {
      id: "entryDate",
      label: "录入日期",
      type: "date",
      group: "基本信息",
    },

    // === 客户信息 ===
    {
      id: "customerId",
      label: "客户ID",
      type: "text",
      required: true,
      group: "客户信息",
    },
    {
      id: "customerCode",
      label: "客户编号",
      type: "text",
      required: true,
      group: "客户信息",
    },
    {
      id: "customerName",
      label: "客户名称",
      type: "text",
      group: "客户信息",
    },
    {
      id: "receivableCustomerCode",
      label: "应收客户编号",
      type: "text",
      group: "客户信息",
    },
    {
      id: "deliveryCustomerCode",
      label: "收货客户编号",
      type: "text",
      group: "客户信息",
    },
    {
      id: "deliveryAddress",
      label: "送货地址",
      type: "textarea",
      span: 4,
      group: "客户信息",
    },

    // === 内部客户信息 ===
    {
      id: "internalCustomerPk",
      label: "内部客户主键",
      type: "text",
      group: "内部客户",
    },
    {
      id: "internalCustomerCode",
      label: "内部客户编号",
      type: "text",
      group: "内部客户",
    },
    {
      id: "internalCustomerName",
      label: "内部客户名称",
      type: "text",
      group: "内部客户",
    },
    {
      id: "internalLegalEntity",
      label: "内部法人单位",
      type: "text",
      group: "内部客户",
    },

    // === 人员信息 ===
    {
      id: "salesPerson",
      label: "销售人员",
      type: "text",
      required: true,
      group: "人员信息",
    },
    {
      id: "merchandiser",
      label: "跟单员",
      type: "text",
      group: "人员信息",
    },
    {
      id: "buyer",
      label: "采购员",
      type: "text",
      group: "人员信息",
    },

    // === 金额与汇率 ===
    {
      id: "currency",
      label: "交易币别",
      type: "select",
      options: [
        { label: "USD", value: "USD" },
        { label: "CNY", value: "CNY" },
        { label: "EUR", value: "EUR" },
        { label: "GBP", value: "GBP" },
        { label: "JPY", value: "JPY" },
      ],
      defaultValue: "USD",
      required: true,
      group: "金额信息",
    },
    {
      id: "usdRate",
      label: "美元汇率",
      type: "number",
      placeholder: "0.000000",
      group: "金额信息",
    },
    {
      id: "creationRate",
      label: "创建时汇率",
      type: "number",
      placeholder: "0.000000",
      group: "金额信息",
    },
    {
      id: "totalAmount",
      label: "销售总金额",
      type: "computed",
      compute: (data) => {
        return data.totalAmount ?? 0
      },
      group: "金额信息",
    },
    {
      id: "totalAmountUsd",
      label: "销售总金额(USD)",
      type: "computed",
      compute: (data) => {
        return data.totalAmountUsd ?? 0
      },
      group: "金额信息",
    },
    {
      id: "originalCurrencyAmount",
      label: "原币种金额",
      type: "number",
      group: "金额信息",
    },

    // === 收款信息 ===
    {
      id: "paymentAccountId",
      label: "收款账号ID",
      type: "text",
      group: "收款信息",
    },
    {
      id: "paymentAccountCode",
      label: "收款账号",
      type: "text",
      group: "收款信息",
    },
    {
      id: "paymentMethodName",
      label: "收款方式",
      type: "text",
      group: "收款信息",
    },
    {
      id: "receivedAmount",
      label: "收款合计",
      type: "number",
      defaultValue: 0,
      readOnly: true,
      group: "收款信息",
    },
    {
      id: "receivableRemittance",
      label: "应收汇款",
      type: "number",
      group: "收款信息",
    },

    // === 客户国家与区域 ===
    {
      id: "customerCountryName",
      label: "客户国别",
      type: "text",
      group: "地区信息",
    },
    {
      id: "customerRegionName",
      label: "客户区域",
      type: "text",
      group: "地区信息",
    },
    {
      id: "tradeCountryName",
      label: "贸易国别",
      type: "text",
      group: "地区信息",
    },
    {
      id: "tradeCountryRegion",
      label: "贸易国别区域",
      type: "text",
      group: "地区信息",
    },

    // === 物流信息 ===
    {
      id: "priceTerms",
      label: "价格条款",
      type: "select",
      options: [
        { label: "FOB", value: "FOB" },
        { label: "CIF", value: "CIF" },
        { label: "CNF", value: "CNF" },
        { label: "EXW", value: "EXW" },
        { label: "DDU", value: "DDU" },
        { label: "DDP", value: "DDP" },
      ],
      group: "物流信息",
    },
    {
      id: "shippingCountryName",
      label: "出运国名称",
      type: "text",
      group: "物流信息",
    },
    {
      id: "shippingCountryRegion",
      label: "出运国区域",
      type: "text",
      group: "物流信息",
    },
    {
      id: "departurePortName",
      label: "出运口岸",
      type: "text",
      group: "物流信息",
    },
    {
      id: "destinationPortName",
      label: "目的口岸",
      type: "text",
      group: "物流信息",
    },
    {
      id: "transportMethod",
      label: "运输方式",
      type: "select",
      options: [
        { label: "海运", value: "SEA" },
        { label: "空运", value: "AIR" },
        { label: "陆运", value: "LAND" },
        { label: "快递", value: "EXPRESS" },
      ],
      group: "物流信息",
    },
    {
      id: "customerDeliveryDate",
      label: "客户交期",
      type: "date",
      required: true,
      group: "物流信息",
    },

    // === 柜型信息 ===
    {
      id: "container20ft",
      label: "20尺柜",
      type: "number",
      defaultValue: 0,
      group: "柜型信息",
    },
    {
      id: "container40ft",
      label: "40尺柜",
      type: "number",
      defaultValue: 0,
      group: "柜型信息",
    },
    {
      id: "container40hq",
      label: "40尺高柜",
      type: "number",
      defaultValue: 0,
      group: "柜型信息",
    },
    {
      id: "bulkCargo",
      label: "散货",
      type: "number",
      group: "柜型信息",
    },

    // === 费用信息 ===
    {
      id: "containerFee",
      label: "拖柜费",
      type: "number",
      defaultValue: 0,
      group: "费用信息",
    },
    {
      id: "estimatedFreight",
      label: "预估总运费",
      type: "number",
      defaultValue: 0,
      group: "费用信息",
    },
    {
      id: "commission",
      label: "佣金",
      type: "number",
      defaultValue: 0,
      group: "费用信息",
    },
    {
      id: "platformFee",
      label: "平台费",
      type: "number",
      defaultValue: 0,
      group: "费用信息",
    },
    {
      id: "insuranceFee",
      label: "保险费",
      type: "number",
      defaultValue: 0,
      group: "费用信息",
    },
    {
      id: "sinosureFee",
      label: "中信保费用",
      type: "number",
      defaultValue: 0,
      group: "费用信息",
    },
    {
      id: "lumpSumFee",
      label: "包干费",
      type: "number",
      defaultValue: 0,
      group: "费用信息",
    },
    {
      id: "additionalAmount",
      label: "加项金额",
      type: "number",
      defaultValue: 0,
      group: "费用信息",
    },
    {
      id: "deductionAmount",
      label: "减项金额",
      type: "number",
      defaultValue: 0,
      group: "费用信息",
    },
    {
      id: "inspectionFee",
      label: "验货费用",
      type: "number",
      defaultValue: 0,
      group: "费用信息",
    },

    // === 统计信息 ===
    {
      id: "totalBoxes",
      label: "箱数合计",
      type: "number",
      defaultValue: 0,
      readOnly: true,
      group: "统计信息",
    },
    {
      id: "totalGrossWeight",
      label: "毛重合计",
      type: "number",
      defaultValue: 0,
      readOnly: true,
      group: "统计信息",
    },
    {
      id: "totalNetWeight",
      label: "净重合计",
      type: "number",
      defaultValue: 0,
      readOnly: true,
      group: "统计信息",
    },
    {
      id: "totalVolume",
      label: "体积合计",
      type: "number",
      defaultValue: 0,
      readOnly: true,
      group: "统计信息",
    },
    {
      id: "totalValue",
      label: "货值合计",
      type: "number",
      defaultValue: 0,
      readOnly: true,
      group: "统计信息",
    },
    {
      id: "totalQuantity",
      label: "数量合计",
      type: "number",
      defaultValue: 0,
      readOnly: true,
      group: "统计信息",
    },

    // === 成本与利润 ===
    {
      id: "inventoryCostTotal",
      label: "库存成本合计",
      type: "number",
      defaultValue: 0,
      readOnly: true,
      group: "成本利润",
    },
    {
      id: "purchaseTotal",
      label: "采购总金额",
      type: "number",
      defaultValue: 0,
      readOnly: true,
      group: "成本利润",
    },
    {
      id: "accessoryPurchaseTotal",
      label: "配件采购合计",
      type: "number",
      defaultValue: 0,
      readOnly: true,
      group: "成本利润",
    },
    {
      id: "estimatedPackagingTotal",
      label: "预计包材合计",
      type: "number",
      defaultValue: 0,
      group: "成本利润",
    },
    {
      id: "taxRefundTotal",
      label: "退税合计",
      type: "number",
      defaultValue: 0,
      readOnly: true,
      group: "成本利润",
    },
    {
      id: "orderGrossProfit",
      label: "订单毛利",
      type: "number",
      defaultValue: 0,
      readOnly: true,
      group: "成本利润",
    },
    {
      id: "grossProfitMargin",
      label: "毛利率(%)",
      type: "number",
      readOnly: true,
      group: "成本利润",
    },

    // === 来源与关联 ===
    {
      id: "sourceContractCode",
      label: "来源合同编号",
      type: "text",
      readOnly: true,
      group: "来源追溯",
    },
    {
      id: "sourceContractId",
      label: "来源合同ID",
      type: "text",
      readOnly: true,
      group: "来源追溯",
    },
    {
      id: "sourceCode",
      label: "来源编号",
      type: "text",
      readOnly: true,
      group: "来源追溯",
    },
    {
      id: "orderLinkCode",
      label: "订单链路编号",
      type: "text",
      readOnly: true,
      group: "来源追溯",
    },
    {
      id: "orderPath",
      label: "订单路径",
      type: "text",
      readOnly: true,
      group: "来源追溯",
    },

    // === 确认与打印 ===
    {
      id: "confirmStatus",
      label: "确认状态",
      type: "select",
      options: [
        { label: "未确认", value: "NOT_CONFIRMED" },
        { label: "已确认", value: "CONFIRMED" },
        { label: "已拒绝", value: "REJECTED" },
      ],
      defaultValue: "NOT_CONFIRMED",
      group: "确认打印",
    },
    {
      id: "printStatus",
      label: "打印状态",
      type: "select",
      options: [
        { label: "未打印", value: "NOT_PRINTED" },
        { label: "已打印", value: "PRINTED" },
      ],
      defaultValue: "NOT_PRINTED",
      readOnly: true,
      group: "确认打印",
    },
    {
      id: "printCount",
      label: "打印次数",
      type: "number",
      defaultValue: 0,
      readOnly: true,
      group: "确认打印",
    },

    // === 回签信息 ===
    {
      id: "signBackStatus",
      label: "回签状态",
      type: "select",
      options: [
        { label: "未回签", value: "NOT_SIGNED" },
        { label: "已回签", value: "SIGNED" },
        { label: "部分回签", value: "PARTIAL" },
      ],
      defaultValue: "NOT_SIGNED",
      group: "回签信息",
    },
    {
      id: "signBackDate",
      label: "回签日期",
      type: "date",
      group: "回签信息",
    },
    {
      id: "signBackPerson",
      label: "回签人",
      type: "text",
      group: "回签信息",
    },
    {
      id: "signBackDescription",
      label: "回签描述",
      type: "textarea",
      span: 4,
      group: "回签信息",
    },

    // === 标识字段 ===
    {
      id: "isAgent",
      label: "是否代理",
      type: "checkbox",
      defaultValue: false,
      group: "标识字段",
    },
    {
      id: "isBookingSpace",
      label: "是否订舱",
      type: "checkbox",
      defaultValue: false,
      group: "标识字段",
    },
    {
      id: "autoCreated",
      label: "自动生成",
      type: "checkbox",
      defaultValue: false,
      readOnly: true,
      group: "标识字段",
    },

    // === 转下游标记 ===
    {
      id: "toPurchasePlan",
      label: "已转采购计划",
      type: "checkbox",
      defaultValue: false,
      readOnly: true,
      group: "下游标记",
    },
    {
      id: "toPurchasePlanTime",
      label: "转采购计划时间",
      type: "date",
      readOnly: true,
      group: "下游标记",
    },

    // === 备注与附件 ===
    {
      id: "remark",
      label: "备注",
      type: "textarea",
      span: 4,
      group: "备注附件",
    },
    {
      id: "designDraft",
      label: "设计稿",
      type: "text",
      placeholder: "设计稿URL",
      group: "备注附件",
    },
  ],
  detailTables: [
    {
      id: "items",
      label: "产品明细",
      editable: true,
      fields: [
        {
          id: "lineNumber",
          label: "行号",
          type: "number",
          readOnly: true,
        },
        {
          id: "productId",
          label: "产品ID",
          type: "text",
        },
        {
          id: "productCode",
          label: "产品编码",
          type: "text",
        },
        {
          id: "productName",
          label: "产品名称",
          type: "text",
          required: true,
        },
        {
          id: "productSpec",
          label: "产品规格",
          type: "text",
        },
        {
          id: "customerProductNo",
          label: "客户产品编号",
          type: "text",
        },
        {
          id: "quantity",
          label: "数量",
          type: "number",
          required: true,
        },
        {
          id: "unit",
          label: "单位",
          type: "select",
          options: [
            { label: "PCS", value: "PCS" },
            { label: "SET", value: "SET" },
            { label: "UNIT", value: "UNIT" },
            { label: "TON", value: "TON" },
            { label: "KG", value: "KG" },
          ],
          defaultValue: "PCS",
        },
        {
          id: "unitPrice",
          label: "单价",
          type: "number",
          required: true,
        },
        {
          id: "currency",
          label: "币种",
          type: "select",
          options: [
            { label: "USD", value: "USD" },
            { label: "CNY", value: "CNY" },
            { label: "EUR", value: "EUR" },
          ],
          defaultValue: "USD",
        },
        {
          id: "amount",
          label: "金额",
          type: "computed",
          compute: (row) => {
            const qty = (row.quantity as number) ?? 0
            const price = (row.unitPrice as number) ?? 0
            return qty * price
          },
        },
        {
          id: "boxes",
          label: "箱数",
          type: "number",
          defaultValue: 0,
        },
        {
          id: "grossWeight",
          label: "毛重",
          type: "number",
        },
        {
          id: "netWeight",
          label: "净重",
          type: "number",
        },
        {
          id: "volume",
          label: "体积",
          type: "number",
        },
        {
          id: "packageMethod",
          label: "包装方式",
          type: "text",
        },
        {
          id: "purchasePrice",
          label: "采购价",
          type: "number",
        },
        {
          id: "costPrice",
          label: "成本价",
          type: "number",
        },
        {
          id: "taxRefund",
          label: "退税",
          type: "number",
        },
        {
          id: "deliveryDate",
          label: "交期",
          type: "date",
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

/** 销售合同变更规则 */
export const salesContractChangeRule: ChangeRule = {
  typeId: "sales_contract",
  watchFields: [
    "master.customerDeliveryDate",
    "master.status",
    "master.totalAmount",
  ],
  evaluate: (oldDoc, newDoc, downstreamDocs) => {
    const impacts = []

    // 客户交期变更
    if (
      oldDoc.masterData.customerDeliveryDate !==
      newDoc.masterData.customerDeliveryDate
    ) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "warning" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "expectedDeliveryDate",
          description: `销售合同客户交期变更 (${oldDoc.masterData.customerDeliveryDate} → ${newDoc.masterData.customerDeliveryDate}), 需要同步更新下游单据的交期。`,
        })
      }
    }

    // 销售合同取消
    if (
      oldDoc.masterData.status !== "CANCELLED" &&
      newDoc.masterData.status === "CANCELLED"
    ) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "critical" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "status",
          description: `销售合同已取消, 下游单据 ${downstream.docNumber} 建议同步取消。`,
        })
      }
    }

    // 总金额变更
    if (oldDoc.masterData.totalAmount !== newDoc.masterData.totalAmount) {
      for (const downstream of downstreamDocs) {
        impacts.push({
          level: "info" as const,
          affectedDocId: downstream.id,
          affectedTypeId: downstream.typeId,
          affectedDocNumber: downstream.docNumber,
          affectedField: "totalAmount",
          description: `销售合同总金额变更 (${oldDoc.masterData.totalAmount} → ${newDoc.masterData.totalAmount}), 请核对下游单据。`,
        })
      }
    }

    return impacts
  },
}
