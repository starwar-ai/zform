/**
 * useDebouncedValue
 *
 * 返回防抖后的值，用于搜索等场景减少频繁更新。
 */
import { useState, useEffect } from "react"

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
