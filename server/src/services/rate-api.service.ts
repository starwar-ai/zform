import { Decimal } from '@prisma/client/runtime/library';
import { exchangeRateService } from './exchange-rate.service';

/**
 * 汇率API接口
 * 提供统一的汇率获取接口，供其他模块调用
 */
export class RateApi {
  /**
   * 获取当日汇率Map
   * @returns Map<currencyName, rate>
   */
  async getDailyRateMap(): Promise<Map<string, Decimal>> {
    return exchangeRateService.getDailyRateMap();
  }

  /**
   * 获取指定日期的汇率Map
   * @param dateTime 日期时间
   * @returns Map<currencyName, rate>
   */
  async getDailyRateMapByDate(dateTime: Date): Promise<Map<string, Decimal>> {
    const dateStr = dateTime.toISOString().split('T')[0];
    return exchangeRateService.getDailyRateMapByDate(dateStr);
  }

  /**
   * 批量获取多个合同的汇率Map
   * @param contractMap 合同编号与合同时间的映射
   * @returns Map<contractCode, Map<currencyName, rate>>
   */
  async getDailyRateMapByContractMap(
    contractMap: Map<string, Date>
  ): Promise<Map<string, Map<string, Decimal>>> {
    return exchangeRateService.getDailyRateMapByContractMap(contractMap);
  }

  /**
   * 获取所有币种
   * @returns 币种代码集合
   */
  async getAllCurrenciesByDate(): Promise<Set<string>> {
    return exchangeRateService.getAllCurrenciesByDate();
  }

  /**
   * 获取指定币种的汇率
   * @param currencyName 币种代码
   * @returns 汇率（对人民币）
   */
  async getRateByCurrencyName(currencyName: string): Promise<Decimal | null> {
    const rate = await exchangeRateService.getRateByCurrencyName(currencyName);
    return rate?.rate || null;
  }

  /**
   * 货币转换
   * @param amount 金额
   * @param fromCurrency 原币种
   * @param toCurrency 目标币种（默认人民币）
   * @param date 日期（可选）
   */
  async convertCurrency(
    amount: Decimal | number,
    fromCurrency: string,
    toCurrency: string = 'CNY',
    date?: Date
  ): Promise<Decimal> {
    return exchangeRateService.convertCurrency(amount, fromCurrency, toCurrency, date);
  }

  /**
   * 获取金额的人民币金额
   * @param amount 金额
   * @param currency 币种
   * @param date 日期（可选）
   */
  async getAmountInCNY(
    amount: Decimal | number,
    currency: string,
    date?: Date
  ): Promise<Decimal> {
    return exchangeRateService.getAmountInCNY(amount, currency, date);
  }

  /**
   * 批量计算金额的人民币金额
   * @param amounts 金额列表 [{amount, currency}]
   * @param date 日期（可选）
   */
  async getAmountsInCNY(
    amounts: Array<{ amount: Decimal | number; currency: string }>,
    date?: Date
  ): Promise<Decimal> {
    let total = new Decimal(0);
    
    for (const item of amounts) {
      if (!item.currency) {
        continue;
      }
      
      if (item.currency === 'RMB' || item.currency === 'CNY') {
        total = total.add(item.amount);
        continue;
      }

      const rate = await this.getRateByCurrencyName(item.currency);
      if (!rate || rate.isZero()) {
        throw new Error(`Exchange rate not found for currency: ${item.currency}`);
      }

      total = total.add(new Decimal(item.amount).mul(rate));
    }

    return total;
  }

  /**
   * 获取汇率记录对象（包含详细信息）
   * @param date 日期
   */
  async getRatesByDate(date: string) {
    return exchangeRateService.getRatesByDate(date);
  }
}

// 导出单例
export const rateApi = new RateApi();
