import { useTabStore } from "@/stores/tab-store"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

interface TabContextMenuProps {
  tabId: string
  children: React.ReactNode
}

export function TabContextMenu({ tabId, children }: TabContextMenuProps) {
  const {
    tabs,
    closeTab,
    closeAllTabs,
    closeOtherTabs,
    closeLeftTabs,
    closeRightTabs,
  } = useTabStore()

  const tab = tabs.find((t) => t.id === tabId)
  if (!tab) return <>{children}</>

  const tabIndex = tabs.findIndex((t) => t.id === tabId)
  const hasLeftTabs = tabIndex > 0
  const hasRightTabs = tabIndex < tabs.length - 1
  const hasOtherTabs = tabs.length > 1

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {tab.closable && (
          <>
            <ContextMenuItem onClick={() => closeTab(tabId)}>
              关闭
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        {hasOtherTabs && (
          <ContextMenuItem onClick={() => closeOtherTabs(tabId)}>
            关闭其他
          </ContextMenuItem>
        )}
        {hasLeftTabs && (
          <ContextMenuItem onClick={() => closeLeftTabs(tabId)}>
            关闭左侧
          </ContextMenuItem>
        )}
        {hasRightTabs && (
          <ContextMenuItem onClick={() => closeRightTabs(tabId)}>
            关闭右侧
          </ContextMenuItem>
        )}
        {hasOtherTabs && <ContextMenuSeparator />}
        <ContextMenuItem onClick={() => closeAllTabs()}>
          关闭全部
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
