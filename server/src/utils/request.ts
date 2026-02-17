/**
 * 将 Express 的 params/query 值规范为 string 类型
 * req.params.xxx 和 req.query.xxx 的类型是 string | string[] | ParsedQs 等
 */
export function ensureString(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return String(value[0] ?? '');
  return String(value);
}

export function ensureNumber(value: unknown, defaultValue: number = 0): number {
  if (value === undefined || value === null) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}
