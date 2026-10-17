import { request } from './api';
import type { Entity, ResourceInput } from './operations';
const body = (input: ResourceInput) => Object.fromEntries(['roomNumber', 'name', 'capacity', 'status'].filter(key => input[key] !== undefined).map(key => [key, input[key]]));
export const roomsApi = {
  list: (token: string) => request<Entity[]>('/api/rooms', { token }),
  get: (token: string, id: string) => request<Entity>(`/api/rooms/${encodeURIComponent(id)}`, { token }),
  create: (token: string, input: ResourceInput) => request<Entity>('/api/rooms', { token, body: body(input) }),
  update: (token: string, id: string, input: ResourceInput) => request<Entity>(`/api/rooms/${encodeURIComponent(id)}`, { token, method: 'PUT', body: body(input) }),
  remove: (token: string, id: string) => request<void>(`/api/rooms/${encodeURIComponent(id)}`, { token, method: 'DELETE' }),
};
