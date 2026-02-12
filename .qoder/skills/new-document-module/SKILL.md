---
name: new-document-module
description: Guide for creating new document modules in the Zform ERP system. Use when the user requests to add a new document type, create a new business module, or add a new form/schema to the system.
---

# New Document Module Workflow

This skill guides the creation of new document modules (e.g., 付款单, 收款登记) in the Zform ERP system.

## Quick Reference

When creating a new document module, follow these 4 steps:

```
Task Progress:
- [ ] Step 1: Add Prisma model to schema.prisma
- [ ] Step 2: Create frontend schema file
- [ ] Step 3: Register schema in setup.ts
- [ ] Step 4: Add menu in seed.ts and run migration
```

---

## Step 1: Add Prisma Model

**File:** `server/prisma/schema.prisma`

1. Add status enums at the appropriate location (search for existing enums):
```prisma
enum YourDocStatus {
  DRAFT
  SUBMITTED
  APPROVED
  CANCELLED
}
```

2. Add the main model at the end of the file:
```prisma
model YourDocument {
  id String @id @default(cuid())

  // Basic info
  code   String           @unique
  status YourDocStatus    @default(DRAFT)
  
  // Business fields...
  
  // Timestamps
  createdBy String?   @map("created_by")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedBy String?   @map("updated_by")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  // Relations
  items YourDocumentItem[] @relation("YourDocumentItems")

  @@index([code])
  @@index([status])
  @@map("your_documents")
}

model YourDocumentItem {
  id String @id @default(cuid())

  yourDocumentId String       @map("your_document_id")
  yourDocument   YourDocument @relation("YourDocumentItems", fields: [yourDocumentId], references: [id], onDelete: Cascade)

  // Detail fields...

  @@index([yourDocumentId])
  @@map("your_document_items")
}
```

**Important naming conventions:**
- Use `@map("snake_case")` for database column names
- Use `@@map("snake_case_table_name")` for table names
- Add indexes for frequently queried fields

---

## Step 2: Create Frontend Schema

**File:** `src/schemas/your-document-schemas.ts`

```typescript
import type { DocumentSchema, ChangeRule } from "@/core/types"

export const yourDocumentSchema: DocumentSchema = {
  typeId: "your_document",  // Must match Prisma model table name (singular)
  typeName: "你的单据名称",
  masterFields: [
    // === 基本信息 ===
    {
      id: "code",
      label: "编号",
      type: "text",
      readOnly: true,
      required: true,
      group: "基本信息",
    },
    {
      id: "status",
      label: "状态",
      type: "select",
      options: [
        { label: "草稿", value: "DRAFT" },
        { label: "待审核", value: "SUBMITTED" },
        { label: "已审核", value: "APPROVED" },
        { label: "已取消", value: "CANCELLED" },
      ],
      defaultValue: "DRAFT",
      required: true,
      group: "基本信息",
    },
    // Add more fields organized by groups...
  ],
  detailTables: [
    {
      id: "items",
      label: "明细",
      editable: true,
      fields: [
        // Detail fields...
      ],
    },
  ],
}

export const yourDocumentChangeRule: ChangeRule = {
  typeId: "your_document",
  watchFields: ["master.status"],
  evaluate: (oldDoc, newDoc, downstreamDocs) => {
    const impacts = []
    // Add change impact logic...
    return impacts
  },
}
```

---

## Step 3: Register Schema

**File:** `src/schemas/setup.ts`

1. Add import:
```typescript
import {
  yourDocumentSchema,
  yourDocumentChangeRule,
} from "./your-document-schemas"
```

2. Register schema (find the registration section):
```typescript
registry.registerSchema(yourDocumentSchema)
```

3. Register change rule:
```typescript
registry.registerChangeRule(yourDocumentChangeRule)
```

4. Add list action config:
```typescript
const yourDocumentActionConfig: DocumentListActionConfig = {
  typeId: "your_document",
  rowActions: [
    { id: "open", label: "打开" },
    { id: "copy-id", label: "复制ID" },
    {
      id: "delete",
      label: "删除",
      danger: true,
      modes: ["document"],
      visible: (row) => row._status === "draft",
      permission: "your_document:delete",
    },
  ],
  toolbarActions: [
    { id: "create", label: "新建", icon: "Plus", variant: "outline", permission: "your_document:create" },
  ],
}
```

5. Add form action config:
```typescript
const yourDocumentFormActions: DocumentFormActionConfig = {
  typeId: "your_document",
  actions: [
    { id: "save", label: "保存", icon: "Save", variant: "outline", allowedStatuses: ["draft"], order: 1 },
    { id: "submit", label: "提交", icon: "Send", allowedStatuses: ["draft"], permission: "your_document:submit", order: 2 },
    // Add more actions...
  ],
}
```

6. Register action configs:
```typescript
registry.registerActionConfig(yourDocumentActionConfig)
registry.registerFormActionConfig(yourDocumentFormActions)
```

---

## Step 4: Add Menu and Run Migration

**File:** `server/prisma/seed.ts`

1. Add menu creation (find parent menu, e.g., `financeEntryMenu`):
```typescript
const yourDocumentMenu = await prisma.sysMenu.create({
  data: {
    title: '你的单据名称',
    icon: 'FileText',
    path: '/type-list/your_document',
    parentId: financeEntryMenu.id,  // Change to appropriate parent
    orderNum: 3,
    menuType: 'menu',
    status: 'visible',
  },
});
```

2. Add button permissions:
```typescript
const yourDocumentBtnIds = await createDocPermButtons(yourDocumentMenu.id, 'your_document', [
  ...basicDocActions,
  { perm: 'close', title: '关闭' },
  // Add more permissions as needed
]);
```

3. Add to `allBtnIds` array:
```typescript
...yourDocumentBtnIds,
```

4. Add to menu arrays (`allMenuIds`, `managerMenuIds`, `userMenuIds`):
```typescript
yourDocumentMenu.id,
```

5. Add to `userBtnIds`:
```typescript
...yourDocumentBtnIds.slice(0, 3),
```

## Run Commands

After completing all file modifications:

```bash
cd server
npx prisma generate
npx prisma migrate dev --name add_your_document
npx ts-node prisma/seed.ts
```

## Menu Parent Reference

| Parent Menu | Variable Name | Typical Documents |
|-------------|---------------|-------------------|
| 业务入口 | businessEntryMenu | 销售合同, 采购计划, 采购合同 |
| 财务入口 | financeEntryMenu | 付款申请, 付款单, 收款登记 |
| 单证入口 | documentEntryMenu | 出运计划, 出运单证 |
| 资料入口 | dataEntryMenu | 产品管理, 客户管理, 供应商管理 |
| 质检入口 | qualityEntryMenu | 验货单, 让步接收单 |
| 仓库入口 | warehouseEntryMenu | 库存查询, 入库管理, 出库管理 |

## Common Field Types

| Type | Usage |
|------|-------|
| `text` | Short text input |
| `textarea` | Multi-line text |
| `number` | Numeric input |
| `date` | Date picker |
| `select` | Dropdown with options |
| `checkbox` | Boolean toggle |

## Field Properties

- `id`: Field identifier (matches Prisma field name)
- `label`: Display label (Chinese)
- `type`: Field type
- `required`: Is field mandatory
- `readOnly`: Is field editable
- `group`: Group name for form organization
- `span`: Column span (default 2, use 4 for full width)
- `options`: For select fields
- `defaultValue`: Default value for new documents
