import * as api from './api';
import { getToken, removeToken } from './token';

export { getToken, setToken, removeToken } from './token';

export async function login(username: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('用户名或密码错误');
  return res.json();
}

export async function logout() {
  await fetch('/api/auth/logout', {
    method: 'POST',
    headers: _authHeaders(),
  });
  removeToken();
}

function _authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function _get(url: string) {
  const res = await fetch(url, { headers: _authHeaders() });
  if (res.status === 401) { removeToken(); window.location.href = '/login'; throw new Error('未登录'); }
  if (!res.ok) throw new Error(`请求失败: ${res.status}`);
  return res.json();
}

async function _post(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ..._authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) { removeToken(); window.location.href = '/login'; throw new Error('未登录'); }
  if (!res.ok) throw new Error(`请求失败: ${res.status}`);
  return res.json();
}

async function _put(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ..._authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) { removeToken(); window.location.href = '/login'; throw new Error('未登录'); }
  if (!res.ok) throw new Error(`请求失败: ${res.status}`);
  return res.json();
}

async function _delete(url: string) {
  const res = await fetch(url, {
    method: 'DELETE',
    headers: _authHeaders(),
  });
  if (res.status === 401) { removeToken(); window.location.href = '/login'; throw new Error('未登录'); }
  if (!res.ok) throw new Error(`请求失败: ${res.status}`);
  return res.json();
}

// Containers
export const getContainers = (showHidden = false) =>
  _get(`/api/containers${showHidden ? '?show_hidden=true' : ''}`);
export const getContainerDetail = (id: string) => _get(`/api/containers/${id}`);

// Stats
export const getStats = () => _get('/api/stats');

// Groups
export const getGroups = () => _get('/api/groups');
export const createGroup = (name: string, color: string) =>
  _post('/api/groups', { name, color });
export const updateGroup = (id: number, data: Record<string, unknown>) =>
  _put(`/api/groups/${id}`, data);
export const deleteGroup = (id: number) => _delete(`/api/groups/${id}`);

// Custom
export const updateContainerCustom = (id: string, data: Record<string, unknown>) =>
  _put(`/api/custom/containers/${id}`, data);
export const deleteContainerCustom = (id: string) =>
  _delete(`/api/custom/containers/${id}`);

// Bulk
export const bulkMove = (container_ids: string[], group_name: string | null) =>
  _post('/api/custom/bulk-move', { container_ids, group_name });
export const bulkHide = (container_ids: string[], is_hidden: boolean) =>
  _post('/api/custom/bulk-hide', { container_ids, is_hidden });
