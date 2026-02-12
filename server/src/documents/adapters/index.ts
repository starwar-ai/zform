/**
 * 所有单据类型适配器的统一注册入口
 *
 * 在应用启动时调用 registerAllAdapters()
 */

import { documentTypeRegistry } from '../registry';
import { salesContractAdapter } from './sales-contract.adapter';
import { purchasePlanAdapter } from './purchase-plan.adapter';
import {
  standardProductAdapter,
  customerProductAdapter,
  selfOwnedProductAdapter,
} from './product.adapter';
import {
  manufacturerAdapter,
  serviceProviderAdapter,
  logisticsAdapter,
} from './supplier.adapter';
import { warehouseInboundAdapter } from './warehouse-inbound.adapter';
import { warehouseOutboundAdapter } from './warehouse-outbound.adapter';
import { warehouseInboundNoticeAdapter } from './warehouse-inbound-notice.adapter';
import { warehouseOutboundNoticeAdapter } from './warehouse-outbound-notice.adapter';
import { exchangeSettlementAdapter } from './exchange-settlement.adapter';
import { invoicingNoticeAdapter } from './invoicing-notice.adapter';
import { paymentApplyAdapter } from './payment-apply.adapter';
import { processingOrderAdapter } from './processing-order.adapter';
import { quotationAdapter } from './quotation.adapter';

export function registerAllAdapters(): void {
  // 销售合同
  documentTypeRegistry.register(salesContractAdapter);

  // 采购计划
  documentTypeRegistry.register(purchasePlanAdapter);

  // 产品 (三种子类型)
  documentTypeRegistry.register(standardProductAdapter);
  documentTypeRegistry.register(customerProductAdapter);
  documentTypeRegistry.register(selfOwnedProductAdapter);

  // 供应商 (三种子类型)
  documentTypeRegistry.register(manufacturerAdapter);
  documentTypeRegistry.register(serviceProviderAdapter);
  documentTypeRegistry.register(logisticsAdapter);

  // 仓库管理 (四种单据)
  documentTypeRegistry.register(warehouseInboundAdapter);
  documentTypeRegistry.register(warehouseOutboundAdapter);
  documentTypeRegistry.register(warehouseInboundNoticeAdapter);
  documentTypeRegistry.register(warehouseOutboundNoticeAdapter);

  // 结汇单
  documentTypeRegistry.register(exchangeSettlementAdapter);

  // 开票通知
  documentTypeRegistry.register(invoicingNoticeAdapter);

  // 付款申请
  documentTypeRegistry.register(paymentApplyAdapter);

  // 加工单
  documentTypeRegistry.register(processingOrderAdapter);

  // 报价单
  documentTypeRegistry.register(quotationAdapter);

  console.log(
    `[DocumentTypeRegistry] Registered ${documentTypeRegistry.getAllTypeIds().length} adapters:`,
    documentTypeRegistry.getAllTypeIds().join(', ')
  );
}
