import { api } from './api';

export interface GoogleAdsStatus {
  platformConfigured: boolean
  connected: boolean
  needsReconnect?: boolean
  email?: string
  customerId?: string
  customerName?: string
  loginCustomerId?: string
  conversionActionId?: string
  webhookKey?: string
  lastLeadAt?: string
  lastTestAt?: string
  lastConversion?: { at: string; ok: boolean; message: string }
}
export interface GoogleAdsAccount { id: string; name: string; isManager: boolean; currency?: string; inaccessible?: boolean }
export interface GoogleAdsCampaign { id: string; name: string; status: string; impressions: number; clicks: number; cost: number; conversions: number; ctr: number; avgCpc: number }

export const getGoogleAdsStatus = async (): Promise<GoogleAdsStatus> => (await api.get('/google-ads/status')).data;
export const getGoogleAdsAuthUrl = async (): Promise<{ authUrl: string }> => (await api.get('/google-ads/auth-url')).data;
export const connectGoogleAds = async (code: string, state: string) => (await api.post('/google-ads/callback', { code, state })).data;
export const getGoogleAdsAccounts = async (): Promise<{ accounts: GoogleAdsAccount[] }> => (await api.get('/google-ads/accounts')).data;
export const selectGoogleAdsAccount = async (body: { customerId: string; customerName?: string; loginCustomerId?: string; conversionActionId?: string }) =>
  (await api.post('/google-ads/select-account', body)).data;
export const getGoogleAdsCampaigns = async (startDate?: string, endDate?: string): Promise<{ campaigns: GoogleAdsCampaign[] }> =>
  (await api.get('/google-ads/campaigns', { params: { startDate, endDate } })).data;
export const getGoogleAdsConversionActions = async (): Promise<{ actions: { id: string; name: string; type: string }[] }> =>
  (await api.get('/google-ads/conversion-actions')).data;
export const regenerateGoogleAdsKey = async () => (await api.post('/google-ads/regenerate-key')).data;
export const disconnectGoogleAds = async () => (await api.post('/google-ads/disconnect')).data;
