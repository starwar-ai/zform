import prisma from '../config/database';

interface PaymentPlanItemInput {
  periodIndex: number;
  paymentTermId?: string;
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
    include: {
      paymentTerm: {
        include: { steps: { orderBy: { stepOrder: 'asc' as const } } },
      },
    },
    orderBy: { periodIndex: 'asc' as const },
  },
};

export class CustomerPaymentPlanService {
  // 获取客户的所有付款方案
  async findByCustomerId(customerId: string) {
    return prisma.salesContractPaymentPlan.findMany({
      where: { customerId, deleted: 0 },
      include: planInclude,
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  // 获取单个方案详情
  async findById(id: string) {
    const plan = await prisma.salesContractPaymentPlan.findUnique({
      where: { id },
      include: planInclude,
    });
    if (!plan || plan.deleted !== 0) throw new Error('付款方案不存在');
    return plan;
  }

  // 创建方案及明细
  async create(customerId: string, data: CreatePaymentPlanInput, userId: string) {
    // 如果设为默认，先取消该客户其他默认方案
    if (data.isDefault) {
      await prisma.salesContractPaymentPlan.updateMany({
        where: { customerId, isDefault: true, deleted: 0 },
        data: { isDefault: false },
      });
    }

    return prisma.salesContractPaymentPlan.create({
      data: {
        customerId,
        name: data.name,
        isDefault: data.isDefault ?? false,
        remark: data.remark,
        createdBy: userId,
        updatedBy: userId,
        items: {
          create: data.items.map((item) => ({
            periodIndex: item.periodIndex,
            paymentTermId: item.paymentTermId || undefined,

          })),
        },
      },
      include: planInclude,
    });
  }

  // 更新方案（替换模式：先删明细再建）
  async update(id: string, data: UpdatePaymentPlanInput, userId: string) {
    const plan = await prisma.salesContractPaymentPlan.findUnique({ where: { id } });
    if (!plan || plan.deleted !== 0) throw new Error('付款方案不存在');

    // 如果设为默认，先取消该客户其他默认方案
    if (data.isDefault) {
      await prisma.salesContractPaymentPlan.updateMany({
        where: { customerId: plan.customerId, isDefault: true, deleted: 0, id: { not: id } },
        data: { isDefault: false },
      });
    }

    // 如果有新的明细，先删后建
    if (data.items) {
      await prisma.salesContractPaymentPlanItem.deleteMany({ where: { planId: id } });
    }

    return prisma.salesContractPaymentPlan.update({
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

            })),
          },
        }),
      },
      include: planInclude,
    });
  }

  // 软删除
  async delete(id: string) {
    const plan = await prisma.salesContractPaymentPlan.findUnique({ where: { id } });
    if (!plan || plan.deleted !== 0) throw new Error('付款方案不存在');

    return prisma.salesContractPaymentPlan.update({
      where: { id },
      data: { deleted: 1 },
    });
  }

  // 设置默认方案
  async setDefault(customerId: string, planId: string) {
    // 取消该客户其他默认方案
    await prisma.salesContractPaymentPlan.updateMany({
      where: { customerId, isDefault: true, deleted: 0 },
      data: { isDefault: false },
    });

    return prisma.salesContractPaymentPlan.update({
      where: { id: planId },
      data: { isDefault: true },
      include: planInclude,
    });
  }
}
