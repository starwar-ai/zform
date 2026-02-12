# New session - 2026-02-12T13:55:24.788Z

**Session ID:** ses_3addd680bffeGgfU22DgjnKJf6
**Created:** 2026/2/12 21:55:24
**Updated:** 2026/2/12 22:16:23

---

## User

帮我整理下这个系统业务规则。只需要业务规则，不需要具体的字段。

---

## Assistant (Build · claude-opus-4-6 · 136.7s)



I'll explore the codebase to understand the system's business rules. Let me start by examining the project structure and key files.

**Tool: task**

**Input:**
```json
{
  "description": "Explore codebase structure",
  "prompt": "Explore the codebase at C:\\Projects\\z\\zexport to understand the overall project structure. I need to understand:\n1. What type of project this is (language, framework, etc.)\n2. The top-level directory structure\n3. Key configuration files (package.json, pom.xml, etc.)\n4. The main source code directories and their structure\n\nRead the top-level directory listing first, then explore key subdirectories. Return a comprehensive summary of the project structure, including the main modules/packages and what they seem to do based on their names and structure.",
  "subagent_type": "explore"
}
```

**Output:**
```
task_id: ses_3addd0b27ffeH3ZEhrDK9cRpJJ (for resuming to continue this task if needed)

<task_result>
Now I have a comprehensive understanding of the project. Here is the full summary:

---

## Project Summary: EPlus (zexport)

### What It Is

This is a **foreign trade / export ERP system** called **EPlus** (the database is named `foreign_trade`). It is a full-stack, multi-language, monorepo-style project built on top of the **YuDao (芋道)** open-source admin framework. The system manages the complete export trade lifecycle: sales contracts, procurement, warehousing, shipping/customs documentation, and finance.

---

### Technology Stack

| Layer | Technology |
|---|---|
| **Frontend (client/)** | Vue 3 + TypeScript + Vite 4 + Element Plus + Pinia + UnoCSS |
| **Backend (server/)** | Java 17, Spring Boot 2.7, Maven multi-module, MyBatis, Flowable BPM, Lombok, MapStruct |
| **Database** | MySQL 8.0 (via Docker), Redis 5.0 |
| **Data Analytics (data/)** | Python 3.10+, Streamlit, Pandas, SQLAlchemy, PyEcharts |
| **Currency Service (currency/)** | Node.js, Express, sql.js (SQLite), Axios (USD/CNY exchange rates) |
| **Tools Service (tools/)** | Node.js, Express, MySQL2, multi-database API |
| **Deployment** | PowerShell scripts, Nginx reverse proxy, SCP/SSH to Linux server (192.168.10.25) |

---

### Top-Level Directory Structure

```
C:\Projects\z\zexport\
  client/              -- Vue 3 frontend (admin UI)
  server/              -- Java Spring Boot backend (Maven multi-module)
  data/                -- Python Streamlit data analytics dashboard
  currency/            -- Node.js micro-service for exchange rates
  tools/               -- Node.js Express utility API server
  deploy-direct.ps1    -- PowerShell deployment script (build + upload + restart)
  deploy-quick.ps1     -- Quick deployment variant
  nginx.conf           -- Nginx config (port 18030 frontend, 18031 backend API)
  graph.md             -- Document flow / business process graph (Mermaid diagrams)
```

---

### Backend (server/) -- Java Maven Multi-Module

The server is the heart of the system. It follows a two-tier module pattern: each business module has an `-api` sub-module (DTOs, enums, API interfaces) and a `-biz` sub-module (controllers, services, DAL).

#### Framework / Infrastructure Modules (inherited from YuDao)

| Module | Purpose |
|---|---|
| `yudao-dependencies` | BOM (Bill of Materials) for dependency version management |
| `yudao-framework/` | Core framework with ~28 Spring Boot starters (security, mybatis, redis, excel, file, websocket, flowable BPM, data-permission, desensitize, IP, job scheduling, MQ, monitoring, etc.) |
| `eplus-framework/` | Custom EPlus extensions on top of yudao-framework (`eplus-common/`) |
| `yudao-server/` | The main runnable Spring Boot application (produces `yudao-server.jar`) |
| `eplus-flyway/` | Flyway database migration scripts |
| `eplus-api-aggregator/` | API aggregation (POM-only, collects all module APIs) |

#### Platform Modules (inherited from YuDao)

| Module | Purpose |
|---|---|
| `yudao-module-system` | User, role, permission, tenant, dept, dict, config management |
| `yudao-module-infra` | Infrastructure: code generation, file storage, API logs, data source |
| `yudao-module-bpm` | Business Process Management (Flowable-based workflows) |

#### Business Modules (EPlus custom -- the export trade domain)

| Module | Likely Meaning | Purpose |
|---|---|---|
| `eplus-module-sms` | **Sales Management System** | Quotations, sale contracts, collection plans, add/sub items |
| `eplus-module-scm` | **Supply Chain Management** | Purchase plans, purchase contracts, payment applications, invoicing notices |
| `eplus-module-wms` | **Warehouse Management System** | Stock notices, inbound/outbound bills, stocktake, adjustments, transfers |
| `eplus-module-dms` | **Document/Shipping Management System** | Shipment plans, shipments, customs declarations, commodity inspections, forwarder fees, settlement forms |
| `eplus-module-fms` | **Finance Management System** | Receipts (collections), payments, bank registrations |
| `eplus-module-crm` | **Customer Relationship Management** | Customer/client management |
| `eplus-module-pms` | **Product Management System** | Product catalog / master data |
| `eplus-module-oa` | **Office Automation** | Reimbursements, loan/travel/payment/repayment applications |
| `eplus-module-qms` | **Quality Management System** | Quality inspection/control |
| `eplus-module-ems` | **Equipment/Asset Management** | Equipment or asset tracking |
| `eplus-module-dtms` | **Data/Document Template Management** | Document templates or data management |
| `eplus-module-mms` | **Manufacturing Management** | Manufacturing orders |
| `eplus-module-exms` | **Exhibition/Expo Management** | Trade show / exhibition management |
| `eplus-module-pjms` | **Project Management System** | Project tracking |
| `eplus-module-report` | **Reporting** | Business reports |
| `eplus-module-home` | **Home/Dashboard** | Dashboard / homepage backend APIs |
| `eplus-module-dpms` | **Data Permission Management** | Data-level access control |
| `eplus-module-social` | **Social/WeChat Integration** | WeCom/WeChat integration |
| `eplus-module-infra` | **EPlus Infra extensions** | Additional infrastructure beyond the yudao base |

Each business module follows the same internal structure:
```
eplus-module-XXX/
  pom.xml
  eplus-module-XXX-api/    -- DTOs, enums, RPC API interfaces
  eplus-module-XXX-biz/    -- Controllers, Services, DAL, mappers
```

---

### Frontend (client/) -- Vue 3 Admin UI

Based on the **yudao-ui-admin-vue3** framework (v1.8.3-snapshot). Uses pnpm, Vite, TypeScript, Element Plus, Pinia state management, Vue Router, vue-i18n, ECharts, BPMN.js, WangEditor, and UnoCSS.

**Key source directories (`client/src/`):**

| Directory | Purpose |
|---|---|
| `api/` | HTTP API client modules (one folder per business domain: crm, scm, sms, wms, dms, fms, oa, pms, qms, ems, exms, mms, pjms, etc.) |
| `views/` | Vue page components organized by domain (mirrors the api/ structure) |
| `components/` | Shared/reusable UI components |
| `router/` | Vue Router configuration |
| `store/` | Pinia stores |
| `layout/` | Application layout (sidebar, header, etc.) |
| `locales/` | i18n translation files |
| `hooks/` | Composable hooks |
| `utils/` | Utility functions |
| `plugins/` | Plugin registrations |
| `directives/` | Custom Vue directives |
| `styles/` | Global SCSS styles |

---

### Data Analytics Dashboard (data/)

A **Python Streamlit** multi-page dashboard for business intelligence:

| File/Dir | Purpose |
|---|---|
| `app.py` | Main entry -- KPI overview (sales, purchasing, receipts, payments, net cash flow) |
| `pages/1_销售分析.py` | Sales analysis page |
| `pages/2_采购分析.py` | Purchasing analysis page |
| `pages/3_库存分析.py` | Inventory analysis page |
| `pages/4_财务分析.py` | Finance analysis page |
| `src/services/` | Backend service layer: `sales_stats.py`, `purchase_stats.py`, `inventory_stats.py`, `finance_stats.py` |
| `src/database.py` | SQLAlchemy database connection |
| `src/models/` | Data models |
| `src/export/` | Excel export functionality |

---

### Currency Service (currency/)

A standalone **Node.js Express** micro-service that fetches and stores USD/CNY exchange rates. Uses sql.js (in-memory SQLite), Swagger docs, and stores historical rates in a CSV file (`daily_currencys_rate.csv`).

---

### Tools Service (tools/)

A **Node.js Express** utility API server with multi-database MySQL support. Provides routes for:
- `sales.js` -- Sales data queries
- `purchase.js` -- Purchase data queries
- `products.js` -- Product data queries
- `database.js` -- Database operations
- `commonQueries.js` -- Reusable query templates
- `query.js` -- Generic query endpoint

Also includes CSV-to-JSON conversion utilities and DDL/DQL script directories.

---

### Core Business Flow

As documented in `graph.md`, the core document flow is:

**Quotation -> Sales Contract -> Purchase Plan -> Purchase Contract -> Inbound Notice -> Inbound Bill -> Inventory -> Outbound Notice -> Outbound Bill -> Shipment Plan -> Shipment -> Customs Declaration / Commodity Inspection -> Settlement Form -> Receipt (Collection)**

With a parallel finance flow: **Purchase Contract -> Payment Application -> Payment**

This is a textbook **export trade ERP** pipeline covering the full lifecycle from customer quotation through manufacturing/procurement, warehousing, export shipping, customs, and financial settlement.

---

### Deployment

- The backend builds into a single `yudao-server.jar` via Maven
- The frontend builds into static files via `pnpm build:pro`
- PowerShell scripts (`deploy-direct.ps1`) handle building, SCP upload to a Linux server, and remote restart
- Nginx serves the frontend on port **18030** and proxies `/admin-api/` to the Spring Boot backend on port **18031**
- Docker Compose provides MySQL 8.0 and Redis 5.0 for development
</task_result>
```

---

## Assistant (Build · claude-opus-4-6 · 570.7s)

Good, I now have a comprehensive understanding of the project. Let me dive deeper into the business modules to extract the specific business rules.

**Tool: task**

**Input:**
```json
{
  "description": "Explore SMS sales module rules",
  "prompt": "Explore the business rules in the Sales Management System (SMS) module at C:\\Projects\\z\\zexport\\server\\eplus-module-sms. \n\nI need to understand the business rules (NOT field definitions, but business logic/rules). Focus on:\n1. Read the service implementation files (ServiceImpl.java) in the biz module to find validation rules, state transitions, calculation logic, constraints\n2. Read the enum files in the api module to understand status flows and business constants\n3. Look at controller files for workflow/approval logic\n4. Check for any listener or event handler files\n\nKey things to extract:\n- Status/state machines and transitions (e.g., draft -> submitted -> approved)\n- Validation rules (e.g., \"cannot do X when Y\", \"must have Z before doing W\")\n- Calculation rules (e.g., how totals are computed, currency conversions)\n- Business constraints (e.g., \"one contract can have multiple items\", \"quantity must match\")\n- Workflow/approval rules\n- Cross-module interactions (e.g., sales contract triggers purchase plan)\n\nRead through the main service implementation files thoroughly. Return a detailed summary of ALL business rules found, organized by entity/process.",
  "subagent_type": "explore"
}
```

**Output:**
```
task_id: ses_3addb22ddffeSAXb01w7WQf88c (for resuming to continue this task if needed)

<task_result>
Now I have read all the critical files. Let me compile the comprehensive business rules summary.

---

# SMS (Sales Management System) Module -- Comprehensive Business Rules

## 1. SALE CONTRACT -- Status/State Machine

### 1.1 Sale Contract Status Flow
Defined in `SaleContractStatusEnum`:

```
(1) WAITING_FOR_SUBMISSION  - "待提交"
(2) WAITING_FOR_APPROVAL    - "待审核"
(3) WAITING_FOR_COUNTERSIGNATURE - "待回签"
(4) REJECTED               - "已驳回"
(5) WAITING_FOR_PROCUREMENT - "待采购"
(6) WAITING_FOR_SHIPMENT   - "待出运"
(7) COMPLETED              - "已完成"
(8) CASE_CLOSED            - "已作废"
```

### 1.2 State Transitions by Contract Type

**Export Sale Contract (外销合同, SaleType=1):**
```
WAITING_FOR_SUBMISSION(1) --[submit]--> WAITING_FOR_APPROVAL(2)
WAITING_FOR_APPROVAL(2) --[approve]--> WAITING_FOR_COUNTERSIGNATURE(3)
WAITING_FOR_APPROVAL(2) --[cancel]--> WAITING_FOR_SUBMISSION(1)
WAITING_FOR_APPROVAL(2) --[reject/other]--> WAITING_FOR_APPROVAL(2)  [stays, no explicit rejection state]
WAITING_FOR_COUNTERSIGNATURE(3) --[signback]--> WAITING_FOR_PROCUREMENT(5)
WAITING_FOR_PROCUREMENT(5) --[toContract/push purchase plan]--> WAITING_FOR_SHIPMENT(6)
WAITING_FOR_SHIPMENT(6) --[close]--> CASE_CLOSED(8)
```

**Domestic Sale Contract (内销合同, SaleType=2):**
```
WAITING_FOR_SUBMISSION(1) --[submit]--> WAITING_FOR_APPROVAL(2)
WAITING_FOR_APPROVAL(2) --[approve]--> WAITING_FOR_COUNTERSIGNATURE(3)
WAITING_FOR_APPROVAL(2) --[reject/other]--> WAITING_FOR_APPROVAL(2)
```
Special: For internal customers (内部客户), upon approval, the system auto-generates a purchase contract and handles stock, then transitions directly to **COMPLETED(7)**.

**Factory Sale Contract (外币采购合同, SaleType=3):**
```
WAITING_FOR_SUBMISSION(1) --[submit]--> WAITING_FOR_APPROVAL(2)
WAITING_FOR_APPROVAL(2) --[approve]--> WAITING_FOR_COUNTERSIGNATURE(3)
WAITING_FOR_APPROVAL(2) --[reject/other]--> WAITING_FOR_APPROVAL(2)
```

### 1.3 Change Order Status Flow
When a contract is changed after approval, it goes through a change approval process:
- If ALL changed fields are "ordinary level" (普通级), changes apply directly without approval.
- If ANY changed field is "approval required" level, a change approval workflow is initiated.
- Approved change: original contract gets `changeStatus = CHANGED`; change data is written back.
- Rejected/cancelled change: original contract reverts to `changeStatus = NOT_CHANGED`.

---

## 2. SALE CONTRACT -- Validation Rules

### 2.1 Creation Validation Rules

| Rule | Details |
|------|---------|
| **Internal customer full stock** | For domestic sale contracts (SaleType=2), if customer is an internal customer, ALL items must use stock only (needPurQuantity must be 0). Exception: `INTERNAL_CUST_NOT_ALL_STOCK`. |
| **Lock quantity constraint** | `currentLockQuantity` must NOT exceed `quantity` (sale quantity). Exception: `SALE_CONTRACT_ITEM_LOCK_QUANTITY_ERROR` or `SALE_CONTRACT_ITEM_LOCK_EXCEED`. |
| **Outer box packing quantity** | `qtyPerOuterbox` must NOT be 0 for any product. Exception: `CURRENCY_ITEM_OUTERBOX_NUM`. |
| **Total volume non-zero** | `totalVolume` must NOT be 0 (division guard). Exception: `CONTRACT_ZERO_VOLUME`. |
| **Currency rate existence** | The exchange rate for the contract currency must exist in the daily rate table. Exception: `NOT_FOUND_CONTRACT_RATE`, `CONTRACT_CURRENCY_RATE_INVALID`. |
| **Contract code uniqueness** | Generated code is checked for uniqueness; if duplicate found, re-generates. |
| **Sale contract date default** | If `saleContractDate` is null, defaults to `LocalDateTime.now()`. |
| **Tax refund rate default** | If `realTaxRefundRate` is null or zero, defaults to `taxRefundRate`. |
| **Domestic contract tax** | For domestic sale contracts, `taxRefundRate` is forced to `BigDecimal.ZERO` and `taxRefundPrice` is zeroed. |

### 2.2 Change Validation Rules

| Rule | Details |
|------|---------|
| **Order path change blocked** | If contract is in `WAITING_FOR_SHIPMENT` status and the order path (companyPath) tree structure changed, the change is blocked. Exception: `EXISTS_NEST_ORDER`. |
| **Deleted items with purchase** | Deleted sale items that already have downstream purchase contract items are rejected. Exception: `SALE_CONTRACT_ITEM_EXISTS_PURCHASE`. |
| **Partially voided items** | If some downstream purchase/shipment items are voided but others are not for the same sale item, the change is NOT allowed. Exception: `NOT_ALLOW_CHANGE`. |

### 2.3 Push to Purchase Plan Validation

| Rule | Details |
|------|---------|
| **Status must be "待采购"** | Can only push to purchase plan when status = `WAITING_FOR_PROCUREMENT(5)`. Exception: `CONTRACT_CONVERTED_PURCHASE_PLAN`. |
| **Collection plan check** | Collection plan must be executed/validated before pushing to purchase plan. Exception: `COLLECT_PLAN_NOT_EXECUTED`. |
| **Same company path** | All sale contracts pushed to the same shipment plan must have the same order path. Exception: `DIFFERENT_PATH_EXCEPTION`. |
| **Same departure port** | Exception: `DEPARTURE_PORT_NOT_SAME`. |
| **Same destination port** | Exception: `DESTINATION_PORT_NOT_SAME`. |
| **Same transport type** | Exception: `TRANSPORT_TYPE_NOT_SAME`. |
| **Same settlement terms** | Exception: `SETTLEMENT_TERM_TYPE_NOT_SAME`. |
| **Same foreign trade company** | Exception: `ONLY_ALLOW_PUSH_SAME_FOREIGN_COMPANY`. |
| **Same account set** | Only items from the same account set (账套) can be pushed together. Exception: `ONLY_ALLOW_PUSH_SAME_COMPANY`. |
| **Shipment quantity constraint** | Shipment quantity must NOT exceed sale quantity. Exception: `SHIPMENT_QUANTITY_EXCEED`. |

### 2.4 Out-Stock Notice Validation

| Rule | Details |
|------|---------|
| **Already converted flag** | If sale item already has `converNoticeFlag = YES`, it cannot create another out-stock notice. Exception: `SALE_CONTRACT_ITEM_CONVERTED_NOTICE`. |
| **Stock availability** | BOM component stock must be sufficient for auto-manufacturing. Exception: `STOCK_QUANTITY_NOT_ENOUGH`. |
| **Outer box packing non-zero** | `qtyPerOuterbox` must not be 0 when computing box count. Exception: `QTY_PEROUTERBOX_ZERO`. |

---

## 3. CALCULATION RULES

### 3.1 Contract Number Generation
- **Export contracts**: Prefix = `"VK" + shortYear` (e.g., `VK26`), 4-digit sequence, suffix `"C"` for non-internal.
- **Domestic contracts**: Prefix = `"DT" + shortYear` (e.g., `DT26`), 4-digit sequence, suffix `"C"` for non-internal.
- **Internal (auto) contracts**: Append the company short name instead of `"C"`.

### 3.2 Container/Cabinet Calculation (Volume-based thresholds)
Volumes are in cubic centimeters. Recursive algorithm:

| Volume Range (cm^3) | Container Type |
|---------------------|---------------|
| > 68,000,000 | 40ft High Cube (40尺高柜), divide and recurse remainder |
| 59,000,000 < V <= 68,000,000 | 1x 40ft High Cube |
| 49,000,000 < V <= 59,000,000 | 1x 40ft Standard (40尺柜) |
| 29,000,000 < V <= 49,000,000 | 20ft Container (20尺柜), divide and recurse remainder |
| 20,000,000 <= V <= 29,000,000 | 1x 20ft Container |
| < 20,000,000 | Bulk cargo (散货), BUT if the bulk handling cost exceeds 20ft cabinet fee, upgrade to 1x 20ft container |

**Bulk Handling Cost Formula**: `bulkHandlingStartFee + (ceil(volumeInCBM) - 1) * bulkHandlingFee`

### 3.3 Freight Cost Distribution per Item
```
itemEstimatedTotalFreight = (totalEstimatedFreight * outerBoxVolume * boxCount) / totalVolume
itemTrailerFee = (trailerFee / totalVolume) * outerBoxVolume * boxCount
```

### 3.4 Box Count Calculation
```
boxCount = ceil(quantity / qtyPerOuterbox)
```

### 3.5 Tax Refund Calculation
```
taxRefundPrice = [purchaseWithTaxPrice * quantity * currencyRate / (1 + taxRefundRate)] * taxRefundRate
```
Where taxRefundRate is expressed as a decimal (e.g., 0.13 for 13%).

### 3.6 Commission Calculation
When commission type is rate-based (not fixed fee):
```
commissionAmount = totalSaleAmount * (commissionRate / 100)
```

### 3.7 Platform Fee Calculation
```
platformFee = SUM(item.totalSaleAmount) * platformFeeRate  [from system config]
```

### 3.8 Total Sale Amount
```
totalAmount = (totalGoodsValue * exchangeRate) + (additionAmount * additionCurrencyRate) - (deductionAmount * deductionCurrencyRate)
totalAmountUSD = totalAmount / usdRate
```

### 3.9 Collection Plan Amount Calculation
```
totalPlanAmount = collectionTotal - (deductions/contractRate) + (additions/contractRate)
receivableAmount = totalPlanAmount * (collectionRatio / 100)
```

### 3.10 Gross Profit Calculation
```
Revenue = (totalGoodsValue * rate) + (totalVatRefund * rate) + (additionAmount * rate)
Cost = totalPurchase + estimatedPackingMaterials + accessoriesPurchase + estimatedTotalFreight
       + inspectionFee + platformFee + deductionAmount + insuranceFee + sinosureFee + commission + subCommissionAmount
GrossProfit = Revenue - Cost
GrossProfitMargin = GrossProfit / Revenue
```

### 3.11 Item-Level Profit Calculation
```
Revenue(RMB) = totalSaleAmount * currencyRate + taxRefundPrice
Cost(RMB) = purchaseWithTaxPrice * purchaseRate * purchaseQuantity
            + commissionAmount
            + packagingPrice * purchaseRate * saleQuantity
            + forecastTotalCost [freight proportional to volume]
            + insurance proportional share
            + platformFee proportional share
Profit = Revenue - Cost
ProfitMargin = Profit / Revenue
```

### 3.12 Stock Lock Price
```
stockLockTotalPrice = SUM(stockPrice[batchCode] * lockQuantity[batchCode])
stockLockPrice = stockLockTotalPrice / totalLockQuantity
```

---

## 4. BUSINESS CONSTRAINTS

### 4.1 Contract Structure
- One sale contract can have **multiple sale contract items** (children).
- One sale contract can have **multiple add/sub items** (加减项, addition/deduction adjustments).
- One sale contract can have **multiple collection plans** (收款计划).
- Each sale item has a **unique code** (`uniqueCode`) and a **source unique code** (`sourceUniqueCode`) for split tracking.

### 4.2 Item Splitting
- Sale items can be **split** for different purchase sources. Split items share the same `sourceUniqueCode` as the parent.
- When deleting split items, the quantities roll back to the parent item.
- Split rollback recalculates: `parentQuantity += splitQuantity`, `needPurQuantity` recalculated accordingly.

### 4.3 Stock Locking
- Lock stock is released and re-locked on every update (cancel + re-lock pattern).
- `realLockQuantity = currentLockQuantity` at creation.
- `needPurQuantity = quantity - realLockQuantity` (computed on change approval writeback).
- Stock lock source type = `SALE_CONTRACT`.

### 4.4 Own-Brand SKU Processing
- If a sale item is an own-brand product (`ownBrandFlag=YES`) but NOT a customer product (`custProFlag=NO`), the system auto-converts it to a customer product for the current customer.
- The system also backfills `cskuCode` (customer SKU code) and `barcode` to the product master if missing.

### 4.5 Collection Plan Defaults
- If no collection plan is provided at creation, the system fetches the default collection plan from the customer master data.

---

## 5. WORKFLOW/APPROVAL RULES

### 5.1 BPM Process Keys
| Contract Type | Approval Process Key | Change Process Key |
|---|---|---|
| Export (外销) | `PROCESS_DEFINITION_KEY_EXPORT` | `PROCESS_DEFINITION_CHANGE_KEY` |
| Domestic (内销) | `PROCESS_DEFINITION_KEY_DOMESTIC` | `DOMESTIC_DEFINITION_CHANGE_KEY` |
| Factory (外币采购) | `PROCESS_DEFINITION_KEY_FACTORY` | `FACTORY_DEFINITION_CHANGE_KEY` |

### 5.2 Submit on Create/Update
- If `submitFlag = SUBMIT`, the contract is immediately submitted to the BPM workflow after save.
- The status changes to `WAITING_FOR_APPROVAL(2)` and `auditStatus = PROCESS`.

### 5.3 Approval Callbacks (Listeners)
**Export Contract Approval** (`ExportSaleContractAuditResultListener`):
- APPROVE --> status = `WAITING_FOR_COUNTERSIGNATURE(3)`
- CANCEL --> status = `WAITING_FOR_SUBMISSION(1)`
- Other (reject etc.) --> status stays `WAITING_FOR_APPROVAL(2)`

**Domestic Contract Approval** (`DomesticSaleContractAuditResultListener`):
- APPROVE --> status = `WAITING_FOR_COUNTERSIGNATURE(3)`
- Other --> status stays `WAITING_FOR_APPROVAL(2)`

**Factory Contract Approval** (`FactoryContractAuditResultListener`):
- APPROVE --> status = `WAITING_FOR_COUNTERSIGNATURE(3)`
- Other --> status stays `WAITING_FOR_APPROVAL(2)`

### 5.4 Post-Approval Logic (`updateAuditStatus`)
On APPROVE:
1. Mark items with `realLockQuantity > 0` as `reLockFlag = YES`.
2. **For domestic contracts with internal customers**:
   - Auto-generate a purchase contract (status = FINISHED, auditStatus = APPROVED).
   - Handle stock movements (out-bill from current company, in-bill to internal company).
   - Auto-complete production orders.
   - Contract status is set to `COMPLETED(7)`.

### 5.5 Change Approval Callbacks
**Export/Factory Change** (`ExportContractChangeResultListener`, `FactoryContractChangeAuditResultListener`):
- APPROVE --> update effect range status (cascade to downstream).
- BACK/REJECT/CANCEL --> revert original contract `changeStatus` to not-in-change.

**Domestic Change** (`DomesticSaleContractChangeResultListener`):
- APPROVE --> update effect range status.
- CANCEL --> revert original contract `changeStatus`.

---

## 6. CROSS-MODULE INTERACTIONS

### 6.1 SMS --> SCM (Purchase Management)
- **Push to Purchase Plan**: Sale contract (status=待采购) pushes items to create a `PurchasePlan` via `purchasePlanApi.createPurchasePlan()`. Status changes to `WAITING_FOR_SHIPMENT(6)`.
- **Auto Purchase Contract**: For internal-customer domestic contracts, auto-generates purchase contracts via `purchaseContractApi.genPurchaseContract()`.
- **Change cascades**: Changes to sale items cascade to purchase plans/contracts. Voided sale items trigger cancellation of corresponding purchase plan items via `purchaseContractApi.cancelPurchasePlanItem()`.
- **Purchase price writeback**: Real purchase prices are written back from purchase contracts to sale items.

### 6.2 SMS --> WMS (Warehouse Management)
- **Stock Locking**: `stockApi.batchLockStock()` / `stockApi.cancelStockLock()` for locking/releasing inventory.
- **Out-Stock Notice**: `iStockNoticeApi.createNotice()` creates stock-out notice for shipment.
- **Stock Cabinet Quantity Update**: `iStockApi.updateStockCabinetQuantity()` updates cabinet-pulled quantities.
- **Auto Manufacturing**: For composite products, auto-triggers manufacturing via `shipmentApi.batchManufactureSku()` and `purchaseContractApi.completeOrderTask()`.

### 6.3 SMS --> DMS (Shipment Management)
- **Push to Shipment Plan**: Sale items push to shipment plans.
- **Change cascades**: Changes to sale items cascade to shipment plans. Voided items trigger `shipmentApi.cancelShipmentPlanItem()`.
- **Effect range**: Changes check downstream shipment impact and require confirmation.

### 6.4 SMS --> CRM (Customer Management)
- **Internal customer check**: `custApi.checkIsInternalCust()` determines if special processing is needed.
- **Collection plan defaults**: `custApi.getCollectionPlanDTOByCustCode()` fetches default collection plans.
- **Customer product creation**: Own-brand products auto-convert to customer-specific products.

### 6.5 SMS --> PMS (Product Management)
- **SKU validation/enrichment**: `skuApi.validateOwnbrandSku()`, `skuApi.updateCSkuCodeByCode()`, `skuApi.updateBarcodeByCode()`.
- **BOM processing**: `skuApi.getSonSkuListBySkuCode()` for composite product decomposition during stock validation.

### 6.6 SMS --> FMS (Financial Management)
- **Receipt/Payment**: `receiptApi`, `custClaimApi` for payment tracking against collection plans.

### 6.7 SMS --> Infrastructure
- **Order Link Tracking**: `orderLinkApi.createOrderLink()` / `updateOrderLinkStatus()` maintains the full order lifecycle chain.
- **Exchange Rates**: `rateApi.getDailyRateMapByDate()` provides daily currency rates for all calculations.
- **System Config**: `configApi.getConfigMap()` provides cabinet fees, platform fee rates, and other system parameters.
- **Code Generation**: `codeGeneratorApi.getCodeGenerator()` generates sequential contract codes.

---

## 7. QUOTATION (报价单) BUSINESS RULES

### 7.1 Quotation Status Flow
```
PENDING_SUBMIT(1) --[submit]--> PENDING_APPROVAL(2)
PENDING_APPROVAL(2) --[approve]--> APPROVED(3)
PENDING_APPROVAL(2) --[reject]--> REJECTED(4)
PENDING_APPROVAL(2) --[cancel]--> PENDING_SUBMIT(1)
APPROVED(3) --[finish]--> CASE_CLOSED(5)
```

### 7.2 Quotation Validation Rules
- Container quantities (20ft, 40ft, 40ft HC, bulk volume) are validated against the same volume-threshold algorithm used for sale contracts.
- Box count must not be null or <= 0.
- Outer box volume must not be empty.
- Report template must be in APPROVED status for export/print.

### 7.3 Quotation Export/Print
- Quotation amounts are converted to USD for display using daily rates.
- Quote validity days = `now - validPeriod`.
- Unit conversion: if English imperial units selected, dimensions are converted by dividing by 2.54 (cm to inches).
- Print flag is set to YES after printing.

---

## 8. SALE AUXILIARY ALLOCATION (辅料分摊) BUSINESS RULES

### 8.1 Constraints
- Sale contract must exist and be valid.
- Auxiliary purchase contract item must exist.
- Sale contract item list must not be empty.
- SKU information must exist for all referenced products.

### 8.2 Allocation Logic
- Allocates auxiliary material (辅料) costs across sale contract items.
- Quantity used for allocation is the `needPurQuantity` of each sale item.
- Cancellation deletes all allocations for a given auxiliary purchase item.

---

## 9. PROFIT ALLOCATION (利润率分配) ENUMS

### 9.1 AllocateTypeEnum
- `NONE(1)` - No allocation (不分配)
- `FIX_RATIO(2)` - Fixed profit ratio (固定利润率)
- `RANDOM_RATIO(3)` - Random profit ratio (随机利润率)

### 9.2 AllocateConditionTypeEnum
Conditions for profit allocation:
- `NONE(1)` - No condition
- `GT(2)` - Greater than (>)
- `GE(3)` - Greater than or equal (>=)
- `LT(4)` - Less than (<)
- `LE(5)` - Less than or equal (<=)

---

## 10. DELETE CASCADE RULES

When a sale contract is deleted:
1. Release all locked stock for that contract.
2. Delete all sale contract items.
3. Delete all add/sub items.
4. Delete all collection plans.

When updating a sale contract:
- Items not in the new payload are deleted.
- Stock locks for deleted items are cancelled.
- Add/sub items and collection plans are fully replaced (delete all, re-insert non-deleted).

---

## 11. KEY CONFIGURATION-DRIVEN PARAMETERS

The system reads from `configApi.getConfigMap()`:
- `TWENTY_FOOT_CABINET_FEE` - 20ft container fee
- `FORTY_FOOT_CABINET_FEE` - 40ft container fee
- `FORTY_FOOT_CONTAINER_FEE` - 40ft high cube fee
- `BULK_HANDLING_FEE` - Bulk cargo per-CBM fee
- `BULK_HANDLING_START_FEE` - Bulk cargo base fee
- `PLATFORM_FEE_RATE` - Platform fee rate (applied to total sale amount)
- `purchase.plan.day` - Days to subtract from delivery date for purchase plan (default 7)
</task_result>
```

**Tool: task**

**Input:**
```json
{
  "description": "Explore SCM procurement rules",
  "prompt": "Explore the business rules in the Supply Chain Management (SCM) module at C:\\Projects\\z\\zexport\\server\\eplus-module-scm.\n\nI need to understand the business rules (NOT field definitions, but business logic/rules). Focus on:\n1. Read the service implementation files (ServiceImpl.java) in the biz module to find validation rules, state transitions, calculation logic, constraints\n2. Read the enum files in the api module to understand status flows and business constants\n3. Look at controller files for workflow/approval logic\n4. Check for any listener or event handler files\n\nKey things to extract:\n- Status/state machines and transitions\n- Validation rules\n- Calculation rules (price, quantity, amounts)\n- Business constraints\n- Workflow/approval rules\n- Cross-module interactions (e.g., purchase plan from sales, payment applications)\n\nRead through the main service implementation files thoroughly. Return a detailed summary of ALL business rules found, organized by entity/process.",
  "subagent_type": "explore"
}
```

**Output:**
```
task_id: ses_3addb1828ffen90zkIuMaXX4r5 (for resuming to continue this task if needed)

<task_result>
I now have a comprehensive understanding of the entire SCM module. Let me compile the complete business rules summary.

---

# SCM Module Business Rules -- Comprehensive Analysis

## 1. PURCHASE PLAN (采购计划)

### 1.1 Status/State Machine
The Purchase Plan follows this lifecycle:
- **PENDING_SUBMIT** (待提交) -- initial state on creation, also set on cancel/unsubmitted
- **PENDING_APPROVAL** (待审批) -- when audit status becomes PROCESS
- **REJECTED** (驳回) -- when audit status becomes REJECT
- **PROCUREMENT_PENDING** (待采购) -- when audit status becomes APPROVE
- **COMPLETED** (已完成) -- when all plan items have `needPurQuantity == purchaseQuantity + convertedQuantity`, or when all items have `needPurQuantity == 0` (stock-only purchase)
- **CASE_CLOSED** (已作废) -- when explicitly finished/cancelled

State transitions driven by `updateAuditStatus()`:
```
UNSUBMITTED -> PENDING_SUBMIT
PROCESS     -> PENDING_APPROVAL
APPROVE     -> PROCUREMENT_PENDING
REJECT      -> REJECTED
CANCEL      -> PENDING_SUBMIT
```

### 1.2 Validation Rules
- **Currency check**: All item currencies must belong to the internal company's available currency list (`checkCurrencyByCompany`). Exception: auxiliary (包材) plans skip this check.
- **Lock quantity constraints**: `lockQuantity <= saleQuantity` (error: PURCHASE_PLAN_LOCK_MORE); `saleLockQuantity <= lockQuantity` (error: PURCHASE_PLAN_LOCK_LESS).
- **Edit prohibition**: Cannot edit while in PROCESS (审核中) audit status.
- **Product list required**: Children items list cannot be empty.
- **Split cancellation**: Source purchase plans cannot be cancelled if there are un-cancelled split purchase plans derived from them.

### 1.3 Calculation Rules
- **Box count**: `boxCount = ceil(needPurQuantity / qtyPerOuterbox)` (outer box quantity, rounded up).
- **Unit price without tax**: `unitPrice = withTaxPrice * 100 / (taxRate + 100)`, scaled to 2 decimal places.
- **Converted flag logic** (`updatePurchasePlanItemConvertedFlag`):
  - If `needPurQuantity == purchaseQuantity + convertedQuantity` -> CONVERTED
  - If `convertedQuantity == 0` -> NOT_CONVERTED
  - Otherwise -> PART_CONVERTED
  - The `convertedQuantity` is updated to `purchaseQuantity + convertedQuantity`.

### 1.4 Code Generation
- Pattern: If sale contract code exists: `{saleContractCode}R{sequence}`; if not: `SG{2-digit-year}{4-digit-sequence}`.
- Sequence type: `SN_PURCHASEPLAN`.

### 1.5 Workflow/Approval
- Standard plans: process key `scm_purchase_plan`, with conditional routing on `ownBrandFlag` (self-branded products trigger different path when `ownBrandFlag > 0`).
- Auxiliary plans: process key `scm_purchase_plan_auxiliary`, with dynamic multi-instance approvers gathered from related purchase contract buyers, sale contract salespeople, and managers.
- On creation, sets sales contract item `purchaseFlag` to YES.

### 1.6 Cross-Module Interactions
- **Sales (SMS)**: Writes back `purchaseFlag` on sale contract items; on cancellation, releases sale item stock locks via `saleContractApi.rollbackSaleContractItemSourceList()` and `reLockStock()`.
- **Warehouse (WMS)**: Locks stock via `stockApi.batchLockStock()`, cancels locks via `stockApi.cancelStockLock()`.
- **Product (PMS)**: Fetches HS data (customs data) for SKU units, validates own-brand SKU existence.
- **Order Link (Infra)**: Creates order link tracking entries.

### 1.7 Stock Lock Logic
- When plan items have stock lock batches, the system:
  1. Releases existing sale contract stock locks.
  2. Creates new locks with `PURCHASE_PLAN` source type.
  3. Syncs sale item lock info back to the sale contract.
  - Only level-1 items (not sub-products) write back lock quantities.

---

## 2. PURCHASE CONTRACT (采购合同)

### 2.1 Status/State Machine
Purchase Contract Status (`PurchaseContractStatusEnum`):
- **READY_TO_SUBMIT** -- default on creation
- Status transitions driven by audit status updates (similar to Purchase Plan)
- **CASE_SETTLED** -- terminal/closed state

Audit status tracks BPM workflow: UNSUBMITTED -> PROCESS -> APPROVE/REJECT/CANCEL/CLOSE/BACK.

Additional status flags:
- `prepayStatus` (预付状态): YES/NO
- `payStatus` (付款状态): YES/NO  
- `invoiceStatus` (开票状态): YES/NO
- `signBackFlag` (回签标识): YES/NO
- `printFlag` (打印标识): YES/NO

### 2.2 Validation Rules
- **Currency consistency check** (`CurrencyCheck`): The vendor must have default financial info with a currency. The system validates that `totalAmount`, `freight`, `otherCost`, `payedAmount`, `prepayAmount`, and `invoicedCurrency` all match the vendor's default currency. If the vendor is internal, the first item's `withTaxPrice` currency is used instead.
- **Currency by company**: For non-internal vendors, item currencies must match the internal company's available currencies.
- **Zero quantity skip**: If all product quantities sum to 0, no contract is created.
- **Vendor existence**: Vendor must exist and be valid.
- **Payment plan ratio required**: `paymentRatio` cannot be null in payment plans.
- **Edit prohibition**: Cannot edit while in PROCESS audit status.
- **Code uniqueness**: Contract code must be unique; validated before creation and on code change.
- **Code change restrictions**: Only allowed when audit status is UNSUBMITTED, REJECT, CANCEL, CLOSE, or BACK.
- **Deletion type check**: Must match `auxiliaryFlag` (auxiliary vs. standard contract type must match the deletion request).

### 2.3 Calculation Rules
- **Total amount**: `totalAmount = SUM(withTaxPrice.amount * quantity)` for all items.
- **Total amount RMB**: `totalAmountRmb = totalAmount * taxRate` where `taxRate` is the daily exchange rate for the contract currency.
- **Payment plan receivable amount**: `receivableAmount = totalAmount * (paymentRatio / 100)`.
- **Unit price (excl. tax)**: `unitPrice = withTaxPrice * 100 / (taxRate + 100)`, scaled to 2 decimals.
- **Total price per item**: If packaging price exists: `totalPrice = withTaxPrice + packagingPrice`; otherwise `totalPrice = withTaxPrice`.
- **Quote sync total price**: `total = withTaxPrice + packagingPrice (if packageFlag != 1) + shippingPrice (if freightFlag != 1)`.
- **Repeat flag**: If the vendor already has non-settled contracts, `repeatFlag = YES`.
- **Delivery date**: Set to the earliest `venderDeliveryDate` across all items.

### 2.4 Code Generation
- Pattern: If autoFlag (from sales): `{saleContractCode}-{sequence}`; otherwise: `{purchasePlanCode}-{sequence}`.
- Sequence type: `SN_PURCHASECONTRACT`.
- Change code: prefix `PCC`, sequence `SN_PURCHASECONTRACT_CHANGE`.

### 2.5 Workflow/Approval
Three separate BPM processes:
- **Standard**: `scm_purchase_contract` with variable `stockPurchaseFlag` (0 if items linked to sales, 1 otherwise).
- **Own-brand**: `scm_purchase_contract_own_brand`.
- **Auxiliary**: `scm_purchase_contract_auxiliary` with dynamic multi-instance approvers (purchase users, salespeople, managers from related contracts).

### 2.6 Vendor Contact Selection
- Selects vendor's default contact (where `defaultFlag == 1`); falls back to first contact if no default.

### 2.7 Auxiliary Contract Allocation
- Only processes auxiliary contracts (`auxiliaryFlag == YES`).
- Only items with `auxiliarySkuType == PRODUCT` are processed.
- Allocation amount: `totalPrice.amount * quantity`.
- Creates `PurchaseAuxiliaryAllocationDO` entries linking auxiliary SKUs to main purchase contract items.

### 2.8 Notice Status Tracking
- Tracked via `noticedQuantity` on each item.
- Contract-level notice status:
  - All items fully noticed -> `ISSUED`
  - Some items partially noticed -> `PART_ISSUED`
  - No items noticed -> `NOT_ISSUED`

### 2.9 Cross-Module Interactions
- **Sales (SMS)**: Fetches sale contract info for initial delivery date; rolls back purchase code to shipment items.
- **Shipment (DMS)**: Writes purchase contract code to shipment items.
- **Warehouse (WMS)**: Creates stock notices, manages in-production stock.
- **Quality (QMS)**: Quality inspection integration.
- **Finance (FMS)**: Payment integration.
- **Product (PMS)**: SKU info, package types, HS data.
- **CRM**: Customer info for item names.

---

## 3. PAYMENT APPLY (付款申请)

### 3.1 Status/State Machine
- Audit status: `UNSUBMITTED -> PROCESS -> APPROVE/REJECT/CLOSE`
- Payment status: `NO (未付款) -> YES (已付款)`
- Payment plan execution status (`PaymentPlanExeStatusEnum`): `UNPAID -> IN_PAID -> PART_PAID -> PAID`

### 3.2 Validation Rules
- **Payment plan required**: `applyPaymentPlanList` cannot be empty.
- **No duplicate applications**: Cannot create a payment apply for payment plans that already have a non-closed, unpaid payment apply. The system checks for intersection of plan IDs with existing active applies.
- **Anti-audit validation**: Checks whether the payment apply code has downstream documents that prevent reversal.
- **Different vendor prohibition**: Not supported -- different vendors cannot be combined in one payment apply.
- **Different company prohibition**: Not supported -- different paying companies cannot be combined.

### 3.3 Calculation Rules
- **Real payment ratio**: `realPaymentRatio = applyAmount / (receivableAmount / paymentRatio)`, scaled to the configured decimal precision.
- **Apply total amount**: `applyTotalAmount = goodsTotalAmount + SUM(add_terms) - SUM(deduction_terms)` where add/deduction terms come from `PurchaseAddSubTerm` (only for the last payment step).
- **Payment plan applied amount**: Cumulative -- `appliedAmount = oldAppliedAmount + thisApplyAmount`.
- **Real payment ratio on completion**: `realPaymentRatio = receivedAmount / contractTotalAmount * 100`.
- **Payment plan step progression**: When all receivable amounts up to and including the current step are fully received, step status becomes PAID.

### 3.4 Workflow/Approval
- Process key: `scm_payment_apply`.
- Variables passed: `paymentMarkType`, `applyTotalAmount`, `prepayment`, `stockPurchaseFlag`, `prepaymentFlag` (1 if step is advance receipt), `deptCode`.

### 3.5 Approval Side Effects
- On APPROVE: Creates a `PaymentOrder` (付款单) in the FMS module via `paymentApi.batchCreatePayment()`.
- The payment order includes bank details, amounts, business type (`PURCHASE_PAYMENT`), and is linked to the payment apply.
- Vendor type determines business subject type: Administration Vendor -> `VENDER`, Business Vendor -> `VENDER_BIZ`.

### 3.6 Cancellation/Closure Logic
- On delete/close: Validates no downstream payments exist via `paymentApi.validatePayment()`.
- Rolls back applied amounts on payment plans in reverse step order.
- If the applied amount after rollback is 0, status becomes UNPAID; otherwise PART_PAID.
- Closes the corresponding payment order in FMS.

### 3.7 Write-Back on Payment
- `batchWriteBackPaymentMsg()`: Called when actual payment is received.
  - Sets `realPaymentAmount = paymentAmount + previousRealPaymentAmount`.
  - Sets `paymentStatus = YES`.
  - Writes back supplier bank info.
  - Writes back add/sub terms.
  - Updates purchase contract item payment info.
  - Updates payment plan with `receivedAmount`, `realPaymentRatio`, and step-level payment records (`JsonPayment` entries).

---

## 4. INVOICING NOTICES (开票通知)

### 4.1 Status/State Machine
- Audit status: `UNSUBMITTED -> PROCESS -> APPROVE/CLOSE`
- Registration status (`RegisteredStatusEnum`): `NOT_REGISTERED -> (PART_REGISTERED) -> REGISTERED`
- Source type: `PURCHASE` (from purchase contract) or `SHIPMENT` (from shipment).
  - SHIPMENT-sourced notices are auto-approved on creation.
  - PURCHASE-sourced notices require BPM approval.

### 4.2 Validation Rules
- **Agent product bypass**: If ALL child products are agent products (`agentFlag == YES`), the approval workflow is skipped.
- **Purchase type required**: The BPM variables `purchaseType` and `saleType` must not be null for submission.
- **Invoice quantity check**: On approval, `baseInvoiceQuantity > unInvoicedQuantity` throws INVOICE_QUANTITY_NOT_ENOUGH.
- **Close validation**: Cannot close if there are non-closed purchase registrations linked to the notice items.
- **Cancellation quantity check**: When closing/voiding, `rollBackQuantity > invoicedQuantity` throws CLASE_INVOICE_QUANTITY_ENOUGH.

### 4.3 Calculation Rules
- **Invoice total amount** (for printing): `totalAmount = invoicePrice * invoiceQuantity`.
- **Unit conversion for weight-based units** (KG/g): Complex conversion between HS measurement units and invoice units:
  - If HS unit is weight-based (KG/g) and invoice unit differs: applies appropriate division/multiplication by 1000.
  - If HS unit is not weight-based but invoice unit is: `rollBackQuantity = (invoiceQuantity / netWeight) * qtyPerOuterbox`.
- **Merged print**: Groups items by `hsMeasureUnit + invoicSkuName + hsCode`, recalculates aggregate price as `totalPrice / totalQuantity`.

### 4.4 Invoice Status Flow on Purchase Items
When notice is approved (listener fires):
- `baseInvoiceQuantity == unInvoicedQuantity` -> `ISSUED` (已开票)
- `baseInvoiceQuantity < unInvoicedQuantity` -> `PART_ISSUED` (部分开票)
- Before approval (on submit): status is `TRANSFER_ORDER` (已转开票)

### 4.5 Workflow
- Process key: `scm_invoicing_notices`.
- Variables: `purchaseType`, `saleType`, `deptCode`.

---

## 5. PURCHASE REGISTRATION (采购登记/登票)

### 5.1 Status/State Machine
- Audit status: BPM standard (UNSUBMITTED -> PROCESS -> APPROVE)
- Registration status: `WAITING_FOR_APPROVAL -> (on approve) -> based on quantities`

### 5.2 Validation Rules
- **Registration quantity constraint**: `invoicThisQuantity` must not exceed `invoicNoticesQuantity` (开票通知数量). Validated both at creation and on approval.
- **Cumulative quantity check**: After adding current registration quantity to existing `registerNoticeQuantity`, the total must not exceed the purchase contract item quantity. If equal -> `REGISTERED`; if less -> `PART_REGISTERED`.
- **Input user required**: The `inputUser` field must not be empty for BPM submission.

### 5.3 Approval Side Effects
- Updates `invoicingNoticesItem` registered quantities.
- Writes back `registrationDate` on the invoicing notice.
- Updates purchase contract item `registerNoticeStatus` and `registerNoticeQuantity`.
- Updates purchase contract payment dates (ticket date type).

### 5.4 Unit Conversion
Same weight-based unit conversion logic as invoicing notices (KG/g) for calculating registration quantities back to base purchase units.

---

## 6. CONCESSION RELEASE (让步放行)

### 6.1 Business Logic
- Created from quality inspection items that need concession handling.
- Validates quality inspection items exist via `qualityInspectionApi.checkItemList()`.
- Writes back concession release status to quality inspection.

### 6.2 Workflow
- Process key: `scm_concession_release`.
- Conditional variable: `annexFlag` (whether factory files are attached).
- Additional variable: `saleFlag` (whether the quality inspection has a sales person).
- Dynamic assignee: Purchase manager from the quality inspection is assigned to a specific activity.

### 6.3 Approval Side Effects
- On APPROVE: Writes back status to quality inspection items with annex, description, and pictures.
- On REJECT/CANCEL: Resets concession release status on quality inspection items to NO.

---

## 7. VENDOR (供应商)

### 7.1 Status/State Machine
- `enableFlag`: YES (启用) / NO (禁用)
- `changeStatus`: NOT_CHANGED / CHANGING / ...
- `changeFlag`: NO (original) / YES (change version)
- Audit status: BPM standard

### 7.2 Validation Rules
- **Code uniqueness**: Vendor code must be unique.
- **Change restrictions**: Cannot change if a higher-version already exists (`CHANGE_NOT_ALLOWED`); cannot change if already in change process (`IN_CHANGE_NOT_ALLOWED`).
- **Bank account uniqueness**: Validated by vendor ID (`VENDER_BANK_ACCOUNT_EXISTS`).
- **Edit/delete restriction**: Only approved records can be modified or deleted (`UNAPPROVE_EDIT_DEL_NOT_ALLOWED`).

### 7.3 Workflow
- Four process definitions depending on vendor type and whether it is a new creation or change:
  - `oa_vender` (new standard vendor)
  - `oa_business_vender` (new business vendor)
  - `oa_change_vender` (change standard vendor)
  - `oa_change_business_vender` (change business vendor)

### 7.4 Approval Side Effects
- On APPROVE: Automatically creates a vendor warehouse via `createVenderWareHouse()`.

---

## 8. FREIGHT ALLOCATION (运费分配)

### 8.1 Allocation Methods (`FreightEnum`)
- `ALLOT_BY_NONE` (0) -- no allocation
- `ALLOT_BY_NUMBER` (1) -- allocate proportionally by quantity
- `ALLOT_BY_AMOUNT` (2) -- allocate proportionally by amount

---

## 9. INSPECTION STATUS (验货状态)

### 9.1 Values (`PurchaseCheckStatusEmums`)
- `NOT_CHECK` (1) -- not inspected
- `PART_CHECK` (2) -- partially passed
- `ALL_PASS` (3) -- all passed

---

## 10. CONTAINER/SHIPPING CALCULATIONS (`CalcContactUtil`)

### 10.1 Container Threshold Rules
Volume-based container assignment (in cubic centimeters):
- Volume > 68,000,000 -> 40-foot high container(s), remainder recursed
- 59,000,000 < Volume <= 68,000,000 -> 1x 40-foot high container
- 49,000,000 < Volume <= 59,000,000 -> 1x 40-foot container
- 29,000,000 < Volume <= 49,000,000 -> 20-foot container(s), remainder recursed
- 20,000,000 <= Volume <= 29,000,000 -> 1x 20-foot container
- Volume < 20,000,000 -> Bulk handling, but if bulk cost exceeds 20-foot container fee, upgrades to 20-foot container

### 10.2 Fee Calculations
- **Item estimated freight**: `(totalEstimatedFreight / totalVolume) * (outerBoxVolume * boxCount)`
- **Item trailer fee**: `(trailerFee / totalVolume) * (outerBoxVolume * boxCount)`
- **Commission amount**: `totalSaleAmount * (commissionRate / 100)` (only for rate-based, not fee-based)
- **Tax refund**: `(withTaxPrice * quantity * currencyRate) / (1 + taxRefundRate) * taxRefundRate`
- **Platform fee**: `SUM(totalSaleAmount * platformFeeRate)`
- **Bulk handling cost**: `startFee + (volume_in_cubic_meters - 1) * perCubicMeterFee`

### 10.3 Container Capacity
- 20-foot: `29,000,000 / outerBoxVolume` (floor)
- 40-foot: `59,000,000 / outerBoxVolume` (floor)
- 40-foot high: `68,000,000 / outerBoxVolume` (floor)
- Containable quantity: `capacity * qtyPerOuterbox`

---

## 11. CROSS-CUTTING BUSINESS RULES

### 11.1 Data Permission
Separate data permission configurations exist for:
- Purchase Contract
- Purchase Contract Change
- Purchase Plan
- Payment Apply
- Vendor

### 11.2 Order Link Tracking
Every major entity (Purchase Plan, Purchase Contract, Payment Apply, Invoicing Notice) creates order link entries via `OrderLinkApi`. Links use `linkCodeList` for chain tracking across the entire order lifecycle (Sales -> Plan -> Contract -> Invoice -> Payment).

### 11.3 Audit Status Guards
Universally applied: entities in `PROCESS` audit status cannot be edited. The pattern `if (PROCESS.equals(auditStatus)) throw exception(NOT_UPDATE_PROCESS)` appears across all services.

### 11.4 Sign-Back Rules
- `SIGN_BACK_DATE_NOT_NULL` -- sign-back date is required
- `SIGN_BACK_DATE_NOT_AFTER_NOW` -- sign-back date cannot be in the future
- `PURCHASE_CONTRACT_NOT_PLACE_ORDER` -- orders must be placed before sign-back
- `PURCHASE_NOT_SIGN_BACK_NOT` -- contract must be signed back before certain downstream operations

### 11.5 Change Management
Purchase contracts support formal change management:
- Change records tracked via `PurchaseContractChange` entity
- Separate BPM processes for changes: `scm_purchase_contract_change`, `scm_purchase_auxiliary_contract_change`
- Restrictions when payment applies exist: cannot void contract, cannot change vendor name, cannot change purchase quantity
</task_result>
```

**Tool: task**

**Input:**
```json
{
  "description": "Explore WMS warehouse rules",
  "prompt": "Explore the business rules in the Warehouse Management System (WMS) module at C:\\Projects\\z\\zexport\\server\\eplus-module-wms.\n\nI need to understand the business rules (NOT field definitions, but business logic/rules). Focus on:\n1. Read the service implementation files (ServiceImpl.java) in the biz module to find validation rules, state transitions, calculation logic, constraints\n2. Read the enum files in the api module to understand status flows and business constants\n3. Look at controller files for workflow/approval logic\n\nKey things to extract:\n- Status/state machines and transitions (inbound, outbound, stocktake)\n- Validation rules (quantity checks, stock sufficiency)\n- Calculation rules (inventory balance)\n- Business constraints\n- Workflow/approval rules\n- Cross-module interactions (e.g., triggered by purchase contract, triggers shipment)\n\nRead through the main service implementation files thoroughly. Return a detailed summary of ALL business rules found, organized by entity/process.",
  "subagent_type": "explore"
}
```

**Output:**
```
task_id: ses_3addb0deeffeJU9kxEZiNBnhQm (for resuming to continue this task if needed)

<task_result>
I now have a comprehensive understanding of the entire WMS module. Here is the detailed summary of all business rules:

---

# WMS Module Business Rules -- Comprehensive Analysis

## 1. STOCK NOTICE (入/出库通知单 -- StockNoticeServiceImpl)

### 1.1 Status State Machine (NoticeStatusEnum)

```
UN_CONVERT (1, 未转)  ---> IN_CONVERT (5, 转单中)  ---> CONVERTED (2, 已转)
      |                        |                            ^
      |                        +----> PART_CONVERT (4, 部分转) -+
      +---> CANCEL (3, 作废)
```

**Transition Rules:**
- **Creation**: defaults to `UN_CONVERT` (未转). Exception: if `factoryOutboundFlag == YES`, set immediately to `CONVERTED`.
- **toBill()** (convert to inbound/outbound bill): transitions to `IN_CONVERT` for standard warehouse shipments; transitions to `CONVERTED` for factory direct shipments (if all items are factory-shipped); transitions to `PART_CONVERT` if some items remain unconverted for factory shipments.
- **updateConvertStatusByCode()**: after bill confirmation, the system checks every notice item. If `realBillQuantity == orderQuantity` for ALL items, status becomes `CONVERTED`; otherwise `PART_CONVERT`.
- **closeStockNotice()** (container transportation cancellation): sets status to `CANCEL`. Pre-condition: checks `billService.checkBillByNoticeCode()` -- if any bill exists referencing this notice, the cancellation is **blocked** (throws `ANTI_AUDIT_EXCEPT`).
- **closeNotice()** (manual notice cancellation): sets status to `CANCEL`. Pre-conditions:
  - No downstream bills may exist for this notice code (`STOCK_NOTICE_EXISTS_BILL`).
  - Only manually created notices can be cancelled (`manualFlag == YES` required; otherwise `STOCK_NOTICE_NOT_ALLOW_CANCEL`).
  - For outbound notices: releases all locked stock via `stockLockService.cancelOutNoticeLockQuantity()`.
  - For inbound notices: rolls back purchase contract quantities via `purchaseContractApi.rollBackPurchaseNoticeQuantity()`.

### 1.2 Validation Rules

- **createNotice()**: Notice items list must NOT be empty (`RENOTICE_ITEM_NOT_EMPTY`).
- **toBill()**: If notice status is `IN_CONVERT` and the shipping address is `BILL` (standard warehouse), throws `BILL_IN_CONVERT` -- prevents duplicate conversion.
- **toBill()**: After filtering items with `pendingStockQuantity > 0`, if the resulting list is empty, throws `BILL_ITEM_ALL_OUT` -- all items already shipped.
- **toBill()**: Each item's `qtyPerOuterbox` must not be null or 0 (`QTY_PER_OUTERBOX_INVALID`).
- **toBill()**: Batch code must be unique per stock record; if multiple stock records share the same batch code, throws `BATCKCODE_MUL`.
- **validateNoticeExists()**: Notice must exist in database (`RENOTICE_NOT_EXISTS`).

### 1.3 Calculation Rules

- **Pending stock quantity**: `pendingStockQuantity = orderQuantity - inBillQuantity - realBillQuantity` (calculated in `updateNoticeQuantity()`).
- **Pending stock box quantity**: `pendingStockBoxQuantity = ceil(pendingStockQuantity / qtyPerOuterbox)`.
- **Shipment price calculation** (`calcShipmentPrice()`): For outbound container transportation notices, computes `sum(unitPrice * shippedQuantity)` per sale contract and validates against the collection plan via `saleContractApi.checkCollectionPlan()`.

### 1.4 Stock Locking on Outbound Notice Creation

- **Rule**: Manual outbound notices (`manualFlag == YES` and `noticeType == OUT_STOCK`) trigger automatic stock locking.
- Creates `StockLockDO` records with `sourceOrderType = OUT_STOCK` and `lockQuantity = orderQuantity` for each notice item.
- On update: the old locks are **released first**, then new locks are re-created.

### 1.5 Workflow/Approval (BPM Integration)

- Two separate BPM process definition keys:
  - **Inbound**: `wms_in_stock_notice`
  - **Outbound**: `wms_out_stock_notice`
- **submitTask()**: Creates a BPM process instance, sets `auditStatus = PROCESS`, stores `processInstanceId`.
- **approveTask() / rejectTask()**: Delegates to `bpmProcessInstanceApi`.
- **Auto-submit on creation**: If both `submitFlag == YES` and `manualFlag == YES`, the notice is immediately submitted for approval after creation.
- **Export restrictions**: Report template must have `auditStatus == APPROVE` before export/print is allowed (`REPORT_NOT_APPROVE`).

### 1.6 Cross-Module Interactions

- **Triggers order link creation** (`orderLinkApi.batchCreateOrderLink()`) for traceability.
- **Sends in-app notifications** to purchasers and managers upon creation (`notifyMessageSendApi.sendSingleMessageToAdmin()`).
- **Factory outbound auto-flow**: When `factoryOutboundFlag == YES`, the notice is auto-converted to a bill immediately upon creation.
- **Container transportation close**: Cancels the convert container flag on shipment items via `shipmentApi.cancelConvertContainerFlag()` and reverses `cabinetQuantity` on stock records.

### 1.7 Notice Quantity Tracking (`updateNoticeQuantity()`)

Three quantity fields on each notice item:
- `realBillQuantity`: Actual quantity converted to bills (confirmed).
- `inBillQuantity`: Quantity currently in process of being converted (not yet confirmed).
- `pendingStockQuantity`: Remaining quantity = `orderQuantity - realBillQuantity - inBillQuantity`.

**On bill submit** (`submitFlag = true`): `realBillQuantity += thisQuantity`, `inBillQuantity -= thisQuantity`.
**On bill save (draft)** (`submitFlag = false`): `inBillQuantity += thisQuantity`.
**On bill cancel** (`isCancel = true`): `realBillQuantity -= thisQuantity` (rollback).

After recalculation: if `pendingStockQuantity == 0` for ALL items, the notice status transitions to `CONVERTED`; otherwise `PART_CONVERT`.

---

## 2. BILL (入/出库单 -- BillServiceImpl)

### 2.1 Status State Machine (StockBillStatusEnum)

```
UN_CONFIRM (1, 未确认)  ---> CONFIRMED (2, 已确认)
      |
      +---> CANCEL (3, 作废)     [via cancel()]
```

### 2.2 Bill Creation Rules

- **Code generation**: Inbound bills get prefix `YS` (验收), outbound bills get prefix `CK` (出库). Uses `codeGeneratorApi.getCodeGenerator()`.
- **Default status**: `UN_CONFIRM` (unless overridden).
- **Print flags**: `printFlag = NO`, `printTimes = 0` on creation.
- **Batch code**: Auto-generated via `batchCodeUtil.genBatchCode()` if not provided.
- **SKU codes concatenation**: All item SKU codes are joined into `skuCodes` field on the bill header for search optimization.
- **Factory outbound special path**: When `factoryFlag == FACTORY`:
  1. Shipment message is updated with outbound quantity and date.
  2. Stock is immediately deducted (`subStockAndItemList()`).
  3. Bill status is set to `CONFIRMED` immediately.
  4. Internal contract is generated via `saleContractApi.genInternalContractByOutBill()`.

### 2.3 Bill Item Status Logic

Each bill item's `noticeItemStatus` is calculated:
- `actQuantity == 0`: `NOT_BILL` (未开单)
- `0 < actQuantity < orderQuantity`: `PART_BILL` (部分开单)
- `actQuantity >= orderQuantity`: `BILLED` (已开单)

### 2.4 Bill Confirmation (updateBill with status = CONFIRMED)

**For Inbound (IN_STOCK):**
1. Sets `sourceType = PURCHASE` on all items.
2. Updates notice quantities (`submitFlag = true`).
3. Calls `addStockAndItemList()` which:
   - For **manually created** inbound notices: creates new stock records directly with `availableQuantity = actQuantity`, `usedQuantity = 0`, `lockQuantity = 0`, `producingQuantity = 0`.
   - For **standard purchase** inbound: simultaneously creates an outbound bill on the supplier warehouse, deducts supplier stock, creates new stock records in the company warehouse, and transfers locked stock records.
4. Updates sale contract item bill status to `VERTAK_STORE` (已入仓).
5. Updates purchase contract item with inbound status and quantity diff.

**For Outbound (OUT_STOCK):**
1. Updates shipment detail with outbound quantity and date.
2. Deducts stock via `subStockAndItemList()`.
3. Generates internal contract via `saleContractApi.genInternalContractByOutBill()`.

### 2.5 Stock Deduction Rules (`subStockAndItemList()`)

- Groups bill items by batch code, sums actual quantities.
- Queries stock by batch codes.
- For each stock record:
  - **Self-operated purchase** (no `saleContractCode`):
    - `usedQuantity += actQuantity`
    - `lockQuantity -= actQuantity` (or set to 0 if already 0)
    - `availableQuantity -= actQuantity`
    - If `convertFlag == true`: `lockQuantity = 0` (full conversion clears lock).
    - For OUT_STOCK with `cabinetQuantity > 0`: `cabinetQuantity -= actQuantity`.
  - **Standard purchase** (has `saleContractCode`):
    - `usedQuantity += actQuantity`
    - `availableQuantity -= actQuantity`
  - **CRITICAL VALIDATION**: If `availableQuantity < 0` after deduction, throws `STOCK_EXCEED` -- insufficient stock.
- After deduction: recalculates `remainTotalAmount` for each stock record.
- Updates purchase contract item outbound quantities via `purchaseContractApi.updatePurchaseItemOutQuantity()`.

### 2.6 Bill Cancellation Rules (`cancel()`)

Pre-conditions:
1. Bill must exist.
2. For each stock record linked to bill items:
   - `usedQuantity` must be 0 (stock has not been used downstream), otherwise: "库存已被使用，不可反提交".
   - `lockQuantity` must be 0 (stock is not locked), otherwise: "库存已被锁定，不可反提交".

On cancellation:
1. Removes stock records created by this bill.
2. If supplier outbound records exist, removes those too and restores supplier stock (`availableQuantity = initQuantity`, `usedQuantity = 0`, `lockQuantity = 0`).
3. Sets bill status to `CANCEL`.
4. Deletes bill items.
5. Resets notice status back to `UN_CONVERT`.
6. Rolls back notice quantities (`isCancel = true`).

### 2.7 Bill Deletion Constraints

- `deleteBillByContract()`: Deletes all bills and items associated with a purchase contract ID.
- Standard delete: validates existence only.

---

## 3. STOCK (库存明细 -- StockServiceImpl)

### 3.1 Inventory Balance Calculation

The fundamental inventory equation:
```
availableQuantity = initQuantity - usedQuantity - lockQuantity
remainderQuantity = initQuantity - usedQuantity
remainTotalAmount = price.amount * (initQuantity - usedQuantity)
totalAmount = price.amount * initQuantity
```

### 3.2 Total Amount Calculation (`updateTotalAmount()`)

For each stock record:
- `totalAmount = price * initQuantity`
- `boxQuantity = ceil(initQuantity / qtyPerOuterbox)`
- `totalVolume = boxQuantity * outerboxVolume` (where outerboxVolume = length * width * height)
- `totalWeight = boxQuantity * outerBoxGrossWeight`

### 3.3 Available Stock Query Rules (`listBatch()`)

When querying available stock for order allocation:
1. Filters stock where `saleContractId IS NULL` and `saleContractCode IS NULL` (only unallocated stock).
2. Includes company IDs from the request PLUS all "production companies" (`producedFlag` defaults to YES).
3. Handles own-brand SKU resolution via `skuApi.getOwnSkuCodeListBySkuCode()`.
4. Filters to records where `availableQuantity > 0` OR `lockQuantity > 0` OR `producingQuantity > 0`.
5. **Effective available quantity** = `availableQuantity - lockQuantity + thisSaleLockQuantity` (adds back the current sale contract's own locks).
6. If `onlyAvailableQuantityFlag != YES`: final `availableQuantity += producingQuantity` (includes in-production inventory).
7. If `onlyLockFlag == YES`: returns only records where both `availableQuantity > 0` AND `sourceOrderLockedQuantity > 0`.
8. Final filter: only records with `availableQuantity > 0`.

### 3.4 Stock Deletion Constraints

- `deleteByPurchaseContractCode()`: Checks if any `StockLockDO` references these stock records. If locked records exist, throws `STOCK_LOCK_EXISTS` -- prevents deletion of locked stock.

### 3.5 Stock Import Rules (`importStock()`)

- Validates import data has not already been processed (`stockFlag == 0 && errorFlag == 0`).
- If `qtyPerOuterbox` is null or 0, defaults to 1.
- Generates batch code automatically.
- Sets `availableQuantity = initQuantity`.
- Creates corresponding inbound bills with `billType = 1` (IN_STOCK), `billStatus = 2` (CONFIRMED), `sourceType = IMPORT`.

### 3.6 Stock Import Validation (`importExcelNotInsert()`)

For each imported row:
- **Company**: Must match an existing company name (`errorFlag = 1` if not found).
- **SKU**: Resolved by code, or by `basicSkuCode + cskuCode + custCode` combination. Error if not found.
- **Own-brand products**: Resolved via dedicated own-brand lookup (`getOwnSkuByBasicCodeAndCskuCodeAndCustCode`).
- **Quantity**: `initQuantity > 0` required.
- **Warehouse**: Must match an existing warehouse name exactly.
- Price defaults to RMB currency if not specified.

---

## 4. STOCK LOCK (库存锁定 -- StockLockServiceImpl)

### 4.1 Lock Source Types (StockLockSourceTypeEnum)

| Value | Source | Description |
|-------|--------|-------------|
| 1 | SALE_CONTRACT | 销售合同 |
| 2 | PROCESSING | 加工单 |
| 3 | TRANSFER_ORDER | 调拨单 |
| 4 | PURCHASE_PLAN | 采购计划 |
| 5 | OUT_STOCK | 出库通知单 |

### 4.2 Lock Creation Rules (`createStockLock()`)

1. Records lock operator and lock time.
2. Calculates: `lockedQuantity = existingLockQuantity + newLockQuantity`.
3. Calculates: `availableQuantity = initQuantity - producingQuantity - usedQuantity`.
4. **VALIDATION**: `lockedQuantity > producingQuantity + availableQuantity` throws `STOCK_LOCK_EXCEED` -- cannot lock more than available + in-production.
5. Updates stock record's `lockQuantity` and `availableQuantity`.

### 4.3 Batch Lock Creation (`batchCreateStockLock()`)

- Validates that the operator user exists (`OPERATION_FORBIDDEN`).
- Validates all referenced stock IDs exist (`STOCK_NOT_EXISTS`).
- For each lock: `availableQuantity = initQuantity - usedQuantity`; if `< 0`, throws `STOCK_LOCK_EXCEED`.
- Batch updates stock and batch inserts locks.

### 4.4 Lock Cancellation (`cancel()`)

- Recalculates: `lockQuantity -= cancelledLockQuantity`.
- Updates stock's `lockQuantity`.
- Removes the lock record.

### 4.5 Outbound Notice Lock Cancellation (`cancelOutNoticeLockQuantity()`)

- Finds all locks by `sourceOrderType` and `sourceOrderCode`.
- Cancels each lock individually (restores stock quantities).

### 4.6 Stock Validation by Contract (`validateStockByContractCodeList()`)

Combines:
- Locked quantities grouped by `(saleContractCode, skuCode)`.
- Stock quantities (`producingQuantity + availableQuantity`) grouped by `(saleContractCode, skuCode)`.
Returns merged map for validation purposes.

---

## 5. STOCKTAKE (盘点单 -- StocktakeServiceImpl)

### 5.1 Status State Machine (StocktakeStatusEnum)

```
NOT_START (1, 未开始)  ---> IN_PROGRESS (2, 进行中)  ---> ENDED (3, 已结束)
```

### 5.2 Stocktake Result Calculation (StocktakeResultEnum)

For each stocktake item:
```
diffQuantity = stocktakeStockQuantity - stockQuantity
```
- `diffQuantity > 0`: SURPLUS (1, 盘盈) -- physical count exceeds system count
- `diffQuantity < 0`: DEFICIT (2, 盘亏) -- physical count is less than system count
- `diffQuantity == 0`: BE_EQUAL (3, 盘平) -- counts match

### 5.3 Creation Rules

- Auto-generates code with prefix `ST`.
- Initial status: `NOT_START`.
- Audit status: `UNSUBMITTED`.
- Print flags: `printFlag = NO`, `printTimes = 0`.
- Default stocktake values: `stocktakeStockQuantity = stockQuantity` (pre-fills counted quantity with system quantity).
- Box quantities: `stockBoxQuantity = ceil(stockQuantity / qtyPerOuterbox)`, `stocktakeStockBoxQuantity = ceil(stocktakeStockQuantity / qtyPerOuterbox)`.
- If `submitFlag == SUBMIT`: immediately submits for BPM approval.

### 5.4 Counting (Start Stocktake)

- Sets status to `IN_PROGRESS`.
- Updates all items with calculated values.
- Comment indicates: "锁定批次库存，禁止出库及占用" (lock batch stock, prohibit outbound and allocation) -- although the actual lock implementation appears incomplete.

### 5.5 Workflow/Approval

- BPM process key: `wms_stocktake`.
- On `updateAuditStatus()`: automatically sets stocktake status to `ENDED`.

---

## 6. TRANSFER ORDER (调拨单 -- TransferOrderServiceImpl)

### 6.1 Status State Machine (TransferOrderStatusEnum)

```
PENDING_SUBMIT (待提交)  ---> DONE (已完成)
```

### 6.2 Transfer Rules

A transfer order simultaneously:
1. **Creates outbound bill items** for the source warehouse.
2. **Deducts stock** from the source batch.
3. **Creates inbound bill items** for the target warehouse.
4. **Creates new stock records** in the target warehouse.

### 6.3 Outbound Stock Validation

- For each transfer item, the batch code must map to an existing stock record (`STOCK_NOT_EXISTS_BY_BATCH_CODE`).
- **CRITICAL VALIDATION**: `actQuantity > availableQuantity` throws `STOCK_NOT_ENOUGH` -- cannot transfer more than available.
- Stock updates:
  - `availableQuantity -= actQuantity`
  - `usedQuantity += actQuantity`
- Recalculates `remainTotalAmount` after transfer.

### 6.4 Inbound Stock Creation

- New stock records in target warehouse:
  - `initQuantity = actQuantity`
  - `availableQuantity = actQuantity`
  - `lockQuantity = 0`
  - Inherits `saleContractCode` from the transfer order.
  - New batch codes are generated for inbound items.

### 6.5 Submit Rules

- On `submitTransferOrder()`: validates transfer order exists AND has items (`TRANSFER_ORDER_ITEM_NOT_EXISTS` if empty).
- If `submitFlag == YES` during create/update: immediately processes stock (no intermediate draft state).

---

## 7. WAREHOUSE (仓库 -- WarehouseServiceImpl)

### 7.1 Business Constraints

- **Name uniqueness**: Warehouse name must be unique across the system (`WAREHOUSE_NAME_ALREADY_EXISTS`).
- **Supplier warehouse protection**: Warehouses with `venderFlag == YES` cannot be deleted (`WAREHOUSE_NOT_DELETE`).
- **Enable/Disable**: Toggle `enableFlag` (YES/NO).
- **Default warehouse**:
  - Must be non-vendor (`venderFlag = 0`), enabled (`enableFlag = 1`).
  - Exactly one default warehouse must exist:
    - `WAREHOUSE_NOT_DEFAULT` if none found.
    - `WAREHOUSE_MORE_DEFAULT` if multiple found.
  - `setDefault()`: Clears all existing default flags before setting the new default.
- **Simple list**: Returns only non-vendor (`venderFlag = 0`), enabled (`enableFlag = 1`) warehouses.

---

## 8. ADJUSTMENT (盘库调整单 -- AdjustmentServiceImpl)

### 8.1 Rules

- Simple CRUD with parent-child relationship.
- Existence validation on all operations.
- Deletion cascades to child items.
- No complex business logic beyond standard create/update/delete patterns.

---

## 9. CROSS-MODULE INTERACTION SUMMARY

### 9.1 Upstream Triggers into WMS

| Source Module | Trigger | WMS Action |
|---|---|---|
| Purchase Contract (SCM) | Purchase goods arrive | Creates inbound notice (RE prefix) |
| Shipment/DMS | Shipment planning | Creates outbound notice (TT prefix) as container transportation |
| Sale Contract (SMS) | Sale finalized | Stock locking via StockLockService |
| Processing Order | Manufacturing complete | Inbound/outbound via bill with sourceType=MANUSACTURE |

### 9.2 Downstream Effects from WMS

| WMS Action | Target Module | Effect |
|---|---|---|
| Inbound bill confirmed | Sale Contract (SMS) | Updates item bill status to `VERTAK_STORE` |
| Inbound bill confirmed | Purchase Contract (SCM) | Updates purchase item inbound status and quantity |
| Outbound bill confirmed | Sale Contract (SMS) | Generates internal contract via `genInternalContractByOutBill()` |
| Outbound bill confirmed | Purchase Contract (SCM) | Updates purchase item outbound quantity |
| Outbound bill confirmed | Shipment (DMS) | Updates shipment item outbound quantity and date |
| Notice cancelled (inbound) | Purchase Contract (SCM) | Rolls back purchase notice quantities |
| Container notice cancelled | Shipment (DMS) | Cancels convert container flag, restores cabinet quantities |
| Stock deletion blocked | - | If StockLock records exist, stock cannot be deleted |

### 9.3 Code Generation Patterns

| Entity | SN Type | Prefix | Example |
|---|---|---|---|
| Inbound Notice | SN_NOTICE | RE | RE20240626001 |
| Outbound Notice | SN_NOTICE | TT | TT20240626001 |
| Inbound Bill | SN_BILL | YS | YS20240626001 |
| Outbound Bill | SN_BILL | CK | CK20240626001 |
| Warehouse | SN_WAREHOUSE | WH | WH20240626001 |
| Transfer Order | TransferOrder | DB | DB20240626001 |
| Stocktake | (batchCodeUtil) | ST | ST... |

### 9.4 Stock Source Types (StockSourceTypeEnum)

| Value | Type | Description |
|---|---|---|
| 1 | PURCHASE | 采购 - standard purchase inbound/outbound |
| 2 | STOCK_SURPLUS | 盘盈 - stocktake surplus |
| 3 | STOCK_LOSS | 盘亏 - stocktake deficit |
| 4 | ALLOCATION | 调拨 - transfer/allocation |
| 5 | ASSEMBLE | 组套件 - kit assembly |
| 6 | MANUSACTURE | 加工单 - processing/manufacturing |
| 7 | IMPORT | 库存导入 - stock import |

---

## 10. KEY FILES REFERENCED

- `C:\Projects\z\zexport\server\eplus-module-wms\eplus-module-wms-api\src\main\java\com\syj\eplus\module\wms\enums\NoticeStatusEnum.java`
- `C:\Projects\z\zexport\server\eplus-module-wms\eplus-module-wms-api\src\main\java\com\syj\eplus\module\wms\enums\StockBillStatusEnum.java`
- `C:\Projects\z\zexport\server\eplus-module-wms\eplus-module-wms-api\src\main\java\com\syj\eplus\module\wms\enums\StockLockSourceTypeEnum.java`
- `C:\Projects\z\zexport\server\eplus-module-wms\eplus-module-wms-api\src\main\java\com\syj\eplus\module\wms\enums\StockSourceTypeEnum.java`
- `C:\Projects\z\zexport\server\eplus-module-wms\eplus-module-wms-api\src\main\java\com\syj\eplus\module\wms\enums\StockStatusEnum.java`
- `C:\Projects\z\zexport\server\eplus-module-wms\eplus-module-wms-api\src\main\java\com\syj\eplus\module\wms\enums\StocktakeResultEnum.java`
- `C:\Projects\z\zexport\server\eplus-module-wms\eplus-module-wms-api\src\main\java\com\syj\eplus\module\wms\enums\StocktakeStatusEnum.java`
- `C:\Projects\z\zexport\server\eplus-module-wms\eplus-module-wms-api\src\main\java\com\syj\eplus\module\wms\enums\StockTypeEnum.java`
- `C:\Projects\z\zexport\server\eplus-module-wms\eplus-module-wms-api\src\main\java\com\syj\eplus\module\wms\enums\ErrorCodeConstants.java`
- `C:\Projects\z\zexport\server\eplus-module-wms\eplus-module-wms-biz\src\main\java\com\syj\eplus\module\wms\service\bill\BillServiceImpl.java`
- `C:\Projects\z\zexport\server\eplus-module-wms\eplus-module-wms-biz\src\main\java\com\syj\eplus\module\wms\service\stock\StockServiceImpl.java`
- `C:\Projects\z\zexport\server\eplus-module-wms\eplus-module-wms-biz\src\main\java\com\syj\eplus\module\wms\service\stockNotice\StockNoticeServiceImpl.java`
- `C:\Projects\z\zexport\server\eplus-module-wms\eplus-module-wms-biz\src\main\java\com\syj\eplus\module\wms\service\stocktake\StocktakeServiceImpl.java`
- `C:\Projects\z\zexport\server\eplus-module-wms\eplus-module-wms-biz\src\main\java\com\syj\eplus\module\wms\service\stocklock\StockLockServiceImpl.java`
- `C:\Projects\z\zexport\server\eplus-module-wms\eplus-module-wms-biz\src\main\java\com\syj\eplus\module\wms\service\transferorder\TransferOrderServiceImpl.java`
- `C:\Projects\z\zexport\server\eplus-module-wms\eplus-module-wms-biz\src\main\java\com\syj\eplus\module\wms\service\stockimport\StockImportServiceImpl.java`
- `C:\Projects\z\zexport\server\eplus-module-wms\eplus-module-wms-biz\src\main\java\com\syj\eplus\module\wms\service\warehouse\WarehouseServiceImpl.java`
- `C:\Projects\z\zexport\server\eplus-module-wms\eplus-module-wms-biz\src\main\java\com\syj\eplus\module\wms\controller\admin\stockNotice\StockNoticeController.java`
- `C:\Projects\z\zexport\server\eplus-module-wms\eplus-module-wms-biz\src\main\java\com\syj\eplus\module\wms\controller\admin\stocktake\StocktakeController.java`
</task_result>
```

**Tool: task**

**Input:**
```json
{
  "description": "Explore DMS shipping rules",
  "prompt": "Explore the business rules in the Document/Shipping Management System (DMS) module at C:\\Projects\\z\\zexport\\server\\eplus-module-dms.\n\nI need to understand the business rules (NOT field definitions, but business logic/rules). Focus on:\n1. Read the service implementation files (ServiceImpl.java) in the biz module to find validation rules, state transitions, calculation logic, constraints\n2. Read the enum files in the api module to understand status flows and business constants\n3. Look at controller files for workflow/approval logic\n\nKey things to extract:\n- Status/state machines and transitions (shipment plan, shipment, customs declaration, settlement)\n- Validation rules\n- Calculation rules (fees, settlement amounts)\n- Business constraints\n- Workflow/approval rules\n- Cross-module interactions\n\nRead through the main service implementation files thoroughly. Return a detailed summary of ALL business rules found, organized by entity/process.",
  "subagent_type": "explore"
}
```

**Output:**
```
task_id: ses_3addb04c0ffeqDqzf91a7mL4rP (for resuming to continue this task if needed)

<task_result>
Now I have a comprehensive picture of all the business rules. Let me compile the findings into a detailed summary.

---

# DMS (Document/Shipping Management System) -- Complete Business Rules Report

## 1. SHIPMENT PLAN (出运计划 / ShipmentPlan)

### 1.1 Status/State Machine
- **PAD_SUBMIT** (待提交) -- Initial draft state when `submitFlag = NO`
- **AWAITING_PROCESSING** (待处理) -- Submitted for processing when `submitFlag = YES`
- **COMPLETED** (已完成) -- All child items have been transformed to shipments
- **CASE_CLOSED** (结案) -- Closed/archived

**Transitions:**
- Create: --> PAD_SUBMIT (if `submitFlag=NO`) or AWAITING_PROCESSING (if `submitFlag=YES`)
- Update: can change to PAD_SUBMIT or AWAITING_PROCESSING depending on `submitFlag`
- Transform to Shipment: Items move to COMPLETED; if ALL items are COMPLETED, parent plan moves to COMPLETED
- Close (结案): Can close individual items or entire plan --> CASE_CLOSED
  - When an individual item is closed, system checks if ALL sibling items are also CASE_CLOSED; if yes, parent plan becomes CASE_CLOSED
  - Closing restores (writes back) the shipping quantities to the sale contract's available-to-ship fields
- Anti-Audit (反审核): Reverts status to UNSUBMITTED. Blocked if downstream documents exist (validated by `validateAntiAuditStatus`)

### 1.2 Validation Rules
- **Stock validation**: Before creating a shipment plan, the system validates inventory availability per sale contract per SKU code:
  - For **GENERAL_PRODUCTS** (普通产品): Real stock quantity must exist and must be >= shipping quantity
  - For **PRODUCT_MIX** (组合产品): Checks own stock first; if insufficient, recursively checks BOM component stocks. Components must have sufficient stock to cover the deficit.
- **Purchase contract code required**: If a plan item has `purchaseQuantity > 0` AND the purchase model is STANDARD, then `purchaseContractCode` must not be empty. The code must exist (validated against purchase contract API).
- **Sale contract must exist**: At least one sale contract code must be present
- **Shipping quantity filter**: Items with `shippingQuantity <= 0` are filtered out from processing
- **Item existence on update**: Plan item must reference a valid sale contract item; throws `SHIPMENT_PLAN_NOT_SALE_ITEM` otherwise

### 1.3 Calculation Rules (CalcShipmentPlanUtil)
- **Box count** = ceiling(shippingQuantity / qtyPerOuterbox); `qtyPerOuterbox` must not be 0
- **Total volume** = SUM(specificationVolume * boxCount per item); must not be 0
- **Total gross weight** = SUM(outerboxGrossweight * boxCount); gram-to-kg conversion applied if unit is "g"
- **Total net weight** = SUM(outerboxNetweight * boxCount); gram-to-kg conversion applied
- **Total quantity** = SUM(shippingQuantity)
- **Total boxes** = SUM(boxCount)
- **Goods value total** = SUM(saleUnitPrice * shippingQuantity), grouped by currency
- **Sale amount per item** = saleUnitPrice.amount * shippingQuantity
- All totals are validated against front-end provided values; mismatches throw exceptions

### 1.4 Cross-Module Interactions
- Writes back `shipmentQuantity` to Sale Contract items (SMS module) on create/update
- Validates purchase contract existence via Purchase Contract API (SCM module)
- Validates stock via Stock API (WMS module)
- Retrieves SKU type (general vs product mix) from SKU API (PMS module)
- Creates Order Link entries (Infra module) for document traceability
- Writes operation logs

---

## 2. SHIPMENT (出运单 / Shipment)

### 2.1 Status/State Machine
- **AWAITING_PROCESSING** (待处理) -- Initial state on creation
- **READY_FOR_SHIPMENT** (待出运) -- Ready for shipping
- **SHIPPED** (已出运) -- Goods have shipped
- **COMPLETED** (已交单) -- Documents submitted/delivered
- **CASE_CLOSED** (结案/作废) -- Closed

**Change Status:**
- **NOT_CHANGED** -- No active change
- **IN_CHANGE** -- Change request in progress
- **CHANGED** -- Change has been applied

**Transitions:**
- Create --> AWAITING_PROCESSING
- Ship (`shipment` method): AWAITING_PROCESSING/READY_FOR_SHIPMENT --> SHIPPED
  - **Pre-condition**: Every item must have `outQuantity >= shippingQuantity` (items must be physically dispatched/outbound first)
  - If `outQuantity > shippingQuantity`, an exception is thrown
- Finish (`finishShipment`): --> COMPLETED
- Close (`closeShipment`): --> CASE_CLOSED (cascading: if all items closed, parent closes)
- Rollback Close (`rollbackClose`): CASE_CLOSED --> READY_FOR_SHIPMENT
- Change workflow: Creates a change record, optionally submits to BPM approval flow

### 2.2 Validation Rules
- **Invoice code uniqueness**: `invoiceCode` must not be duplicated across non-closed shipments. For auto-generated shipments, allows count <= 1; for manual, allows count = 0.
- **Declaration transfer**: Cumulative declaration quantity (`declarationQuantityOld + current`) must not exceed `declarationQuantity`
- **Commodity inspection transfer**: Items already transferred to commodity inspection cannot be transferred again (`INVALID_TO_DOCUMENT`). Items with `commodityInspectionFlag = NO` cannot be transferred (`FAIL_TO_COMMODITY_INSPECTION`).
- **Settlement form transfer**: All items cannot already be fully settled. Transport type must be consistent across all shipments being combined (`TRANSPORT_DIFF_NOT_TRANSFORM`).
- **Multi-company export prevention**: All shipments being converted to a declaration must have the same `foreignTradeCompanyId`
- **Batch flag rules**: Cannot enable batch flag if any of `settleOrderFlag`, `declarationFlag`, `outboundFlag`, or `invoiceNoticeFlag` is YES. Cannot cancel batch flag if child split shipments exist (non-closed).
- **Split quantity validation**: `splitQuantity` must be > 0
- **Invoice validation for declaration**: When transferring to declaration, if an item has been invoiced (invoiceStatus != NOT_ISSUED), the corresponding invoice notification must exist AND the declaration name must match the invoice SKU name exactly.
- **Change quantity validation**: When changing shipment item quantities upward, the increase cannot exceed the un-transformed shipment quantity from the sale contract.

### 2.3 Calculation Rules (CalcShipmentUtil / CheckShipmentUtil)
- **Declaration amount** = declarationUnitPrice * declarationQuantity (per item)
- **Tax refund amount** = [purchaseWithTaxPrice * quantity * currencyRate / (1 + taxRefundRate%)] * taxRefundRate%
  - `taxRefundRate` is converted from whole number to percentage (multiplied by 0.01)
  - Currency rate must exist and not be zero
- **Goods value total** = SUM(saleUnitPrice * shippingQuantity), grouped by currency
- **Declaration total** = SUM(declarationUnitPrice * declarationQuantity), grouped by currency
- **Purchase total** = SUM(purchaseWithTaxPrice * shippingQuantity), grouped by currency
- **Total volume** = SUM(outerboxVolume * boxCount); must not be zero
- **Total gross/net weight**: Calculated per item with gram-to-kg conversion, then summed
- **Box count** = ceiling(shippingQuantity / qtyPerOuterbox); qtyPerOuterbox must not be 0
- **Stock cost**: Calculated by calling `iStockApi.calcStockCost` using sale contract codes; only applied when `realLockQuantity > 0`
- **Invoice quantity calculation**: `noticeQuantity` = max(0, shippingQuantity - availableStockQuantity). If available stock covers shipping, invoice quantity = 0; if stock is fully consumed, invoice quantity = shippingQuantity.
- **KANE INV currency conversion**: sale amounts are converted from original currency to RMB (via currencyRate), then from RMB to USD (dividing by USD rate)

### 2.4 Shipment Splitting (Batch Shipment)
- Creates a new shipment from the source, copying header data
- New shipment gets a fresh code, resets all flags (shipmentFlag, declarationFlag, outboundFlag, etc.) to NO
- New item shipping quantities come from the split request; box counts, volumes, weights are recalculated
- Source shipment items have their `splitQuantity` incremented
- Source shipment gets `batchFlag = YES`
- Order link chain is duplicated asynchronously across sale contracts, purchase plans, purchase contracts, and shipment plans

### 2.5 Change/Approval Workflow
- Changes are tracked via `ShipmentChange` entity storing old and new data
- Field-by-field comparison determines change severity using `FormChangeApi`
- **Three submit paths**:
  1. `ONLY_SAVE` (普通级 / all fields normal): Auto-approved without workflow if `businessFlag=false`; if `businessFlag=true`, enters business approval flow with documenter assignment
  2. `SUBMIT` (需审批): Enters configured BPM approval flow
- BPM listener `ShipmentChangeListener` handles approval events
- `SetDocumenterAssigneeTaskListener` dynamically assigns the documenter (单证员) as the task assignee in the BPM flow
- On approval: Changes are applied to shipment, items, add/sub terms, temporary SKUs, and forwarder fees. Change status becomes CHANGED.
- On rejection: Shipment change status reverts to NOT_CHANGED.
- **Purchase/Stock quantity rebalancing on change**: When shipping quantities change, the system recalculates how quantities are sourced between stock and purchase, following priority: use available stock first, then purchase quantities.

### 2.6 Downstream Document Generation

#### Transform to Commodity Inspection (转商检)
- Splits items by inspection type: **OWNER** (自主商检) generates one inspection record; **VENDER** (供应商商检) generates one per vendor
- Sets `isToCommodityInspection = YES` and records timestamp/user

#### Transform to Declaration (转报关)
- Validates invoice status and product name consistency
- Tracks partial vs full declaration transfers via `ToDeclarationEnum`: NOT_YET_TRANSFERRED, PARTIAL_CONVERSION, TRANSFERRED
- When ALL items' `declarationQuantityOld == shippingQuantity`, shipment's `declarationFlag = YES`
- Multiple shipments can be combined into one declaration if they share the same `foreignTradeCompanyId`

#### Transform to Settlement Form (转结汇)
- Groups items by customer code AND first-node company ID from the company path
- Creates separate settlement forms per company path node
- Tracks partial vs full settlement via `ToSettlementEnum`
- Sets `settleOrderFlag` accordingly on shipment items and parent

#### Transform to Invoicing Notice (转开票通知)
- Groups items by purchase contract code
- **Split purchase items** (`PurchaseModelEnum.COMBINE`) require shipment status >= SHIPPED before invoicing
- Tracks `invoicedQuantity` per item; sets `InvoiceStatusEnum.ISSUED` when `invoicedQuantity >= shippingQuantity`, otherwise `PART_ISSUED`

### 2.7 Shipment Execution (出运)
- **Pre-conditions**: All items must have `outQuantity == shippingQuantity` (exact match required)
- On execution:
  - Status changes to SHIPPED
  - Updates purchase contract shipment dates
  - Updates sale contract collection plan dates
  - Updates sale contract shipped quantities
  - Generates internal purchase/sales contracts (`genInternalContract`)

---

## 3. DECLARATION (报关单 / Declaration)

### 3.1 Calculation Rules
- **Box count per item** = ceiling(declarationQuantity / qtyPerOuterbox)
- **Total quantity** = SUM(declarationQuantity)
- **Total boxes** = SUM(boxCount)
- **Total gross/net weight**: Calculated from specification lists by box count
- **Total volume**: Calculated from specification lists by box count
- **Declaration total** by currency: SUM(declaredQuantity * declarationAmount) grouped by currency

### 3.2 Grouping Logic
Items are grouped for display by 5 keys: `customsDeclarationNameEng`, `taxRefundRate`, `hsCode`, `declarationName`, `hsMeasureUnit`. Within groups:
- Quantities are summed (shipping, declaration, purchase, declared, box count)
- Monetary amounts (commission, sale, refund, insurance, declaration) are summed per currency
- Unit prices are recalculated as total/quantity
- Specification data (volume, gross/net weight) is averaged per box

### 3.3 Validation
- Shipping quantity and declaration quantity must not be zero (after grouping)
- On deletion: Writes back declaration quantities to shipment items, recalculating `declarationQuantityOld` and resetting `isToDeclaration` status

---

## 4. COMMODITY INSPECTION (商检单 / CommodityInspection)

### 4.1 Calculation Rules
Same as Declaration: total quantity, box count, gross weight, net weight, volume, declaration totals.

### 4.2 Grouping Logic
Grouped by 6 keys: `customsDeclarationNameEng`, `taxRefundRate`, `hsCode`, `declarationName`, `hsMeasureUnit`, `shipmentCode`. Same aggregation rules as Declaration, plus:
- **Purchase unit price / with-tax price**: Weighted average calculation = SUM(unitPrice * quantity) / totalQuantity

### 4.3 Business Rules
- On deletion: Resets `isToCommodityInspection` flag on associated shipment items to NO

---

## 5. SETTLEMENT FORM (结汇单 / SettlementForm)

### 5.1 Calculation Rules
- **Total gross weight** = SUM of item gross weights
- **Total volume** = SUM of item volumes
- **Total net weight** = SUM of item net weights
- **Goods value, declaration, purchase totals**: Summed by currency from associated shipment data
- **KANE INV export**: Currency conversion from original to RMB to USD

### 5.2 Grouping Logic
Grouped by 6 keys: `customsDeclarationNameEng`, `taxRefundRate`, `hsCode`, `declarationName`, `hsMeasureUnit`, `purchaseContractCode`. Same aggregation approach as Declaration.

### 5.3 Business Rules
- On deletion: Resets `isToSettlementForm` flag on associated shipment items to NO
- Batch deletion rolls back shipment items via `rollbackShipmentByDeletedSettlement`
- Add/Sub items are managed in parallel with settlement form updates

---

## 6. FORWARDER FEE (船代费用 / ForwarderFee)

### 6.1 Code Generation
- Pattern: `FWF` prefix with sequential number

### 6.2 Fee Aggregation Rules
- For the apply page, unpaid fees are aggregated: fees with the same `(payStatus, companyId, venderId, shipmentId, invoiceCode, currency)` are merged, with amounts summed
- Already-applied fees (with `paymentAppCode`) are also aggregated by the same key plus `paymentAppCode`
- Code lists are concatenated with commas during aggregation

### 6.3 Payment Status
- **NOT_APPLY** (未申请): Initial state. When reverting to this status, `paymentAppCode` and `paymentAppId` are cleared.
- Status transitions are driven by external payment application lifecycle
- `PaymentAppApi` provides payment date and payment status for display

### 6.4 Fee Share
- Fees can be shared across cost centers via `FeeShareApi`
- BPM process `oa_fee_share` manages fee share approval
- Amount retrieval by shipment codes returns amounts grouped by currency

---

## 7. FORWARDER COMPANY INFO (船代公司 / ForwarderCompanyInfo)

### 7.1 Business Rules
- Auto-assigns current logged-in user as `inputUser` on creation
- Generates unique code with `DMS` prefix

---

## 8. CROSS-CUTTING BUSINESS RULES

### 8.1 Code Generation Patterns
| Entity | SN Type | Prefix |
|--------|---------|--------|
| Shipment Plan | `shipment_plan` | `SP` |
| Shipment | `shipment` | `CY` |
| Shipment Change | `shipmentChange` | `CYC` |
| Declaration | `declaration` | `BG` |
| Commodity Inspection | `commodityInspection` | `SJ` |
| Settlement Form | `settlement_form` | `JH` |
| Forwarder Fee | `forwarder_fee` | `FWF` |
| Forwarder Company | `DMS_FCI` | `DMS` |

### 8.2 Order Link / Document Chain
Every major document creates an order link entry with:
- businessId, code, type (OrderLinkTypeEnum), linkCode (traceable chain), parentCode, status, companyId
- Types: SHIPPING_PLAN, SHIPPING_DETAIL, CUSTOMS_DECLARATION, INSPECTION_CERTIFICATE, SETTLEMENT
- On close/delete, order link status is updated accordingly

### 8.3 Data Permission
Separate data permission configurations exist for:
- Shipment, ShipmentPlan, ShipmentChange, Declaration, CommodityInspection, ForwarderFee, SettlementForm

### 8.4 Sale Contract Write-Back Rules
- **Shipment quantity**: Written back on shipment plan create/update; difference-based on update
- **Shipped quantity**: Written back when shipment is executed (SHIPPED status)
- **Convert shipment flag**: Restored on close/case-closed
- **Re-lock flag**: Set to false when shipment is created
- **Shipment total quantity**: Written back when transforming plan to shipment

### 8.5 Company Path Traversal
When generating settlement forms, the system traverses the `JsonCompanyPath` linked list from the sale contract:
- First node generates the primary settlement form
- Subsequent nodes generate additional settlement forms until a FOREIGN_TRADE company is reached
- Internal customers along the path are used to override the customer info on settlement items

### 8.6 Report Template Rules
- Export operations require a valid `reportCode`
- Report template must have `auditStatus = APPROVE`
- Templates are company-specific (falls back to generic if not found)
- Template files are fetched from the file service

### 8.7 Weight Unit Conversion
- If weight unit is "g" (gram), it is converted to kg by dividing by 1000 before aggregation
</task_result>
```

**Tool: task**

**Input:**
```json
{
  "description": "Explore FMS finance rules",
  "prompt": "Explore the business rules in the Finance Management System (FMS) module at C:\\Projects\\z\\zexport\\server\\eplus-module-fms.\n\nI need to understand the business rules (NOT field definitions, but business logic/rules). Focus on:\n1. Read the service implementation files (ServiceImpl.java) in the biz module to find validation rules, state transitions, calculation logic, constraints\n2. Read the enum files in the api module to understand status flows and business constants\n3. Look at controller files for workflow/approval logic\n\nKey things to extract:\n- Status/state machines and transitions (receipt, payment, bank registration)\n- Validation rules\n- Calculation rules (amounts, currency, exchange rates)\n- Business constraints\n- Workflow/approval rules\n- Cross-module interactions (e.g., receipt linked to sales contract, payment linked to purchase)\n\nRead through the main service implementation files thoroughly. Return a detailed summary of ALL business rules found, organized by entity/process.",
  "subagent_type": "explore"
}
```

**Output:**
```
task_id: ses_3addafae8ffeBFgeAI7KBx4xbI (for resuming to continue this task if needed)

<task_result>
I now have a comprehensive understanding of the entire FMS module. Here is the detailed summary of all business rules:

---

# FMS (Finance Management System) Module -- Complete Business Rules Analysis

## Module Overview

The FMS module manages four core entities: **Receipt** (收款单, incoming payments/collections), **Payment** (付款单, outgoing payments), **Bank Registration** (银行登记, bank entry records), and **Customer Claim** (客户认领, customer payment claim/matching). This is an export trade finance management system.

---

## 1. RECEIPT (收款单 -- Incoming Payment/Collection)

### 1.1 Code Generation
- Auto-generated code using serial number type `sn_receipt` with prefix `SK` (abbreviation for 收款/ShouKuan).
- Each receipt gets a unique sequential code upon creation.

### 1.2 Status/State Machine

**Audit Status** (workflow approval status, from BpmProcessInstanceResultEnum):
```
UNSUBMITTED --> PROCESS --> APPROVE
                        --> REJECT
```

**Receipt Status** (ReceiptStatusEnum):
```
AMOUNT_DUE (0, 未收款/Not Received) --> RECEIVED (1, 已收款/Received)
```

### 1.3 Create + Submit Logic
- On creation, if `submitFlag == SUBMIT (1)`, the receipt is immediately submitted to BPM workflow (process definition key: `fms_receipt`).
- If `submitFlag == ONLY_SAVE (0)`, it is saved as a draft only.
- The `startUserId` defaults to the currently logged-in user but can be overridden by the caller.
- When created via the external API (`ReceiptApiImpl`), the `submitFlag` is always forced to `SUBMIT`.

### 1.4 Batch Creation
- Batch creation generates individual codes for each receipt but does NOT auto-submit them to the BPM workflow.

### 1.5 Confirmation Rule (`confirmReceipt`)
- Sets the receipt status to `RECEIVED (1)`.
- Sets `receiptTime` to the current timestamp (`LocalDateTime.now()`).
- Captures the logged-in user's department info (`UserDept`) as the `receiptUser`.
- **Cross-module write-back**: If the receipt's `businessType` is `REPAY (1, 还款/Repayment)`, it calls `repayAppApi.updateRepayStatus()` to update the OA repayment application status.

### 1.6 Approval Workflow
- Uses BPM process definition key: `fms_receipt`.
- `ReceiptAuditResultListener` listens for BPM process completion events and:
  1. Updates the receipt's `auditStatus` with the BPM result.
  2. Writes back the final approver info and approval timestamp.
- Controller exposes approve, reject, and submit endpoints, all gated by permissions (`fms:receipt:audit`, `fms:receipt:submit`).

### 1.7 Validation Rules
- Before update or delete, existence is validated -- throws `RECEIPT_NOT_EXISTS` (error code 1_008_001_001) if the record is not found.

### 1.8 Business Subject Resolution
- The receipt tracks the business subject via `businessSubjectType` + `businessSubjectCode`.
- Subject type mapping for name resolution:
  - `CUST (3)` --> Lookup customer name from CRM module (CustApi)
  - `BUSINESS_VENDER (1)` or `ADMINISTRATION_VENDER (2)` --> Lookup vendor name from SCM module (VenderApi)
  - `PERSON (4)` --> Lookup user info from System module (AdminUserApi), returns JSON-serialized UserDept

### 1.9 Batch Deletion
- Receipts can be batch-deleted by composite key: `businessType` + `businessCode` + `businessSubjectType` + `businessSubjectCode`.
- Used during customer claim cancellation to clean up generated receipts.

### 1.10 Data Model Specifics
- Amount is stored as `JsonAmount` (currency + amount as a composite JSON).
- Exchange rate (`rate`) is stored as a `JsonAmount`.
- Tracks bank details: `bank`, `bankAddress`, `bankAccount`, `bankPoc`, `bankCode`.

---

## 2. PAYMENT (付款单 -- Outgoing Payment)

### 2.1 Code Generation
- Auto-generated code using serial number type `sn_payment` with prefix `FK` (abbreviation for 付款/FuKuan).

### 2.2 Status/State Machine

**Payment Order Status** (PaymentOrderStatusEnum -- tracked in `auditStatus` field):
```
UNSUBMITTED (0) --> PROCESS (1) --> APPROVE (2) --> ALREADY_PLANNED (10) --> ALREADY_PAID (11)
                                --> REJECT (3)                            --> CLOSE (12, 作废)
                                --> BACK (5, 驳回)
                                --> DELEGATE (6)
                                --> SIGN_AFTER (7)
                                --> SIGN_BEFORE (8)
                                --> WAIT_BEFORE_TASK (9)
                APPROVE (2) --> CLOSE (12)  [can close directly from approved]
```

**Payment Status** (PaymentStatusEnum -- tracked in `status` field):
```
UNPAID (0) --> PART_PAID (3) --> PAID (1)
           --> PAID (1)      [direct full payment]
           --> IN_PAYMENT (2)
```

### 2.3 Create Logic
- On creation via the service directly, `auditStatus` is set to `APPROVE (2)` immediately (auto-approved).
- The applyer info (`UserDept`) is resolved from the provided `applyerId` or the current logged-in user.
- **NOTE**: The submit-to-BPM logic is commented out in `createPayment` -- payments appear to bypass BPM approval when created directly.

### 2.4 Create via External API (`PaymentApiImpl`)
- **Zero-amount guard**: If ALL amounts in `applyAmount` are null or zero, the payment is NOT created (silent skip).
- The submit flag is forced to `SUBMIT`.
- The applyer's userId is extracted from the DTO.

### 2.5 Batch Creation with Order Linking
- Each payment in a batch gets its own generated code.
- After batch insert, for each payment that has `linkCodeList`, an `OrderLinkDTO` record is created linking the payment to related orders.
- The link type is `PAYMENT (17)`, with name `付款单`.
- The parent code defaults to the `applyCode` or a hyphen (`-`) if empty.

### 2.6 Plan Payment (`planPayment`)
- **Precondition**: `paymentId` must not be null -- throws `PAYMENT_CODE_EMPTY` otherwise.
- Validates payment existence.
- Transitions `auditStatus` to `ALREADY_PLANNED (10)`.
- Sets: payment bank, bank account, payment method, amount, annex, acceptance days.
- **Batch plan**: Iterates and calls `planPayment` for each item.

### 2.7 Plan Payment Cancel (`planPaymentCancel`)
- **Transactional**: Runs in a transaction with rollback on exception.
- Reverts `auditStatus` to `APPROVE (2)`.
- Clears bank, bank account, payment method, and amount fields.

### 2.8 Single Payment Confirm (`confirmPayment`)
- Updates the payment with:
  - Actual `amount` paid
  - `date` = current timestamp
  - `cashier` = current logged-in user's department info
  - `status` = `PAID (1)`
  - `companyId` from the request
- If DB update returns 0 rows affected, throws `UPDATE_PAYMENT_STATUS_FAIL`.
- **Cross-module write-backs by businessType**:
  - `PAYMENT_APP (4, 公对公)`: Updates OA payment application via `paymentAppApi.updatePaymentApp()`. **Special sub-rule**: If the OA payment app's `relationType` is `EMSSEND (2, 寄件)`, it also updates the EMS send pay status to `YES`.
  - `ENTERTAIN_APP (3)`, `GENERAL_APP (2)`, `TRAVEL_APP (1)`: Updates reimbursement payment status via `reimbApi.updatePaymentStatus()`.
  - `LOAN_APP (5)`: Updates loan application payment status via `loanAppApi.updatePaymentStatus()`.
  - `PAYMENT_APPLY (7)`: Writes back payment message to purchase payment application via `paymentApplyApi.batchWriteBackPaymentMsg()`.

### 2.9 Batch Payment Confirm (`batchConfirmPayment`) -- THE CORE BUSINESS LOGIC
- **Transactional**: Runs in a transaction with rollback on exception.
- **Precondition**: Payment IDs list must not be empty -- throws `PAYMENT_CODE_EMPTY`.
- Validates all payments exist -- throws `PAYMENT_NOT_EXIST` if the batch is empty after DB lookup.

**Amount calculation logic per payment**:
1. Get existing `paidAmount` (defaults to 0 if null).
2. Add current payment amount: `paidAmount = paidAmount + currentAmount` (using `NumUtil.add`).
3. Calculate total `applyAmount` by summing all `JsonAmount.amount` values in the `applyAmount` list.
4. **Status determination rule**:
   - If `paidAmount >= applyAmount`: status = `PAID (1)`, auditStatus = `ALREADY_PAID (11)`.
   - If `paidAmount < applyAmount`: status = `PART_PAID (3)`, auditStatus = `APPROVE (2)` (reset to allow re-planning).

**Annex merging**: If the current payment has annexes, they are merged (appended) to the existing annex list.

**Payment detail fallback**: Individual payment item values (paymentDate, companyId, paymentMethod, bank, bankAccount) fall back to the batch-level defaults if the item-level values are null/empty.

**Post-payment write-backs (only for FULLY PAID payments)**:
1. **Purchase contract amount write-back**: If `businessType == PAYMENT_APPLY (7)`, retrieves the payment application details and updates each referenced purchase contract's paid amount.
2. **Auxiliary purchase contract**: If `businessType == PAYMENT_APP (4)` and the OA payment app's relation type is `AUXILIARY_PURCHASE (4, 包材采购合同)`, updates auxiliary purchase amounts.
3. **Fee share status update**: Marks the fee share record as paid (`BooleanEnum.YES`).
4. **Source application write-backs by businessType** (grouped by type):
   - `PAYMENT_APP (4)` --> `paymentAppApi.batchUpdatePaymentApp()`
   - `ENTERTAIN_APP (3)` / `GENERAL_APP (2)` / `TRAVEL_APP (1)` / `OTHER_APP (8)` --> `reimbApi.batchUpdatePaymentStatus()`
   - `LOAN_APP (5)` --> `loanAppApi.batchUpdaPaymentStatus()`
   - `PAYMENT_APPLY (7)` --> `paymentApplyApi.batchWriteBackPaymentMsg()`
5. **Annex write-back**: Payment apply annexes are written back regardless of full/partial payment status.

### 2.10 Payment Page Aggregation
- The payment page response includes a `summary` map containing `amountSum` -- the total amounts grouped by currency across all records matching the query (not just the current page).

### 2.11 Payment Validation (Anti-Audit Check)
- Used by external modules to validate before reversing an audit.
- **Rule**: If any payment exists for the given `businessType` + `businessCode` where `status` is NOT `UNPAID (0)` and NOT `IN_PAYMENT (2)`, the validation fails with `ANTI_AUDIT_EXCEPT`.
- In other words: you can only reverse-audit if all related payments are still unpaid or in-payment.

### 2.12 Close Payment (作废)
- **By ID**: Validates existence. **Constraint**: Cannot close a payment with `auditStatus == ALREADY_PAID (11)` -- throws `PAYMENT_PAID_NOT_CLOSE`. Sets auditStatus to `CLOSE (12)`. Updates the order link status as well.
- **By businessType + businessCode (API-level)**: Finds all payments with matching type/code AND `status == UNPAID (0)`. Sets their auditStatus to `CLOSE (12)`, records cancel reason, cancel time, and cancel user.

### 2.13 Approval Workflow
- Uses BPM process definition key: `fms_payment`.
- `PaymentAuditResultListener` handles BPM completion events identically to the receipt listener.

---

## 3. BANK REGISTRATION (银行登记 -- Bank Entry Record)

### 3.1 Code Generation
- Uses SN type `${table.snType}` (appears to be a placeholder not yet configured) with prefix `SK`.

### 3.2 Status
- Binary status driven by `BooleanEnum`: `YES (1)` = submitted/active, `NO (0)` = draft.
- Controlled by `submitFlag` at creation time.

### 3.3 Claim Status (ClaimStatusEnum)
```
NOT_CLAIM (0, 未认领) --> PART_CLAIM (1, 部分认领) --> CLAIM (2, 已认领)
```
- Managed by the customer claim process, not directly by bank registration.

### 3.4 Creation Logic
- Supports batch creation of multiple registrations at once.
- **Auto-enrichment**: For each registration, looks up the `companyTitle` (bank entry company title/header) against the CRM to find matching customers.
  - Extracts all sales managers (`managerList`) from the matched customers (de-duplicated by userId).
  - Extracts customer list (`custList`) from the matches.
- These are stored on the registration record for display/filtering.

### 3.5 Bank POC Lookup
- `getSimpleRegistrationRespByBankPoc`: Looks up vendor info by bank point-of-contact (bank POC) name. Customer lookup is commented out, so currently only vendor lookup is active.

### 3.6 Validation
- Before update or delete, existence is validated -- throws `BANK_REGISTRATION_NOT_EXISTS` (error code 1_008_001_003).

---

## 4. CUSTOMER CLAIM (客户认领 -- Payment Claim/Matching)

This is the most complex process in the FMS module. It matches incoming bank registration records to specific customers and their sales contracts.

### 4.1 Claim Detail View (`getCustClaim`)
- Loads the bank registration record.
- **Unclaimed amount calculation**: `unclaimedAmount = amount - claimedAmount` (using `NumUtil.sub`).
- Looks up customers by the registration's `companyTitle` via `custApi.getSimpleCustRespByBankPoc()`.
- Loads existing payee entities for the registration from `fms_payee` table.
- Transforms customer list into payee entities for display.
- Loads claim item list by customer codes and companyId from `fms_cust_claim_item` table.

### 4.2 Create Claim (`createCustClaim`) -- Core Transaction
- **Transactional**: Full transaction with rollback on exception.

**Step 1: Insert Payee Entities**
- Clears IDs (to force insert) and sets the `registrationId`.
- Batch-inserts all payee entities into `fms_payee`.

**Step 2: Customer Title Write-Back**
- Retrieves existing customer codes associated with the company title.
- For any customer in the payee list NOT already associated with this title, writes back the title to the CRM via `custApi.createCustTitle()`.

**Step 3: Insert Claim Items**
- Sets `claimPerson` to the current logged-in user's department info.
- Sets `claimDate` to current timestamp.
- Sets `registrationId` on each item.
- Batch-inserts into `fms_cust_claim_item`.

**Step 4: Exchange Rate and Contract Amount Calculation**
- Fetches daily exchange rates via `rateApi.getDailyRateMap()`.
- **Key calculation for `contractAmount`** (in the WriteBackDTO):
  ```
  contractAmount = contractAmount + differenceAmount + (financeAmount / dailyRate[financeAmount.currency]) * dailyRate[claimItem.currency]
  ```
  This converts finance amounts from their original currency to the claim item's currency using daily exchange rates.

**Step 5: Write Back to Sales Contract Collection Plan**
- Creates `WriteBackDTO` list with: currency, completedFlag, itemId, sourceType, differenceReason, and a `CollectionPlanItem` containing the claim details.
- Calls `saleContractApi.writeBackContract(writeBackDTOList, false)` (false = not rollback).

**Step 6: Create Receipt Orders**
- For each payee entity, creates a receipt with:
  - `auditStatus` = `APPROVE` (auto-approved, no BPM)
  - `amount` = payee's `claimTotalAmount` with currency
  - `rate` = daily rate for the payee's currency
  - `receiptTime` = current timestamp
  - `businessType` = `CLAIM (6, 回款认领)`
  - `businessCode` = the bank registration ID (as string)
  - `businessSubjectType` = `CUST (3, 客户)`
  - `businessSubjectCode` = the payee's customer code
  - `status` = `YES (1)` (i.e., already received)
- If batch receipt creation returns empty, throws `RECEIPT_NOT_EXISTS`.

**Step 7: Write Receipt Code Back to Claim Items**
- Each claim item gets the receipt code of the receipt matching its customer code.

**Step 8: Create Order Links**
- For each claim item with a contract code, retrieves linked codes from the sales contract.
- Creates `OrderLinkDTO` records with link type `RECEIPT_ORDER (22)` and name `收款单`.

**Step 9: Write Back Registration Amounts**
- Updates the bank registration's `claimedAmount`:
  - `claimedAmount = existing claimedAmount + sum(claimItem.claimedAmount)`
- **Claim status determination rule**:
  - If `claimedAmount == 0`: `NOT_CLAIM (0)`
  - If `claimedAmount == amount` (full): `CLAIM (2)`
  - Otherwise: `PART_CLAIM (1)`
- Updates `custList` and `managerList` on the registration from the payee customer info.

### 4.3 Cancel Claim (`cancelCustClaim`) -- Full Rollback
- **Transactional**: Full transaction with rollback on exception.

**Rollback steps**:
1. Deletes all payee entities for the registration.
2. Calls `custApi.deleteCustTitle()` to rollback title associations.
3. Deletes all generated receipt orders (via `receiptService.batchDeletedReceipt()`).
4. Deletes all claim items.
5. Writes back to sales contract collection plan with `rollback = true` and `completedFlag = NO`.
6. **Reverses the claimed amount**: `claimedAmount = existing claimedAmount - sum(claimItem.claimedAmount)`.
7. Recalculates claim status using the same rules.
8. Clears `custList` and `managerList` from the registration.

### 4.4 Claim Item Types
- `type` field: `0` = 回款认领 (payment claim), `1` = 其他收费 (other charges).
- `otherFeeType` values: `1` = Certificate fee, `2` = Mold fee, `3` = Sample fee, `4` = Express fee, `5` = Inspection fee.

### 4.5 Collection Plan Steps (sourceType)
- `ADVANCE_RECEIPT (1)` = Advance receipt/prepayment.
- `FIRST_PAYMENT (2)` through `FIFTH_PAYMENT (6)` = Sequential collection milestones.
- Items with `sourceType == ADVANCE_RECEIPT` or `sourceType == 0` are treated specially (always included without invoice-based splitting).

### 4.6 Split Logic by Shipment Invoice (Currently Disabled)
- There is commented-out logic to split claim items by shipment invoice number and warehouse-out numbers.
- When active, it would:
  - Look up shipment price data by sale contract code.
  - Split each claim item into sub-items per invoice code.
  - Apply collection ratio: `receivablePrice = receivablePrice * (collectionRatio / 100)`.
  - Track received amounts per invoice code.

---

## 5. CROSS-MODULE INTERACTION SUMMARY

| FMS Entity | External Module | API Called | Direction | Trigger |
|---|---|---|---|---|
| Receipt | OA (RepayApp) | `repayAppApi.updateRepayStatus()` | FMS --> OA | Receipt confirmation with businessType=REPAY |
| Receipt | CRM | `custApi.getCustNameCache()` | FMS <-- CRM | Name resolution for display |
| Receipt | SCM | `venderApi.getVenderNameCache()` | FMS <-- SCM | Name resolution for display |
| Payment | OA (PaymentApp) | `paymentAppApi.updatePaymentApp()` | FMS --> OA | Payment confirmation (type 4) |
| Payment | OA (PaymentApp) | `paymentAppApi.batchUpdatePaymentApp()` | FMS --> OA | Batch payment confirmation (type 4) |
| Payment | OA (Reimb) | `reimbApi.updatePaymentStatus()` | FMS --> OA | Confirmation for types 1,2,3 |
| Payment | OA (Reimb) | `reimbApi.batchUpdatePaymentStatus()` | FMS --> OA | Batch confirmation for types 1,2,3,8 |
| Payment | OA (LoanApp) | `loanAppApi.updatePaymentStatus()` | FMS --> OA | Confirmation for type 5 |
| Payment | SCM | `paymentApplyApi.batchWriteBackPaymentMsg()` | FMS --> SCM | Confirmation for type 7 |
| Payment | SCM | `purchaseContractApi.updatePurchaseAmount()` | FMS --> SCM | Full payment of type 7 (purchase) |
| Payment | SCM | `purchaseContractApi.updateAuxiliaryPurchaseAmount()` | FMS --> SCM | Full payment of type 4 + auxiliary relation |
| Payment | EMS | `emsSendSpi.updatePayStatusByCodeList()` | FMS --> EMS | Confirmation of type 4 + EMS send relation |
| Payment | OA (FeeShare) | `feeShareApi.updatePaymentStatus()` | FMS --> OA | All fully paid payments |
| Payment | Infra | `orderLinkApi.batchCreateOrderLink()` | FMS --> Infra | Batch creation / linking |
| Customer Claim | SMS (SaleContract) | `saleContractApi.writeBackContract()` | FMS --> SMS | Claim creation and cancellation |
| Customer Claim | SMS (SaleContract) | `saleContractApi.getLinkCodeMap()` | FMS <-- SMS | Order linking during claim |
| Customer Claim | CRM | `custApi.createCustTitle()` / `deleteCustTitle()` | FMS --> CRM | Title write-back and rollback |
| Customer Claim | Infra (Rate) | `rateApi.getDailyRateMap()` | FMS <-- Infra | Currency exchange rate lookup |
| Bank Registration | CRM | `custApi.getSimpleCustRespByBankPoc()` | FMS <-- CRM | Customer matching by title |
| Bank Registration | SCM | `venderApi.getSimpleVenderRespByBankPoc()` | FMS <-- SCM | Vendor matching by bank POC |

---

## 6. PERMISSION MODEL

| Entity | Create | Update | Delete | Query | Submit | Audit | Confirm | Plan | Close | Export |
|---|---|---|---|---|---|---|---|---|---|---|
| Receipt | `fms:receipt:create` | `fms:receipt:update` | `fms:receipt:delete` | `fms:receipt:query` | `fms:receipt:submit` | `fms:receipt:audit` | `fms:receipt:confirm` | -- | -- | `fms:receipt:export` |
| Payment | `fms:payment:create` | `fms:payment:update` | `fms:payment:delete` | `fms:payment:query` | `fms:payment:submit` | `fms:payment:audit` | `fms:payment:confirm` | `fms:payment:plan-payment` | `fms:payment:close` | `fms:payment:export` |
| Bank Registration | `fms:bank-registration:create` | `fms:bank-registration:update` | `fms:bank-registration:delete` | `fms:bank-registration:query` | -- | -- | -- | -- | -- | `fms:bank-registration:export` |
| Customer Claim | `fms:cust-claim:create` | -- | -- | `fms:cust-claim:query` | -- | -- | -- | -- | `fms:cust-claim:cancel` | -- |

---

## 7. ERROR CODES

| Code | Constant | Message (Chinese) | Meaning |
|---|---|---|---|
| 1_008_001_001 | `RECEIPT_NOT_EXISTS` | 收款单不存在 | Receipt not found |
| 1_008_001_002 | `UPDATE_PAYMENT_STATUS_FAIL` | 付款状态更新失败 | Payment status update failed (0 rows affected) |
| 1_008_001_003 | `BANK_REGISTRATION_NOT_EXISTS` | 银行登记单不存在 | Bank registration not found |
| 1_008_001_004 | `PAYMENT_CODE_EMPTY` | 付款单编号为空 | Payment ID/code is null or empty |
| 1_008_001_005 | `PAYMENT_NOT_EXIST` | 付款单不存在 | Payment not found (batch context) |
| (from CRM) | `ANTI_AUDIT_EXCEPT` | -- | Anti-audit validation failed (paid payments exist) |
| (from CRM) | `PAYMENT_PAID_NOT_CLOSE` | -- | Cannot close already-paid payment |

---

## 8. KEY BUSINESS CONSTRAINTS SUMMARY

1. **A payment that has been fully paid (`ALREADY_PAID`) cannot be closed/voided.**
2. **A business record cannot have its audit reversed if any linked payment has status other than UNPAID or IN_PAYMENT.**
3. **Payment amounts are multi-currency** -- `applyAmount` is a list of `JsonAmount` objects. The aggregation/comparison logic sums amounts within the same currency.
4. **Partial payment is supported** -- a payment order can be paid in multiple installments; its status transitions through `PART_PAID` until the cumulative `paidAmount >= applyAmount`.
5. **Claim amounts must balance** -- the bank registration's `claimedAmount` is the running total of all claim items; the claim status is determined by comparing it against the total `amount`.
6. **Currency conversion uses daily exchange rates** from the infra module's rate service during customer claim processing.
7. **Receipts created by customer claims are auto-approved** (auditStatus = APPROVE, status = YES) -- they bypass the BPM workflow.
8. **Payments created via the external API skip zero-amount entries silently** -- all-zero or all-null amounts are filtered out.
9. **Customer claim is fully reversible** -- cancellation rolls back all side effects: payee records, receipt records, title associations, collection plan write-backs, and claimed amounts.
</task_result>
```

---

## Assistant (Build · claude-opus-4-6 · 351.2s)

Now let me also explore the remaining business modules for completeness.

**Tool: task**

**Input:**
```json
{
  "description": "Explore OA and other modules",
  "prompt": "Explore the business rules in the following modules at C:\\Projects\\z\\zexport\\server:\n\n1. **eplus-module-oa** (Office Automation) - reimbursements, loans, travel, payment applications\n2. **eplus-module-qms** (Quality Management) - quality inspection\n3. **eplus-module-pms** (Product Management) - product catalog\n4. **eplus-module-crm** (Customer Relationship Management)\n5. **eplus-module-mms** (Manufacturing Management)\n\nFor each module, focus on:\n- Status/state machines and transitions\n- Key validation rules and business constraints\n- Workflow/approval rules\n- Cross-module interactions\n\nRead the service implementation files (ServiceImpl.java) and enum files for each module. Be thorough but focus on business rules, not field definitions.\n\nReturn a comprehensive summary organized by module.",
  "subagent_type": "explore"
}
```

**Output:**
```
task_id: ses_3add270f1ffePg5W8QPY2fD0wZ (for resuming to continue this task if needed)

<task_result>
Now I have a comprehensive picture. Here is the full summary:

---

# Comprehensive Business Rules Summary by Module

## 1. eplus-module-oa (Office Automation)

### 1.1 Status/State Machines

**Universal BPM Audit Status** (shared across all OA documents):
- `UNSUBMITTED` -> `PROCESS` (审核中) -> `APPROVE` (已通过) | `REJECT` (已驳回)
- `CANCEL` (已取消) / `CLOSE` (已作废) are terminal states

**Loan Application (LoanApp) Status** - dual-track state machine:
- BPM Audit: `UNSUBMITTED -> PROCESS -> APPROVE | REJECT`; on `CANCEL`, reverts to `PRE_SUBMIT`
- Loan Business Status (`VenderLoanStatusEnum`): `PRE_SUBMIT(1)` -> `PRE_APPROVE(2)` -> `APPROVE(3)` | `REJECT(4)` -> `FINISH(5)`
- These two states are synchronized: when `auditStatus` updates, `loanStatus` is mapped accordingly in `updateAuditStatus()`

**Loan Repayment Status (`RepayStatus`)**: `NOT_REPAID(0)` -> `REPAID(1)` | `CANCEL(2)`

**Payment Status (`PaymentStatusEnum`)**: `UNPAID(0)` -> `PAID(1)` | `IN_PAYMENT(2)` | `PART_PAID(3)`

**Print Status (`PrintFlagEnum`)**: `NO(0)` -> `YES(1)` (with print count incrementing)

### 1.2 Key Business Rules - Apply (OA Application)

- **Code generation**: Auto-generated with prefix `app` using `CodeGeneratorApi`
- **Types**: Travel(1), General/Expense(2), Entertain(3), Other(4) -- each has its own BPM process key (`oa_apply_travel`, `oa_apply_general`, `oa_apply_entertain`)
- **Fee sharing mandatory**: `FeeShareReqDTO` list is REQUIRED; throws `FEE_SHARE_NOT_EXISTS` if empty
- **Submit-on-create**: If `submitFlag == SUBMIT`, the BPM workflow is triggered immediately after insert
- **Workflow variables**: `applyAmount` and `deptCode` are passed as process variables (used for approval routing)
- **Expense tracking**: International business trips (`TravelTypeEnum.INTERNATIONAL_BUSINESS_TRIP`) allow MULTIPLE expense claims (counter incremented/decremented); domestic trips allow only ONE (binary 0/1)
- **Close**: Sets `auditStatus` to `CLOSE` directly without workflow

### 1.3 Key Business Rules - Loan Application (LoanApp)

- **Two loan sources** with DIFFERENT workflows:
  - `PERSON` (personal loan): uses process key `oa_loan_app`
  - `VENDER` (vendor loan): uses process key `vender_loan`
- **Validation on edit/delete**: Records in `PROCESS` (under review) audit status CANNOT be modified or deleted (`UNDERREVIEW_EDITTING_NOT_ALLOWED`)
- **Currency rate validation**: On submit, the system validates that the loan currency has a daily exchange rate configured; throws `CURRENCY_RATE_NOT_EXISTS` if missing
- **Auto-fill bank info**: On create, the applicant's bank account details are auto-populated from the user profile
- **Outstanding amount tracking**: `outstandingAmount = amount - repayAmount`; when outstanding reaches zero, `repayStatus` is set to `REPAID`
- **Repay amount calculation**: Includes TWO sources -- direct repayment (`RepayApp`) AND reimbursement repayment (`ReimbRepayDetail`)
- **Print management**: Each print increments `printTimes` and sets `printFlag = YES`
- **Vendor outstanding loan check**: Can query all approved, not-yet-repaid vendor loans for a given vendor code

### 1.4 Key Business Rules - Reimbursement (Reimb)

- **Four types** with distinct code prefixes: Travel(`BSC`), Entertain(`BSZ`), General(`BST`), Other(`BSM`)
- **Invoice holder status management**: When reimb details are created/updated/deleted, the linked invoice holder records toggle between `REIMBURSED` and `NOT_REIMBURSED`
- **Draft mechanism**: A singleton draft record (`draftFlag = YES`) holds uncommitted expense items
- **Loan-reimb offset logic** (`dealRepayApp`): When a reimbursement references loans, the system automatically:
  - Compares reimb amount vs. outstanding loan amount per currency
  - If reimb < outstanding: entire reimb amount goes to loan repayment
  - If reimb >= outstanding: settles the loan fully, remainder becomes actual reimbursement payout
  - Creates `RepayApp` records with type `Reimb(3)` for each offset
- **Close/void rules**:
  - Cannot void if payment status is `PAID` or `PART_PAID`
  - On void: rolls back loan amounts (re-adds outstanding, subtracts repaid), deletes repay details, syncs void to unpaid payment records, restores apply expense counts
- **Submit variables**: Total amount (converted to RMB via daily rates) and `deptCode` passed to BPM
- **Actual user validation**: The `actualUser` (the person who receives payment) is REQUIRED on submit

### 1.5 Key Business Rules - Payment Application (PaymentApp)

- **Three types** (`PaymentAppTypeEnum`): `PRE_PAID(1)` (advance), `PAYMENT(2)` (payment), `OFF_SET(3)` (offset)
- **Company matching rule**: For non-prepaid types, if linking existing payment codes, ALL linked payments must belong to the SAME company entity; otherwise throws `COMPANY_NOT_MATCH`
- **Cross-module write-back on create**:
  - EMS Send type: updates send status to `COMPLETED`
  - DMS Forwarder type: updates forwarder fee status to `APPLY`
  - Auxiliary Purchase type: updates auxiliary payment status to `YES`
- **Cross-module write-back on delete** (all reversed):
  - EMS: reverts to `PENDING_PAY`
  - DMS Forwarder: reverts to `NOT_APPLY`
  - Auxiliary Purchase: reverts to `NO`
  - Fee share data deleted
  - Linked payment apps get `linkFlag` reset to `NO`
- **Fee share handling**: When `feeShareFlag = YES` and `auxiliaryType = YES`, fee share records must be provided (throws `REIMBER_SHARE_NOT_NULL` if empty)
- **Recursive payment linking**: `getPaymentAppList` can recursively traverse linked payment chains

### 1.6 Key Business Rules - Repay Application (RepayApp)

- **Configurable audit**: If config key `REPAY_AUDIT_FLAG` is turned OFF, submission directly creates a receipt and approves (no workflow)
- **Amount validation**: Repay amount CANNOT exceed the loan's outstanding amount (`REPAY_AMOUNT_ERROR`)
- **On payment confirmation**: Updates repay status and writes back to the loan's `repayAmount` and `outstandingAmount`
- **Receipt creation**: On approval (direct or via workflow), a `Receipt` record is created with `businessType = REPAY`

---

## 2. eplus-module-qms (Quality Management System)

### 2.1 Status/State Machines

**Inspection Bill Status (`InspectionBillStatusEnum`)**:
```
WAITING_FOR_CONFIRMATION(2) -> EXPECTING_INSPECTION(3) -> 
  INSPECTION_PASS(5) | INSPECTION_FAIL(4) | INSPECTION_PART(6) -> CASE_SETTLED(8)
```
Also: `AWAITING_APPROVAL(1)`, `REJECTED(7)`

**Inspection Item Status (`InspectionItemStatusEnum`)**: `PENDING(1)`, `FAIL(2)`, `SUCESS(3)` (note: intentional spelling)

**QMS Handle State (`QmsHandleStateEnum`)**: `REWORK(1)`, `RELEASE(2)` (concession release / let-pass)

### 2.2 Key Business Rules

- **Auto-status derivation**: The overall inspection bill status is COMPUTED from individual item statuses:
  - ALL items `SUCCESS` -> bill = `INSPECTION_PASS`
  - ALL items NOT SUCCESS -> bill = `INSPECTION_FAIL`
  - Mixed -> `INSPECTION_PART`
  - No statuses set -> `EXPECTING_INSPECTION`
- **Remote inspection special handling**: When `inspectionType == REMOTE(7)`:
  - Status is calculated immediately on creation
  - Inspection time defaults to now
  - Item statuses are synced to the purchase contract immediately
- **Final inspection node**: Status sync to purchase contract ONLY occurs when `inspectionNode == FINAL`
- **Concession release** (`setConcessionReleaseStatus`):
  - Sets item `handleFlag` to `RELEASE(2)` 
  - Items with `handleFlag = RELEASE` are treated as `SUCCESS` in status calculation
  - Syncs updated inspection data back to purchase contract
- **Rework** (`reworkQualityInspection`):
  - CANNOT rework items that are already `SUCCESS` or have `handleFlag = YES` (throws `QUALITY_ITEM_SKU_SUCCESS`)
  - All selected items must belong to the SAME inspection (throws `QUALITY_CODE_NOT_SAME`)
  - Creates a NEW inspection record from failed/pending items with `reinspectionFlag = YES`
  - Sets item `handleFlag` to `REWORK(1)` on original record
- **Close** (`closeInspection`): Sets status to `CASE_SETTLED(8)`, updates order link status
- **Order link tracking**: On create, links are registered via `OrderLinkApi` connecting inspection to purchase contracts

### 2.3 Cross-Module Interactions

- **PurchaseContract (SCM)**: Syncs inspection item status and handle flags; updates contract `checkStatus` on audit status changes
- **SKU (PMS)**: Fetches product images and thumbnails for inspection items
- **PackageType (PMS)**: Resolves package type names for display
- **SaleContract (SMS)**: Retrieves related sale contract codes
- **Customer (CRM)**: Gets customer names for display
- **OrderLink (Infra)**: Maintains an order tracking chain

---

## 3. eplus-module-pms (Product Management System)

### 3.1 Status/State Machines

**SKU Audit Status** (BPM-driven):
- `UNSUBMITTED` -> `PROCESS` -> `APPROVE` | `REJECT`
- Customer products (`custProFlag = YES`) are auto-approved (skip workflow entirely)

**Change Status (`ChangeStatusEnum`)**: `NOT_CHANGED(1)` -> `IN_CHANGE(2)` -> `CHANGED(3)`

**SKU Types**: Basic product, Customer product (`custProFlag`), Own brand (`ownBrandFlag`), Agent product (`agentFlag`), Product mix/combo, Accessories, Auxiliary materials

### 3.2 Key Business Rules

- **Multiple workflow definitions**:
  - Basic SKU: `pms_sku`
  - Own brand: `pms_own_brand`
  - Auxiliary materials: `pms_auxiliary_sku`
  - Change variants: `pms_change_sku`, `pms_change_csku`, `pms_change_own_brand`, `pms_change_auxiliary_sku`
- **Configurable audit bypass**: Config keys `base_sku_audit_flag` and `own_sku_audit_flag` can disable workflow (value `"0"` = auto-approve)
- **Code uniqueness rules**:
  - Customer products: UNIQUE combination of `basicSkuCode + custCode + cskuCode` (throws `CSKU_CODE_EXIST`)
  - Own brand: UNIQUE `oskuCode` (throws `OSKU_CODE_EXIST`)
  - Basic products: UNIQUE `code` (throws `BASE_SKU_CODE_NUL`)
  - Agent products: auto-generated code with configurable prefix
  - Code collision check: re-generates until unique
- **Basic SKU code inheritance**: Non-customer, non-own-brand products have `basicSkuCode = code`
- **Agent products**: `commodityInspectionFlag` is forced to `NO`
- **Auto-create customer sub-products**: When a combo/mix customer product is approved, the system recursively creates customer-version copies of all child products that don't yet exist for that customer
- **Change management (versioning)**:
  - Cannot change if already in `IN_CHANGE` status or a higher version exists
  - Creates a NEW record with `ver + 1` and `changeFlag = YES`
  - **Change level detection**: Compares old vs new using `FormChangeApi` config to determine if fields require approval; "ordinary" level changes auto-approve, "form" level changes require BPM workflow
  - On change success: deletes old version, updates all customer products pointing to this SKU, propagates effect ranges to SMS/SCM/DMS (sets `confirmFlag = NO`)
  - **HS code cascading**: If base SKU's HS code changes AND config `bsku_hscode_change_effect_csku_flag = YES`, ALL customer products derived from it get their HS code updated
- **Quote item pricing**: `totalPrice = withTaxPrice + packagingPrice + shippingPrice`
- **Image compression**: Generates 200x200 thumbnails with white background padding for main product images

### 3.3 SPU (Standard Product Unit)

- **Update = delete + recreate**: Updates use a delete-then-create pattern with new auto-increment ID
- **Audit guard**: Cannot delete/edit while `auditStatus = PROCESS`
- **Code derived from category**: Category prefix code drives the SPU code generation

### 3.4 Cross-Module Interactions

- **CRM**: Customer code lookups for customer products
- **SCM**: Vendor quotations, purchase contract data for change effect analysis
- **SMS**: Sale contract data for change effect
- **DMS**: Shipment data for change effect, confirm flag updates
- **Infra**: Form change configuration for field-level change detection

---

## 4. eplus-module-crm (Customer Relationship Management)

### 4.1 Status/State Machines

**Customer Audit Status** (BPM-driven): `UNSUBMITTED -> PROCESS -> APPROVE | REJECT | CANCEL`

**Change Status**: `NOT_CHANGED(1)` -> `IN_CHANGE(2)` -> `CHANGED(3)` (same as PMS)

**Customer Stage (`CustomerStageEnum`)**: `LEAD_CUSTOMERS(1)` -> `ORDINARY_CUSTOMERS(2)` -> `KEY_CUSTOMERS(3)` -> `LAPSED_CUSTOMERS(4)`

### 4.2 Key Business Rules

- **Two workflows**: New customer uses `oa_cust`, change uses `oa_change_cust`
- **Name uniqueness**: Customer name MUST be unique across all codes (validates on create and change)
- **Currency validation on submit**: Exactly ONE currency must be marked as default (`defaultFlag`); throws `CURRENCY_WRONG` otherwise
- **Code generation**: Uses country area code as prefix (e.g., `C` + area code + sequence)
- **Manager IDs maintenance**: `managerList` (business managers) are converted to `managerIds` for data permission filtering
- **Delete rules**: Only records in `UNSUBMITTED` or `CANCEL` audit status can be deleted; otherwise throws `UNSUBMIT_EDIT_DEL_NOT_ALLOWED`
- **Edit guard**: Cannot modify records in `PROCESS` audit status

### 4.3 Change Management (Versioning)

- **Same pattern as PMS**: Creates new versioned record, old is soft-deleted on approval
- **Cannot change if**: already `IN_CHANGE` or a higher version exists
- **Field-level change detection** using `FormChangeApi`:
  - Reads configuration from tables: `crm_cust`, `crm_cust_bankaccount`, `crm_cust_poc`, `crm_cust_settlement`, `crm_mark`, `crm_company_path`
  - Each field has configured `effectRange` (SMS/SCM/DMS) and `effectMainInstanceFlag`
  - Each field has a `changeLevel`: `FORM` level requires approval workflow; ordinary level auto-approves
- **Effect range propagation on change success**:
  - SMS-affecting changes: marks all uncompleted sale contracts for this customer as `confirmFlag = NO`
  - DMS-affecting changes: marks all unshipped shipments for this customer as `confirmFlag = NO`
  - Updates customer name/code in sale contracts and shipments
- **Auto-approve path**: If ALL changed fields are ordinary-level, the change is auto-approved without BPM workflow

### 4.4 Sub-entity Management

- Bank accounts, contacts (POC), settlement methods, company paths, and collection accounts are ALL managed as child entities
- On update: old child records are deleted and re-created (full replace strategy)

### 4.5 Cross-Module Interactions

- **SMS (SaleContractApi)**: Queries uncompleted sales, updates confirm flags, propagates customer name changes
- **DMS (ShipmentApi)**: Queries unshipped items, updates confirm flags, propagates customer changes
- **OA**: PaymentApp and FeeShare APIs for financial linkage
- **Infra**: Country info for code generation, form change config, company paths, settlement methods
- **EXMS**: Exhibition info for customer source tracking

---

## 5. eplus-module-mms (Manufacturing Management System)

### 5.1 Status/State Machine

**Manufacture Status (`MmsManufactureStatusEnum`)**:
```
PENDING_DONE(1, "待完成") -> DONE(2, "已完成") -> FINISH(3, "已结案")
```
Also supports: `DONE -> PENDING_DONE` (unfinish/revert)

### 5.2 Key Business Rules

- **No BPM workflow**: Manufacturing orders do NOT use BPM approval; status transitions are direct
- **Code generation**: Prefix `MF`, type `SN_MANFACTURE`
- **Create validations**:
  - Children (sub-products) list MUST NOT be empty (throws exception)
  - Default status is `PENDING_DONE(1)` if not specified
  - Records input user and timestamp
- **Three-tier data structure**: Manufacture -> ManufactureSku (products) -> ManufactureSkuItem (product components/items)
- **Done operation** (`doneManufacture`):
  - Validates SKU items exist (throws `MANUFACTURE_SKU_ITEM_NOT_EXISTS`)
  - Sets status to `DONE` with `doneTime = now()`
  - Stock validation logic is present but COMMENTED OUT (prepared for future WMS integration)
- **Finish operation** (`finishManufacture`): Sets status to `FINISH` with `finishTime` and `finishDesc`
- **Unfinish operation** (`unfinishManufacture`): REVERTS status from `FINISH` back to `PENDING_DONE`, clears `finishTime` and `finishDesc`
- **Batch done**: Supports marking multiple manufacture orders as `DONE` simultaneously
- **Delete cascade**: Deleting a manufacture order also deletes all child `ManufactureSku` and `ManufactureSkuItem` records
- **Operation logging**: Uses `OperateCompareUtil` to detect and log field-level changes on update

### 5.3 Cross-Module Interactions

- **WMS (IStockApi)**: Stock API is injected but stock validation is currently disabled (commented out); designed to check available inventory before completing manufacture
- **PMS**: Product/SKU data referenced through the manufacture SKU items

---

## Cross-Cutting Patterns

### Shared Across All Modules:
1. **BPM Integration**: All approval-based entities share the same `BpmProcessInstanceApi` pattern with `submitTask`, `approveTask`, `rejectTask`, and `updateAuditStatus` methods
2. **Code Generation**: Universal `CodeGeneratorApi.getCodeGenerator(type, prefix)` pattern
3. **SubmitFlag Pattern**: `SubmitFlagEnum.SUBMIT` triggers automatic workflow submission on create/update
4. **Fee Share System**: OA module acts as a central fee allocation hub; payment apps, reimbursements, and applications all manage `FeeShareReqDTO` records
5. **Change Management** (CRM + PMS): Identical version-based change management with field-level change detection via `FormChangeApi`, auto-approve for minor changes, BPM workflow for significant changes, and downstream confirm flag propagation
6. **Payment Writeback Chain**: `FMS Payment` -> `OA Reimb/LoanApp/PaymentApp` -> updates `paymentStatus`, `paymentAmount`, `paymentDate`, and `cashier`
7. **Multi-currency support**: `JsonAmount` (amount + currency) is used universally; daily exchange rates from `RateApi` enable cross-currency calculations
</task_result>
```

**Tool: task**

**Input:**
```json
{
  "description": "Read graph.md business flow",
  "prompt": "Read the file C:\\Projects\\z\\zexport\\graph.md completely. This file contains the business process/document flow diagram in Mermaid format. Return the full content of this file.",
  "subagent_type": "explore"
}
```

**Output:**
```
task_id: ses_3add260affferO1q4uLIWRRlJ7 (for resuming to continue this task if needed)

<task_result>
Here is the full content of `C:\Projects\z\zexport\graph.md` (125 lines):

---

# 单据总览与流转图谱 (Document Overview and Flow Graph)

## Summary of Contents

The file is a comprehensive business process / document flow diagram written in Chinese. It covers the following sections:

### 1. Statistics and Document Table Counts
- **Scope A (System Tables)**: 115 business/base tables in the system.
- **Scope B (Document-type Tables)**: 40 document-type tables across 7 modules:
  - **SCM** (Supply Chain Management): 9 tables
  - **SMS** (Sales Management System): 8 tables
  - **WMS** (Warehouse Management System): 7 tables
  - **DMS** (Document/Shipping Management System): 7 tables
  - **OA** (Office Automation): 5 tables
  - **FMS** (Financial Management System): 3 tables
  - **MMS** (Manufacturing Management System): 1 table
- **Scope C (Document Type Configuration)**: Configuration tables for document types and relation rules.

### 2. Core Document Flow (Mermaid Diagram)
The Mermaid `flowchart LR` diagram describes the main business flow:

```
Quotation(SMS) → Sale Contract(SMS) → Purchase Plan(SCM) → Purchase Contract(SCM) → Stock Notice In(WMS) → Bill In(WMS) → Stock(WMS) → Stock Notice Out(WMS) → Bill Out(WMS) → Shipment Plan(DMS) → Shipment(DMS) → Declaration / Inspection / Settlement Form(DMS) → Receipt(FMS)
```
With a parallel branch:
```
Purchase Contract(SCM) → Payment Apply(SCM) → Payment(FMS)
Bank Registration(FMS) → Receipt(FMS)
```

### 3. Upstream-Downstream Document Relationships (Key Links)
Describes FK/business relationships across modules:
- Sales → Procurement
- Procurement → Warehousing (Inbound)
- Warehousing (Outbound) → Shipping/Customs
- Sales ↔ Finance
- Meta-relationships via `doc_document_definition`, `doc_document_link`, `doc_document_relation_rule`, `doc_document_flow_log`

### 4. Data Write-Back Logic (Core Paths)
Documents the key write-back operations:
- **Sale Contract write-back**: shipment quantity updates, financial write-backs
- **Purchase Plan write-back**: purchase flag updates, quantity splits, rollback logic
- **Purchase Contract write-back**: price, merchandiser, and gift quantity write-backs
- **Warehouse write-back**: stock lock release, notice-to-bill status updates

### 5. References
Points to related documentation files and code module locations (`eplus-module-sms`, `eplus-module-scm`, `eplus-module-wms`, `eplus-module-dms`).
</task_result>
```

---

## Assistant (Build · claude-opus-4-6 · 199.7s)

Now I have comprehensive information from all modules. Let me compile the final business rules document.

---

# EPlus 外贸ERP系统 —— 业务规则总览

## 一、系统总体业务流程

系统覆盖外贸出口全生命周期，核心单据流转链路：

```
报价单 → 销售合同 → 采购计划 → 采购合同 → 入库通知 → 入库单 → 库存 → 出库通知 → 出库单 → 出运计划 → 出运单 → 报关/商检/结汇 → 收款
```

并行财务链路：
```
采购合同 → 付款申请 → 付款单
银行登记 → 客户认领 → 收款单
```

---

## 二、销售管理（SMS）

### 1. 报价单

- 状态流转：`待提交 → 待审核 → 已通过 → 已作废`；审核中可驳回回到待提交
- 报价有效期 = 当前日期 - 有效期日期
- 打印/导出需报表模板已审批
- 英制单位场景下，尺寸自动除以 2.54 转换

### 2. 销售合同

**状态流转（按合同类型区分）：**

- **外销合同**：`待提交 → 待审核 → 待回签 → 待采购 → 待出运 → 已作废`
- **内销合同**：`待提交 → 待审核 → 待回签`；内部客户审批通过后直接自动生成采购合同、处理库存并标记为`已完成`
- **外币采购合同**：`待提交 → 待审核 → 待回签`

**审批规则：**
- 提交时可立即触发BPM审批流；外销/内销/外币采购各有独立审批流程定义
- 审批通过 → 待回签；取消 → 回到待提交；驳回 → 保持待审核

**变更管理：**
- 已审批合同支持变更申请，变更走独立审批流程
- 若所有变更字段为"普通级"，无需审批直接生效；任一字段为"审批级"则触发变更审批
- 变更期间下游已作废的项目需全部一致，否则不允许变更
- 删除的销售项已有下游采购合同项的，变更被拒绝

**推采购计划校验：**
- 合同状态必须为"待采购"
- 收款计划必须已执行
- 同批推送的合同必须：同一订单路径、同一起运港、同一目的港、同一运输方式、同一结算条款、同一外贸公司、同一账套

**出库通知校验：**
- 同一销售项不可重复生成出库通知
- 组合产品的BOM子件库存必须充足

**利润计算规则：**
- 收入 = 货值×汇率 + 退税 + 加项
- 成本 = 采购成本 + 包装 + 辅料 + 运费 + 商检费 + 平台费 + 扣项 + 保险 + 信保 + 佣金
- 毛利 = 收入 - 成本；毛利率 = 毛利 / 收入

**柜量计算规则（基于体积阈值递归）：**
- 体积 > 68,000,000 cm³ → 40尺高柜，余量递归
- 59,000,000 ~ 68,000,000 → 1个40尺高柜
- 49,000,000 ~ 59,000,000 → 1个40尺柜
- 29,000,000 ~ 49,000,000 → 20尺柜，余量递归
- 20,000,000 ~ 29,000,000 → 1个20尺柜
- < 20,000,000 → 散货；若散货费用超过20尺柜费则升级为20尺柜

**其他规则：**
- 每个合同可有多个销售项、加减项、收款计划
- 销售项支持拆分（不同采购来源），拆分项共享源唯一码
- 删除拆分项时数量回滚至父项
- 锁库在每次更新时先释放再重新锁定
- 自有品牌商品在非客户产品时自动转为客户产品
- 未提供收款计划时自动取客户默认收款计划
- 删除合同级联释放锁库、删除子项/加减项/收款计划
- 合同金额 =（货值总额 × 汇率）+（加项 × 加项汇率）-（扣项 × 扣项汇率）
- 退税额 =（含税采购价 × 数量 × 汇率 / (1 + 退税率)）× 退税率
- 箱数 = 向上取整（数量 / 每箱装量）
- 内销合同退税率强制为0

---

## 三、采购管理（SCM）

### 1. 采购计划

**状态流转：** `待提交 → 待审批 → 待采购 → 已完成 → 已作废`；驳回回到已驳回状态，取消回到待提交

**校验规则：**
- 所有项目币种必须在内部公司可用币种列表内（辅料计划除外）
- 锁库数量不得超过销售数量，且销售锁库量不得低于锁库量
- 审核中状态禁止编辑
- 源采购计划有未取消的拆分计划时不可作废

**审批规则：**
- 标准计划使用 `scm_purchase_plan` 流程，自有品牌走不同路径
- 辅料计划使用 `scm_purchase_plan_auxiliary` 流程，动态指定审批人（从关联采购合同的采购员、销售合同的业务员、管理者中获取）

**跨模块交互：**
- 创建时设置销售合同项的"已下采购"标识
- 取消时释放销售项的锁库，回滚销售合同项的来源清单

### 2. 采购合同

**状态流转：** `待提交 → 审批中 → 已通过 → 已结案`；支持驳回/取消/关闭

**附加状态跟踪：** 预付状态、付款状态、开票状态、回签标识、打印标识

**校验规则：**
- 供应商默认财务信息必须有币种，总金额/运费/其他费用/已付金额/预付金额/发票币种必须一致
- 非内部供应商的项目币种须在内部公司可用币种范围内
- 所有商品数量合计为0时不创建合同
- 审核中状态禁止编辑
- 合同编码唯一性校验
- 编码仅在未提交/驳回/取消/关闭/退回时可修改

**通知状态跟踪：**
- 按项目的已通知数量判定：全部通知→已通知，部分→部分通知，无→未通知

**回签规则：**
- 回签日期必填、不可晚于当前日期
- 必须先下单再回签
- 回签前不可做特定下游操作

**变更管理：**
- 已有付款申请时：不可作废合同、不可更换供应商、不可修改采购数量
- 变更走独立BPM流程

**审批规则：**
- 标准合同：`scm_purchase_contract`，变量含锁库采购标识
- 自有品牌合同：`scm_purchase_contract_own_brand`
- 辅料合同：`scm_purchase_contract_auxiliary`，动态审批人

### 3. 付款申请

**状态流转：** `未提交 → 审核中 → 已通过`；付款状态 `未付款 → 付款中 → 部分付款 → 已付款`

**校验规则：**
- 付款计划不可为空
- 同一付款计划不可重复创建未关闭、未付款的付款申请
- 反审核前校验是否有下游付款单据
- 不支持不同供应商/不同付款公司合并申请

**审批通过后：**
- 自动在FMS创建付款单（含银行信息、金额、业务类型）

**取消/关闭逻辑：**
- 校验无下游付款记录
- 按步骤倒序回滚付款计划的已申请金额

**付款回写：**
- 实际付款后设置实际付款金额 = 已付 + 本次付款
- 回写供应商银行信息
- 回写加减项
- 更新付款计划的已收金额和实际付款比例

### 4. 开票通知

**状态流转：** `未提交 → 审核中 → 已通过 → 已登记`；支持部分登记
- 来源为出运的通知创建时自动通过，来源为采购的需BPM审批
- 全部为代理商品时跳过审批

**校验规则：**
- 审批时基础开票数量不可超过未开票数量
- 关闭时不可有未关闭的采购登记记录

**重量单位换算：**
- HS计量单位为KG/g时，开票与基础单位间自动进行千分换算

### 5. 采购登记

- 登记数量不可超过开票通知数量
- 累计登记数量不可超过采购合同项目数量
- 审批通过后更新开票通知的已登记数量、采购合同项的登记状态

### 6. 让步放行

- 从质检不合格项创建
- 审批通过后将让步状态回写质检
- 驳回/取消后重置质检项的让步状态

### 7. 供应商

**状态流转：** 启用/禁用；支持变更管理（同CRM/PMS模式）
- 编码唯一性校验
- 高版本已存在时不可变更；变更中不可再次变更
- 仅已通过的记录可修改或删除
- 审批通过后自动创建供应商仓库
- 新建/变更分别有不同BPM流程（行政供应商与业务供应商各有独立流程）

---

## 四、仓储管理（WMS）

### 1. 入/出库通知

**状态流转：** `未转 → 转单中 → 已转`；支持部分转、作废
- 工厂直发（factoryOutboundFlag=YES）创建即为已转
- 全部项目的实际开单量=订单量时为已转，否则为部分转
- 已有下游入/出库单时不可作废
- 仅手工创建的通知可取消
- 出库通知取消时释放锁定库存
- 入库通知取消时回滚采购合同数量
- 每箱装量不可为空或0

**数量跟踪（三量控制）：**
- `realBillQuantity`：已确认开单量
- `inBillQuantity`：正在开单量
- `pendingStockQuantity` = 订单量 - 已确认 - 正在开单

**出库通知出运价格校验：**
- 按销售合同汇总单价×出运数量，与收款计划校验

### 2. 入/出库单

**状态流转：** `未确认 → 已确认 → 作废`

**入库确认：**
- 手动创建的入库通知：直接新增库存记录
- 标准采购入库：同时在供应商仓库创建出库单、扣减供应商库存、在公司仓库新增库存、转移锁定记录
- 更新销售合同项为"已入仓"
- 更新采购合同项入库状态和数量差

**出库确认：**
- 更新出运详情的出库数量和日期
- 扣减库存
- 生成内部合同

**库存扣减规则：**
- 自营采购：`已用量 += 实际量`，`锁定量 -= 实际量`（最小为0），`可用量 -= 实际量`
- 标准采购：`已用量 += 实际量`，`可用量 -= 实际量`
- 可用量 < 0 时抛出库存不足异常
- 出库且有柜量时：`柜量 -= 实际量`

**作废前置条件：**
- 库存已用量必须为0（未被下游使用）
- 库存锁定量必须为0（未被锁定）
- 作废后删除库存记录、还原通知状态和数量

### 3. 库存

**基本等式：**
- `可用量 = 初始量 - 已用量 - 锁定量`
- `剩余量 = 初始量 - 已用量`
- `剩余金额 = 单价 × 剩余量`

**可用库存查询规则：**
- 仅查询未分配至销售合同的库存
- 包含生产公司的库存
- 自有品牌SKU自动解析关联编码
- 有效可用量 = 可用量 - 锁定量 + 本销售合同的锁定量（排除自身锁定的占用）
- 可选包含在产量

**库存导入规则：**
- 公司名/SKU编码/仓库名必须匹配现有数据
- 初始量必须 > 0
- 每箱装量为空或0时默认为1
- 导入自动创建已确认的入库单

**库存删除约束：**
- 有锁定记录的库存不可删除

### 4. 库存锁定

**锁定来源类型：** 销售合同、加工单、调拨单、采购计划、出库通知

**锁定规则：**
- 锁定量不可超过（在产量 + 可用量）
- 批量锁定需校验操作人存在性和库存存在性

### 5. 盘点

**状态流转：** `未开始 → 进行中 → 已结束`

**盘点结果：**
- 差异量 = 盘点量 - 系统量
- 差异量 > 0：盘盈；< 0：盘亏；= 0：盘平
- 盘点数量默认预填系统量

### 6. 调拨

**状态流转：** `待提交 → 已完成`

- 一次调拨同时执行：源仓出库（扣减库存）+ 目标仓入库（新增库存）
- 调拨量不可超过源批次可用量
- 目标仓新库存继承销售合同关联

### 7. 仓库

- 名称唯一性校验
- 供应商仓库不可删除
- 系统中有且仅有一个默认仓库
- 简单列表仅返回非供应商、已启用的仓库

---

## 五、出运管理（DMS）

### 1. 出运计划

**状态流转：** `待提交 → 待处理 → 已完成 → 结案`
- 全部子项转出运单后计划变为已完成
- 结案单个项目后若同级项目均已结案则父计划也结案
- 结案时回写销售合同的可出运数量
- 反审核前校验是否有下游出运单

**库存校验：**
- 普通产品：实际库存 ≥ 出运量
- 组合产品：先查自身库存，不足部分递归检查BOM子件库存

**采购合同校验：**
- 有采购数量且为标准采购模式时，采购合同编码必填且必须存在

### 2. 出运单

**状态流转：** `待处理 → 待出运 → 已出运 → 已交单 → 结案`

**变更管理：**
- 变更状态：未变更 → 变更中 → 已变更
- 所有字段为普通级时无需审批自动生效（但含业务标识时需走业务审批并指定单证员）
- 有审批级字段时走BPM审批
- 变更数量增加时不可超过销售合同的未转出运数量
- 变更时按优先使用库存原则重新分配库存与采购数量

**出运执行规则：**
- 每个项目的出库量必须 = 出运量（精确匹配）
- 出运后更新采购合同出运日期、销售合同收款计划日期和已出运量

**拆分（批次出运）规则：**
- 创建新出运单，复制表头、重置所有标识为NO
- 源出运单的拆分量累加，标记batchFlag=YES
- 拆分量必须 > 0
- 已有结汇/报关/出库/开票标识时不可开启批次

**发票编号唯一性：** 非结案出运单中发票编号不可重复

**转报关校验：**
- 所有出运单须同一外贸公司
- 已开票项的报关品名须与开票SKU名完全一致
- 跟踪部分转/全部转状态

**转商检：**
- 按商检类型拆分：自主商检生成一条，供应商商检按供应商各生成一条

**转结汇：**
- 按客户编码 + 订单路径第一节点公司分组
- 遍历公司路径链表，沿路径为每个节点创建结汇单直到外贸公司节点

**转开票通知：**
- 按采购合同编码分组
- 拼单采购的项目需出运单状态 ≥ 已出运才可转
- 跟踪已开票数量和开票状态

### 3. 报关单

- 按5个维度分组合并：英文报关品名、退税率、HS编码、报关品名、HS计量单位
- 组内数量汇总、金额汇总、单价重算
- 删除时回写出运单的报关转换状态

### 4. 商检单

- 与报关单相同的分组计算逻辑，增加出运编号维度
- 采购含税单价按加权平均计算
- 删除时重置出运项的商检标识

### 5. 结汇单

- 按6个维度分组（增加采购合同编码维度）
- 删除时回写出运项的结汇标识

### 6. 船代费用

- 未申请费用按（付款状态+公司+供应商+出运单+发票+币种）聚合
- 费用可通过费用分摊跨成本中心分配
- 状态与外部付款申请生命周期联动

---

## 六、财务管理（FMS）

### 1. 收款单

**状态流转：** `未收款 → 已收款`；审批流 `未提交 → 审核中 → 已通过`
- 外部创建时强制提交审批
- 确认收款时记录时间和操作人
- 业务类型为"还款"时同步更新OA还款申请状态
- 客户认领创建的收款单自动审批通过，不走BPM

### 2. 付款单

**状态流转：** `未提交 → 审核中 → 已通过 → 已排款 → 已付款`；支持作废

**付款状态：** `未付款 → 部分付款 → 已付款`；支持在途状态

**排款规则：**
- 设置付款银行、账号、方式、金额
- 取消排款回到已通过状态并清空银行信息

**确认付款（核心规则）：**
- 累计已付金额 = 原已付 + 本次付款
- 已付 ≥ 申请金额 → 已付款 + 已付款审批状态
- 已付 < 申请金额 → 部分付款 + 回到已通过状态（可继续排款）
- 附件增量合并
- 全额付款后触发下游回写：
  - 采购合同已付金额更新
  - 辅料采购合同金额更新
  - 费用分摊标记已付
  - 按业务类型分别回写OA报销/借款/付款申请状态

**作废规则：**
- 已付款状态不可作废
- 反审核校验：关联付款单有非未付款状态的不可反审核

**零金额过滤：** 所有金额均为0或空时不创建付款单

### 3. 银行登记

- 支持批量创建
- 创建时自动根据"公司抬头"匹配CRM中的客户，获取业务经理和客户列表
- 认领状态：`未认领 → 部分认领 → 已认领`

### 4. 客户认领（核心业务）

**创建认领（完整事务）：**
1. 插入收款人实体
2. 回写客户抬头至CRM（新增抬头关联）
3. 插入认领明细
4. 汇率换算：finance金额按当日汇率转换至认领币种计算合同金额
5. 回写销售合同收款计划
6. 自动创建已通过的收款单（无需BPM）
7. 将收款单编码回写认领明细
8. 创建订单链接追踪
9. 更新银行登记的已认领金额和认领状态

**认领状态判定：**
- 已认领金额 = 0 → 未认领
- 已认领金额 = 总金额 → 已认领
- 其他 → 部分认领

**取消认领（完全回滚）：**
- 删除收款人实体
- 删除CRM客户抬头关联
- 删除自动生成的收款单
- 删除认领明细
- 反向回写销售合同收款计划
- 反向扣减银行登记的已认领金额
- 清空银行登记的客户和经理列表

**多币种支持：** 认领金额通过当日汇率在不同币种间转换

---

## 七、办公自动化（OA）

### 1. 费用申请

- 类型：差旅(1)/一般(2)/招待(3)/其他(4)，各有独立BPM流程
- 费用分摊明细必填
- 国际出差允许多次报销（计数器递增），国内出差仅允许一次

### 2. 借款申请

- 个人借款和供应商借款走不同BPM流程
- 审核中不可编辑/删除
- 提交时校验借款币种的当日汇率必须存在
- 自动填充申请人银行账户信息
- 未还金额 = 借款金额 - 已还金额；归零时标记为已还款
- 还款来源：直接还款 + 报销冲抵

### 3. 报销

- 四种类型各有不同编码前缀：差旅(BSC)/招待(BSZ)/一般(BST)/其他(BSM)
- 发票持有人状态联动：报销创建时标记已报销，删除时恢复
- 单例草稿机制：未提交的费用项暂存在草稿记录中

**借款冲抵规则：**
- 按币种比较报销金额与借款未还金额
- 报销额 < 未还额 → 全部冲抵，无实际报销款
- 报销额 ≥ 未还额 → 结清借款，剩余为实际报销款
- 自动生成"报销冲抵"类型的还款记录

**作废规则：**
- 已付款/部分付款状态不可作废
- 作废回滚借款金额（回加未还额、扣减已还额）、删除还款明细、同步到未付款的付款单、恢复费用申请报销次数

### 4. 付款申请（OA层）

- 三种类型：预付(1)/付款(2)/冲抵(3)
- 非预付类型关联已有付款编码时，所有关联付款须属于同一公司
- 创建/删除时按关联类型（快递/船代/辅料采购等）同步更新对应模块状态

### 5. 还款申请

- 可配置是否需要审批（config开关）；关闭审批则提交直接创建收款单
- 还款金额不可超过借款未还金额
- 审批通过后创建业务类型为"还款"的收款单

---

## 八、产品管理（PMS）

**SKU类型：** 基础产品、客户产品、自有品牌、代理产品、组合产品、辅料

**审批规则：**
- 基础SKU/自有品牌/辅料各有独立BPM流程
- 客户产品自动审批，不走工作流
- 可通过系统配置关闭审批（值为"0"时自动通过）

**编码唯一性：**
- 客户产品：`基础SKU编码 + 客户编码 + 客户SKU编码` 组合唯一
- 自有品牌：自有品牌编码唯一
- 基础产品：编码唯一
- 代理产品：商检标识强制为NO

**变更管理（版本机制）：**
- 已在变更中或存在更高版本时不可发起变更
- 创建版本号+1的新记录
- 字段级变更检测：普通级自动生效，表单级走BPM审批
- 变更成功后删除旧版本，更新关联客户产品
- 基础SKU的HS编码变更可级联更新所有衍生客户产品（可配置）
- 变更影响范围传播至SMS/SCM/DMS，设置确认标识=否

**组合产品规则：**
- 组合客户产品审批通过后，自动递归创建不存在的子产品的客户版本

---

## 九、客户管理（CRM）

**客户阶段：** `潜在客户 → 普通客户 → 重点客户 → 流失客户`

**审批规则：**
- 新建客户使用 `oa_cust` 流程，变更使用 `oa_change_cust` 流程
- 客户名称全局唯一
- 提交时有且仅有一个币种标记为默认

**删除/编辑约束：**
- 仅未提交或已取消状态可删除
- 审核中不可修改

**变更管理（与PMS相同模式）：**
- 字段级变更检测，普通级自动生效，表单级走审批
- 变更成功后影响范围传播：
  - 影响SMS → 标记未完成的销售合同确认标识=否
  - 影响DMS → 标记未出运的出运单确认标识=否
  - 同步更新销售合同和出运单中的客户名称

**子实体管理（银行账户/联系人/结算方式/公司路径/收款账户）：**
- 更新时全量替换（先删后插）

---

## 十、质检管理（QMS）

**状态流转：** `待审批 → 待确认 → 待验货 → 验货通过/不合格/部分合格 → 已结案`

**状态自动推导规则：**
- 全部项目合格 → 验货通过
- 全部项目不合格 → 验货不合格
- 混合 → 部分合格
- 远程验货在创建时即计算状态

**让步放行：**
- 让步放行的项目视同合格参与状态计算
- 让步状态回写到质检项

**返工：**
- 已合格或已处理的项目不可返工
- 所有选中项必须属于同一质检单
- 从不合格/待处理项创建新质检单（标记为复检）

**结果同步：** 仅终检节点同步状态到采购合同

---

## 十一、制造管理（MMS）

**状态流转：** `待完成 → 已完成 → 已结案`；支持从已结案回退至待完成

- 不使用BPM审批，状态直接转换
- 三层数据结构：制造单 → 产品 → 产品子件
- 完成操作需校验子件明细存在
- 删除级联删除所有子层级数据

---

## 十二、跨模块通用规则

### 1. 审批流程（BPM）
- 所有需审批的单据统一通过 `BpmProcessInstanceApi` 提交/审批/驳回
- 每类单据有独立的流程定义Key
- `submitFlag = SUBMIT` 时创建即提交
- 审核中状态普遍禁止编辑

### 2. 编码生成
- 统一通过 `CodeGeneratorApi` 按类型+前缀生成流水号
- 各模块前缀：VK(外销)/DT(内销)/SG(采购计划)/SK(收款)/FK(付款)/RE(入库通知)/TT(出库通知)/YS(入库单)/CK(出库单)/SP(出运计划)/CY(出运单)/BG(报关)/SJ(商检)/JH(结汇)/MF(制造单)/ST(盘点)

### 3. 变更管理（CRM/PMS/SMS）
- 统一的版本化变更管理模式
- `FormChangeApi` 进行字段级变更检测
- 变更级别：普通级（自动生效）/ 表单级（需审批）
- 变更影响范围向下游传播（设置确认标识=否）

### 4. 订单链路追踪
- 每个核心单据创建 `OrderLink` 记录
- 通过 `linkCode` 实现全链路追踪：销售→采购计划→采购合同→入/出库→出运→报关/商检/结汇→收付款

### 5. 多币种与汇率
- 金额统一使用 `JsonAmount`（币种+金额）存储
- 当日汇率通过 `RateApi` 获取
- 客户认领等场景跨币种转换使用当日汇率

### 6. 数据权限
- 核心单据（销售合同/采购合同/出运单/收付款等）均配置独立数据权限规则
- 通过 `managerIds` 等字段控制基于角色的数据可见性

---

