import { useMemo, useState } from "react"
import { registry } from "@/core/registry"
import { useAllDocuments } from "@/hooks/use-document"
import { useDocumentStore } from "@/stores/document-store"
import { useDashboardStore } from "@/stores/dashboard-store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ExternalLink, Plus, Settings2 } from "lucide-react"
import type { DocumentTypeId } from "@/core/types"

interface DashboardHomeProps {
  onOpenDocument: (docId: string, typeId?: string) => void
  onOpenTypeList: (typeId: string, title: string) => void
}

const MAX_FAVORITE_BUTTONS = 5

export function DashboardHome({
  onOpenDocument,
  onOpenTypeList,
}: DashboardHomeProps) {
  const documents = useAllDocuments()
  const createDocument = useDocumentStore((s) => s.createDocument)
  const schemas = registry.getAllSchemas()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, string>>({})

  const favoriteButtonTypeIds = useDashboardStore((s) => s.favoriteButtonTypeIds)
  const favoriteListTypeIds = useDashboardStore((s) => s.favoriteListTypeIds)
  const setFavoriteButtonTypeIds = useDashboardStore(
    (s) => s.setFavoriteButtonTypeIds
  )
  const setFavoriteListTypeIds = useDashboardStore((s) => s.setFavoriteListTypeIds)

  const effectiveFavoriteButtonTypeIds = useMemo(() => {
    const candidates =
      favoriteButtonTypeIds.length > 0
        ? favoriteButtonTypeIds
        : schemas.map((schema) => schema.typeId).slice(0, MAX_FAVORITE_BUTTONS)
    return candidates
      .filter((typeId) => schemas.some((schema) => schema.typeId === typeId))
      .slice(0, MAX_FAVORITE_BUTTONS)
  }, [favoriteButtonTypeIds, schemas])

  const effectiveFavoriteListTypeIds = useMemo(() => {
    const candidates =
      favoriteListTypeIds.length > 0
        ? favoriteListTypeIds
        : schemas.map((schema) => schema.typeId).slice(0, 2)
    return candidates.filter((typeId) =>
      schemas.some((schema) => schema.typeId === typeId)
    )
  }, [favoriteListTypeIds, schemas])

  const favoriteButtons = useMemo(
    () =>
      effectiveFavoriteButtonTypeIds
        .map((typeId) => schemas.find((schema) => schema.typeId === typeId))
        .filter((schema): schema is (typeof schemas)[number] => Boolean(schema)),
    [effectiveFavoriteButtonTypeIds, schemas]
  )

  const favoriteLists = useMemo(
    () =>
      effectiveFavoriteListTypeIds
        .map((typeId) => schemas.find((schema) => schema.typeId === typeId))
        .filter((schema): schema is (typeof schemas)[number] => Boolean(schema)),
    [effectiveFavoriteListTypeIds, schemas]
  )

  const docsByType = useMemo(() => {
    const grouped = new Map<DocumentTypeId, typeof documents>()
    for (const doc of documents) {
      const list = grouped.get(doc.typeId) ?? []
      list.push(doc)
      grouped.set(doc.typeId, list)
    }
    return grouped
  }, [documents])

  const handleCreate = (typeId: DocumentTypeId) => {
    const doc = createDocument(typeId)
    onOpenDocument(doc.id, typeId)
  }

  const toggleButtonFavorite = (typeId: string, checked: boolean) => {
    if (checked) {
      if (
        effectiveFavoriteButtonTypeIds.length >= MAX_FAVORITE_BUTTONS ||
        effectiveFavoriteButtonTypeIds.includes(typeId)
      ) {
        return
      }
      setFavoriteButtonTypeIds([...effectiveFavoriteButtonTypeIds, typeId])
      return
    }

    setFavoriteButtonTypeIds(
      effectiveFavoriteButtonTypeIds.filter((id) => id !== typeId)
    )
  }

  const toggleListFavorite = (typeId: string, checked: boolean) => {
    if (checked) {
      if (effectiveFavoriteListTypeIds.includes(typeId)) return
      setFavoriteListTypeIds([...effectiveFavoriteListTypeIds, typeId])
      return
    }

    setFavoriteListTypeIds(effectiveFavoriteListTypeIds.filter((id) => id !== typeId))
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-l">首页</h1>

        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {favoriteButtons.map((schema) => (
            <Button
              key={schema.typeId}
              variant="outline"
              onClick={() => handleCreate(schema.typeId)}
            >
              <Plus className="h-4 w-4 mr-1" />
              新建{schema.typeName}
            </Button>
          ))}
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm">
                <Settings2 className="h-4 w-4 mr-1" />
                设置
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>首页配置</DialogTitle>
                <DialogDescription>
                  可配置常用按钮和常用列表组件。常用按钮最多 {MAX_FAVORITE_BUTTONS} 个。
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">常用按钮（右上角）</h3>
                    <Badge variant="outline">
                      {effectiveFavoriteButtonTypeIds.length}/{MAX_FAVORITE_BUTTONS}
                    </Badge>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {schemas.map((schema) => {
                      const checked = effectiveFavoriteButtonTypeIds.includes(
                        schema.typeId
                      )
                      const disabled =
                        !checked &&
                        effectiveFavoriteButtonTypeIds.length >=
                          MAX_FAVORITE_BUTTONS
                      return (
                        <Label
                          key={schema.typeId}
                          className="flex items-center gap-2 rounded border p-2"
                        >
                          <Checkbox
                            checked={checked}
                            disabled={disabled}
                            onCheckedChange={(value) =>
                              toggleButtonFavorite(schema.typeId, value === true)
                            }
                          />
                          <span>{schema.typeName}</span>
                        </Label>
                      )
                    })}
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">常用列表组件</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {schemas.map((schema) => (
                      <Label
                        key={schema.typeId}
                        className="flex items-center gap-2 rounded border p-2"
                      >
                        <Checkbox
                          checked={effectiveFavoriteListTypeIds.includes(
                            schema.typeId
                          )}
                          onCheckedChange={(value) =>
                            toggleListFavorite(schema.typeId, value === true)
                          }
                        />
                        <span>{schema.typeName}</span>
                      </Label>
                    ))}
                  </div>
                </section>
              </div>

              <DialogFooter>
                <Button onClick={() => setIsSettingsOpen(false)}>完成</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {favoriteLists.length > 0 ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {favoriteLists.map((schema) => {
            const sourceDocs = docsByType.get(schema.typeId) ?? []
            const keyword = (filters[schema.typeId] ?? "").trim().toLowerCase()
            const filteredDocs = sourceDocs.filter((doc) =>
              doc.docNumber.toLowerCase().includes(keyword)
            )

            return (
              <Card key={schema.typeId} className="p-3">
                <CardHeader className="space-y-2 pb-2 p-0">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-medium">{schema.typeName}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          onOpenTypeList(schema.typeId, schema.typeName)
                        }
                        title={`打开 ${schema.typeName} 列表页`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={filters[schema.typeId] ?? ""}
                      onChange={(event) =>
                        setFilters((prev) => ({
                          ...prev,
                          [schema.typeId]: event.target.value,
                        }))
                      }
                      placeholder="输入单据编号自动筛选"
                      className="flex-1 h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const newDoc = createDocument(schema.typeId)
                        onOpenDocument(newDoc.id, schema.typeId)
                      }}
                      variant="outline"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      新增
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-2 p-0">
                  {filteredDocs.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>单据编号</TableHead>
                          <TableHead>创建时间</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDocs.slice(0, 5).map((doc) => (
                          <TableRow key={doc.id} className="h-10">
                            <TableCell className="font-medium text-sm py-2">
                              {doc.docNumber}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs py-2">
                              {new Date(doc.createdAt).toLocaleString("zh-CN")}
                            </TableCell>
                            <TableCell className="py-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onOpenDocument(doc.id, doc.typeId)}
                                className="h-7 text-xs"
                              >
                                打开
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      暂无匹配单据
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            暂无常用列表组件，请点击右上角“设置”进行添加。
          </CardContent>
        </Card>
      )}
    </div>
  )
}

