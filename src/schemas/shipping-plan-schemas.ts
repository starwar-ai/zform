/**
 * Shipping Plan Schemas
 *
 * 出运计划单单据定义（基于后端 Prisma Schema）
 */

import type { DocumentSchema, ChangeRule, PushDownRule } from "@/core/types"

// ============================================================
// 出运计划单 (Shipping Plan)
// ============================================================

export const shippingPlanSchema: DocumentSchema = {
  typeId: "shipping_plan",
  typeName: "出运计划单",
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
      label: "单据状态",
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
      id: "orderLinkCode",
      label: "订单链路编号",
      type: "text",
      readOnly: true,
      group: "基本信息",
    },
    {
      id: "salesContractCode",
      label: "外销合同号",
      type: "text",
      group: "基本信息",
    },
    {
      id: "customerPoNo",
      label: "客户PO号",
      type: "text",
      group: "基本信息",
    },
    {
      id: "entryDate",
      label: "录入日期",
      type: "date",
      group: "基本信息",
    },
    {
      id: "expectedShippingDate",
      label: "预计出运时间",
      type: "date",
      group: "基本信息",
    },
    {
      id: "expectedDeliveryDate",
      label: "预计交货日期",
      type: "date",
      group: "基本信息",
    },
    {
      id: "customerDeliveryDate",
      label: "客户交期",
      type: "date",
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

    // === 客户信息 ===
    {
      id: "receivableCustomerId",
      label: "应收客户主键",
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
      id: "receivableCustomerName",
      label: "应收客户名称",
      type: "text",
      group: "客户信息",
    },
    {
      id: "deliveryCustomerId",
      label: "收货客户主键",
      type: "text",
      group: "客户信息",
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

    // === 外贸公司主体 ===
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

    // === 汇总统计 ===
    {
      id: "purchaseTotal",
      label: "采购合计",
      type: "number",
      readOnly: true,
      defaultValue: 0,
      group: "汇总统计",
    },
    {
      id: "totalValue",
      label: "货值合计",
      type: "number",
      readOnly: true,
      defaultValue: 0,
      group: "汇总统计",
    },
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
      label: "出运计划明细",
      editable: true,
      fields: [
        // === 产品基本信息 ===
        { id: "barcode", label: "条形码", type: "text" },
        { id: "skuCode", label: "SKU编号", type: "text" },
        { id: "customerProductNo", label: "客户货号", type: "text" },
        { id: "productNameCn", label: "中文品名", type: "text" },
        { id: "productNameEn", label: "英文品名", type: "text" },
        { id: "baseProductCode", label: "基础产品编号", type: "text" },
        { id: "specification", label: "规格", type: "text" },

        // === 数量信息 ===
        { id: "shippingQuantity", label: "出运数量", type: "number", required: true },
        { id: "purchaseQuantity", label: "采购数量", type: "number" },
        { id: "salesQuantity", label: "销售数量", type: "number" },
        { id: "realLockedQuantity", label: "真实锁定数量", type: "number", readOnly: true },
        { id: "unit", label: "计量单位", type: "text" },
        { id: "customsUnit", label: "海关计量单位", type: "text" },

        // === 供应商信息 ===
        { id: "supplierId", label: "供应商id", type: "text" },
        { id: "supplierCode", label: "供应商编号", type: "text" },
        { id: "supplierName", label: "供应商名称", type: "text" },
        { id: "payableSupplierName", label: "应付供应商名称", type: "text" },
        { id: "payableSupplierCode", label: "应付供应商编号", type: "text" },
        { id: "payableSupplierId", label: "应付供应商", type: "text" },

        // === 销售信息 ===
        { id: "salesPerson", label: "销售人员", type: "text" },
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
          label: "币种",
          type: "select",
          options: [
            { label: "USD", value: "USD" },
            { label: "CNY", value: "CNY" },
            { label: "EUR", value: "EUR" },
          ],
          defaultValue: "USD",
        },
        { id: "salesContractCode", label: "外销合同编号", type: "text" },
        { id: "customerPoNo", label: "客户PO号", type: "text" },
        { id: "salesItemId", label: "销售明细主键", type: "text" },

        // === 采购信息 ===
        { id: "purchaseContractCode", label: "采购合同编号", type: "text" },
        { id: "inventoryPurchaseContractCode", label: "库存采购合同号", type: "text" },
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

        // === 客户信息 ===
        { id: "customerId", label: "客户主键", type: "text" },
        { id: "customerCode", label: "客户编号", type: "text" },
        { id: "customerName", label: "客户名称", type: "text" },

        // === 收款与价格 ===
        { id: "paymentMethodId", label: "收款方式主键", type: "text" },
        { id: "paymentMethodName", label: "收款方式名称", type: "text" },
        { id: "priceTerms", label: "价格条款", type: "text" },
        { id: "customerDeliveryDate", label: "客户交期", type: "date" },

        // === 报关信息 ===
        { id: "hsCode", label: "HS编码", type: "text" },
        { id: "inspectionType", label: "商检类型", type: "text" },
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
        { id: "freight", label: "运费", type: "number" },
        { id: "packagePrice", label: "包装价", type: "number" },
        { id: "totalAmount", label: "总价", type: "number" },
        { id: "totalAmountWithTax", label: "含税总价", type: "number" },
        { id: "commissionAmount", label: "佣金金额", type: "number" },
        { id: "commissionType", label: "佣金类型", type: "text" },
        { id: "commissionRate", label: "佣金比例", type: "number" },
        { id: "grossProfitMargin", label: "毛利率", type: "number", readOnly: true },

        // === 下单主体 ===
        { id: "orderEntityId", label: "下单主体主键", type: "text" },
        { id: "orderEntityName", label: "下单主体名称", type: "text" },

        // === 其他信息 ===
        { id: "isSeparateBox", label: "是否分箱", type: "checkbox", defaultValue: false },
        { id: "isIncludeGift", label: "是否包含赠品", type: "checkbox", defaultValue: false },
        { id: "shippingLocation", label: "发货地点", type: "text" },
        { id: "warehouseCode", label: "仓库编号", type: "text" },
        { id: "warehouseName", label: "仓库名称", type: "text" },
        { id: "productDescription", label: "产品描述", type: "text" },
        { id: "productDescriptionEn", label: "产品英文描述", type: "text" },

        // === 来源追溯 ===
        { id: "sourceCode", label: "来源编号", type: "text", readOnly: true },
        { id: "uniqueCode", label: "唯一编号", type: "text", readOnly: true },
        { id: "isConvertedToShipping", label: "是否转出运明细", type: "checkbox", defaultValue: false, readOnly: true },

        // === 备注 ===
        { id: "remark", label: "备注", type: "text" },
      ],
    },
  ],
}

// ============================================================
// 出运计划单 → 出运单 下推规则
// ============================================================

export const shippingPlanToShippingOrderRule: PushDownRule = {
  sourceTypeId: "shipping_plan",
  targetTypeId: "shipping_order",
  name: "生成出运单",
  masterFieldMappings: [
    { sourceField: "master.salesContractCode", targetField: "master.salesContractCode" },
    { sourceField: "master.code", targetField: "master.planCode" },
    { sourceField: "master.frontMark", targetField: "master.frontMark" },
    { sourceField: "master.sideMark", targetField: "master.sideMark" },
    { sourceField: "master.consignee", targetField: "master.consignee" },
    { sourceField: "master.notifyParty", targetField: "master.notifyParty" },
    { sourceField: "master.salesPerson", targetField: "master.salesPerson" },
    { sourceField: "master.buyer", targetField: "master.buyer" },
    { sourceField: "master.priceTerms", targetField: "master.priceTerms" },
    { sourceField: "master.transportMethod", targetField: "master.transportMethod" },
    { sourceField: "master.customerDeliveryDate", targetField: "master.customerDeliveryDate" },
    { sourceField: "master.expectedShippingDate", targetField: "master.expectedShippingDate" },
    { sourceField: "master.shippingCountryId", targetField: "master.shippingCountryId" },
    { sourceField: "master.shippingCountryName", targetField: "master.shippingCountryName" },
    { sourceField: "master.shippingCountryRegion", targetField: "master.shippingCountryRegion" },
    { sourceField: "master.departurePortId", targetField: "master.departurePortId" },
    { sourceField: "master.departurePortName", targetField: "master.departurePortName" },
    { sourceField: "master.tradeCountryId", targetField: "master.tradeCountryId" },
    { sourceField: "master.tradeCountryName", targetField: "master.tradeCountryName" },
    { sourceField: "master.tradeCountryRegion", targetField: "master.tradeCountryRegion" },
    { sourceField: "master.destinationPortId", targetField: "master.destinationPortId" },
    { sourceField: "master.destinationPortName", targetField: "master.destinationPortName" },
    { sourceField: "master.receivableCustomerId", targetField: "master.customerId" },
    { sourceField: "master.receivableCustomerCode", targetField: "master.customerCode" },
    { sourceField: "master.receivableCustomerName", targetField: "master.customerName" },
    { sourceField: "master.tradingCompanyId", targetField: "master.tradingCompanyId" },
    { sourceField: "master.tradingCompanyName", targetField: "master.tradingCompanyName" },
    { sourceField: "master.container20ft", targetField: "master.container20ft" },
    { sourceField: "master.container40ft", targetField: "master.container40ft" },
    { sourceField: "master.container40hq", targetField: "master.container40hq" },
    { sourceField: "master.bulkCargo", targetField: "master.bulkCargo" },
    { sourceField: "master.orderLinkCode", targetField: "master.orderLinkCode" },
  ],
  detailMappings: [
    {
      sourceTableId: "items",
      targetTableId: "items",
      fieldMappings: [
        { sourceField: "productId", targetField: "productId" },
        { sourceField: "skuCode", targetField: "skuCode" },
        { sourceField: "barcode", targetField: "barcode" },
        { sourceField: "customerProductNo", targetField: "customerProductNo" },
        { sourceField: "productNameCn", targetField: "productNameCn" },
        { sourceField: "productNameEn", targetField: "productNameEn" },
        { sourceField: "baseProductCode", targetField: "baseProductCode" },
        { sourceField: "specification", targetField: "specification" },
        { sourceField: "thumbnail", targetField: "thumbnail" },
        { sourceField: "mainImage", targetField: "mainImage" },
        { sourceField: "shippingQuantity", targetField: "shippingQuantity" },
        { sourceField: "purchaseQuantity", targetField: "purchaseQuantity" },
        { sourceField: "unit", targetField: "unit" },
        { sourceField: "customsUnit", targetField: "customsUnit" },
        { sourceField: "supplierId", targetField: "supplierId" },
        { sourceField: "supplierCode", targetField: "supplierCode" },
        { sourceField: "supplierName", targetField: "supplierName" },
        { sourceField: "payableSupplierId", targetField: "payableSupplierId" },
        { sourceField: "payableSupplierCode", targetField: "payableSupplierCode" },
        { sourceField: "payableSupplierName", targetField: "payableSupplierName" },
        { sourceField: "customerId", targetField: "customerId" },
        { sourceField: "customerCode", targetField: "customerCode" },
        { sourceField: "customerName", targetField: "customerName" },
        { sourceField: "salesPerson", targetField: "salesPerson" },
        { sourceField: "saleUnitPrice", targetField: "saleUnitPrice" },
        { sourceField: "saleAmount", targetField: "saleAmount" },
        { sourceField: "currency", targetField: "currency" },
        { sourceField: "salesContractCode", targetField: "salesContractCode" },
        { sourceField: "customerPoNo", targetField: "customerPoNo" },
        { sourceField: "salesItemId", targetField: "salesItemId" },
        { sourceField: "purchaseContractCode", targetField: "purchaseContractCode" },
        { sourceField: "inventoryPurchaseContractCode", targetField: "inventoryPurchaseContractCode" },
        { sourceField: "buyerId", targetField: "buyerId" },
        { sourceField: "buyerName", targetField: "buyerName" },
        { sourceField: "buyerDeptId", targetField: "buyerDeptId" },
        { sourceField: "buyerDeptName", targetField: "buyerDeptName" },
        { sourceField: "purchaseCurrency", targetField: "purchaseCurrency" },
        { sourceField: "purchaseUnitPrice", targetField: "purchaseUnitPrice" },
        { sourceField: "paymentMethodId", targetField: "paymentMethodId" },
        { sourceField: "paymentMethodName", targetField: "paymentMethodName" },
        { sourceField: "priceTerms", targetField: "priceTerms" },
        { sourceField: "customerDeliveryDate", targetField: "deliveryDate" },
        { sourceField: "hsCode", targetField: "hsCode" },
        { sourceField: "inspectionType", targetField: "inspectionType" },
        { sourceField: "taxRefundRate", targetField: "taxRefundRate" },
        { sourceField: "taxRefundAmount", targetField: "taxRefundAmount" },
        { sourceField: "packageMethod", targetField: "packageMethod" },
        { sourceField: "outerBoxQuantity", targetField: "outerBoxQuantity" },
        { sourceField: "innerBoxQuantity", targetField: "innerBoxQuantity" },
        { sourceField: "boxCount", targetField: "boxCount" },
        { sourceField: "outerBoxUnit", targetField: "outerBoxUnit" },
        { sourceField: "outerBoxLength", targetField: "outerBoxLength" },
        { sourceField: "outerBoxWidth", targetField: "outerBoxWidth" },
        { sourceField: "outerBoxHeight", targetField: "outerBoxHeight" },
        { sourceField: "outerBoxVolume", targetField: "outerBoxVolume" },
        { sourceField: "totalVolume", targetField: "totalVolume" },
        { sourceField: "outerBoxNetWeight", targetField: "outerBoxNetWeight" },
        { sourceField: "totalNetWeight", targetField: "totalNetWeight" },
        { sourceField: "outerBoxGrossWeight", targetField: "outerBoxGrossWeight" },
        { sourceField: "totalGrossWeight", targetField: "totalGrossWeight" },
        { sourceField: "commissionAmount", targetField: "commissionAmount" },
        { sourceField: "grossProfitMargin", targetField: "grossProfitMargin" },
        { sourceField: "productDescription", targetField: "productDescription" },
        { sourceField: "productDescriptionEn", targetField: "productDescriptionEn" },
        { sourceField: "warehouseCode", targetField: "warehouseCode" },
        { sourceField: "warehouseName", targetField: "warehouseName" },
        { sourceField: "isSeparateBox", targetField: "isSeparateBox" },
        { sourceField: "isIncludeGift", targetField: "isIncludeGift" },
        { sourceField: "remark", targetField: "remark" },
      ],
    },
  ],
}

// ============================================================
// 出运计划单变更规则
// ============================================================

export const shippingPlanChangeRule: ChangeRule = {
  typeId: "shipping_plan",
  watchFields: [
    "master.expectedShippingDate",
    "master.expectedDeliveryDate",
    "master.priceTerms",
    "master.shippingCountryName",
    "master.departurePortName",
    "master.destinationPortName",
    "detail.items.shippingQuantity",
    "detail.items.saleUnitPrice",
  ],
  evaluate: (oldDoc, newDoc, downstreamDocs) => {
    const impacts: import("@/core/types").ImpactItem[] = []

    // 检查预计出运时间变更
    const oldShippingDate = oldDoc.masterData.expectedShippingDate
    const newShippingDate = newDoc.masterData.expectedShippingDate
    if (oldShippingDate !== newShippingDate) {
      for (const ds of downstreamDocs) {
        impacts.push({
          level: "warning",
          affectedDocId: ds.id,
          affectedTypeId: ds.typeId,
          affectedDocNumber: ds.docNumber,
          affectedField: "expectedShippingDate",
          description: `出运计划的预计出运时间变更，可能影响出运单 ${ds.docNumber} 的出运安排`,
        })
      }
    }

    // 检查数量变更（明细行级别的数量变更影响严重）
    const oldItems = oldDoc.detailTables.find((t) => t.tableId === "items")?.rows ?? []
    const newItems = newDoc.detailTables.find((t) => t.tableId === "items")?.rows ?? []
    for (const newItem of newItems) {
      const oldItem = oldItems.find((r) => r.id === newItem.id)
      if (oldItem) {
        const oldQty = Number(oldItem.data.shippingQuantity) || 0
        const newQty = Number(newItem.data.shippingQuantity) || 0
        if (newQty < oldQty) {
          for (const ds of downstreamDocs) {
            impacts.push({
              level: "critical",
              affectedDocId: ds.id,
              affectedTypeId: ds.typeId,
              affectedDocNumber: ds.docNumber,
              affectedField: "shippingQuantity",
              description: `出运数量从 ${oldQty} 减少到 ${newQty}，已生成的出运单 ${ds.docNumber} 可能超出计划数量`,
            })
          }
        }
      }
    }

    return impacts
  },
}
