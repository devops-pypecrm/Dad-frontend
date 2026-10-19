import { api } from './api';

// ---------------- connection ----------------
export interface IgAccount {
  id: string; igUserId: string; username: string; name: string | null; profilePicUrl: string | null; accountType: string | null;
  followersCount: number | null; mediaCount: number | null; status: 'active' | 'inactive' | 'needs_reauth';
  tokenExpiresAt: string | null; lastWebhookAt: string | null; webhookSubscribedAt: string | null; lastError: string | null;
}
export interface IgConnection { connected: boolean; configured: boolean; healthy?: boolean; account?: IgAccount }

export const instagramConnectionApi = {
  get: async () => (await api.get<IgConnection>('/instagram/connection')).data,
  disconnect: async () => (await api.post('/instagram/disconnect')).data,
};

/** Sends the user to Instagram's login page; Instagram returns them to /api/instagram/callback, then to returnPath. */
export async function startInstagramConnect(returnPath: string) {
  const { data } = await api.get<{ url: string }>('/instagram/connect-url', { params: { returnPath } });
  window.location.href = data.url;
}

// ---------------- inbox ----------------
export interface IgWindow { open: boolean; expiresAt: string | null; msLeft: number }
export interface IgConversation {
  id: string; igsid: string; username: string | null; displayName: string | null; profilePicUrl: string | null;
  assigneeId: string | null; assigneeName?: string | null; status: 'open' | 'pending' | 'resolved'; labels: string[]; unreadCount: number;
  lastMessageAt: string; lastMessagePreview: string | null; lastMessageDirection: 'incoming' | 'outgoing' | null; lastInboundAt: string | null; window: IgWindow;
}
export interface IgConversationDetail extends IgConversation { assignee: { id: string; firstName: string; lastName?: string } | null }
export interface IgMessage {
  id: string; direction: 'incoming' | 'outgoing'; messageType: string; status: 'sent' | 'received' | 'read' | 'failed'; errorMessage?: string | null;
  source?: string | null; createdAt: string;
  content: { text?: string; mediaUrl?: string; buttons?: { title: string; url?: string }[] } | null;
}
export interface IgCounts { all: number; mine: number; unassigned: number; unread: number }
export interface IgNote { id: string; body: string; authorName: string; createdAt: string }

export const instagramInboxApi = {
  list: async (q: { view?: string; status?: string; search?: string; cursor?: string }) =>
    (await api.get<{ conversations: IgConversation[]; nextCursor: string | null }>('/instagram/inbox/conversations', { params: q })).data,
  counts: async () => (await api.get<IgCounts>('/instagram/inbox/counts')).data,
  get: async (id: string) => (await api.get<IgConversationDetail>(`/instagram/inbox/conversations/${id}`)).data,
  messages: async (id: string) => (await api.get<{ messages: IgMessage[]; window: IgWindow }>(`/instagram/inbox/conversations/${id}/messages`)).data,
  send: async (id: string, text: string) => (await api.post(`/instagram/inbox/conversations/${id}/messages`, { text })).data,
  read: async (id: string) => (await api.post(`/instagram/inbox/conversations/${id}/read`)).data,
  update: async (id: string, body: { assigneeId?: string | null; status?: string; labels?: string[] }) => (await api.patch(`/instagram/inbox/conversations/${id}`, body)).data,
  notes: async (id: string) => (await api.get<IgNote[]>(`/instagram/inbox/conversations/${id}/notes`)).data,
  addNote: async (id: string, body: string) => (await api.post(`/instagram/inbox/conversations/${id}/notes`, { body })).data,
  users: async () => (await api.get<{ id: string; firstName: string; lastName?: string }[]>('/instagram/inbox/assignable-users')).data,
};

// ---------------- keyword chatbots ----------------
export interface IgBotMessage { text: string; buttons?: { title: string; url: string }[] }
export interface IgChatbot {
  id: string; name: string; isActive: boolean; keywords: string[]; matchType: 'contains' | 'exact'; chatWindowMinutes: number;
  messages: IgBotMessage[]; sourceTemplateKey?: string | null; createdAt: string; triggered?: number;
}
export interface IgChatbotOverview {
  stats: { messagesSent: number; active: number; inactive: number; custom: number; templates: number };
  chatbots: IgChatbot[];
  templates: { key: string; name: string; description: string; keywords: string[]; used: boolean }[];
}
export type IgChatbotInput = Pick<IgChatbot, 'name' | 'keywords' | 'matchType' | 'chatWindowMinutes' | 'messages'> & { isActive?: boolean };

export const instagramChatbotApi = {
  overview: async () => (await api.get<IgChatbotOverview>('/instagram/chatbots')).data,
  get: async (id: string) => (await api.get<IgChatbot>(`/instagram/chatbots/${id}`)).data,
  create: async (b: IgChatbotInput) => (await api.post<IgChatbot>('/instagram/chatbots', b)).data,
  update: async (id: string, b: Partial<IgChatbotInput>) => (await api.put<IgChatbot>(`/instagram/chatbots/${id}`, b)).data,
  remove: async (id: string) => (await api.delete(`/instagram/chatbots/${id}`)).data,
  useTemplate: async (key: string) => (await api.post<IgChatbot>(`/instagram/chatbots/templates/${key}/use`)).data,
};

// ---------------- ask to follow ----------------
export interface IgGateBot {
  id: string; name: string; isActive: boolean; mediaId: string; mediaPermalink?: string | null; mediaThumbUrl?: string | null; mediaCaption?: string | null;
  keywords: string[]; publicReplies: string[]; askMessage: string; followButton: string; notFollowingMessage: string; rewardMessage: string; rewardLink?: string | null;
  comments?: number; rewarded?: number; createdAt: string;
}
export interface IgGateOverview {
  connected: boolean; account: { username: string; name: string | null; profilePicUrl: string | null; followersCount: number | null } | null;
  stats: { total: number; active: number; inactive: number }; bots: IgGateBot[];
}
export interface IgMedia { id: string; caption: string; mediaType: string; thumbnailUrl: string; permalink: string; timestamp: string; commentsCount?: number; likeCount?: number; bots: number; activeBots: number }
export type IgGateInput = Partial<Pick<IgGateBot, 'name' | 'isActive' | 'mediaId' | 'keywords' | 'publicReplies' | 'askMessage' | 'followButton' | 'notFollowingMessage' | 'rewardMessage' | 'rewardLink'>>;

export const instagramGateApi = {
  overview: async () => (await api.get<IgGateOverview>('/instagram/ask-to-follow')).data,
  media: async () => (await api.get<IgMedia[]>('/instagram/ask-to-follow/media')).data,
  get: async (id: string) => (await api.get<IgGateBot>(`/instagram/ask-to-follow/bots/${id}`)).data,
  create: async (b: IgGateInput) => (await api.post<IgGateBot>('/instagram/ask-to-follow/bots', b)).data,
  update: async (id: string, b: IgGateInput) => (await api.put<IgGateBot>(`/instagram/ask-to-follow/bots/${id}`, b)).data,
  remove: async (id: string) => (await api.delete(`/instagram/ask-to-follow/bots/${id}`)).data,
};
