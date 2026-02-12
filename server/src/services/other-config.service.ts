/**
 * OtherConfigService
 *
 * 其他配置管理服务。
 */

import prisma from '../config/database';
import type { OtherConfig, ConfigParameter } from '@prisma/client';

export interface OtherConfigWithParameters extends OtherConfig {
  parameters: ConfigParameter[];
}

export interface UpdateParameterValueInput {
  value: string;
}

export class OtherConfigService {
  /** 获取所有配置（含参数） */
  async findAll(): Promise<OtherConfigWithParameters[]> {
    return prisma.otherConfig.findMany({
      where: { deletedAt: null },
      include: {
        parameters: {
          orderBy: { orderNum: 'asc' },
        },
      },
      orderBy: { orderNum: 'asc' },
    });
  }

  /** 获取单个配置（含参数） */
  async findById(id: string): Promise<OtherConfigWithParameters | null> {
    return prisma.otherConfig.findFirst({
      where: { id, deletedAt: null },
      include: {
        parameters: {
          orderBy: { orderNum: 'asc' },
        },
      },
    });
  }

  /** 更新参数值 */
  async updateParameterValue(
    configId: string,
    parameterId: string,
    value: string,
    userId?: string
  ): Promise<ConfigParameter> {
    // 验证参数属于该配置
    const parameter = await prisma.configParameter.findFirst({
      where: { id: parameterId, configId },
    });

    if (!parameter) {
      throw new Error('参数不存在');
    }

    // 更新参数值
    const updated = await prisma.configParameter.update({
      where: { id: parameterId },
      data: { value },
    });

    // 更新配置的 updatedAt 和 updatedBy
    await prisma.otherConfig.update({
      where: { id: configId },
      data: { updatedBy: userId || null },
    });

    return updated;
  }

  /** 批量更新参数值 */
  async updateParameterValues(
    configId: string,
    parameters: { id: string; value: string }[],
    userId?: string
  ): Promise<ConfigParameter[]> {
    const updated: ConfigParameter[] = [];

    for (const param of parameters) {
      const result = await this.updateParameterValue(configId, param.id, param.value, userId);
      updated.push(result);
    }

    return updated;
  }
}
