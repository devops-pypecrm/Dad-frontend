import type { PillTone } from './StatusPill';

export const CAMPAIGN_TONE: Record<string, PillTone> = { sent: 'success', sending: 'info', scheduled: 'warning', draft: 'muted', failed: 'danger', cancelled: 'muted' };
