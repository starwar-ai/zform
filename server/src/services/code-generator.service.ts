import { serialNumberService } from './serial-number.service';

/**
 * 编码规则接口
 */
export interface CodeRule {
  execute(length?: number): string;
}

/**
 * 常量编码规则
 * 输出固定的前缀
 */
export class ConstantCodeRule implements CodeRule {
  constructor(private readonly code: string) {}

  execute(): string {
    return this.code;
  }
}

/**
 * 日期时间编码规则
 * 输出格式化的日期时间
 */
export class DateTimeCodeRule implements CodeRule {
  private readonly formatter: (date: Date) => string;

  constructor(format: string = 'yyMM') {
    this.formatter = this.createFormatter(format);
  }

  private createFormatter(format: string): (date: Date) => string {
    return (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return format
        .replace('yyyy', String(year))
        .replace('yy', String(year).slice(-2))
        .replace('MM', month)
        .replace('dd', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
    };
  }

  execute(): string {
    return this.formatter(new Date());
  }
}

/**
 * 序列号编码规则
 * 从数据库获取并递增序列号
 */
export class SerialNumberCodeRule implements CodeRule {
  constructor(
    private readonly type: string,
    private readonly codePrefix: string,
    private readonly length: number = 4
  ) {
    if (!type) throw new Error('type参数不能为空');
    if (!codePrefix) throw new Error('编码前缀codePrefix不能为空');
    if (length > 100) throw new Error('长度参数不能大于100');
  }

  async executeAsync(): Promise<string> {
    const snRecord = await serialNumberService.getAndIncrementSn(
      this.type,
      this.codePrefix
    );

    if (!snRecord) {
      throw new Error(
        `未查询到编号--type:${this.type},codePrefix:${this.codePrefix}`
      );
    }

    return String(snRecord.sn).padStart(this.length, '0');
  }

  execute(): string {
    throw new Error('SerialNumberCodeRule需要使用executeAsync方法');
  }
}

/**
 * 编码生成器
 * 组合多个规则生成最终编码
 */
export class CodeGenerator {
  private rules: CodeRule[] = [];
  private asyncRules: SerialNumberCodeRule[] = [];

  addRule(rule: CodeRule): this {
    this.rules.push(rule);
    return this;
  }

  addAsyncRule(rule: SerialNumberCodeRule): this {
    this.asyncRules.push(rule);
    return this;
  }

  /**
   * 执行同步规则生成编码
   */
  execute(length?: number): string {
    const parts: string[] = [];
    for (const rule of this.rules) {
      parts.push(rule.execute(length));
    }
    return parts.join('');
  }

  /**
   * 执行所有规则（包括异步规则）生成编码
   */
  async executeAsync(length?: number): Promise<string> {
    const parts: string[] = [];

    // 执行同步规则
    for (const rule of this.rules) {
      parts.push(rule.execute(length));
    }

    // 执行异步规则
    for (const rule of this.asyncRules) {
      parts.push(await rule.executeAsync());
    }

    return parts.join('');
  }
}

/**
 * 编码生成器构建器
 */
export class CodeGeneratorBuilder {
  private generator: CodeGenerator = new CodeGenerator();

  static create(): CodeGeneratorBuilder {
    return new CodeGeneratorBuilder();
  }

  addConstantCodeRule(code: string): this {
    this.generator.addRule(new ConstantCodeRule(code));
    return this;
  }

  addDateTimeCodeRule(format?: string): this {
    this.generator.addRule(new DateTimeCodeRule(format));
    return this;
  }

  addSerialNumberCodeRule(
    type: string,
    codePrefix: string,
    length: number = 4
  ): this {
    this.generator.addAsyncRule(
      new SerialNumberCodeRule(type, codePrefix, length)
    );
    return this;
  }

  build(): CodeGenerator {
    return this.generator;
  }
}

/**
 * 业务编码前缀枚举
 * 统一管理各模块的编码前缀
 */
export enum CodePrefix {
  VK = 'VK', // 外销合同
  DT = 'DT', // 内销合同
  SG = 'SG', // 采购计划
  SK = 'SK', // 收款单
  FK = 'FK', // 付款单
  RE = 'RE', // 入库通知
  TT = 'TT', // 出库通知
  YS = 'YS', // 入库单
  CK = 'CK', // 出库单
  SP = 'SP', // 出运计划
  CY = 'CY', // 出运单
  BG = 'BG', // 报关单
  SJ = 'SJ', // 商检单
  JH = 'JH', // 结汇单
  MF = 'MF', // 制造单
  ST = 'ST', // 盘点单
  KH = 'KH', // 客户
}

/**
 * 编码类型枚举
 * 用于区分不同业务类型的序列号
 */
export enum CodeType {
  SALES_CONTRACT_EXPORT = 'SN_SALES_CONTRACT_EXPORT', // 外销合同
  SALES_CONTRACT_DOMESTIC = 'SN_SALES_CONTRACT_DOMESTIC', // 内销合同
  PURCHASE_PLAN = 'SN_PURCHASEPLAN', // 采购计划
  RECEIPT = 'SN_RECEIPT', // 收款单
  PAYMENT = 'SN_PAYMENT', // 付款单
  INBOUND_NOTICE = 'SN_INBOUND_NOTICE', // 入库通知
  OUTBOUND_NOTICE = 'SN_OUTBOUND_NOTICE', // 出库通知
  INBOUND = 'SN_INBOUND', // 入库单
  OUTBOUND = 'SN_OUTBOUND', // 出库单
  SHIPPING_PLAN = 'SN_SHIPPING_PLAN', // 出运计划
  SHIPPING = 'SN_SHIPPING', // 出运单
  CUSTOMS = 'SN_CUSTOMS', // 报关单
  INSPECTION = 'SN_INSPECTION', // 商检单
  SETTLEMENT = 'SN_SETTLEMENT', // 结汇单
  MANUFACTURE = 'SN_MANUFACTURE', // 制造单
  STOCKTAKING = 'SN_STOCKTAKING', // 盘点单
  CUSTOMER = 'SN_CUSTOMER', // 客户
}

/**
 * 编码生成API
 * 统一的编码生成接口
 */
export class CodeGeneratorApi {
  private cache: Map<string, CodeGenerator> = new Map();

  /**
   * 生成编码
   * 默认格式：前缀 + 日期(yyMM) + 4位序列号
   * @param type 编码类型
   * @param codePrefix 编码前缀
   */
  async generateCode(type: string, codePrefix: string): Promise<string> {
    const cacheKey = `${type}_${codePrefix}`;

    let generator = this.cache.get(cacheKey);
    if (!generator) {
      generator = CodeGeneratorBuilder.create()
        .addConstantCodeRule(codePrefix)
        .addDateTimeCodeRule('yyMM')
        .addSerialNumberCodeRule(type, codePrefix, 4)
        .build();
      this.cache.set(cacheKey, generator);
    }

    return generator.executeAsync(4);
  }

  /**
   * 生成编码（自定义格式）
   * @param type 编码类型
   * @param codePrefix 编码前缀
   * @param includeTime 是否包含日期
   * @param length 序列号长度
   */
  async generateCodeCustom(
    type: string,
    codePrefix: string,
    includeTime: boolean = true,
    length: number = 4
  ): Promise<string> {
    const cacheKey = `${type}_${codePrefix}_${includeTime}_${length}`;

    let generator = this.cache.get(cacheKey);
    if (!generator) {
      const builder = CodeGeneratorBuilder.create()
        .addConstantCodeRule(codePrefix)
        .addSerialNumberCodeRule(type, codePrefix, length);

      if (includeTime) {
        builder.addDateTimeCodeRule('yyMM');
      }

      generator = builder.build();
      this.cache.set(cacheKey, generator);
    }

    return generator.executeAsync(length);
  }

  /**
   * 生成销售合同编码
   * 格式：前缀(VK/DT) + 年份后两位 + 4位序列号 + 后缀
   */
  async generateSalesContractCode(params: {
    isExport: boolean;
    year: number;
    isInternal?: boolean;
    companyShortName?: string;
  }): Promise<string> {
    const { isExport, year, isInternal, companyShortName } = params;
    const prefix = isExport ? CodePrefix.VK : CodePrefix.DT;
    const yearSuffix = String(year).slice(-2);
    const type = isExport
      ? CodeType.SALES_CONTRACT_EXPORT
      : CodeType.SALES_CONTRACT_DOMESTIC;

    const codePrefixWithYear = `${prefix}${yearSuffix}`;

    const generator = CodeGeneratorBuilder.create()
      .addConstantCodeRule(codePrefixWithYear)
      .addSerialNumberCodeRule(type, codePrefixWithYear, 4)
      .build();

    let code = await generator.executeAsync(4);

    // 添加后缀
    if (!isInternal) {
      code += 'C';
    } else if (companyShortName) {
      code += companyShortName;
    }

    return code;
  }

  /**
   * 生成采购计划编码
   * 格式：SG + 2位年份 + 4位序列号
   */
  async generatePurchasePlanCode(): Promise<string> {
    const year = String(new Date().getFullYear()).slice(-2);
    const codePrefix = `${CodePrefix.SG}${year}`;

    return this.generateCode(CodeType.PURCHASE_PLAN, codePrefix);
  }

  /**
   * 生成收款单编码
   */
  async generateReceiptCode(): Promise<string> {
    return this.generateCode(CodeType.RECEIPT, CodePrefix.SK);
  }

  /**
   * 生成付款单编码
   */
  async generatePaymentCode(): Promise<string> {
    return this.generateCode(CodeType.PAYMENT, CodePrefix.FK);
  }

  /**
   * 生成入库通知编码
   */
  async generateInboundNoticeCode(): Promise<string> {
    return this.generateCode(CodeType.INBOUND_NOTICE, CodePrefix.RE);
  }

  /**
   * 生成出库通知编码
   */
  async generateOutboundNoticeCode(): Promise<string> {
    return this.generateCode(CodeType.OUTBOUND_NOTICE, CodePrefix.TT);
  }

  /**
   * 生成入库单编码
   */
  async generateInboundCode(): Promise<string> {
    return this.generateCode(CodeType.INBOUND, CodePrefix.YS);
  }

  /**
   * 生成出库单编码
   */
  async generateOutboundCode(): Promise<string> {
    return this.generateCode(CodeType.OUTBOUND, CodePrefix.CK);
  }

  /**
   * 生成出运计划编码
   */
  async generateShippingPlanCode(): Promise<string> {
    return this.generateCode(CodeType.SHIPPING_PLAN, CodePrefix.SP);
  }

  /**
   * 生成出运单编码
   */
  async generateShippingCode(): Promise<string> {
    return this.generateCode(CodeType.SHIPPING, CodePrefix.CY);
  }

  /**
   * 生成报关单编码
   */
  async generateCustomsCode(): Promise<string> {
    return this.generateCode(CodeType.CUSTOMS, CodePrefix.BG);
  }

  /**
   * 生成商检单编码
   */
  async generateInspectionCode(): Promise<string> {
    return this.generateCode(CodeType.INSPECTION, CodePrefix.SJ);
  }

  /**
   * 生成结汇单编码
   */
  async generateSettlementCode(): Promise<string> {
    return this.generateCode(CodeType.SETTLEMENT, CodePrefix.JH);
  }

  /**
   * 生成制造单编码
   */
  async generateManufactureCode(): Promise<string> {
    return this.generateCode(CodeType.MANUFACTURE, CodePrefix.MF);
  }

  /**
   * 生成盘点单编码
   */
  async generateStocktakingCode(): Promise<string> {
    return this.generateCode(CodeType.STOCKTAKING, CodePrefix.ST);
  }

  /**
   * 生成客户编码
   * 格式：KH + 年月(yyMM) + 4位序列号
   */
  async generateCustomerCode(): Promise<string> {
    return this.generateCode(CodeType.CUSTOMER, CodePrefix.KH);
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const codeGeneratorApi = new CodeGeneratorApi();
