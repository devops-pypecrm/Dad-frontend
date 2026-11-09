import { api } from './api';

// Instagram Growth Tools (separate module: /api/instagram-tools)
type Res<T> = { ok: true; data: T } | { ok: false; error: string };
export interface IgToolsStatus { connected: boolean; username?: string; extendedScopesEnabled: boolean; permissions: { insights: boolean; publishing: boolean; comments: boolean; messages: boolean } }
export interface IgInsights {
  days: number;
  profile: { username: string; name?: string; biography?: string; followers_count?: number; follows_count?: number; media_count?: number; profile_picture_url?: string };
  totals: Record<string, number>;
  series: Res<{ date: string; reach: number }[]>;
  demographics: Record<'age' | 'gender' | 'city' | 'country', Res<{ label: string; value: number }[]>>;
  permissionHint: string | null;
}
export interface IgMedia { id: string; caption?: string; media_type: string; media_url?: string; thumbnail_url?: string; permalink: string; timestamp: string; like_count?: number; comments_count?: number; insights?: Record<string, number> | null }
export interface IgComment { id: string; text: string; username: string; timestamp: string; like_count?: number; hidden?: boolean; replies?: { data: { id: string; text: string; username: string; timestamp: string }[] } }
export interface IgMessagingProfile { iceBreakers: string[]; persistentMenu: { type: 'web_url' | 'postback'; title: string; url?: string }[] }
export interface IgDiscovery { username: string; name?: string; biography?: string; followers_count?: number; follows_count?: number; media_count?: number; profile_picture_url?: string; media: IgMedia[]; avgEngagementPerPost: number; engagementRatePct: number | null }
export interface IgScheduledPost { id: string; mediaType: 'IMAGE' | 'REELS' | 'STORIES'; mediaUrl: string; caption: string | null; scheduledFor: string; status: 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled'; permalink: string | null; error: string | null }

export const igToolsApi = {
  status: async () => (await api.get<IgToolsStatus>('/instagram-tools/status')).data,
  insights: async (days: number) => (await api.get<IgInsights>('/instagram-tools/insights', { params: { days } })).data,
  topMedia: async () => (await api.get<IgMedia[]>('/instagram-tools/top-media')).data,
  media: async () => (await api.get<IgMedia[]>('/instagram-tools/media')).data,
  comments: async (mediaId: string) => (await api.get<IgComment[]>(`/instagram-tools/media/${mediaId}/comments`)).data,
  reply: async (id: string, message: string) => (await api.post(`/instagram-tools/comments/${id}/reply`, { message })).data,
  hide: async (id: string, hide: boolean) => (await api.post(`/instagram-tools/comments/${id}/hide`, { hide })).data,
  remove: async (id: string) => (await api.delete(`/instagram-tools/comments/${id}`)).data,
  setCommentsEnabled: async (mediaId: string, enabled: boolean) => (await api.post(`/instagram-tools/media/${mediaId}/comments-enabled`, { enabled })).data,
  getMessagingProfile: async () => (await api.get<IgMessagingProfile>('/instagram-tools/messaging-profile')).data,
  saveMessagingProfile: async (body: Partial<IgMessagingProfile>) => (await api.put<IgMessagingProfile>('/instagram-tools/messaging-profile', body)).data,
  discover: async (username: string) => (await api.get<IgDiscovery>('/instagram-tools/discover', { params: { username } })).data,
  posts: async () => (await api.get<IgScheduledPost[]>('/instagram-tools/posts')).data,
  createPost: async (body: { mediaType: string; mediaUrl: string; caption?: string; scheduledFor?: string }) => (await api.post<IgScheduledPost>('/instagram-tools/posts', body)).data,
  cancelPost: async (id: string) => (await api.delete(`/instagram-tools/posts/${id}`)).data,
  upload: async (file: File) => { const f = new FormData(); f.append('file', file); return (await api.post<{ url: string }>('/instagram-tools/posts/upload', f)).data.url; },
};
