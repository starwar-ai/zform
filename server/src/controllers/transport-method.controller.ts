/**
 * 运输方式控制器
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 获取所有运输方式
export async function getTransportMethods(req: any, res: any) {
  try {
    const methods = await prisma.transportMethod.findMany({
      where: {
        deletedAt: null
      },
      orderBy: [
        { isCommon: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    });
    
    res.json(methods);
  } catch (error) {
    console.error('获取运输方式失败:', error);
    res.status(500).json({ error: '获取运输方式失败' });
  }
}

// 创建运输方式
export async function createTransportMethod(req: any, res: any) {
  try {
    const { code, name, nameEn, isCommon, sortOrder, isEnabled, remark } = req.body;
    
    // 检查编码是否已存在
    const existing = await prisma.transportMethod.findUnique({
      where: { code }
    });
    
    if (existing) {
      return res.status(400).json({ error: '编码已存在' });
    }
    
    const method = await prisma.transportMethod.create({
      data: {
        code,
        name,
        nameEn: nameEn || null,
        isCommon: isCommon || false,
        sortOrder: sortOrder || 0,
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        remark: remark || null,
        createdBy: req.user?.id || 'system'
      }
    });
    
    res.status(201).json(method);
  } catch (error) {
    console.error('创建运输方式失败:', error);
    res.status(500).json({ error: '创建运输方式失败' });
  }
}

// 更新运输方式
export async function updateTransportMethod(req: any, res: any) {
  try {
    const { id } = req.params;
    const { code, name, nameEn, isCommon, sortOrder, isEnabled, remark } = req.body;
    
    // 如果提供了编码，检查是否与其他记录冲突
    if (code) {
      const existing = await prisma.transportMethod.findFirst({
        where: {
          code,
          id: { not: id },
          deletedAt: null
        }
      });
      
      if (existing) {
        return res.status(400).json({ error: '编码已存在' });
      }
    }
    
    const method = await prisma.transportMethod.update({
      where: { id },
      data: {
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(nameEn !== undefined && { nameEn: nameEn || null }),
        ...(isCommon !== undefined && { isCommon }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isEnabled !== undefined && { isEnabled }),
        ...(remark !== undefined && { remark: remark || null }),
        updatedBy: req.user?.id || 'system'
      }
    });
    
    res.json(method);
  } catch (error) {
    console.error('更新运输方式失败:', error);
    res.status(500).json({ error: '更新运输方式失败' });
  }
}

// 删除运输方式
export async function deleteTransportMethod(req: any, res: any) {
  try {
    const { id } = req.params;
    
    await prisma.transportMethod.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: req.user?.id || 'system'
      }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('删除运输方式失败:', error);
    res.status(500).json({ error: '删除运输方式失败' });
  }
}