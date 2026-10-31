import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { format, isToday, isYesterday } from 'date-fns';
import { Clock, MessageSquarePlus, Search, SlidersHorizontal, UserRound } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { inboxApi, type WaConversation } from '@/services/whatsAppHubService';
import { useLivePoll } from '@/hooks/useLivePoll';
import { useWhatsAppConnection } from '@/hooks/useWhatsAppConnection';
import { WhatsAppLogo } from '@/components/icons/BrandLogos';
import { cn } from '@/lib/utils';
import { WaAvatar } from './WaAvatar';
import { Ticks } from './MessageBubble';
import { WA } from './wa';
import { windowLeft, useNow } from './useNow';

const VIEWS = [{ key: 'all', label: 'All' }, { key: 'unread', label: 'Unread' }, { key: 'mine', label: 'Mine' }, { key: 'unassigned', label: 'Unassigned' }] as const;

const stamp = (iso: string) => {
  const d = new Date(iso);
  return isToday(d) ? format(d, 'h:mm a').toLowerCase() : isYesterday(d) ? 'Yesterday' : format(d, 'dd/MM/yyyy');
};

interface Props { selectedId: string | null; onSelect: (c: WaConversation) => void; onNewChat: () => void }

export function ConversationListPanel({ selectedId, onSelect, onNewChat }: Props) {
  const [view, setView] = useState<(typeof VIEWS)[number]['key']>('all');
  const [status, setStatus] = useState('active');
  const [label, setLabel] = useState('all');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(false);
  const now = useNow();
  const poll = useLivePoll(4000, 15000);
  const { data: conn } = useWhatsAppConnection();

  const { data: counts } = useQuery({ queryKey: ['whatsapp', 'inbox', 'counts'], queryFn: inboxApi.counts, refetchInterval: poll, refetchIntervalInBackground: false, refetchOnWindowFocus: true });
  const { data: labels = [] } = useQuery({ queryKey: ['whatsapp', 'inbox', 'labels'], queryFn: inboxApi.labels });

  const query = useInfiniteQuery({
    queryKey: ['whatsapp', 'inbox', 'list', view, status, label, search],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => inboxApi.list({
      view, search: search || undefined, cursor: pageParam,
      status: status === 'active' ? undefined : status,
      label: label === 'all' ? undefined : label,
    }),
    getNextPageParam: last => last.nextCursor ?? undefined,
    refetchInterval: poll, refetchIntervalInBackground: false, refetchOnWindowFocus: true,
  });

  const all = query.data?.pages.flatMap(p => p.conversations) ?? [];
  const conversations = status === 'active' ? all.filter(c => c.status !== 'resolved') : all;

  return (
    <div className="flex h-full flex-col bg-white" style={{ fontFamily: WA.font }}>
      {/* header */}
      <div className="flex h-[59px] shrink-0 items-center justify-between px-4" style={{ background: WA.panel }}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white" style={{ background: WA.green }}><WhatsAppLogo className="h-6 w-6" /></div>
          <div className="min-w-0">
            <p className="truncate text-[16px] font-medium leading-5" style={{ color: WA.text }}>Team Inbox</p>
            <p className="truncate text-[12px] leading-4" style={{ color: WA.sub }}>{conn?.phoneNumber || 'WhatsApp Business'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1" style={{ color: WA.icon }}>
          <button onClick={() => setFilters(f => !f)} className={cn('rounded-full p-2 hover:bg-black/5', filters && 'bg-black/10')} aria-label="Filters"><SlidersHorizontal className="h-5 w-5" /></button>
          <button onClick={onNewChat} className="rounded-full p-2 hover:bg-black/5" aria-label="New chat"><MessageSquarePlus className="h-5 w-5" /></button>
        </div>
      </div>

      {/* search */}
      <div className="px-3 py-[7px]">
        <div className="flex h-[35px] items-center gap-5 rounded-lg px-3" style={{ background: WA.panel }}>
          <Search className="h-4 w-4 shrink-0" style={{ color: WA.icon }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search or start a new chat" className="w-full border-0 bg-transparent text-[14px] outline-none placeholder:text-[#667781] focus:ring-0" style={{ color: WA.text }} />
        </div>
      </div>

      {/* filter pills */}
      <div className="flex gap-2 overflow-x-auto px-3 pb-2 pt-1">
        {VIEWS.map(v => {
          const active = view === v.key;
          const n = counts?.[v.key as keyof typeof counts] ?? 0;
          return (
            <button key={v.key} onClick={() => setView(v.key)} className="shrink-0 rounded-full px-3 py-[5px] text-[14px] transition-colors" style={{ background: active ? '#d9fdd3' : WA.panel, color: active ? WA.greenDark : WA.sub, fontWeight: active ? 500 : 400 }}>
              {v.label}{v.key !== 'all' && n > 0 ? ` ${n}` : ''}
            </button>
          );
        })}
      </div>

      {filters && (
        <div className="flex gap-2 px-3 pb-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 rounded-full border-0 text-[13px] shadow-none" style={{ background: WA.panel }}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="active">Open &amp; pending</SelectItem><SelectItem value="open">Open</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent>
          </Select>
          <Select value={label} onValueChange={setLabel}>
            <SelectTrigger className="h-8 rounded-full border-0 text-[13px] shadow-none" style={{ background: WA.panel }}><SelectValue placeholder="Label" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All labels</SelectItem>{labels.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}

      {/* list */}
      <div className="flex-1 overflow-y-auto">
        {query.isLoading && Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex gap-3 px-3 py-3"><Skeleton className="h-[49px] w-[49px] rounded-full" /><div className="flex-1 space-y-2 pt-1"><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-3/4" /></div></div>
        ))}
        {!query.isLoading && conversations.length === 0 && <p className="px-6 py-12 text-center text-[14px]" style={{ color: WA.sub }}>No chats here yet. Start one with the new-chat button above.</p>}

        {conversations.map(c => {
          const name = c.displayName || `+${c.phoneNumber}`;
          const win = windowLeft(c.lastInboundAt, now);
          const hasUnread = c.unreadCount > 0;
          const selected = selectedId === c.id;
          return (
            <button key={c.id} onClick={() => onSelect(c)} className="group flex w-full items-stretch pl-3 text-left" style={{ background: selected ? WA.selected : undefined }}
              onMouseEnter={e => { if (!selected) e.currentTarget.style.background = WA.hover; }} onMouseLeave={e => { if (!selected) e.currentTarget.style.background = ''; }}>
              <div className="flex items-center py-[11px] pr-[15px]"><WaAvatar name={name} className="h-[49px] w-[49px] text-[24px]" /></div>
              <div className="min-w-0 flex-1 border-b py-[10px] pr-4" style={{ borderColor: WA.line }}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[17px] leading-[21px]" style={{ color: WA.text }}>{name}</span>
                  <span className="shrink-0 text-[12px]" style={{ color: hasUnread ? WA.unread : WA.sub }}>{stamp(c.lastMessageAt)}</span>
                </div>
                <div className="mt-[2px] flex items-center justify-between gap-2">
                  <p className="flex min-w-0 items-center gap-1 text-[14px] leading-[20px]" style={{ color: hasUnread ? WA.text : WA.sub }}>
                    {c.lastMessageDirection === 'outgoing' && <Ticks status="delivered" className="shrink-0" />}
                    <span className="truncate">{c.lastMessagePreview || '—'}</span>
                  </p>
                  {hasUnread && <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full px-[5px] text-[12px] font-medium text-white" style={{ background: WA.unread }}>{c.unreadCount}</span>}
                </div>
                <div className="mt-[3px] flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px]" style={{ color: WA.sub }}>
                  {c.assigneeName ? <span className="inline-flex items-center gap-0.5"><UserRound className="h-3 w-3" />{c.assigneeName}</span> : <span style={{ color: '#d9822b' }}>Unassigned</span>}
                  {win.open && win.msLeft < 3 * 3_600_000 && <span className="inline-flex items-center gap-0.5" style={{ color: '#d9822b' }}><Clock className="h-3 w-3" />{win.label}</span>}
                  {c.status !== 'open' && <span className="capitalize">{c.status}</span>}
                  {c.labels.slice(0, 2).map(l => <span key={l} className="rounded px-1.5" style={{ background: WA.panel }}>{l}</span>)}
                </div>
              </div>
            </button>
          );
        })}
        {query.hasNextPage && <button onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage} className="w-full py-3 text-[13px]" style={{ color: WA.greenDark }}>{query.isFetchingNextPage ? 'Loading…' : 'Load more chats'}</button>}
      </div>
    </div>
  );
}
