import type { IgChatbot } from '@/services/instagramService';

export interface DraftMessage { id: string; text: string; buttons: { title: string; url: string }[] }
export interface WorkflowDraft {
  name: string;
  isActive: boolean;
  keywords: string[];
  matchType: 'contains' | 'exact';
  chatWindowMinutes: number;
  messages: DraftMessage[];
}

export type EditTarget = { kind: 'trigger' } | { kind: 'keywords' } | { kind: 'window' } | { kind: 'message'; id: string } | null;

let n = 0;
export const newMessageId = () => `m${Date.now().toString(36)}${n++}`;
export const blankMessage = (): DraftMessage => ({ id: newMessageId(), text: '', buttons: [] });

export const emptyDraft = (): WorkflowDraft => ({ name: 'Untitled Workflow', isActive: false, keywords: [], matchType: 'contains', chatWindowMinutes: 60, messages: [] });

export const draftFromBot = (b: IgChatbot): WorkflowDraft => ({
  name: b.name, isActive: b.isActive, keywords: b.keywords, matchType: b.matchType, chatWindowMinutes: b.chatWindowMinutes,
  messages: (b.messages || []).map(m => ({ id: newMessageId(), text: m.text, buttons: m.buttons || [] })),
});

export const draftIssues = (d: WorkflowDraft) => ({
  keywords: d.keywords.length === 0,
  messages: d.messages.length === 0 || d.messages.some(m => !m.text.trim()),
});

export const minutesLabel = (m: number) => (m % 1440 === 0 ? `${m / 1440} day${m === 1440 ? '' : 's'}` : m % 60 === 0 ? `${m / 60} hour${m === 60 ? '' : 's'}` : `${m} minutes`);
