// API client for the Uptime Monitor backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (res.status === 401) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Unauthorized');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, error.code || 'ERROR', error.message || res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

// ── Auth ────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  pictureUrl: string | null;
  status: string;
  createdAt: string;
}

export const auth = {
  me: () => fetchApi<User>('/api/auth/me'),
  loginUrl: () => `${API_BASE}/oauth2/authorization/google`,
  logoutUrl: () => `${API_BASE}/api/auth/logout`,
};

// ── Monitors ────────────────────────────────────────────
export interface Monitor {
  id: string;
  name: string;
  url: string;
  httpMethod: string;
  expectedStatusCode: number;
  intervalSeconds: number;
  timeoutMs: number;
  enabled: boolean;
  currentStatus: string;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMonitorRequest {
  name: string;
  url: string;
  httpMethod?: string;
  expectedStatusCode?: number;
  intervalSeconds?: number;
  timeoutMs?: number;
}

export interface UpdateMonitorRequest {
  name?: string;
  url?: string;
  httpMethod?: string;
  expectedStatusCode?: number;
  intervalSeconds?: number;
  timeoutMs?: number;
}

export const monitors = {
  list: () => fetchApi<Monitor[]>('/api/monitors'),
  get: (id: string) => fetchApi<Monitor>(`/api/monitors/${id}`),
  create: (data: CreateMonitorRequest) =>
    fetchApi<Monitor>('/api/monitors', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: UpdateMonitorRequest) =>
    fetchApi<Monitor>(`/api/monitors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<void>(`/api/monitors/${id}`, { method: 'DELETE' }),
  pause: (id: string) =>
    fetchApi<Monitor>(`/api/monitors/${id}/pause`, { method: 'POST' }),
  resume: (id: string) =>
    fetchApi<Monitor>(`/api/monitors/${id}/resume`, { method: 'POST' }),
};

// ── Check Results ───────────────────────────────────────
export interface CheckResult {
  id: number;
  status: string;
  httpStatus: number | null;
  responseTimeMs: number | null;
  errorMessage: string | null;
  checkedAt: string;
}

export const checks = {
  list: (monitorId: string, page = 0, size = 50) =>
    fetchApi<CheckResult[]>(`/api/monitors/${monitorId}/checks?page=${page}&size=${size}`),
};

// ── Statistics ──────────────────────────────────────────
export interface UptimeStatistics {
  period: string;
  uptimePercentage: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  avgResponseTimeMs: number;
  minResponseTimeMs: number;
  maxResponseTimeMs: number;
  totalDowntimeSeconds: number;
}

export const statistics = {
  get: (monitorId: string) =>
    fetchApi<UptimeStatistics[]>(`/api/monitors/${monitorId}/statistics`),
};

// ── Notifications ───────────────────────────────────────
export interface NotificationSettings {
  id: string;
  monitorId: string;
  emailEnabled: boolean;
  notifyOnDown: boolean;
  notifyOnRecovery: boolean;
}

export interface UpdateNotificationSettingsRequest {
  emailEnabled: boolean;
  notifyOnDown: boolean;
  notifyOnRecovery: boolean;
}

export const notifications = {
  get: (monitorId: string) =>
    fetchApi<NotificationSettings>(`/api/monitors/${monitorId}/notifications`),
  update: (monitorId: string, data: UpdateNotificationSettingsRequest) =>
    fetchApi<NotificationSettings>(`/api/monitors/${monitorId}/notifications`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
