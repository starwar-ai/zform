/**
 * 实体配置 API
 */

import type { Company, CompanyBankAccount, Region, Country, Port, Brand, Warehouse } from '@/types/business-config';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// ==================== 子公司 API ====================

export async function fetchCompaniesApi(): Promise<Company[]> {
  const res = await fetch(`${API_BASE}/companies`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('获取子公司列表失败');
  return res.json();
}

export async function fetchCompanyByIdApi(id: string): Promise<Company> {
  const res = await fetch(`${API_BASE}/companies/${id}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('获取子公司详情失败');
  return res.json();
}

export async function createCompanyApi(data: Partial<Company>): Promise<Company> {
  const res = await fetch(`${API_BASE}/companies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '创建子公司失败');
  }
  return res.json();
}

export async function updateCompanyApi(id: string, data: Partial<Company>): Promise<Company> {
  const res = await fetch(`${API_BASE}/companies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '更新子公司失败');
  }
  return res.json();
}

export async function deleteCompanyApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/companies/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '删除子公司失败');
  }
}

// ==================== 银行账号 API ====================

export async function createBankAccountApi(
  companyId: string,
  data: Partial<CompanyBankAccount>
): Promise<CompanyBankAccount> {
  const res = await fetch(`${API_BASE}/companies/${companyId}/bank-accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '创建银行账号失败');
  }
  return res.json();
}

export async function updateBankAccountApi(
  companyId: string,
  id: string,
  data: Partial<CompanyBankAccount>
): Promise<CompanyBankAccount> {
  const res = await fetch(`${API_BASE}/companies/${companyId}/bank-accounts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '更新银行账号失败');
  }
  return res.json();
}

export async function deleteBankAccountApi(companyId: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/companies/${companyId}/bank-accounts/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '删除银行账号失败');
  }
}

// ==================== 区域 API ====================

export async function fetchRegionsApi(): Promise<Region[]> {
  const res = await fetch(`${API_BASE}/regions`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('获取区域列表失败');
  return res.json();
}

export async function createRegionApi(data: Partial<Region>): Promise<Region> {
  const res = await fetch(`${API_BASE}/regions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '创建区域失败');
  }
  return res.json();
}

export async function updateRegionApi(id: string, data: Partial<Region>): Promise<Region> {
  const res = await fetch(`${API_BASE}/regions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '更新区域失败');
  }
  return res.json();
}

export async function deleteRegionApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/regions/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '删除区域失败');
  }
}

// ==================== 国家 API ====================

export async function fetchCountriesApi(): Promise<Country[]> {
  const res = await fetch(`${API_BASE}/countries`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('获取国家列表失败');
  return res.json();
}

export async function createCountryApi(data: Partial<Country>): Promise<Country> {
  const res = await fetch(`${API_BASE}/countries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '创建国家失败');
  }
  return res.json();
}

export async function updateCountryApi(id: string, data: Partial<Country>): Promise<Country> {
  const res = await fetch(`${API_BASE}/countries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '更新国家失败');
  }
  return res.json();
}

export async function deleteCountryApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/countries/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '删除国家失败');
  }
}

// ==================== 港口 API ====================

export async function fetchPortsApi(): Promise<Port[]> {
  const res = await fetch(`${API_BASE}/ports`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('获取港口列表失败');
  return res.json();
}

export async function createPortApi(data: Partial<Port>): Promise<Port> {
  const res = await fetch(`${API_BASE}/ports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '创建港口失败');
  }
  return res.json();
}

export async function updatePortApi(id: string, data: Partial<Port>): Promise<Port> {
  const res = await fetch(`${API_BASE}/ports/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '更新港口失败');
  }
  return res.json();
}

export async function deletePortApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/ports/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '删除港口失败');
  }
}

// ==================== 品牌 API ====================

export async function fetchBrandsApi(): Promise<Brand[]> {
  const res = await fetch(`${API_BASE}/brands`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('获取品牌列表失败');
  return res.json();
}

export async function createBrandApi(data: Partial<Brand>): Promise<Brand> {
  const res = await fetch(`${API_BASE}/brands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '创建品牌失败');
  }
  return res.json();
}

export async function updateBrandApi(id: string, data: Partial<Brand>): Promise<Brand> {
  const res = await fetch(`${API_BASE}/brands/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '更新品牌失败');
  }
  return res.json();
}

export async function deleteBrandApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/brands/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '删除品牌失败');
  }
}

// ==================== 仓库 API ====================

export async function fetchWarehousesApi(): Promise<Warehouse[]> {
  const res = await fetch(`${API_BASE}/warehouses`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('获取仓库列表失败');
  return res.json();
}

export async function fetchWarehouseByIdApi(id: string): Promise<Warehouse> {
  const res = await fetch(`${API_BASE}/warehouses/${id}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('获取仓库详情失败');
  return res.json();
}

export async function createWarehouseApi(data: Partial<Warehouse>): Promise<Warehouse> {
  const res = await fetch(`${API_BASE}/warehouses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '创建仓库失败');
  }
  return res.json();
}

export async function updateWarehouseApi(id: string, data: Partial<Warehouse>): Promise<Warehouse> {
  const res = await fetch(`${API_BASE}/warehouses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '更新仓库失败');
  }
  return res.json();
}

export async function deleteWarehouseApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/warehouses/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '删除仓库失败');
  }
}
