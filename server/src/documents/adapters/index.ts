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

export function registerAllAdapters(): void {
  // 销售合同
  documentTypeRegistry.register(salesContractAdapter);

  // 采购计划
  documentTypeRegistry.register(purchasePlanAdapter);

  // 产品 (三种子类型)
  documentTypeRegistry.register(standardProductAdapter);
  documentTypeRegistry.register(customerProductAdapter);
  documentTypeRegistry.register(selfOwnedProductAdapter);

  console.log(
    `[DocumentTypeRegistry] Registered ${documentTypeRegistry.getAllTypeIds().length} adapters:`,
    documentTypeRegistry.getAllTypeIds().join(', ')
  );
}
