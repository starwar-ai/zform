import { useTabStore, type Tab } from "@/stores/tab-store"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { TabContextMenu } from "./tab-context-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SortableTabProps {
  tab: Tab
  isActive: boolean
  onSwitch: () => void
  onClose: () => void
}

function PinnedTab({ tab, isActive, onSwitch }: Omit<SortableTabProps, "onClose">) {
  return (
    <TabContextMenu tabId={tab.id}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "relative flex items-center gap-2 rounded-t-md border border-b-0 px-4 py-2 text-sm transition-colors cursor-pointer shrink-0",
                isActive
                  ? "bg-background border-primary text-foreground"
                  : "bg-muted border-transparent text-muted-foreground hover:bg-muted/80"
              )}
              onClick={onSwitch}
            >
              <span className="truncate">{tab.title}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            <p>{tab.title}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TabContextMenu>
  )
}

function SortableTab({ tab, isActive, onSwitch, onClose }: SortableTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <TabContextMenu tabId={tab.id}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={setNodeRef}
              style={style}
              className={cn(
                "relative flex items-center gap-2 rounded-t-md border border-b-0 px-4 py-2 text-sm transition-colors cursor-pointer min-w-0",
                isActive
                  ? "bg-background border-primary text-foreground"
                  : "bg-muted border-transparent text-muted-foreground hover:bg-muted/80",
                isDragging && "opacity-50"
              )}
              {...attributes}
              {...listeners}
              onClick={onSwitch}
            >
              <span className="truncate">
                {tab.title}
              </span>
              {tab.closable && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 shrink-0 p-0 hover:bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8}>
            <p>{tab.title}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </TabContextMenu>
  )
}

export function TabBar() {
  const { tabs, activeTabId, switchTab, closeTab, moveTab } = useTabStore()

  // 首页标签始终排在最左面，不参与拖拽排序
  const homeTab = tabs.find((tab) => tab.type === "dashboard")
  const sortableTabs = tabs.filter((tab) => tab.type !== "dashboard")

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Avoid swallowing click events when tabs are sortable.
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = tabs.findIndex((tab) => tab.id === active.id)
      const newIndex = tabs.findIndex((tab) => tab.id === over.id)

      moveTab(oldIndex, newIndex)
    }
  }

  if (tabs.length === 0) {
    return null
  }

  return (
    <div className="flex h-12 items-end gap-1 border-b bg-muted/50 px-2 overflow-hidden">
      {homeTab && (
        <PinnedTab
          tab={homeTab}
          isActive={homeTab.id === activeTabId}
          onSwitch={() => switchTab(homeTab.id)}
        />
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortableTabs.map((tab) => tab.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex gap-1 min-w-0 overflow-hidden">
            {sortableTabs.map((tab) => (
              <SortableTab
                key={tab.id}
                tab={tab}
                isActive={tab.id === activeTabId}
                onSwitch={() => switchTab(tab.id)}
                onClose={() => void closeTab(tab.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
