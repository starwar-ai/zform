import prisma from '../config/database';

/**
 * Currency Service
 *
 * 币种管理服务。
 */

export interface CurrencyItem {
  id: string;
  code: string;        // 币种代码 (如: USD)
  name: string;        // 币种名称 (如: 美元)
  symbol: string;      // 货币符号 (如: $)
  isCommon: boolean;   // 是否常用
  isEnabled: boolean;  // 是否启用
  orderNum: number;    // 排序号
  remark: string;      // 备注
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class CurrencyService {
  /** 获取所有币种 */
  async findAll(): Promise<CurrencyItem[]> {
    return prisma.currency.findMany({
      where: { deletedAt: null },
      orderBy: [
        { orderNum: 'asc' },
        { code: 'asc' }
      ]
    });
  }

  /** 根据ID获取币种 */
  async findById(id: string): Promise<CurrencyItem | null> {
    return prisma.currency.findFirst({
      where: { 
        id,
        deletedAt: null 
      }
    });
  }

  /** 根据币种代码获取币种 */
  async findByCode(code: string): Promise<CurrencyItem | null> {
    return prisma.currency.findFirst({
      where: { 
        code: code.toUpperCase(),
        deletedAt: null 
      }
    });
  }

  /** 创建币种 */
  async create(
    data: Omit<CurrencyItem, 'id' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt'>,
    userId?: string
  ): Promise<CurrencyItem> {
    return prisma.currency.create({
      data: {
        ...data,
        createdBy: userId || null,
        updatedBy: userId || null,
      }
    });
  }

  /** 更新币种 */
  async update(
    id: string,
    data: Partial<Omit<CurrencyItem, 'id' | 'createdBy' | 'createdAt'>>,
    userId?: string
  ): Promise<CurrencyItem | null> {
    try {
      return await prisma.currency.update({
        where: { id },
        data: {
          ...data,
          updatedBy: userId || null,
          updatedAt: new Date(),
        }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return null; // 记录不存在
      }
      throw error;
    }
  }

  /** 删除币种 */
  async delete(id: string, userId?: string): Promise<CurrencyItem | null> {
    try {
      return await prisma.currency.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedBy: userId || null,
          updatedAt: new Date(),
        }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        return null; // 记录不存在
      }
      throw error;
    }
  }

  /** 检查币种是否被引用 */
  async checkReferences(_id: string): Promise<boolean> {
    // TODO: 实现引用检查逻辑
    // 暂时返回false允许删除
    return false;
  }

  /** 批量更新排序 */
  async updateOrder(
    updates: { id: string; orderNum: number }[],
    userId?: string
  ): Promise<void> {
    const updatePromises = updates.map(update =>
      prisma.currency.update({
        where: { id: update.id },
        data: {
          orderNum: update.orderNum,
          updatedBy: userId || null,
          updatedAt: new Date(),
        }
      })
    );

    await Promise.all(updatePromises);
  }
}