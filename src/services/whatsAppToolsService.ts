import { api } from './api';

// WhatsApp Growth Tools (separate module: /api/whatsapp-tools)
export interface WaToolAccount { id: string; phoneNumber: string; displayName: string | null; phoneNumberId: string | null; wabaId: string | null; isDefault: boolean }
type Soft<T> = { available: true; data: T } | { available: false; error: string };
export interface WaAnalytics {
  days: number;
  messaging: Soft<{ date: string; sent: number; delivered: number }[]>;
  conversations: Soft<{ date: string; category: string; type: string; conversations: number; cost: number }[]>;
  templates: Soft<{ name: string; sent: number; delivered: number; read: number; clicked: number }[]>;
}
export interface WaNumberStatus {
  verified_name?: string; display_phone_number?: string; quality_rating?: string; messaging_limit_tier?: string; name_status?: string;
  status?: string; platform_type?: string; throughput?: { level?: string }; is_pin_enabled?: boolean; code_verification_status?: string;
}
export interface WaBusinessProfile { about?: string; address?: string; description?: string; email?: string; websites?: string[]; vertical?: string; profile_picture_url?: string }
export interface WaQr { code: string; prefilled_message: string; deep_link_url: string; qr_image_url?: string }
export interface WaStarters { enableWelcomeMessage: boolean; prompts: string[]; commands: { command_name: string; command_description: string }[] }
export interface WaReferralSummary {
  total: number; uniqueContacts: number;
  sources: { sourceId: string; sourceType: string | null; headline: string | null; sourceUrl: string | null; chats: number; contacts: number }[];
  recent: { id: string; phone: string; leadId: string | null; sourceType: string | null; headline: string | null; createdAt: string }[];
}

const p = (accountId?: string, extra: object = {}) => ({ params: { ...(accountId ? { accountId } : {}), ...extra } });

export const waToolsApi = {
  accounts: async () => (await api.get<WaToolAccount[]>('/whatsapp-tools/accounts')).data,
  analytics: async (accountId: string | undefined, days: number) => (await api.get<WaAnalytics>('/whatsapp-tools/analytics', p(accountId, { days }))).data,
  numberStatus: async (accountId?: string) => (await api.get<WaNumberStatus>('/whatsapp-tools/number-status', p(accountId))).data,
  referrals: async (days: number) => (await api.get<WaReferralSummary>('/whatsapp-tools/ad-referrals', { params: { days } })).data,
  getProfile: async (accountId?: string) => (await api.get<WaBusinessProfile>('/whatsapp-tools/business-profile', p(accountId))).data,
  saveProfile: async (accountId: string | undefined, body: WaBusinessProfile) => (await api.put<WaBusinessProfile>('/whatsapp-tools/business-profile', body, p(accountId))).data,
  qrList: async (accountId?: string) => (await api.get<WaQr[]>('/whatsapp-tools/qr-codes', p(accountId))).data,
  qrCreate: async (accountId: string | undefined, message: string) => (await api.post('/whatsapp-tools/qr-codes', { message }, p(accountId))).data,
  qrUpdate: async (accountId: string | undefined, code: string, message: string) => (await api.put(`/whatsapp-tools/qr-codes/${code}`, { message }, p(accountId))).data,
  qrDelete: async (accountId: string | undefined, code: string) => (await api.delete(`/whatsapp-tools/qr-codes/${code}`, p(accountId))).data,
  getStarters: async (accountId?: string) => (await api.get<WaStarters>('/whatsapp-tools/conversation-starters', p(accountId))).data,
  saveStarters: async (accountId: string | undefined, body: Partial<WaStarters>) => (await api.put<WaStarters>('/whatsapp-tools/conversation-starters', body, p(accountId))).data,
  blocked: async (accountId?: string) => (await api.get<string[]>('/whatsapp-tools/blocked', p(accountId))).data,
  block: async (accountId: string | undefined, phone: string) => (await api.post('/whatsapp-tools/blocked', { phone }, p(accountId))).data,
  unblock: async (accountId: string | undefined, phone: string) => (await api.post('/whatsapp-tools/unblock', { phone }, p(accountId))).data,
};
