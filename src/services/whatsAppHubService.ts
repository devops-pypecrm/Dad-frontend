import { api } from './api';

// ---------------- Inbox ----------------
export interface WaWindow { open: boolean; expiresAt: string | null; msLeft: number }

export interface WaConversation {
  id: string;
  phoneNumber: string;
  displayName: string | null;
  leadId: string | null;
  contactId: string | null;
  assigneeId: string | null;
  assigneeName?: string | null;
  whatsappAccountId: string | null;
  status: 'open' | 'pending' | 'resolved';
  labels: string[];
  unreadCount: number;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  lastMessageDirection: 'incoming' | 'outgoing' | null;
  lastInboundAt: string | null;
  window: WaWindow;
}

export interface WaConversationDetail extends WaConversation {
  assignee: { id: string; firstName: string; lastName?: string } | null;
  lead: { id: string; firstName: string; lastName?: string; phone: string; email?: string; status: string; source: string; nextFollowUp?: string | null; tags: string[] } | null;
  optedOut: boolean;
}

export interface WaMessage {
  id: string;
  direction: 'incoming' | 'outgoing';
  messageType: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'template' | 'interactive';
  content: {
    text?: string; mediaUrl?: string; caption?: string; fileName?: string; templateName?: string;
    buttons?: { id: string; title: string }[]; sections?: unknown[]; latitude?: number; longitude?: number;
  } | null;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  errorMessage?: string | null;
  source?: string | null;
  createdAt: string;
  agent?: { id: string; firstName: string; lastName?: string } | null;
}

export interface WaCounts { all: number; mine: number; unassigned: number; unread: number }
export interface WaLabel { id: string; name: string; color: string }
export interface WaQuickReply { id: string; shortcut: string; body: string }
export interface WaNote { id: string; body: string; authorName: string; createdAt: string }
export interface WaUser { id: string; firstName: string; lastName?: string }

export interface ConversationQuery { view?: string; status?: string; label?: string; search?: string; cursor?: string }

export const inboxApi = {
  list: async (q: ConversationQuery) =>
    (await api.get<{ conversations: WaConversation[]; nextCursor: string | null }>('/whatsapp/inbox/conversations', { params: q })).data,
  counts: async () => (await api.get<WaCounts>('/whatsapp/inbox/counts')).data,
  get: async (id: string) => (await api.get<WaConversationDetail>(`/whatsapp/inbox/conversations/${id}`)).data,
  messages: async (id: string) => (await api.get<{ messages: WaMessage[]; window: WaWindow }>(`/whatsapp/inbox/conversations/${id}/messages`)).data,
  send: async (id: string, body: { text?: string; template?: { name: string; language: string; values: string[] }; media?: { type: string; mediaId: string; caption?: string; filename?: string } }) =>
    (await api.post(`/whatsapp/inbox/conversations/${id}/messages`, body)).data,
  read: async (id: string) => (await api.post(`/whatsapp/inbox/conversations/${id}/read`)).data,
  update: async (id: string, body: { assigneeId?: string | null; status?: string; labels?: string[] }) =>
    (await api.patch(`/whatsapp/inbox/conversations/${id}`, body)).data,
  notes: async (id: string) => (await api.get<WaNote[]>(`/whatsapp/inbox/conversations/${id}/notes`)).data,
  addNote: async (id: string, body: string) => (await api.post(`/whatsapp/inbox/conversations/${id}/notes`, { body })).data,
  start: async (body: { phone: string; text?: string; template?: { name: string; language: string; values: string[] }; accountId?: string; leadId?: string }) =>
    (await api.post<{ conversationId: string }>('/whatsapp/inbox/start', body)).data,
  users: async () => (await api.get<WaUser[]>('/whatsapp/inbox/assignable-users')).data,
  quickReplies: async () => (await api.get<WaQuickReply[]>('/whatsapp/inbox/quick-replies')).data,
  saveQuickReply: async (body: { id?: string; shortcut: string; body: string }) =>
    body.id ? (await api.put(`/whatsapp/inbox/quick-replies/${body.id}`, body)).data : (await api.post('/whatsapp/inbox/quick-replies', body)).data,
  deleteQuickReply: async (id: string) => (await api.delete(`/whatsapp/inbox/quick-replies/${id}`)).data,
  labels: async () => (await api.get<WaLabel[]>('/whatsapp/inbox/labels')).data,
  createLabel: async (body: { name: string; color?: string }) => (await api.post<WaLabel>('/whatsapp/inbox/labels', body)).data,
  deleteLabel: async (id: string) => (await api.delete(`/whatsapp/inbox/labels/${id}`)).data,
  uploadMedia: async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return (await api.post<{ id: string }>('/whatsapp/upload-media', fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
  },
};

// ---------------- Templates ----------------
export interface WaTemplate {
  id: string; name: string; language: string; category: string; status: string; rejectedReason?: string | null;
  components: Array<{ type: string; text?: string; format?: string; buttons?: Array<{ type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'; text: string }> }>;
}
export const templateApi = {
  list: async (refresh = false) => (await api.get<WaTemplate[]>('/whatsapp/templates', { params: refresh ? { refresh: 1 } : {} })).data,
  sync: async () => (await api.post<{ synced: number }>('/whatsapp/templates/sync')).data,
};
export const bodyVariableCount = (t: Pick<WaTemplate, 'components'>) => {
  const body = t.components.find(c => c.type === 'BODY')?.text || '';
  const nums = (body.match(/\{\{(\d+)\}\}/g) || []).map(m => Number(m.replace(/\D/g, '')));
  return nums.length ? Math.max(...nums) : 0;
};

// ---------------- Shared automation types ----------------
export interface ParamSpec { source: string; value?: string }
export const PARAM_SOURCE_OPTIONS: { value: string; label: string }[] = [
  { value: 'lead.firstName', label: 'Lead first name' },
  { value: 'lead.lastName', label: 'Lead last name' },
  { value: 'lead.fullName', label: 'Lead full name' },
  { value: 'lead.source', label: 'Lead source' },
  { value: 'lead.company', label: 'Lead company' },
  { value: 'lead.enquiryAbout', label: 'Lead enquiry' },
  { value: 'org.name', label: 'Your business name' },
  { value: 'static', label: 'Fixed text…' },
];
export const LEAD_SOURCE_OPTIONS = ['website', 'referral', 'social', 'paid_ad', 'import', 'api', 'manual', 'whatsapp', 'meta_leadgen', 'cold_call', 'social_media', 'email_campaign', 'meta_ads', 'google_ads', 'facebook_payload', 'lead_squared', 'zapier', 'other'];

export type WorkingHours = Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', { start: string; end: string } | null>;
export const DEFAULT_WORKING_HOURS: WorkingHours = {
  mon: { start: '09:00', end: '18:00' }, tue: { start: '09:00', end: '18:00' }, wed: { start: '09:00', end: '18:00' },
  thu: { start: '09:00', end: '18:00' }, fri: { start: '09:00', end: '18:00' }, sat: { start: '09:00', end: '14:00' }, sun: null,
};

// ---------------- Auto responder ----------------
export interface WaResponder {
  id: string; name: string; isActive: boolean; whatsappAccountId: string | null;
  templateName: string; templateLanguage: string; templateParams: ParamSpec[] | null;
  delayMinutes: number; sources: string[]; workingHoursEnabled: boolean; workingHours: WorkingHours | null;
  timezone: string; outsideHoursBehavior: 'wait' | 'skip'; activatedAt: string | null;
  stats?: { scheduled: number; sent: number; skipped: number; failed: number };
}
export interface WaResponderLog { id: string; leadName: string; status: string; scheduledFor: string; sentAt: string | null; error: string | null }
export const responderApi = {
  list: async () => (await api.get<WaResponder[]>('/whatsapp/automation/responders')).data,
  create: async (b: Partial<WaResponder>) => (await api.post<WaResponder>('/whatsapp/automation/responders', b)).data,
  update: async (id: string, b: Partial<WaResponder>) => (await api.put<WaResponder>(`/whatsapp/automation/responders/${id}`, b)).data,
  remove: async (id: string) => (await api.delete(`/whatsapp/automation/responders/${id}`)).data,
  logs: async (id: string) => (await api.get<WaResponderLog[]>(`/whatsapp/automation/responders/${id}/logs`)).data,
};

// ---------------- Nurturing ----------------
export interface WaNurtureStep { id?: string; position?: number; label?: string | null; delayMinutes: number; templateName: string; templateLanguage: string; templateParams: ParamSpec[] | null }
export interface WaNurture {
  id: string; name: string; isActive: boolean; whatsappAccountId: string | null; sources: string[]; stopOnReply: boolean;
  steps: WaNurtureStep[]; stats?: Record<string, number>;
}
export interface WaEnrollment { id: string; leadName: string | null; phoneNumber: string; status: string; stepsSent: number; nextRunAt: string | null; lastError: string | null }
export const nurtureApi = {
  list: async () => (await api.get<WaNurture[]>('/whatsapp/automation/nurture')).data,
  create: async (b: Partial<WaNurture>) => (await api.post<WaNurture>('/whatsapp/automation/nurture', b)).data,
  update: async (id: string, b: Partial<WaNurture>) => (await api.put<WaNurture>(`/whatsapp/automation/nurture/${id}`, b)).data,
  remove: async (id: string) => (await api.delete(`/whatsapp/automation/nurture/${id}`)).data,
  enrollments: async (id: string) => (await api.get<WaEnrollment[]>(`/whatsapp/automation/nurture/${id}/enrollments`)).data,
};

// ---------------- Chatbot library + AI ----------------
export interface WaLibraryBot {
  key: string; name: string; category: string; badge: 'High Impact' | 'Useful' | 'Essential'; benefit: string;
  description: string; tags: string[]; triggerKeywords: string[]; flowId: string | null; isPublished: boolean;
}
export interface WaChatbotOverview {
  stats: { messagesSent: number; active: number; inactive: number; custom: number; systemTemplates: number };
  library: WaLibraryBot[];
}
export const chatbotApi = {
  overview: async () => (await api.get<WaChatbotOverview>('/whatsapp/chatbot/overview')).data,
  use: async (key: string) => (await api.post<{ id: string }>(`/whatsapp/chatbot/library/${key}/use`)).data,
  publish: async (id: string, publish: boolean) => (await api.post(`/whatsapp/chatbot/${id}/publish`, { publish })).data,
};

export interface WaAIStatus {
  agent: { isEnabled: boolean; chatbotName: string; showFooter: boolean; footerText: string; tone: string; handoffMessage: string; whatsappAccountId: string | null };
  aiProviderConfigured: boolean;
  categories: { key: string; label: string; hint: string; content: string }[];
  knowledge: { filled: number; total: number; percent: number };
  documents: { id: string; fileName: string; sizeBytes: number; status: string; errorMessage?: string | null; chunkCount: number; createdAt: string }[];
  usage: { used: number; limit: number; month: string };
}
export const aiApi = {
  status: async () => (await api.get<WaAIStatus>('/whatsapp/ai/status')).data,
  updateAgent: async (b: Partial<WaAIStatus['agent']>) => (await api.put('/whatsapp/ai/agent', b)).data,
  saveSection: async (category: string, content: string) => (await api.put(`/whatsapp/ai/sections/${category}`, { content })).data,
  upload: async (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return (await api.post('/whatsapp/ai/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
  },
  deleteDoc: async (id: string) => (await api.delete(`/whatsapp/ai/documents/${id}`)).data,
  test: async (question: string) => (await api.post<{ answer: string | null; handoff?: boolean; reason?: string }>('/whatsapp/ai/test', { question })).data,
};

// ---------------- Campaigns ----------------
export interface AudienceFilter { sources?: string[]; statuses?: string[]; tags?: string[]; createdFrom?: string; createdTo?: string }
export interface WaCampaign {
  id: string; name: string; message: string; status: string; templateId: string | null; templateLanguage: string | null;
  templateParams: ParamSpec[] | null; audienceFilter: AudienceFilter | null; audienceCount: number | null;
  whatsappAccountId: string | null; flowId: string | null; scheduledAt: string | null; sentAt: string | null; createdAt: string;
  stats: { sent: number; delivered: number; read: number; failed: number; replied: number; error?: string } | null;
}
export interface AudiencePreview { count: number; skipped: { noNumber: number; optedOut: number; duplicates: number }; sample: { name: string; phone: string }[]; dailyCapacity: number | null; exceedsCapacity: boolean }
export const campaignApi = {
  list: async () => (await api.get<WaCampaign[]>('/whatsapp-campaigns')).data,
  get: async (id: string, params?: { status?: string; page?: number }) =>
    (await api.get<{ campaign: WaCampaign; recipients: (WaMessage & { phoneNumber: string; lead?: { id: string; firstName: string; lastName?: string } | null })[]; total: number; page: number; pageSize: number }>(`/whatsapp-campaigns/${id}`, { params })).data,
  preview: async (b: { audienceFilter?: AudienceFilter; recipients?: unknown[]; whatsappAccountId?: string | null }) => (await api.post<AudiencePreview>('/whatsapp-campaigns/preview', b)).data,
  create: async (b: Record<string, unknown>) => (await api.post<WaCampaign>('/whatsapp-campaigns', b)).data,
  send: async (id: string) => (await api.post(`/whatsapp-campaigns/${id}/send`)).data,
  retryFailed: async (id: string) => (await api.post(`/whatsapp-campaigns/${id}/retry-failed`)).data,
  cancel: async (id: string) => (await api.post(`/whatsapp-campaigns/${id}/cancel`)).data,
  remove: async (id: string) => (await api.delete(`/whatsapp-campaigns/${id}`)).data,
};

// ---------------- Settings / health / insights ----------------
export interface WaAccountHealth {
  id: string; phoneNumber: string; displayName?: string | null; provider: string; status: string; isDefault: boolean;
  phoneNumberId?: string | null; wabaId?: string | null; connectionType: string; qualityRating?: string | null; messagingTier?: string | null;
  webhookSubscribedAt?: string | null; lastWebhookAt?: string | null; healthCheckedAt?: string | null; lastError?: string | null; hasToken: boolean;
  assignmentRules: { id: string; isActive: boolean }[]; _count: { campaigns: number; messages: number };
}
export interface WaSettingsOverview {
  accounts: WaAccountHealth[]; optOutCount: number; assignmentRules: number;
  webhook: { callbackUrl: string; verifyTokenConfigured: boolean; appSecretConfigured: boolean; subscribedFields: string[] };
}
export interface WaInsights {
  days: number; daily: { day: string; direction: string; count: number }[]; outgoingBySource: { source: string; count: number }[];
  delivery: { sent: number; delivered: number; read: number; failed: number };
  conversations: { open: number; unassigned: number; resolved: number }; aiMessagesThisMonth: number;
}
export const settingsApi = {
  overview: async () => (await api.get<WaSettingsOverview>('/whatsapp/settings/overview')).data,
  refreshAccount: async (id: string) => (await api.post(`/whatsapp/settings/accounts/${id}/refresh`)).data,
  refreshAll: async () => (await api.post('/whatsapp/settings/refresh')).data,
  optOuts: async () => (await api.get<{ id: string; phoneNumber: string; reason: string; createdAt: string }[]>('/whatsapp/optouts')).data,
  addOptOut: async (phone: string) => (await api.post('/whatsapp/optouts', { phone })).data,
  removeOptOut: async (phone: string) => (await api.delete(`/whatsapp/optouts/${phone}`)).data,
  insights: async (days = 7) => (await api.get<WaInsights>('/whatsapp/insights', { params: { days } })).data,
};
