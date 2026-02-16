/**
 * 收款计划服务 (SmsCollectionPlan)
 * 基于 zexport CollectionPlan，支持分期付款如 "T/T 20%预付，余款发货后30天"
 */

import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export type CollectionPlanCreateInput = {
  salesContractId: string;
  step: number;
  paymentMethod?: number;
  paymentName?: string;
  dateType?: number;
  startDate?: Date;
  days: number;
  expectedReceiptDate?: Date;
  collectionRatio: number | Decimal;
  receivableAmount: number | Decimal;
  receivedAmount?: number | Decimal;
  controlPurchaseFlag?: number;
  controlShipmentFlag?: number;
  exeStatus?: number;
  children?: unknown;
  differenceReason?: unknown;
};

export type CollectionPlanUpdateInput = Partial<CollectionPlanCreateInput>;

export class CollectionPlanService {
  constructor() {}

  async findBySalesContractId(salesContractId: string) {
    return prisma.smsCollectionPlan.findMany({
      where: {
        salesContractId,
        deletedAt: null,
      },
      orderBy: { step: 'asc' },
    });
  }

  async findById(id: string) {
    const plan = await prisma.smsCollectionPlan.findFirst({
      where: { id, deletedAt: null },
    });
    if (!plan) throw new Error('收款计划不存在');
    return plan;
  }

  async create(data: CollectionPlanCreateInput, userId: string) {
    return prisma.smsCollectionPlan.create({
      data: {
        ...data,
        receivedAmount: data.receivedAmount ?? 0,
        controlPurchaseFlag: data.controlPurchaseFlag ?? 0,
        controlShipmentFlag: data.controlShipmentFlag ?? 0,
        exeStatus: data.exeStatus ?? 0,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async createMany(
    salesContractId: string,
    plans: Omit<CollectionPlanCreateInput, 'salesContractId'>[],
    userId: string
  ) {
    if (plans.length === 0) return [];

    const created = await prisma.$transaction(
      plans.map((p, index) =>
        prisma.smsCollectionPlan.create({
          data: {
            salesContractId,
            step: p.step ?? index + 1,
            paymentMethod: p.paymentMethod,
            paymentName: p.paymentName,
            dateType: p.dateType,
            startDate: p.startDate,
            days: p.days ?? 0,
            expectedReceiptDate: p.expectedReceiptDate,
            collectionRatio: p.collectionRatio,
            receivableAmount: p.receivableAmount,
            receivedAmount: p.receivedAmount ?? 0,
            controlPurchaseFlag: p.controlPurchaseFlag ?? 0,
            controlShipmentFlag: p.controlShipmentFlag ?? 0,
            exeStatus: p.exeStatus ?? 0,
            children: p.children as Prisma.JsonInput | undefined,
            differenceReason: p.differenceReason as Prisma.JsonInput | undefined,
            createdBy: userId,
            updatedBy: userId,
          },
        })
      )
    );
    return created;
  }

  async update(id: string, data: CollectionPlanUpdateInput, userId: string) {
    await this.findById(id);
    return prisma.smsCollectionPlan.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
    });
  }

  async delete(id: string, userId: string) {
    await this.findById(id);
    return prisma.smsCollectionPlan.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  async deleteBySalesContractId(salesContractId: string, userId: string) {
    return prisma.smsCollectionPlan.updateMany({
      where: { salesContractId },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  // 批量更新收款计划（替换模式：先删后建）
  async upsertBySalesContractId(
    salesContractId: string,
    plans: Omit<CollectionPlanCreateInput, 'salesContractId'>[],
    userId: string
  ) {
    await this.deleteBySalesContractId(salesContractId, userId);
    if (plans.length === 0) return [];
    return this.createMany(salesContractId, plans, userId);
  }

  // 更新实收金额并计算执行状态
  async updateReceivedAmount(
    id: string,
    receivedAmount: number | Decimal,
    userId: string
  ) {
    const plan = await this.findById(id);
    const receivable = Number(plan.receivableAmount);
    const received = Number(receivedAmount);

    let exeStatus = 0;
    if (received >= receivable) exeStatus = 2; // 已执行
    else if (received > 0) exeStatus = 1; // 部分执行

    const realRatio = receivable > 0 ? (received / receivable) * 100 : 0;

    return prisma.smsCollectionPlan.update({
      where: { id },
      data: {
        receivedAmount,
        realCollectionRatio: realRatio,
        exeStatus,
        updatedBy: userId,
      },
    });
  }

  // 计算预计收款日（根据 startDate + days）
  static calcExpectedReceiptDate(startDate: Date, days: number): Date {
    const d = new Date(startDate);
    d.setDate(d.getDate() + days);
    return d;
  }
}
