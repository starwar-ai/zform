/**
 * Country Selector Demo
 * 
 * This is a demonstration of how to use the CountrySelector component.
 * You can import and use it in any form or component.
 */

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { CountrySelector } from "@/components/country-selector"

export function CountrySelectorDemo() {
  const [selectedCountry, setSelectedCountry] = useState<string>()

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>国家选择器演示</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>选择国家</Label>
          <CountrySelector
            value={selectedCountry}
            onChange={setSelectedCountry}
            placeholder="请选择一个国家"
          />
        </div>
        
        {selectedCountry && (
          <div className="text-sm text-muted-foreground">
            已选择国家 ID: {selectedCountry}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground mt-4">
          说明：此组件从实体配置中获取国家列表，支持搜索过滤功能。
        </div>
      </CardContent>
    </Card>
  )
}