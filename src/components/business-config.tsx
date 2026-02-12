/**
 * BusinessConfig
 *
 * 实体配置管理组件，包含子公司、国家、港口、订单路径等配置。
 * 每种配置一个Tab。
 */

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings } from "lucide-react"
import { CompanyConfigPanel } from "./business-config/company-panel"
import { RegionConfigPanel } from "./business-config/region-panel"
import { CountryConfigPanel } from "./business-config/country-panel"
import { PortConfigPanel } from "./business-config/port-panel"
import { BrandConfigPanel } from "./business-config/brand-panel"
import { WarehouseConfigPanel } from "./business-config/warehouse-panel"
import { OrderRouteConfigPanel } from "./business-config/order-route-panel"
import type { ConfigTypeKey } from "@/types/business-config"

export function BusinessConfig() {
  const [activeKey, setActiveKey] = useState<ConfigTypeKey>('company')

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h1 className="text-xl font-bold">实体配置</h1>
      </div>

      {/* 配置 Tab 切换 */}
      <Tabs value={activeKey} onValueChange={(v) => setActiveKey(v as ConfigTypeKey)}>
        <TabsList>
          <TabsTrigger value="company">子公司</TabsTrigger>
          <TabsTrigger value="region">区域</TabsTrigger>
          <TabsTrigger value="country">国家</TabsTrigger>
          <TabsTrigger value="port">港口</TabsTrigger>
          <TabsTrigger value="brand">品牌</TabsTrigger>
          <TabsTrigger value="warehouse">仓库</TabsTrigger>
          <TabsTrigger value="orderRoute">订单路径</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 当前配置面板 */}
      {activeKey === 'company' && <CompanyConfigPanel />}
      {activeKey === 'region' && <RegionConfigPanel />}
      {activeKey === 'country' && <CountryConfigPanel />}
      {activeKey === 'port' && <PortConfigPanel />}
      {activeKey === 'brand' && <BrandConfigPanel />}
      {activeKey === 'warehouse' && <WarehouseConfigPanel />}
    </div>
  )
}
