/**
 * SkuService
 *
 * 产品编号生成服务。
 * 前缀取自 ProductCategory.codePrefix，序号长度取自 ProductCategory.serialLength。
 */

import { productCategoryService } from './product-category.service';
import { serialNumberService } from './serial-number.service';

const SKU_TYPE = 'product_sku';

export interface GenerateSkuCodeResult {
  code: string;
  preCode: string;
  xhCode: string;
  serialLength: number;
}

export class SkuService {
  /**
   * 根据产品分类 ID 生成产品编号
   * 格式: codePrefix + 序号(按 serialLength 补零)
   */
  async generateCode(categoryId: string): Promise<GenerateSkuCodeResult> {
    const category = await productCategoryService.findById(categoryId);
    if (!category) {
      throw new Error('产品分类不存在');
    }

    const preCode = category.codePrefix ?? category.code;
    const serialLength = Math.max(1, Math.min(10, category.serialLength));

    const snRecord = await serialNumberService.getAndIncrementSn(
      SKU_TYPE,
      preCode
    );

    const xhCode = String(snRecord.sn).padStart(serialLength, '0');
    const code = `${preCode}${xhCode}`;

    return { code, preCode, xhCode, serialLength };
  }
}

export const skuService = new SkuService();
