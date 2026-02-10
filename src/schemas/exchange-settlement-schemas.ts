/**
 * Exchange Settlement Schemas
 *
 * 结汇单单据定义（基于后端 Prisma Schema）
 */

import type { DocumentSchema, ChangeRule } from "@/core/types"

// ============================================================
// 结汇单 (Exchange Settlement)
// ============================================================

export const exchangeSettlementSchema: DocumentSchema = {
  typeId: "exchange_settlement",
  typeName: "结汇单",
  masterFields: [
    // === 基本信息 ===
    {
      id: "code",
      label: "编号",
      type: "text",
      readOnly: true,
      required: true,
      group: "基本信息",
    },
    {
      id: "status",
      label: "状态",
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
      readOnly: true,
      group: "基本信息",
    },
    {
      id: "planCode",
      label: "计划编号",
      type: "text",
      readOnly: true,
      group: "基本信息",
    },
    {
      id: "invoiceNo",
      label: "发票号",
      type: "text",
      group: "基本信息",
    },
    {
      id: "invoiceDate",
      label: "发票日期",
      type: "date",
      group: "基本信息",
    },
    {
      id: "entryDate",
      label: "制单日期",
      type: "date",
      group: "基本信息",
    },
    {
      id: "shippingDate",
      label: "出运日期",
      type: "date",
      group: "基本信息",
    },
    {
      id: "orderLinkCode",
      label: "订单链路编号",
      type: "text",
      readOnly: true,
      group: "基本信息",
    },
    {
      id: "sourceCode",
      label: "来源编号",
      type: "text",
      readOnly: true,
      group: "基本信息",
    },
    {
      id: "invoicePackingList",
      label: "发票箱单",
      type: "text",
      group: "基本信息",
    },

    // === 唛头与收货 ===
    {
      id: "frontMark",
      label: "正面唛头",
      type: "textarea",
      span: 2,
      group: "唛头与收货",
    },
    {
      id: "sideMark",
      label: "侧面唛头",
      type: "textarea",
      span: 2,
      group: "唛头与收货",
    },
    {
      id: "consignee",
      label: "收货人",
      type: "textarea",
      span: 2,
      group: "唛头与收货",
    },
    {
      id: "notifyParty",
      label: "通知人",
      type: "textarea",
      span: 2,
      group: "唛头与收货",
    },

    // === 人员信息 ===
    {
      id: "salesPerson",
      label: "业务员",
      type: "text",
      group: "人员信息",
    },
    {
      id: "buyer",
      label: "采购员",
      type: "text",
      group: "人员信息",
    },
    {
      id: "entryPerson",
      label: "录入人",
      type: "text",
      readOnly: true,
      group: "人员信息",
    },

    // === 价格与运输 ===
    {
      id: "priceTerms",
      label: "价格条款",
      type: "select",
      options: [
        { label: "FOB", value: "FOB" },
        { label: "CIF", value: "CIF" },
        { label: "CNF", value: "CNF" },
        { label: "CFR", value: "CFR" },
        { label: "EXW", value: "EXW" },
        { label: "DDP", value: "DDP" },
        { label: "DDU", value: "DDU" },
      ],
      group: "价格与运输",
    },
    {
      id: "transportMethod",
      label: "运输方式",
      type: "select",
      options: [
        { label: "海运", value: "SEA" },
        { label: "陆运", value: "LAND" },
        { label: "空运", value: "AIR" },
        { label: "供应商送货", value: "SUPPLIER" },
      ],
      group: "价格与运输",
    },
    {
      id: "tradeMethod",
      label: "贸易方式",
      type: "text",
      group: "价格与运输",
    },
    {
      id: "currency",
      label: "外销币种",
      type: "select",
      options: [
        { label: "USD", value: "USD" },
        { label: "CNY", value: "CNY" },
        { label: "EUR", value: "EUR" },
      ],
      defaultValue: "USD",
      group: "价格与运输",
    },

    // === 结汇方式 ===
    {
      id: "settlementMethodId",
      label: "结汇方式主键",
      type: "text",
      group: "结汇方式",
    },
    {
      id: "settlementMethodName",
      label: "结汇名称",
      type: "text",
      group: "结汇方式",
    },

    // === 出运国与口岸 ===
    {
      id: "shippingCountryId",
      label: "出运国主键",
      type: "text",
      group: "出运国与口岸",
    },
    {
      id: "shippingCountryName",
      label: "出运国名称",
      type: "text",
      group: "出运国与口岸",
    },
    {
      id: "shippingCountryRegion",
      label: "出运国区域",
      type: "text",
      readOnly: true,
      group: "出运国与口岸",
    },
    {
      id: "departurePortId",
      label: "出运口岸主键",
      type: "text",
      group: "出运国与口岸",
    },
    {
      id: "departurePortName",
      label: "出运口岸名称",
      type: "text",
      group: "出运国与口岸",
    },
    {
      id: "tradeCountryId",
      label: "贸易国别主键",
      type: "text",
      group: "出运国与口岸",
    },
    {
      id: "tradeCountryName",
      label: "贸易国别名称",
      type: "text",
      group: "出运国与口岸",
    },
    {
      id: "tradeCountryRegion",
      label: "贸易国别区域",
      type: "text",
      readOnly: true,
      group: "出运国与口岸",
    },
    {
      id: "destinationPortId",
      label: "目的口岸主键",
      type: "text",
      group: "出运国与口岸",
    },
    {
      id: "destinationPortName",
      label: "目的口岸名称",
      type: "text",
      group: "出运国与口岸",
    },

    // === 外贸公司 ===
    {
      id: "tradingCompanyId",
      label: "外贸公司主体主键",
      type: "text",
      group: "外贸公司",
    },
    {
      id: "tradingCompanyName",
      label: "外贸公司主体名称",
      type: "text",
      group: "外贸公司",
    },

    // === 船运信息 ===
    {
      id: "shippingAgentId",
      label: "船代公司主键",
      type: "text",
      group: "船运信息",
    },
    {
      id: "shippingAgentName",
      label: "船代公司名称",
      type: "text",
      group: "船运信息",
    },
    {
      id: "expectedPortArrivalDate",
      label: "预计结港日期",
      type: "date",
      group: "船运信息",
    },
    {
      id: "shippingOrderNo",
      label: "出运单号",
      type: "text",
      group: "船运信息",
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
      defaultValue: 0,
      group: "柜型信息",
    },
    {
      id: "containerCount",
      label: "集装箱数量",
      type: "number",
      defaultValue: 0,
      group: "柜型信息",
    },

    // === 汇总统计 ===
    {
      id: "totalQuantity",
      label: "数量合计",
      type: "number",
      readOnly: true,
      defaultValue: 0,
      group: "汇总统计",
    },
    {
      id: "totalBoxes",
      label: "箱数合计",
      type: "number",
      readOnly: true,
      defaultValue: 0,
      group: "汇总统计",
    },
    {
      id: "totalGrossWeight",
      label: "毛重合计",
      type: "number",
      readOnly: true,
      defaultValue: 0,
      group: "汇总统计",
    },
    {
      id: "totalNetWeight",
      label: "净重合计",
      type: "number",
      readOnly: true,
      defaultValue: 0,
      group: "汇总统计",
    },
    {
      id: "totalVolume",
      label: "体积合计",
      type: "number",
      readOnly: true,
      defaultValue: 0,
      group: "汇总统计",
    },

    // === 金额统计 ===
    {
      id: "totalAmount",
      label: "金额合计",
      type: "number",
      readOnly: true,
      defaultValue: 0,
      group: "金额统计",
    },
    {
      id: "totalValue",
      label: "货值合计",
      type: "number",
      readOnly: true,
      defaultValue: 0,
      group: "金额统计",
    },
    {
      id: "receivedValue",
      label: "已收货值",
      type: "number",
      readOnly: true,
      defaultValue: 0,
      group: "金额统计",
    },
    {
      id: "unreceivedValue",
      label: "未收货值",
      type: "number",
      readOnly: true,
      defaultValue: 0,
      group: "金额统计",
    },

    // === 备注 ===
    {
      id: "remark",
      label: "备注",
      type: "textarea",
      span: 4,
      group: "备注",
    },
  ],
  detailTables: [
    {
      id: "items",
      label: "结汇单明细",
      editable: true,
      fields: [
        // === 产品基本信息 ===
        { id: "barcode", label: "条形码", type: "text" },
        { id: "skuCode", label: "SKU编号", type: "text" },
        { id: "customerProductNo", label: "客户货号", type: "text" },
        { id: "productNameCn", label: "中文名称", type: "text" },
        { id: "productNameEn", label: "英文名称", type: "text" },
        { id: "baseProductCode", label: "基础产品编号", type: "text" },
        { id: "specification", label: "规格", type: "text" },

        // === 数量信息 ===
        { id: "shippingQuantity", label: "出运数量", type: "number", required: true },
        { id: "exchangeQuantity", label: "结汇数量", type: "number" },
        { id: "purchaseQuantity", label: "总采购数量", type: "number" },
        { id: "customsQuantity", label: "报关数量", type: "number" },
        { id: "reportedCustomsQty", label: "已报关数", type: "number", readOnly: true },
        { id: "unit", label: "计量单位", type: "text" },
        { id: "customsUnit", label: "海关计量单位", type: "text" },

        // === 供应商信息 ===
        { id: "supplierId", label: "供应商id", type: "text" },
        { id: "supplierCode", label: "供应商编号", type: "text" },
        { id: "supplierName", label: "供应商名称", type: "text" },

        // === 客户信息 ===
        { id: "customerId", label: "客户主键", type: "text" },
        { id: "customerCode", label: "客户编号", type: "text" },
        { id: "customerName", label: "客户名称", type: "text" },
        { id: "customerContractNo", label: "客户合同号", type: "text" },

        // === 销售信息 ===
        { id: "salesPerson", label: "业务员", type: "text" },
        { id: "saleUnitPrice", label: "销售单价", type: "number" },
        {
          id: "saleAmount",
          label: "销售金额",
          type: "computed",
          compute: (row) => {
            const qty = Number(row.shippingQuantity) || 0
            const price = Number(row.saleUnitPrice) || 0
            return (qty * price).toFixed(2)
          },
        },
        {
          id: "currency",
          label: "交易币别",
          type: "select",
          options: [
            { label: "USD", value: "USD" },
            { label: "CNY", value: "CNY" },
            { label: "EUR", value: "EUR" },
          ],
          defaultValue: "USD",
        },
        { id: "salesContractCode", label: "外销合同号", type: "text" },
        { id: "deliveryDate", label: "交货日期", type: "date" },

        // === 采购信息 ===
        { id: "purchaseContractCode", label: "采购合同编号", type: "text" },
        { id: "buyerId", label: "采购员id", type: "text" },
        { id: "buyerName", label: "采购员姓名", type: "text" },
        { id: "buyerDeptId", label: "采购员部门id", type: "text" },
        { id: "buyerDeptName", label: "采购员部门名称", type: "text" },
        {
          id: "purchaseCurrency",
          label: "采购币种",
          type: "select",
          options: [
            { label: "CNY", value: "CNY" },
            { label: "USD", value: "USD" },
            { label: "EUR", value: "EUR" },
          ],
          defaultValue: "CNY",
        },
        { id: "purchaseUnitPrice", label: "采购单价", type: "number" },
        { id: "purchaseTaxPrice", label: "采购含税价", type: "number" },

        // === 报关信息 ===
        { id: "customsUnitPrice", label: "报关单价", type: "number" },
        {
          id: "customsAmount",
          label: "报关金额",
          type: "computed",
          compute: (row) => {
            const qty = Number(row.customsQuantity) || 0
            const price = Number(row.customsUnitPrice) || 0
            return (qty * price).toFixed(2)
          },
        },
        { id: "customsNameCn", label: "报关中文品名", type: "text" },
        { id: "customsNameEn", label: "报关英文品名", type: "text" },
        { id: "hsCode", label: "海关编码", type: "text" },
        { id: "inspectionType", label: "商检类型", type: "text" },
        { id: "isInspectionRequired", label: "是否商检", type: "checkbox", defaultValue: false },
        { id: "taxRefundRate", label: "退税率", type: "number" },
        {
          id: "taxRefundAmount",
          label: "退税金额",
          type: "computed",
          compute: (row) => {
            const amount = Number(row.saleAmount) || 0
            const rate = Number(row.taxRefundRate) || 0
            return ((amount * rate) / 100).toFixed(2)
          },
        },

        // === 收款方式 ===
        { id: "paymentMethodId", label: "收款方式主键", type: "text" },
        { id: "paymentMethodName", label: "收款方式名称", type: "text" },
        { id: "priceTerms", label: "价格条款", type: "text" },

        // === 包装信息 ===
        { id: "packageMethod", label: "包装方式", type: "text" },
        { id: "outerBoxQuantity", label: "外箱装量", type: "number" },
        { id: "innerBoxQuantity", label: "内盒装量", type: "number" },
        { id: "boxCount", label: "箱数", type: "number" },
        { id: "outerBoxUnit", label: "外箱单位", type: "text" },
        { id: "outerBoxLength", label: "外箱长度", type: "number" },
        { id: "outerBoxWidth", label: "外箱宽度", type: "number" },
        { id: "outerBoxHeight", label: "外箱高度", type: "number" },
        {
          id: "outerBoxVolume",
          label: "外箱体积",
          type: "computed",
          compute: (row) => {
            const l = Number(row.outerBoxLength) || 0
            const w = Number(row.outerBoxWidth) || 0
            const h = Number(row.outerBoxHeight) || 0
            return ((l * w * h) / 1000000).toFixed(4)
          },
        },
        {
          id: "totalVolume",
          label: "总体积",
          type: "computed",
          compute: (row) => {
            const vol = Number(row.outerBoxVolume) || 0
            const boxes = Number(row.boxCount) || 0
            return (vol * boxes).toFixed(4)
          },
        },
        { id: "outerBoxNetWeight", label: "外箱净重", type: "number" },
        {
          id: "totalNetWeight",
          label: "总净重",
          type: "computed",
          compute: (row) => {
            const nw = Number(row.outerBoxNetWeight) || 0
            const boxes = Number(row.boxCount) || 0
            return (nw * boxes).toFixed(3)
          },
        },
        { id: "outerBoxGrossWeight", label: "外箱毛重", type: "number" },
        {
          id: "totalGrossWeight",
          label: "总毛重",
          type: "computed",
          compute: (row) => {
            const gw = Number(row.outerBoxGrossWeight) || 0
            const boxes = Number(row.boxCount) || 0
            return (gw * boxes).toFixed(3)
          },
        },

        // === 费用信息 ===
        { id: "insuranceFee", label: "保险费", type: "number" },
        { id: "commissionAmount", label: "佣金金额", type: "number" },
        { id: "grossProfitMargin", label: "毛利率", type: "number", readOnly: true },

        // === 货值信息 ===
        { id: "receivedValue", label: "已收货值", type: "number", readOnly: true },
        { id: "unreceivedValue", label: "未收货值", type: "number", readOnly: true },

        // === 出仓信息 ===
        { id: "isWarehouseOut", label: "是否出仓", type: "checkbox", defaultValue: false, readOnly: true },
        { id: "warehouseOutDate", label: "出仓日期", type: "date", readOnly: true },
        { id: "customsReportUnit", label: "报关单位", type: "text" },

        // === 拉柜信息 ===
        { id: "expectedContainerDate", label: "预计拉柜时间", type: "date" },

        // === 仓库信息 ===
        { id: "warehouseCode", label: "仓库编号", type: "text" },
        { id: "warehouseName", label: "仓库名称", type: "text" },

        // === 产品描述 ===
        { id: "productDescription", label: "产品描述", type: "text" },
        { id: "productDescriptionEn", label: "产品英文描述", type: "text" },

        // === 其他标识 ===
        { id: "isIncludeGift", label: "是否包含赠品", type: "checkbox", defaultValue: false },
        { id: "isSeparateBox", label: "是否分箱", type: "checkbox", defaultValue: false },

        // === 报关要素 ===
        { id: "customsElements", label: "报关要素", type: "text" },
        { id: "shippingLocation", label: "发货地点", type: "text" },

        // === 出运明细关联 ===
        { id: "shippingDetailId", label: "出运明细id", type: "text" },

        // === 转单信息 ===
        { id: "isConvertedToInspection", label: "是否转商检单", type: "checkbox", defaultValue: false, readOnly: true },
        { id: "convertedToInspectionDate", label: "转商检单时间", type: "date", readOnly: true },
        { id: "convertedToInspectionBy", label: "转商检单人", type: "text", readOnly: true },
        { id: "isConvertedToCustoms", label: "是否转报关单", type: "checkbox", defaultValue: false, readOnly: true },
        { id: "convertedToCustomsDate", label: "转报关单时间", type: "date", readOnly: true },
        { id: "convertedToCustomsBy", label: "转报关单人", type: "text", readOnly: true },

        // === 备注 ===
        { id: "remark", label: "备注", type: "text" },
      ],
    },
  ],
}

// ============================================================
// 结汇单变更规则
// ============================================================

export const exchangeSettlementChangeRule: ChangeRule = {
  typeId: "exchange_settlement",
  watchFields: [
    "master.shippingDate",
    "master.expectedPortArrivalDate",
    "master.priceTerms",
    "detail.items.shippingQuantity",
    "detail.items.exchangeQuantity",
  ],
  evaluate: (oldDoc, newDoc, downstreamDocs) => {
    const impacts: import("@/core/types").ImpactItem[] = []

    // 检查出运日期变更
    const oldDate = oldDoc.masterData.shippingDate
    const newDate = newDoc.masterData.shippingDate
    if (oldDate !== newDate && downstreamDocs.length > 0) {
      for (const ds of downstreamDocs) {
        impacts.push({
          level: "warning",
          affectedDocId: ds.id,
          affectedTypeId: ds.typeId,
          affectedDocNumber: ds.docNumber,
          affectedField: "shippingDate",
          description: `结汇单的出运日期变更，可能影响下游单据 ${ds.docNumber}`,
        })
      }
    }

    // 检查结汇数量变更
    const oldItems = oldDoc.detailTables.find((t) => t.tableId === "items")?.rows ?? []
    const newItems = newDoc.detailTables.find((t) => t.tableId === "items")?.rows ?? []
    for (const newItem of newItems) {
      const oldItem = oldItems.find((r) => r.id === newItem.id)
      if (oldItem) {
        const oldQty = Number(oldItem.data.exchangeQuantity) || 0
        const newQty = Number(newItem.data.exchangeQuantity) || 0
        if (newQty < oldQty) {
          impacts.push({
            level: "critical",
            affectedDocId: oldDoc.id,
            affectedTypeId: oldDoc.typeId,
            affectedDocNumber: oldDoc.docNumber,
            affectedField: "exchangeQuantity",
            description: `结汇数量从 ${oldQty} 减少到 ${newQty}，可能影响已完成的结汇`,
          })
        }
      }
    }

    return impacts
  },
}
