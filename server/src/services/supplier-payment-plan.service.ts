import prisma from '../config/database';

interface PaymentPlanItemInput {
  periodIndex: number;
  paymentTermId?: string;
  paymentRatio?: number;
  paymentDescription?: string;
  paymentDateBase?: number;
  daysOffset?: number;
}

interface CreatePaymentPlanInput {
  name: string;
  isDefault?: boolean;
  remark?: string;
  items: PaymentPlanItemInput[];
}

interface UpdatePaymentPlanInput {
  name?: string;
  isDefault?: boolean;
  remark?: string;
  items?: PaymentPlanItemInput[];
}

const planInclude = {
  items: {
    include: { paymentTerm: true },
    orderBy: { periodIndex: 'asc' as const },
  },
};

export class SupplierPaymentPlanService {
  // 获取供应商的所有付款方案
  async findBySupplierId(supplierId: string) {
    return prisma.supplierPaymentPlan.findMany({
      where: { supplierId, deleted: 0 },
      include: planInclude,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  // 获取单个方案详情
  async findById(id: string) {
    const plan = await prisma.supplierPaymentPlan.findUnique({
      where: { id },
      include: planInclude,
    });
    if (!plan || plan.deleted !== 0) throw new Error('付款方案不存在');
    return plan;
  }

  // 创建方案及明细
  async create(supplierId: string, data: CreatePaymentPlanInput, userId: string) {
    // 如果设为默认，先取消该供应商其他默认方案
    if (data.isDefault) {
      await prisma.supplierPaymentPlan.updateMany({
        where: { supplierId, isDefault: true, deleted: 0 },
        data: { isDefault: false },
      });
    }

    return prisma.supplierPaymentPlan.create({
      data: {
        supplierId,
        name: data.name,
        isDefault: data.isDefault ?? false,
        remark: data.remark,
        createdBy: userId,
        updatedBy: userId,
        items: {
          create: data.items.map((item) => ({
            periodIndex: item.periodIndex,
            paymentTermId: item.paymentTermId || undefined,
            paymentRatio: item.paymentRatio,
            paymentDescription: item.paymentDescription,
            paymentDateBase: item.paymentDateBase,
            daysOffset: item.daysOffset ?? 0,
          })),
        },
      },
      include: planInclude,
    });
  }

  // 更新方案（替换模式：先删明细再建）
  async update(id: string, data: UpdatePaymentPlanInput, userId: string) {
    const plan = await prisma.supplierPaymentPlan.findUnique({ where: { id } });
    if (!plan || plan.deleted !== 0) throw new Error('付款方案不存在');

    // 如果设为默认，先取消该供应商其他默认方案
    if (data.isDefault) {
      await prisma.supplierPaymentPlan.updateMany({
        where: { supplierId: plan.supplierId, isDefault: true, deleted: 0, id: { not: id } },
        data: { isDefault: false },
      });
    }

    // 如果有新的明细，先删后建
    if (data.items) {
      await prisma.supplierPaymentPlanItem.deleteMany({ where: { planId: id } });
    }

    return prisma.supplierPaymentPlan.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.remark !== undefined && { remark: data.remark }),
        updatedBy: userId,
        ...(data.items && {
          items: {
            create: data.items.map((item) => ({
              periodIndex: item.periodIndex,
              paymentTermId: item.paymentTermId || undefined,
              paymentRatio: item.paymentRatio,
              paymentDescription: item.paymentDescription,
              paymentDateBase: item.paymentDateBase,
              daysOffset: item.daysOffset ?? 0,
            })),
          },
        }),
      },
      include: planInclude,
    });
  }

  // 软删除
  async delete(id: string) {
    const plan = await prisma.supplierPaymentPlan.findUnique({ where: { id } });
    if (!plan || plan.deleted !== 0) throw new Error('付款方案不存在');

    return prisma.supplierPaymentPlan.update({
      where: { id },
      data: { deleted: 1 },
    });
  }

  // 设置默认方案
  async setDefault(supplierId: string, planId: string) {
    // 取消该供应商其他默认方案
    await prisma.supplierPaymentPlan.updateMany({
      where: { supplierId, isDefault: true, deleted: 0 },
      data: { isDefault: false },
    });

    return prisma.supplierPaymentPlan.update({
      where: { id: planId },
      data: { isDefault: true },
      include: planInclude,
    });
  }
}
