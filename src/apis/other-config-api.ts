/**
 * 其他配置 API
 */

import type {
  OtherConfigWithParameters,
  UpdateParametersInput,
} from '@/types/other-config';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

/** 获取所有配置 */
export async function fetchOtherConfigsApi(): Promise<OtherConfigWithParameters[]> {
  const res = await fetch(`${API_BASE}/other-configs`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('获取配置列表失败');
  return res.json();
}

/** 获取单个配置 */
export async function fetchOtherConfigByIdApi(id: string): Promise<OtherConfigWithParameters> {
  const res = await fetch(`${API_BASE}/other-configs/${id}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('获取配置失败');
  return res.json();
}

/** 批量更新参数值 */
export async function updateConfigParametersApi(
  configId: string,
  data: UpdateParametersInput
): Promise<void> {
  const res = await fetch(`${API_BASE}/other-configs/${configId}/parameters`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '更新参数失败');
  }
}

/** 更新单个参数值 */
export async function updateConfigParameterApi(
  configId: string,
  parameterId: string,
  value: string
): Promise<void> {
  const res = await fetch(`${API_BASE}/other-configs/${configId}/parameters/${parameterId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ value }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '更新参数失败');
  }
}
