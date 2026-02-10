/**
 * Concession Acceptance Schemas
 *
 * 让步接收单单据定义（基于后端 Prisma Schema）
 */

import type { DocumentSchema, ChangeRule } from "@/core/types"

// ============================================================
// 让步接收单 (Concession Acceptance)
// ============================================================

export const concessionAcceptanceSchema: DocumentSchema = {
  typeId: "concession_acceptance",
  typeName: "让步接收单",
  masterFields: [
    // === 基本信息 ===
    {
      id: "code",
      label: "单号",
      type: "text",
      readOnly: true,
      required: true,
      group: "基本信息",
    },
    {
      id: "approvalStatus",
      label: "审核状态",
      type: "select",
      options: [
        { label: "待审核", value: "PENDING" },
        { label: "已审核", value: "APPROVED" },
        { label: "已拒绝", value: "REJECTED" },
      ],
      defaultValue: "PENDING",
      required: true,
      group: "基本信息",
    },

    // === 验货单关联 ===
    {
      id: "inspectionOrderId",
      label: "验货单主键",
      type: "text",
      readOnly: true,
      group: "验货单关联",
    },

    // === 保函信息 ===
    {
      id: "guaranteeFlag",
      label: "保函标记",
      type: "checkbox",
      defaultValue: false,
      group: "保函信息",
    },
    {
      id: "guarantee",
      label: "保函",
      type: "textarea",
      span: 4,
      group: "保函信息",
    },

    // === 让步描述 ===
    {
      id: "concessionDescription",
      label: "让步描述",
      type: "textarea",
      span: 4,
      group: "让步信息",
    },
  ],
  detailTables: [],
}

// ============================================================
// 让步接收单变更规则
// ============================================================

export const concessionAcceptanceChangeRule: ChangeRule = {
  typeId: "concession_acceptance",
  watchFields: [
    "master.approvalStatus",
    "master.concessionDescription",
  ],
  evaluate: (_oldDoc, _newDoc, _downstreamDocs) => {
    // 让步接收单暂无下游单据，变更影响评估为空
    return []
  },
}
