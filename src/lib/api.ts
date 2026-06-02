import type { Client, Item, Category, Order, Payment } from '../types';

const BASE = import.meta.env.VITE_API_URL || '';

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  login: (username: string, password: string) =>
    req<{ token: string }>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ username, password }),
    }),

  getClients: () => req<Client[]>('/api/clients'),
  createClient: (b: { name: string; phone?: string; address?: string }) =>
    req<Client>('/api/clients', { method: 'POST', body: JSON.stringify(b) }),
  updateClient: (id: number, b: { name: string; phone?: string; address?: string }) =>
    req(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  getClientLedger: (id: number) => req<Order[]>(`/api/clients/${id}/ledger`),

  getItems: () => req<Item[]>('/api/items'),
  getCategories: () => req<Category[]>('/api/items/categories'),
  createCategory: (b: { name: string }) =>
    req<Category>('/api/items/categories', { method: 'POST', body: JSON.stringify(b) }),
  updateCategory: (id: number, b: { name: string }) =>
    req(`/api/items/categories/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  deleteCategory: (id: number) =>
    req(`/api/items/categories/${id}`, { method: 'DELETE' }),

  createItem: (b: { name: string; category_id?: number; default_unit?: string }) =>
    req<Item>('/api/items', { method: 'POST', body: JSON.stringify(b) }),
  updateItem: (id: number, b: { name: string; category_id?: number | null; default_unit?: string }) =>
    req(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  deleteItem: (id: number) =>
    req(`/api/items/${id}`, { method: 'DELETE' }),

  createOrder: (b: { client_id: number; order_date: string; paid: number; notes?: string; lines: any[] }) =>
    req<Order>('/api/orders', { method: 'POST', body: JSON.stringify(b) }),
  updateOrder: (id: number, b: { client_id: number; order_date: string; paid: number; notes?: string; lines: any[] }) =>
    req<Order>(`/api/orders/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  getOrder: (id: number) => req<Order>(`/api/orders/${id}`),
  getOrders: (p?: { client_id?: number; from?: string; to?: string }) =>
    req<Order[]>(`/api/orders?${new URLSearchParams(p as any)}`),
  updatePayment: (id: number, paid: number) =>
    req(`/api/orders/${id}/payment`, { method: 'PUT', body: JSON.stringify({ paid }) }),

  getPayments: (p?: { client_id?: number }) =>
    req<Payment[]>(`/api/payments?${new URLSearchParams(p as any)}`),
  createPayment: (b: { client_id: number; amount: number; payment_date: string; method: string; note?: string, reference?: string, order_id?: Number|undefined }) =>
    req<Payment>('/api/payments', { method: 'POST', body: JSON.stringify(b) }),
  editPayment: (id: number, b: { client_id: number; amount: number; payment_date: string; method: string; note?: string; reference?: string }) =>
    req<Payment>(`/api/payments/${id}`, { method: 'PUT', body: JSON.stringify(b) }),
  deletePayment: (id: number) =>
    req(`/api/payments/${id}`, { method: 'DELETE' }),
};