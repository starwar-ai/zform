# ZForm - 企业单据管理系统

## 项目概述

ZForm 是一个 Schema-driven 的企业单据管理前端框架，核心能力包括：
- **动态表单**: 根据 Schema 定义自动渲染主数据表单和明细表格
- **单据下推**: 从上游单据（如销售合同）自动生成下游单据（如采购计划）
- **追溯关系**: 下游单据自动关联来源单据和明细行，支持双向追溯
- **变更影响评估**: 修改已有下游单据的上游单据时，自动评估影响范围并阻止危险变更

## 技术栈

- **React** + TypeScript + Vite
- **TanStack Table** - 明细表格
- **Zustand** + Immer - 状态管理
- **shadcn/ui** + Tailwind CSS v4 + Radix UI - UI 组件
- **Zod** - 数据校验（预留）

## 项目结构

```
src/
├── core/                    # 核心引擎（纯逻辑，无 UI 依赖）
│   ├── types.ts             # 所有类型定义
│   ├── registry.ts          # 全局单据注册中心
│   ├── push-down.ts         # 下推引擎
│   ├── traceability.ts      # 追溯引擎
│   ├── impact.ts            # 变更影响评估引擎
│   └── index.ts             # barrel export
├── stores/
│   └── document-store.ts    # Zustand 单据 Store
├── hooks/
│   └── use-document.ts      # React hooks
├── components/
│   ├── ui/                  # shadcn/ui 基础组件
│   ├── field-renderer.tsx   # 字段渲染器
│   ├── master-form.tsx      # 主数据表单
│   ├── detail-table.tsx     # 明细表格（TanStack Table）
│   ├── document-form.tsx    # 完整单据表单（主表单 + 明细 + 追溯 + 影响评估）
│   ├── document-list.tsx    # 单据列表
│   ├── trace-panel.tsx      # 追溯面板
│   └── impact-dialog.tsx    # 影响评估对话框
├── examples/
│   ├── schemas.ts           # 示例业务定义（销售合同→采购计划→采购合同）
│   └── setup.ts             # 注册示例 Schema
├── lib/
│   └── utils.ts             # cn() 等工具函数
├── App.tsx                  # 应用入口
├── main.tsx                 # React 挂载点
└── index.css                # Tailwind v4 主题变量
```

## 核心概念

### 1. DocumentSchema（单据 Schema）

每种单据由 `DocumentSchema` 定义，包含：
- `typeId` / `typeName` - 类型标识和名称
- `masterFields: FieldDef[]` - 主数据字段定义
- `detailTables: DetailTableDef[]` - 明细表定义

### 2. DocumentData（单据数据）

运行时的单据数据结构：
- `masterData: Record<string, unknown>` - 主数据
- `detailTables: DetailTableData[]` - 明细数据，每个明细表含多行 `DetailRow`
- `sourceRef?: SourceRef` - 来源追溯引用

### 3. PushDownRule（下推规则）

定义如何从一种单据生成另一种：
- `masterFieldMappings` - 主数据字段映射
- `detailMappings` - 明细数据映射（含行级字段映射和行过滤器）
- 下推时自动建立 `SourceRef` 追溯关系

### 4. ChangeRule（变更规则）

定义单据变更时的影响评估逻辑：
- `watchFields` - 监控的字段
- `evaluate()` - 给定旧值、新值和下游单据，返回影响列表
- 影响级别: `info` / `warning` / `critical`（critical 会阻止变更）

## 开发命令

```bash
npm install          # 安装依赖
npm run dev          # 启动开发服务器
npm run build        # 类型检查 + 构建
npm run preview      # 预览构建产物
```

## 添加新单据类型

1. 在 `src/examples/schemas.ts`（或新文件）中定义 `DocumentSchema`
2. 定义 `PushDownRule` 连接上下游单据
3. 定义 `ChangeRule` 设置变更规则
4. 在 setup 函数中调用 `registry.registerSchema()` / `registerPushDownRule()` / `registerChangeRule()`

## 编码约定

- 核心逻辑 (`src/core/`) 不依赖 React，保持纯函数和可测试性
- UI 组件使用 shadcn/ui，路径别名 `@/components/ui/`
- Store 使用 Zustand + Immer，mutations 写在 immer 的 set 回调中
- 字段路径格式: `"master.fieldId"` 或 `"detail.tableId.fieldId"`
- 中文用于 UI 显示和注释，英文用于代码标识符
- Tailwind CSS v4 使用 `--color-*` 前缀定义主题色
