/**
 * 销售合同 API 使用示例
 * 
 * 演示如何在前端调用销售合同的各种操作
 */

import { executeDocumentAction } from "@/apis/document-api"
import { useState } from "react"
import { Button } from "@/components/ui/button"

// ============================================================
// 1. 基础 CRUD 操作
// ============================================================

/**
 * 创建销售合同
 */
async function createSalesContract() {
  const response = await fetch('/api/documents/sales_contract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      masterData: {
        customerId: "cust-001",
        customerCode: "C001",
        customerName: "客户A",
        salesPerson: "张三",
        currency: "USD",
        contractType: "EXPORT",
        customerDeliveryDate: "2024-12-31",
      },
      detailData: {
        items: [
          {
            lineNumber: 1,
            productCode: "PROD-001",
            productName: "产品A",
            quantity: 1000,
            unitPrice: 10.50,
            unit: "PCS",
          }
        ]
      }
    })
  })
  
  const result = await response.json()
  console.log("创建成功:", result.data)
  return result.data
}

/**
 * 更新销售合同
 */
async function updateSalesContract(contractId: string) {
  const response = await fetch(`/api/documents/sales_contract/${contractId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      masterData: {
        remark: "更新备注信息"
      }
    })
  })
  
  return await response.json()
}

// ============================================================
// 2. 审核操作
// ============================================================

/**
 * 审核通过
 */
async function approveContract(contractId: string) {
  const result = await executeDocumentAction(
    "sales_contract",
    contractId,
    "approve",
    { approved: true }
  )
  
  console.log("审核通过:", result)
  return result
}

/**
 * 审核拒绝
 */
async function rejectContract(contractId: string) {
  const result = await executeDocumentAction(
    "sales_contract",
    contractId,
    "approve",
    { approved: false }
  )
  
  console.log("审核拒绝:", result)
  return result
}

/**
 * 批量审核
 */
async function batchApproveContracts(contractIds: string[], approved: boolean) {
  const result = await executeDocumentAction(
    "sales_contract",
    "batch",
    "batchApprove",
    { ids: contractIds, approved }
  )
  
  console.log("批量审核结果:", result)
  console.log(`成功: ${result.successCount}, 失败: ${result.errorCount}`)
  
  if (result.errors.length > 0) {
    console.error("失败的合同:", result.errors)
  }
  
  return result
}

// ============================================================
// 3. 状态管理
// ============================================================

/**
 * 更新合同状态
 */
async function updateContractStatus(contractId: string, status: string) {
  const result = await executeDocumentAction(
    "sales_contract",
    contractId,
    "updateStatus",
    { status }
  )
  
  console.log("状态更新成功:", result)
  return result
}

/**
 * 确认合同
 */
async function confirmContract(contractId: string) {
  const result = await executeDocumentAction(
    "sales_contract",
    contractId,
    "confirm",
    {}
  )
  
  console.log("合同确认成功:", result)
  return result
}

// ============================================================
// 4. 计算操作
// ============================================================

/**
 * 计算柜型
 */
async function calculateContainers(contractId: string) {
  const result = await executeDocumentAction(
    "sales_contract",
    contractId,
    "calculateContainers",
    {}
  )
  
  console.log("柜型计算结果:")
  console.log(`  总体积: ${result.totalVolume} m³`)
  console.log(`  20尺柜: ${result.container20ft}`)
  console.log(`  40尺柜: ${result.container40ft}`)
  console.log(`  40尺高柜: ${result.container40hq}`)
  console.log(`  散货: ${result.bulkCargo} m³`)
  
  return result
}

/**
 * 重新计算金额
 */
async function recalculateAmount(contractId: string) {
  const result = await executeDocumentAction(
    "sales_contract",
    contractId,
    "recalculateAmount",
    {}
  )
  
  console.log("金额重算结果:")
  console.log(`  总金额: ${result.totalAmount}`)
  console.log(`  总数量: ${result.totalQuantity}`)
  console.log(`  总箱数: ${result.totalBoxes}`)
  console.log(`  总体积: ${result.totalVolume}`)
  
  return result
}

// ============================================================
// 5. 关联数据查询
// ============================================================

/**
 * 查询关联单据
 */
async function getRelatedDocuments(contractId: string) {
  const result = await executeDocumentAction(
    "sales_contract",
    contractId,
    "getRelatedDocuments",
    {}
  )
  
  console.log("关联单据:")
  console.log(`  采购计划: ${result.summary.purchasePlansCount} 个`)
  console.log(`  加工单: ${result.summary.processingOrdersCount} 个`)
  console.log(`  入库单: ${result.summary.inboundsCount} 个`)
  console.log(`  出库单: ${result.summary.outboundsCount} 个`)
  
  return result
}

/**
 * 查询执行进度
 */
async function getExecutionProgress(contractId: string) {
  const result = await executeDocumentAction(
    "sales_contract",
    contractId,
    "getExecutionProgress",
    {}
  )
  
  console.log("执行进度:")
  console.log(`  合同编号: ${result.contractCode}`)
  console.log(`  合同状态: ${result.contractStatus}`)
  console.log(`  总计划: ${result.totalPlanned}`)
  console.log(`  已发货: ${result.totalShipped}`)
  console.log(`  剩余: ${result.totalRemaining}`)
  console.log(`  完成率: ${result.overallCompletionRate}%`)
  
  console.log("\n产品明细:")
  result.items.forEach((item: any) => {
    console.log(`  ${item.productCode}: ${item.shippedQuantity}/${item.plannedQuantity} (${item.completionRate}%)`)
  })
  
  return result
}

// ============================================================
// 6. 文档操作
// ============================================================

/**
 * 打印合同
 */
async function printContract(contractId: string) {
  const result = await executeDocumentAction(
    "sales_contract",
    contractId,
    "print",
    {}
  )
  
  console.log("打印成功:", result)
  return result
}

/**
 * 批量打印
 */
async function batchPrintContracts(contractIds: string[]) {
  const result = await executeDocumentAction(
    "sales_contract",
    "batch",
    "batchPrint",
    { ids: contractIds }
  )
  
  console.log(`批量打印成功: ${result.count} 个合同`)
  return result
}

/**
 * 回签合同
 */
async function signBackContract(contractId: string) {
  const result = await executeDocumentAction(
    "sales_contract",
    contractId,
    "signBack",
    {
      signBackDate: new Date().toISOString(),
      signBackDescription: "客户已签回确认",
      signBackAttachments: ["file1.pdf", "file2.pdf"]
    }
  )
  
  console.log("回签成功:", result)
  return result
}

/**
 * 复制合同
 */
async function copyContract(contractId: string, newCode?: string) {
  const result = await executeDocumentAction(
    "sales_contract",
    contractId,
    "copy",
    { newCode }
  )
  
  console.log("复制成功:", result.message)
  console.log("新合同ID:", result.data.id)
  return result.data
}

// ============================================================
// 7. 业务流程
// ============================================================

/**
 * 转采购计划
 */
async function convertToPurchasePlan(contractId: string) {
  const result = await executeDocumentAction(
    "sales_contract",
    contractId,
    "toPurchasePlan",
    {}
  )
  
  console.log("转采购计划成功:", result)
  return result
}

// ============================================================
// 8. 完整工作流示例
// ============================================================

/**
 * 完整的合同处理流程
 */
async function completeContractWorkflow() {
  try {
    // 1. 创建合同
    console.log("1. 创建销售合同...")
    const contract = await createSalesContract()
    const contractId = contract.id
    
    // 2. 计算柜型和金额
    console.log("\n2. 计算柜型和金额...")
    await calculateContainers(contractId)
    await recalculateAmount(contractId)
    
    // 3. 提交审核
    console.log("\n3. 提交审核...")
    await updateContractStatus(contractId, "PENDING")
    
    // 4. 审核通过
    console.log("\n4. 审核通过...")
    await approveContract(contractId)
    
    // 5. 确认合同
    console.log("\n5. 确认合同...")
    await confirmContract(contractId)
    
    // 6. 转采购计划
    console.log("\n6. 转采购计划...")
    await convertToPurchasePlan(contractId)
    
    // 7. 打印合同
    console.log("\n7. 打印合同...")
    await printContract(contractId)
    
    // 8. 查询执行进度
    console.log("\n8. 查询执行进度...")
    await getExecutionProgress(contractId)
    
    // 9. 查询关联单据
    console.log("\n9. 查询关联单据...")
    await getRelatedDocuments(contractId)
    
    console.log("\n✅ 合同处理流程完成!")
    
  } catch (error) {
    console.error("❌ 流程执行失败:", error)
    throw error
  }
}

// ============================================================
// 9. React 组件中的使用示例
// ============================================================

/**
 * 销售合同操作组件
 */
export function SalesContractActions({ contractId }: { contractId: string }) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<any>(null)

  const handleApprove = async () => {
    setLoading(true)
    try {
      await approveContract(contractId)
      alert("审核通过")
    } catch (error: any) {
      alert(`审核失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCalculate = async () => {
    setLoading(true)
    try {
      await calculateContainers(contractId)
      await recalculateAmount(contractId)
      alert("计算完成")
    } catch (error: any) {
      alert(`计算失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleViewProgress = async () => {
    setLoading(true)
    try {
      const result = await getExecutionProgress(contractId)
      setProgress(result)
    } catch (error: any) {
      alert(`查询失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button onClick={handleApprove} disabled={loading}>
        审核通过
      </Button>
      <Button onClick={handleCalculate} disabled={loading}>
        重新计算
      </Button>
      <Button onClick={handleViewProgress} disabled={loading}>
        查看进度
      </Button>

      {progress && (
        <div className="mt-4">
          <h3>执行进度: {progress.overallCompletionRate}%</h3>
          <div className="space-y-2">
            {progress.items.map((item: any) => (
              <div key={item.lineNumber}>
                {item.productCode}: {item.shippedQuantity}/{item.plannedQuantity}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// 10. 错误处理示例
// ============================================================

/**
 * 带错误处理的操作封装
 */
async function safeExecuteAction<T>(
  action: () => Promise<T>,
  errorMessage: string
): Promise<T | null> {
  try {
    return await action()
  } catch (error: any) {
    console.error(errorMessage, error)
    
    // 根据错误类型进行处理
    if (error.response?.status === 403) {
      alert("权限不足")
    } else if (error.response?.status === 404) {
      alert("合同不存在")
    } else if (error.response?.status === 400) {
      alert(`操作失败: ${error.message}`)
    } else {
      alert("系统错误，请稍后重试")
    }
    
    return null
  }
}

// 使用示例
async function safeApproveContract(contractId: string) {
  return await safeExecuteAction(
    () => approveContract(contractId),
    "审核操作失败"
  )
}

export {
  createSalesContract,
  updateSalesContract,
  approveContract,
  rejectContract,
  batchApproveContracts,
  updateContractStatus,
  confirmContract,
  calculateContainers,
  recalculateAmount,
  getRelatedDocuments,
  getExecutionProgress,
  printContract,
  batchPrintContracts,
  signBackContract,
  copyContract,
  convertToPurchasePlan,
  completeContractWorkflow,
  safeExecuteAction,
}
