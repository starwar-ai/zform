import prisma from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * 汇率服务
 * 管理各币种汇率的获取、缓存和查询
 */
export class ExchangeRateService {
  /**
   * 汇率缓存
   * Key: currencyName, Value: CurrencyRate
   */
  private rateCache: Map<string, CurrencyRateData> = new Map();

  /**
   * 缓存初始化标志
   */
  private cacheInitialized: boolean = false;

  /**
   * 常用货币列表
   */
  static readonly COMMON_CURRENCIES = [
    'CNY', 'RMB', 'USD', 'EUR', 'JPY', 'HKD', 'GBP', 'RUB', 'PLN', 'CZK'
  ];

  /**
   * 获取当日汇率Map
   * 返回格式: { "USD": 7.25, "EUR": 7.85, ... }
   */
  async getDailyRateMap(): Promise<Map<string, Decimal>> {
    const today = this.getTodayDate();
    return this.getDailyRateMapByDate(today);
  }

  /**
   * 获取指定日期的汇率Map
   * @param dateStr 日期字符串 (YYYY-MM-DD)
   */
  async getDailyRateMapByDate(dateStr: string): Promise<Map<string, Decimal>> {
    // 初始化默认值Map
    const rateMap = new Map<string, Decimal>();
    
    // 初始化默认值 - CNY/RMB 为 1
    rateMap.set('CNY', new Decimal(1));
    rateMap.set('RMB', new Decimal(1));
    
    // 其他币种默认为 0
    ExchangeRateService.COMMON_CURRENCIES
      .filter(c => c !== 'CNY' && c !== 'RMB')
      .forEach(c => rateMap.set(c, new Decimal(0)));

    // 查询数据库获取实际汇率
    const rates = await this.getRatesByDate(dateStr);
    
    rates.forEach(rate => {
      rateMap.set(rate.currencyName, rate.rate);
    });

    return rateMap;
  }

  /**
   * 批量获取多个日期的汇率Map
   * @param dates 日期数组
   * @returns Map<dateStr, Map<currencyName, rate>>
   */
  async getDailyRateMapByDates(dates: Date[]): Promise<Map<string, Map<string, Decimal>>> {
    const result = new Map<string, Map<string, Decimal>>();
    
    const dateStrs = [...new Set(dates.map(d => this.formatDate(d)))];
    
    for (const dateStr of dateStrs) {
      const rateMap = await this.getDailyRateMapByDate(dateStr);
      result.set(dateStr, rateMap);
    }

    return result;
  }

  /**
   * 根据合同获取汇率Map
   * @param contractMap 合同编号与合同时间的映射
   * @returns Map<contractCode, Map<currencyName, rate>>
   */
  async getDailyRateMapByContractMap(
    contractMap: Map<string, Date>
  ): Promise<Map<string, Map<string, Decimal>>> {
    const result = new Map<string, Map<string, Decimal>>();

    for (const [contractCode, contractDate] of contractMap) {
      const dateStr = this.formatDate(contractDate);
      const rateMap = await this.getDailyRateMapByDate(dateStr);
      result.set(contractCode, rateMap);
    }

    return result;
  }

  /**
   * 获取所有币种列表
   */
  async getAllCurrenciesByDate(): Promise<Set<string>> {
    const rateMap = await this.getDailyRateMap();
    return new Set([...rateMap.keys()].filter(k => rateMap.get(k)?.gt(0)));
  }

  /**
   * 获取指定日期的汇率列表
   * 如果指定日期没有汇率，会查找最接近的日期
   */
  async getRatesByDate(dateStr: string): Promise<CurrencyRateData[]> {
    let rates = await prisma.currencyRate.findMany({
      where: { rateDate: dateStr },
    });

    // 如果没有找到，查找最接近的日期
    if (rates.length === 0) {
      const closestDate = await this.findClosestDate(dateStr);
      if (closestDate) {
        rates = await prisma.currencyRate.findMany({
          where: { rateDate: closestDate },
        });
      }
    }

    return rates.map(r => ({
      id: r.id,
      rateDate: r.rateDate,
      currencyName: r.currencyName,
      rate: r.rate,
      midRate: r.midRate,
      source: r.source,
      remark: r.remark,
    }));
  }

  /**
   * 创建汇率记录
   */
  async createRate(data: CreateCurrencyRateInput): Promise<CurrencyRateData> {
    return prisma.currencyRate.create({
      data: {
        rateDate: data.rateDate,
        currencyName: data.currencyName,
        rate: data.rate,
        midRate: data.midRate,
        source: data.source ?? 0,
        remark: data.remark,
        createdBy: data.createdBy,
      },
    });
  }

  /**
   * 批量创建汇率记录
   * 如果同一日期的币种已存在，则跳过
   */
  async batchCreateRates(rates: CreateCurrencyRateInput[], date: string): Promise<number> {
    // 获取已存在的币种
    const existingRates = await prisma.currencyRate.findMany({
      where: { rateDate: date },
      select: { currencyName: true },
    });
    const existingCurrencies = new Set(existingRates.map(r => r.currencyName));

    // 过滤出不存在的汇率
    const newRates = rates.filter(r => !existingCurrencies.has(r.currencyName));

    if (newRates.length === 0) {
      return 0;
    }

    // 批量插入
    await prisma.currencyRate.createMany({
      data: newRates.map(r => ({
        rateDate: r.rateDate,
        currencyName: r.currencyName,
        rate: r.rate,
        midRate: r.midRate,
        source: r.source ?? 0,
        remark: r.remark,
        createdBy: r.createdBy,
      })),
    });

    // 清除缓存
    this.clearCache();

    return newRates.length;
  }

  /**
   * 更新汇率记录
   */
  async updateRate(
    rateDate: string,
    currencyName: string,
    data: UpdateCurrencyRateInput
  ): Promise<CurrencyRateData> {
    const result = await prisma.currencyRate.update({
      where: {
        rateDate_currencyName: {
          rateDate,
          currencyName,
        },
      },
      data: {
        rate: data.rate,
        midRate: data.midRate,
        source: data.source,
        remark: data.remark,
        updatedBy: data.updatedBy,
      },
    });

    // 清除缓存
    this.clearCache();

    return result;
  }

  /**
   * 删除汇率记录
   */
  async deleteRate(rateDate: string, currencyName: string): Promise<void> {
    await prisma.currencyRate.delete({
      where: {
        rateDate_currencyName: {
          rateDate,
          currencyName,
        },
      },
    });

    // 清除缓存
    this.clearCache();
  }

  /**
   * 分页查询汇率记录
   */
  async findMany(params: {
    page?: number;
    pageSize?: number;
    rateDate?: string;
    currencyName?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, pageSize = 20, rateDate, currencyName, startDate, endDate } = params;

    const where = {
      ...(rateDate && { rateDate }),
      ...(currencyName && {
        currencyName: { contains: currencyName, mode: 'insensitive' as const },
      }),
      ...(startDate &&
        endDate && {
          rateDate: {
            gte: startDate,
            lte: endDate,
          },
        }),
    };

    const [records, total] = await Promise.all([
      prisma.currencyRate.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ rateDate: 'desc' }, { currencyName: 'asc' }],
      }),
      prisma.currencyRate.count({ where }),
    ]);

    return {
      records,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取最新汇率（用于缓存）
   */
  async getLatestRates(): Promise<CurrencyRateData[]> {
    if (this.cacheInitialized && this.rateCache.size > 1) {
      return Array.from(this.rateCache.values());
    }

    // 获取每个币种的最新汇率
    const rates = await prisma.$queryRaw<CurrencyRateData[]>`
      SELECT DISTINCT ON (currency_name) 
        id, rate_date, currency_name, rate, mid_rate, source, remark
      FROM currency_rates
      ORDER BY currency_name, rate_date DESC
    `;

    // 更新缓存
    rates.forEach(rate => {
      this.rateCache.set(rate.currencyName, rate);
    });
    this.cacheInitialized = true;

    return rates;
  }

  /**
   * 获取指定币种的最新汇率
   */
  async getRateByCurrencyName(currencyName: string): Promise<CurrencyRateData | null> {
    if (this.rateCache.has(currencyName)) {
      return this.rateCache.get(currencyName) || null;
    }

    const rate = await prisma.currencyRate.findFirst({
      where: { currencyName },
      orderBy: { rateDate: 'desc' },
    });

    if (rate) {
      this.rateCache.set(currencyName, rate);
    }

    return rate;
  }

  /**
   * 从外部API获取汇率
   */
  async fetchRateFromApi(currency: string): Promise<Decimal | null> {
    try {
      const url = `https://v6.exchangerate-api.com/v6/b23e58cd445c6d3ff3d621ed/latest/${currency}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Failed to fetch rate for ${currency}`);
        return null;
      }

      const data = (await response.json()) as { result?: string; conversion_rates?: Record<string, number> };
      
      if (data.result === 'success' && data.conversion_rates) {
        const cnyRate = data.conversion_rates.CNY;
        if (cnyRate) {
          return new Decimal(cnyRate);
        }
      }

      return null;
    } catch (error) {
      console.error(`Error fetching rate for ${currency}:`, error);
      return null;
    }
  }

  /**
   * 自动获取并保存当日汇率
   */
  async fetchAndSaveDailyRates(): Promise<{ currency: string; rate: Decimal | null }[]> {
    const today = this.getTodayDate();
    const results: { currency: string; rate: Decimal | null }[] = [];

    // 首先添加人民币汇率
    await this.createRate({
      rateDate: today,
      currencyName: 'RMB',
      rate: new Decimal(1),
      midRate: new Decimal(1),
      source: 1,
    });

    // 获取其他币种汇率
    const currenciesToFetch = ExchangeRateService.COMMON_CURRENCIES.filter(
      c => c !== 'CNY' && c !== 'RMB'
    );

    for (const currency of currenciesToFetch) {
      const rate = await this.fetchRateFromApi(currency);
      
      results.push({ currency, rate });

      if (rate) {
        await this.createRate({
          rateDate: today,
          currencyName: currency,
          rate,
          midRate: rate,
          source: 1,
        });
      }
    }

    // 清除缓存
    this.clearCache();

    return results;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.rateCache.clear();
    this.cacheInitialized = false;
  }

  /**
   * 获取今日日期字符串
   */
  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * 格式化日期
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * 查找最接近的日期
   */
  private async findClosestDate(targetDate: string): Promise<string | null> {
    const allDates = await prisma.currencyRate.findMany({
      select: { rateDate: true },
      distinct: ['rateDate'],
    });

    const dateList = allDates.map(r => r.rateDate);

    if (dateList.length === 0) {
      return null;
    }

    // 找最接近的日期
    const target = new Date(targetDate).getTime();
    
    // 先找大于等于目标日期的最小日期
    const futureDates = dateList.filter(d => new Date(d).getTime() >= target);
    if (futureDates.length > 0) {
      return futureDates.sort()[0];
    }

    // 否则找小于目标日期的最大日期
    const pastDates = dateList.filter(d => new Date(d).getTime() < target);
    if (pastDates.length > 0) {
      return pastDates.sort().reverse()[0];
    }

    return dateList[0];
  }

  /**
   * 货币转换
   * @param amount 金额
   * @param fromCurrency 原币种
   * @param toCurrency 目标币种
   * @param date 汇率日期
   */
  async convertCurrency(
    amount: Decimal | number,
    fromCurrency: string,
    toCurrency: string,
    date?: Date
  ): Promise<Decimal> {
    const dateStr = date ? this.formatDate(date) : this.getTodayDate();
    const rateMap = await this.getDailyRateMapByDate(dateStr);

    const fromRate = rateMap.get(fromCurrency);
    const toRate = rateMap.get(toCurrency);

    if (!fromRate || fromRate.isZero()) {
      throw new Error(`Exchange rate not found for currency: ${fromCurrency}`);
    }

    if (!toRate || toRate.isZero()) {
      throw new Error(`Exchange rate not found for currency: ${toCurrency}`);
    }

    const amountDecimal = new Decimal(amount);
    // 先转为人民币，再转为目标币种
    const amountInCNY = amountDecimal.mul(fromRate);
    const result = amountInCNY.div(toRate);

    return result;
  }

  /**
   * 获取金额的人民币金额
   */
  async getAmountInCNY(
    amount: Decimal | number,
    currency: string,
    date?: Date
  ): Promise<Decimal> {
    return this.convertCurrency(amount, currency, 'CNY', date);
  }
}

// 类型定义
export interface CurrencyRateData {
  id: string;
  rateDate: string;
  currencyName: string;
  rate: Decimal;
  midRate: Decimal | null;
  source: number;
  remark: string | null;
}

export interface CreateCurrencyRateInput {
  rateDate: string;
  currencyName: string;
  rate: Decimal;
  midRate?: Decimal | null;
  source?: number;
  remark?: string;
  createdBy?: string;
}

export interface UpdateCurrencyRateInput {
  rate?: Decimal;
  midRate?: Decimal | null;
  source?: number;
  remark?: string;
  updatedBy?: string;
}

export const exchangeRateService = new ExchangeRateService();
