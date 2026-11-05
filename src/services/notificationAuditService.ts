import { api } from './api';

const BASE = '/super-admin/notification-audit';

export type Health = 'healthy' | 'failing' | 'no_device' | 'push_disabled' | 'stale_device' | 'untested' | 'inactive';

export interface AuditScope {
    organisationId?: string;
    userId?: string;
}

export interface AuditSummary {
    windowHours: number;
    bucket: 'hour' | 'day';
    fcmConfigured: boolean;
    users: { active: number; withDevice: number; withoutDevice: number; legacyTokenOnly: number; pushDisabled: number };
    devices: { total: number; stale: number; staleAfterDays: number };
    notifications: { inWindow: number; unreadTotal: number };
    push: { sent: number; failed: number; skipped: number };
    topErrors: { errorCode: string; status: string; count: number }[];
    timeline: { t: string; notifications: number; sent: number; failed: number; skipped: number }[];
}

export interface AuditUserRow {
    id: string; name: string; email: string; role: string; isActive: boolean;
    organisationId: string | null; organisationName: string | null;
    lastLogin: string | null; pushDisabled: boolean; deviceCount: number; lastDeviceSeen: string | null;
    notifications24h: number; unread: number;
    push24h: { sent: number; failed: number; skipped: number };
    lastPush: { status: string; errorCode: string | null; at: string } | null;
    health: Health;
}

export interface PushLogRow {
    id: string; createdAt: string; userId: string; organisationId: string | null; notificationId: string | null;
    title: string; type: string; source: string; tokenSuffix: string | null; platform: string | null;
    status: 'sent' | 'failed' | 'skipped'; errorCode: string | null; errorMessage: string | null;
    messageId: string | null; latencyMs: number | null;
    user?: { name: string; email: string; organisationName: string | null } | null;
}

export interface AuditNotificationRow {
    id: string; title: string; message: string; type: string; severity: string; isRead: boolean; createdAt: string;
    recipient: { id: string; name: string; email: string; organisationName: string | null } | null;
    push: { sent: number; failed: number; skipped: number; errorCode: string | null } | null;
}

export interface AuditDeviceRow {
    id: string; tokenSuffix: string | null; platform: string | null; createdAt: string; lastSeenAt: string; stale: boolean;
    user: { id: string; name: string; email: string; isActive: boolean; organisationName: string | null };
}

export interface TestPushResult {
    tokenSuffix: string | null; platform: string | null; ok: boolean; errorCode: string | null;
    errorMessage: string | null; messageId: string | null; latencyMs: number; deadToken: boolean;
}

const clean = (o: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '' && v !== 'all'));

export const getAuditOrganisations = async (): Promise<{ id: string; name: string }[]> =>
    (await api.get(`${BASE}/organisations`)).data.organisations;

export const lookupAuditUsers = async (organisationId?: string, search?: string) =>
    (await api.get(`${BASE}/users-lookup`, { params: clean({ organisationId, search }) })).data.users as
        { id: string; name: string; email: string; organisationName: string | null }[];

export const getAuditSummary = async (scope: AuditScope, hours: number): Promise<AuditSummary> =>
    (await api.get(`${BASE}/summary`, { params: clean({ organisationId: scope.organisationId, hours }) })).data;

export const getAuditUsers = async (params: Record<string, unknown>) =>
    (await api.get(`${BASE}/users`, { params: clean(params) })).data as { users: AuditUserRow[]; total: number; page: number; pages: number };

export const getAuditUserDetail = async (id: string) => (await api.get(`${BASE}/users/${id}`)).data;

export const getAuditNotifications = async (params: Record<string, unknown>) =>
    (await api.get(`${BASE}/notifications`, { params: clean(params) })).data as { notifications: AuditNotificationRow[]; total: number; page: number; pages: number };

export const getAuditLogs = async (params: Record<string, unknown>) =>
    (await api.get(`${BASE}/logs`, { params: clean(params) })).data as { logs: PushLogRow[]; total: number; page: number; pages: number };

export const getAuditDevices = async (params: Record<string, unknown>) =>
    (await api.get(`${BASE}/devices`, { params: clean(params) })).data as { devices: AuditDeviceRow[]; total: number; page: number; pages: number; staleAfterDays: number };

export const deleteAuditDevice = async (id: string) => (await api.delete(`${BASE}/devices/${id}`)).data;

export const testUserPush = async (userId: string, dryRun: boolean) =>
    (await api.post(`${BASE}/users/${userId}/test-push`, { dryRun })).data as
        { dryRun: boolean; fcmConfigured: boolean; results: TestPushResult[]; message?: string };
