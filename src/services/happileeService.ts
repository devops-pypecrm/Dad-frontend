import { api } from './api';

export interface HappileeTemplate {
  template_id: string; template_name: string; category?: string; language?: string; status?: string;
  body?: string; header?: string; footer?: string; header_url?: string; template_type?: string;
  body_params?: string[]; header_params?: string[]; button_params?: string[];
}
export interface HappileeStatus {
  connected: boolean; connectedAt: string | null; label: string | null; keyHint: string | null;
  stats: { sent: number; failed: number; lastActivity: string | null };
}
export interface HappileeLog {
  id: string; kind: 'single' | 'broadcast'; phone: string | null; recipientCount: number; templateName: string | null;
  messageUid: string | null; status: string; error: string | null; createdAt: string;
}
export interface Param { name: string; value: string }

export interface WebhookInfo {
  baseUrl: string;
  types: { key: string; label: string; url: string; createLead: boolean }[];
  events: { id: string; type: string; payload: any; outcome: string; leadId: string | null; createdAt: string }[];
}

export const happileeApi = {
  webhook: () => api.get<WebhookInfo>('/happilee/webhook').then(r => r.data),
  saveWebhookSettings: (createOn: string[]) => api.put('/happilee/webhook/settings', { createOn }).then(r => r.data),
  rotateWebhook: () => api.post('/happilee/webhook/rotate').then(r => r.data),
  status: () => api.get<HappileeStatus>('/happilee/status').then(r => r.data),
  connect: (apiKey: string, label?: string) => api.post('/happilee/connect', { apiKey, label }).then(r => r.data),
  disconnect: () => api.delete('/happilee/connect').then(r => r.data),
  templates: (search?: string, pageNumber = 1) => api.get<{ data: HappileeTemplate[] }>('/happilee/templates', { params: { search: search || undefined, pageNumber, limit: 50 } }).then(r => r.data.data),
  sendTemplate: (b: { leadId?: string; phone?: string; templateId: string; templateName?: string; params: Param[]; headerMediaUrl?: string }) => api.post('/happilee/send-template', b).then(r => r.data),
  broadcast: (b: { templateId: string; templateName?: string; leadIds: string[]; numbers: { name: string; phone: string }[]; bodyParams: Record<string, string>; headerMediaUrl?: string }) => api.post('/happilee/broadcast', b).then(r => r.data),
  syncContacts: (leadIds: string[], tags: string[]) => api.post('/happilee/contacts/sync', { leadIds, tags }).then(r => r.data as { synced: number; failed: number; errors: string[] }),
  updateTags: (phone: string, add?: string, remove?: string) => api.post('/happilee/tags', { phone, add, remove }).then(r => r.data),
  upload: (file: File) => { const f = new FormData(); f.append('file', file); return api.post<{ url: string }>('/happilee/upload', f).then(r => r.data.url); },
  messages: (page = 1) => api.get<{ data: HappileeLog[]; total: number; page: number; pages: number }>('/happilee/messages', { params: { page } }).then(r => r.data),
  refreshStatus: (id: string) => api.post(`/happilee/messages/${id}/refresh`).then(r => r.data),
};
