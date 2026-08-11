import { getToken, removeToken } from './token';

const BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    removeToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

// Auth
export function login(username: string, password: string) {
  return request<{ access_token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function refreshToken() {
  return request<{ access_token: string }>('/auth/refresh', { method: 'POST' });
}

export function logout() {
  return request('/auth/logout', { method: 'POST' });
}

// Containers
export function getContainers() {
  return request<any[]>('/containers');
}

export function getContainer(id: string) {
  return request<any>(`/containers/${id}`);
}

// Stats
export function getStats() {
  return request<any>('/stats');
}

// Groups
export function getGroups() {
  return request<any[]>('/groups');
}

export function createGroup(name: string, color: string) {
  return request<any>('/groups', {
    method: 'POST',
    body: JSON.stringify({ name, color }),
  });
}

export function updateGroup(id: number, data: any) {
  return request<any>(`/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteGroup(id: number) {
  return request(`/groups/${id}`, { method: 'DELETE' });
}

// Custom
export function updateContainerCustom(id: string, data: any) {
  return request<any>(`/custom/containers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function moveContainerGroup(id: string, groupName: string | null) {
  return request<any>(`/custom/containers/${id}/group`, {
    method: 'PUT',
    body: JSON.stringify({ group_name: groupName }),
  });
}
