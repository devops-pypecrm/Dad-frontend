import { api } from './api';

export type BroadcastSeverity = 'info' | 'warning' | 'critical' | 'update';
export type BroadcastAudience = 'all' | 'admins' | 'self';

export interface Broadcast {
    id: string;
    title: string;
    message: string;
    severity: BroadcastSeverity;
    audience: BroadcastAudience;
    createdAt: string;
    createdBy: string | null;
    recipientCount: number;
    readCount: number;
    pendingCount: number;
}

export interface BroadcastOrgStats {
    organisationId: string;
    organisationName: string;
    total: number;
    acknowledged: number;
    fullyAcknowledged: boolean;
    pendingUsers: { id: string; name: string; email: string }[];
}

export interface BroadcastStats {
    broadcast: Pick<Broadcast, 'id' | 'title' | 'message' | 'severity' | 'audience' | 'createdAt'>;
    totalRecipients: number;
    totalAcknowledged: number;
    fullyAcknowledgedOrgCount: number;
    totalOrgCount: number;
    organisations: BroadcastOrgStats[];
}

export const getAllBroadcasts = async (): Promise<Broadcast[]> => {
    const res = await api.get('/super-admin/broadcasts');
    return res.data.broadcasts;
};

export const getBroadcastStats = async (id: string): Promise<BroadcastStats> => {
    const res = await api.get(`/super-admin/broadcasts/${id}/stats`);
    return res.data;
};

export const sendBroadcast = async (payload: {
    title: string;
    message: string;
    severity: BroadcastSeverity;
    audience: BroadcastAudience;
}) => {
    const res = await api.post('/super-admin/broadcasts', payload);
    return res.data as { success: boolean; broadcastId: string; count: number; message: string };
};
