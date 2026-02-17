/**
 * useFieldEffects
 *
 * 通用字段副作用 Hook。
 * 遍历 fields 中所有配置了 effect 的字段，监听其 watchFields 变化，
 * 自动触发 handler。MasterForm 不感知具体业务逻辑。
 */

import { useEffect, useRef } from "react"
import type { FieldDef, FormMode, FieldEffectContext } from "@/core/types"

interface UseFieldEffectsOptions {
  /** 字段定义列表 */
  fields: FieldDef[]
  /** 当前表单数据 */
  data: Record<string, unknown>
  /** 字段更新回调 */
  onChange: (fieldId: string, value: unknown) => void
  /** 当前表单模式 */
  mode?: FormMode
  /** 副作用上下文（提供明细表操作等能力） */
  context?: FieldEffectContext
}

/**
 * 收集 fields 中所有激活的 effect（按 mode 过滤）
 */
function collectActiveEffects(fields: FieldDef[], mode?: FormMode) {
  return fields
    .filter((f) => f.effect)
    .filter((f) => {
      const modes = f.effect!.modes
      // 未指定 modes 表示所有模式生效
      if (!modes || modes.length === 0) return true
      return mode ? modes.includes(mode) : true
    })
    .map((f) => f.effect!)
}

/**
 * 从 data 中提取 watchFields 的值，生成一个稳定的快照 key
 */
function snapshotKey(
  watchFields: string[],
  data: Record<string, unknown>
): string {
  return watchFields
    .map((fid) => {
      const v = data[fid]
      return v === undefined || v === null ? "" : String(v)
    })
    .join("\x00")
}

export function useFieldEffects({
  fields,
  data,
  onChange,
  mode,
  context,
}: UseFieldEffectsOptions): void {
  // 稳定引用 onChange，避免 effect 中拿到过时的闭包
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // 稳定引用 context
  const contextRef = useRef(context)
  contextRef.current = context

  // 记录每个 effect 上次触发时的快照，避免重复触发
  const prevSnapshotsRef = useRef<Map<number, string>>(new Map())
  // 防并发锁
  const runningRef = useRef<Set<number>>(new Set())

  const activeEffects = collectActiveEffects(fields, mode)

  useEffect(() => {
    for (let i = 0; i < activeEffects.length; i++) {
      const effect = activeEffects[i]
      const key = snapshotKey(effect.watchFields, data)

      // 所有 watchFields 均为空值时跳过
      const allEmpty = effect.watchFields.every((fid) => {
        const v = data[fid]
        return v === undefined || v === null || v === ""
      })
      if (allEmpty) {
        prevSnapshotsRef.current.delete(i)
        continue
      }

      // 与上次快照相同，跳过
      if (prevSnapshotsRef.current.get(i) === key) continue
      prevSnapshotsRef.current.set(i, key)

      // 正在执行中，跳过
      if (runningRef.current.has(i)) continue

      // 触发 handler
      runningRef.current.add(i)
      const result = effect.handler(data, onChangeRef.current, contextRef.current)

      if (result && typeof result.then === "function") {
        result
          .catch((err: unknown) => {
            console.warn("[FieldEffect] handler 执行失败:", err)
          })
          .finally(() => {
            runningRef.current.delete(i)
          })
      } else {
        runningRef.current.delete(i)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // activeEffects 本身由 fields + mode 派生，这里用关键依赖触发
    fields,
    mode,
    // data 引用变化即重新检查（Zustand immer 每次更新会产生新引用）
    data,
  ])
}
