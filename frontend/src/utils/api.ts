import { getToken, removeToken } from './token';

export { getToken, setToken, removeToken } from './token';

async function _get(url: string) {
  const res = await fetch(url, { headers: _authHeaders() });
  if (res.status === 401) { removeToken(); window.location.href = '/login'; throw new Error('unauthorized'); }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function _post(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ..._authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) { removeToken(); window.location.href = '/login'; throw new Error('unauthorized'); }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function _put(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ..._authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) { removeToken(); window.location.href = '/login'; throw new Error('unauthorized'); }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function _delete(url: string) {
  const res = await fetch(url, { headers: _authHeaders(), method: 'DELETE' });
  if (res.status === 401) { removeToken(); window.location.href = '/login'; throw new Error('unauthorized'); }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function _authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: 'Bearer ' + t } : {};
}

// Auth
export const login = (username: string, password: string) =>
  _post('/api/auth/login', { username, password });
export const logout = () => _post('/api/auth/logout');

// Containers
export const getContainers = () => _get('/api/containers?show_hidden=true');
export const getContainerDetail = (id: string) => _get('/api/containers/' + id);

// Stats
export const getStats = () => _get('/api/stats');

// Groups
export const getGroups = () => _get('/api/groups');
export const createGroup = (name: string, color: string) =>
  _post('/api/groups', { name, color });
export const updateGroup = (id: number, data: Record<string, unknown>) =>
  _put('/api/groups/' + id, data);
export const deleteGroup = (id: number) => _delete('/api/groups/' + id);

// Custom
export const updateContainerCustom = (id: string, data: Record<string, unknown>) =>
  _put('/api/custom/containers/' + id, data);

// Bulk
export const bulkMove = (containerIds: string[], groupName: string | null) =>
  _post('/api/custom/bulk-move', { container_ids: containerIds, group_name: groupName });
export const bulkHide = (containerIds: string[], hidden: boolean) =>
  _post('/api/custom/bulk-hide', { container_ids: containerIds, is_hidden: hidden });

// Reorder
export const reorderContainer = (containerId: string, direction: string) =>
  _post('/api/custom/reorder', { container_id: containerId, direction });

// Drag-place: move to group at position
export const placeContainer = (containerId: string, groupName: string | null, beforeId: string | null) =>
  _post('/api/custom/place', { container_id: containerId, group_name: groupName, before_id: beforeId });
