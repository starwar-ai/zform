import prisma from '../config/database';

/**
 * 序列号服务
 * 用于管理各类业务编码的序列号
 */
export class SerialNumberService {
  /**
   * 根据类型和前缀获取序列号
   */
  async getSerialNumber(type: string, codePrefix: string) {
    return prisma.serialNumber.findUnique({
      where: {
        type_codePrefix: {
          type,
          codePrefix,
        },
      },
    });
  }

  /**
   * 获取并递增序列号（原子操作）
   * 如果不存在则创建新记录
   */
  async getAndIncrementSn(type: string, codePrefix: string) {
    // 使用事务确保原子性
    return prisma.$transaction(async (tx) => {
      // 尝试查找现有记录
      let snRecord = await tx.serialNumber.findUnique({
        where: {
          type_codePrefix: {
            type,
            codePrefix,
          },
        },
      });

      if (!snRecord) {
        // 如果不存在，创建新记录
        snRecord = await tx.serialNumber.create({
          data: {
            type,
            codePrefix,
            sn: 1,
          },
        });
        return snRecord;
      }

      // 递增序列号
      const updatedRecord = await tx.serialNumber.update({
        where: {
          id: snRecord.id,
        },
        data: {
          sn: {
            increment: 1,
          },
        },
      });

      return updatedRecord;
    });
  }

  /**
   * 创建序列号配置
   */
  async createSerialNumber(data: {
    type: string;
    codePrefix: string;
    sn?: number;
    remark?: string;
    createdBy?: string;
  }) {
    return prisma.serialNumber.create({
      data: {
        type: data.type,
        codePrefix: data.codePrefix,
        sn: data.sn ?? 1,
        remark: data.remark,
        createdBy: data.createdBy,
      },
    });
  }

  /**
   * 更新序列号配置
   */
  async updateSerialNumber(
    type: string,
    codePrefix: string,
    data: {
      sn?: number;
      remark?: string;
      updatedBy?: string;
    }
  ) {
    return prisma.serialNumber.update({
      where: {
        type_codePrefix: {
          type,
          codePrefix,
        },
      },
      data: {
        sn: data.sn,
        remark: data.remark,
        updatedBy: data.updatedBy,
      },
    });
  }

  /**
   * 删除序列号配置
   */
  async deleteSerialNumber(type: string, codePrefix: string) {
    return prisma.serialNumber.delete({
      where: {
        type_codePrefix: {
          type,
          codePrefix,
        },
      },
    });
  }

  /**
   * 分页查询序列号配置
   */
  async findMany(params: {
    page?: number;
    pageSize?: number;
    type?: string;
    codePrefix?: string;
  }) {
    const { page = 1, pageSize = 20, type, codePrefix } = params;

    const where = {
      ...(type && { type: { contains: type, mode: 'insensitive' as const } }),
      ...(codePrefix && {
        codePrefix: { contains: codePrefix, mode: 'insensitive' as const },
      }),
    };

    const [records, total] = await Promise.all([
      prisma.serialNumber.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.serialNumber.count({ where }),
    ]);

    return {
      records,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}

export const serialNumberService = new SerialNumberService();
