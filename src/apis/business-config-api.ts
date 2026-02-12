/**
 * 实体配置 API
 */

import type { Company, CompanyBankAccount, Region, Country, Port, Brand, Warehouse, OrderRoute, CurrencyRate } from '@/types/business-config';

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

// ==================== 订单路径 API ====================

export async function fetchOrderRoutesApi(): Promise<OrderRoute[]> {
  const res = await fetch(`${API_BASE}/order-routes`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('获取订单路径列表失败');
  return res.json();
}

export async function createOrderRouteApi(data: Partial<OrderRoute>): Promise<OrderRoute> {
  const res = await fetch(`${API_BASE}/order-routes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '创建订单路径失败');
  }
  return res.json();
}

export async function updateOrderRouteApi(id: string, data: Partial<OrderRoute>): Promise<OrderRoute> {
  const res = await fetch(`${API_BASE}/order-routes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '更新订单路径失败');
  }
  return res.json();
}

export async function deleteOrderRouteApi(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/order-routes/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '删除订单路径失败');
  }
}

// ==================== 汇率 API ====================

export interface ExchangeRateListResponse {
  records: CurrencyRate[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TodayRatesResponse {
  date: string;
  rates: Record<string, number>;
}

export async function fetchExchangeRatesApi(params?: {
  page?: number;
  pageSize?: number;
  rateDate?: string;
  currencyName?: string;
  startDate?: string;
  endDate?: string;
}): Promise<ExchangeRateListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params?.rateDate) searchParams.set('rateDate', params.rateDate);
  if (params?.currencyName) searchParams.set('currencyName', params.currencyName);
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);
  
  const res = await fetch(`${API_BASE}/rates?${searchParams.toString()}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('获取汇率列表失败');
  return res.json();
}

export async function fetchTodayRatesApi(): Promise<TodayRatesResponse> {
  const res = await fetch(`${API_BASE}/rates/today`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('获取今日汇率失败');
  return res.json();
}

export async function fetchRatesByDateApi(date: string): Promise<{ date: string; rates: CurrencyRate[] }> {
  const res = await fetch(`${API_BASE}/rates/date/${date}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('获取指定日期汇率失败');
  return res.json();
}

export async function createExchangeRateApi(data: Partial<CurrencyRate>): Promise<CurrencyRate> {
  const res = await fetch(`${API_BASE}/rates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '创建汇率失败');
  }
  return res.json();
}

export async function batchCreateExchangeRatesApi(date: string, rates: Array<{
  currencyName: string;
  rate: number;
  midRate?: number;
}>): Promise<{ success: boolean; createdCount: number }> {
  const res = await fetch(`${API_BASE}/rates/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ date, rates }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '批量创建汇率失败');
  }
  return res.json();
}

export async function updateExchangeRateApi(
  rateDate: string,
  currencyName: string,
  data: Partial<CurrencyRate>
): Promise<CurrencyRate> {
  const res = await fetch(`${API_BASE}/rates/${rateDate}/${currencyName}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '更新汇率失败');
  }
  return res.json();
}

export async function deleteExchangeRateApi(rateDate: string, currencyName: string): Promise<void> {
  const res = await fetch(`${API_BASE}/rates/${rateDate}/${currencyName}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '删除汇率失败');
  }
}

export async function fetchRatesFromExternalApi(): Promise<{
  success: boolean;
  date: string;
  results: Array<{ currency: string; rate: number | null }>;
}> {
  const res = await fetch(`${API_BASE}/rates/fetch`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '从外部API获取汇率失败');
  }
  return res.json();
}

export async function convertCurrencyApi(params: {
  amount: number;
  fromCurrency: string;
  toCurrency?: string;
  date?: string;
}): Promise<{
  originalAmount: number;
  fromCurrency: string;
  toCurrency: string;
  convertedAmount: number;
  rate: number;
}> {
  const res = await fetch(`${API_BASE}/rates/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || '货币转换失败');
  }
  return res.json();
}
