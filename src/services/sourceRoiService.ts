import { api } from './api';

export interface RoiMetrics {
    leads: number;
    converted: number;
    lost: number;
    open: number;
    conversionRate: number;
    revenue: number;
    spend: number;
    costPerLead: number;
    costPerConversion: number;
    profit: number;
    roi: number | null;
    statuses: Record<string, number>;
    firstLeadAt: string | null;
    lastLeadAt: string | null;
}

export interface RoiSource extends RoiMetrics {
    source: string;
    label: string;
    campaignCount: number;
}

export interface RoiForm extends RoiMetrics {
    key: string;
    formId: string | null;
    name: string;
}

export interface RoiCampaign extends RoiMetrics {
    key: string;
    campaignId: string | null;
    name: string;
    sources: string[];
    matchedToMeta: boolean;
    adAccountName: string | null;
    currency: string | null;
    metaStatus: string | null;
    startTime: string | null;
    stopTime: string | null;
    clicks: number;
    impressions: number;
    reach: number;
    costPerClick: number;
    forms: RoiForm[];
}

export interface RoiUser extends RoiMetrics {
    userId: string | null;
    name: string;
    branch: string | null;
    isActive: boolean;
}

export interface SourceRoiReport {
    startDate: string;
    endDate: string;
    filters: { source: string | null; campaign: string | null; branchId: string | null; lostStatuses: string[] };
    orgCurrency: string | null;
    adCurrencies: string[];
    meta: { connected: boolean; errors: string[] };
    statusLabels: Record<string, string>;
    summary: RoiMetrics;
    sources: RoiSource[];
    campaigns: RoiCampaign[];
    users: RoiUser[];
}

export interface SourceRoiParams {
    startDate: string;
    endDate: string;
    source?: string;
    campaign?: string;
    branchId?: string;
    lostStatuses?: string[];
}

/** GET /api/reports/source-roi — see Dad-backend/src/controllers/sourceRoiController.ts */
export const getSourceRoiReport = async (params: SourceRoiParams): Promise<SourceRoiReport> => {
    const { lostStatuses, ...rest } = params;
    const response = await api.get('/reports/source-roi', {
        params: { ...rest, lostStatuses: lostStatuses?.length ? lostStatuses.join(',') : undefined },
    });
    return response.data;
};
