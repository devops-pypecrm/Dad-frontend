import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { ChevronDown, Clock, Search, SquarePen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { instagramInboxApi, type IgConversation } from '@/services/instagramService';
import { useInstagramConnection } from '@/hooks/useInstagramConnection';
import { useLivePoll } from '@/hooks/useLivePoll';
import { cn } from '@/lib/utils';
import { useNow, windowLeft } from '@/components/WhatsApp/inbox/useNow';
import { IgAvatar } from './IgAvatar';
import { IG } from './ig';

const VIEWS = [{ key: 'all', label: 'All' }, { key: 'mine', label: 'Mine' }, { key: 'unassigned', label: 'Unassigned' }, { key: 'unread', label: 'Unread' }] as const;
const STATUSES = [{ key: 'active', label: 'Open' }, { key: 'pending', label: 'Pending' }, { key: 'resolved', label: 'Resolved' }];

/** Compact "2h" / "3d" like Instagram's DM list. */
const short = (iso: string) => formatDistanceToNowStrict(new Date(iso)).replace(/ seconds?/, 's').replace(/ minutes?/, 'm').replace(/ hours?/, 'h').replace(/ days?/, 'd').replace(/ months?/, 'mo').replace(/ years?/, 'y');

export function IgConversationList({ selectedId, onSelect }: { selectedId: string | null; onSelect: (c: IgConversation) => void }) {
  const [view, setView] = useState<(typeof VIEWS)[number]['key']>('all');
  const [status, setStatus] = useState('active');
  const [search, setSearch] = useState('');
  const now = useNow();
  const poll = useLivePoll(4000, 15000);
  const { data: conn } = useInstagramConnection();

  const { data: counts } = useQuery({ queryKey: ['instagram', 'inbox', 'counts'], queryFn: instagramInboxApi.counts, refetchInterval: poll, refetchIntervalInBackground: false, refetchOnWindowFocus: true });
  const query = useInfiniteQuery({
    queryKey: ['instagram', 'inbox', 'list', view, status, search],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => instagramInboxApi.list({ view, search: search || undefined, cursor: pageParam, status: status === 'active' ? undefined : status }),
    getNextPageParam: last => last.nextCursor ?? undefined,
    refetchInterval: poll, refetchIntervalInBackground: false, refetchOnWindowFocus: true,
  });
  const all = query.data?.pages.flatMap(p => p.conversations) ?? [];
  const conversations = status === 'active' ? all.filter(c => c.status !== 'resolved') : all;

  return (
    <div className="flex h-full flex-col bg-white" style={{ fontFamily: IG.font }}>
      <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-6">
        <button className="flex items-center gap-1.5 text-[20px] font-bold leading-6" style={{ color: IG.text }}>
          {conn?.account?.username || 'Messages'}<ChevronDown className="h-4 w-4" />
        </button>
        <SquarePen className="h-6 w-6" style={{ color: IG.text }} aria-hidden />
      </div>

      <div className="px-5 pb-2">
        <div className="flex h-9 items-center gap-2 rounded-lg px-3" style={{ background: IG.soft }}>
          <Search className="h-4 w-4 shrink-0" style={{ color: IG.sub }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search" className="w-full border-0 bg-transparent text-[14px] outline-none placeholder:text-[#8e8e8e] focus:ring-0" style={{ color: IG.text }} />
        </div>
      </div>

      <div className="flex items-center justify-between px-5 pb-1 pt-2">
        <span className="text-[16px] font-bold" style={{ color: IG.text }}>Messages</span>
        <select value={status} onChange={e => setStatus(e.target.value)} aria-label="Status" className="cursor-pointer border-0 bg-transparent text-[14px] font-semibold outline-none focus:ring-0" style={{ color: IG.blue }}>
          {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto px-5 pb-3 pt-1">
        {VIEWS.map(v => {
          const active = view === v.key;
          const n = counts?.[v.key] ?? 0;
          return (
            <button key={v.key} onClick={() => setView(v.key)} className="shrink-0 rounded-lg px-3 py-1.5 text-[14px] font-semibold transition-colors" style={{ background: active ? IG.text : IG.soft, color: active ? '#fff' : IG.text }}>
              {v.label}{v.key !== 'all' && n > 0 ? ` ${n}` : ''}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {query.isLoading && Array.from({ length: 7 }).map((_, i) => <div key={i} className="flex items-center gap-3 px-5 py-2.5"><Skeleton className="h-14 w-14 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-3/4" /></div></div>)}
        {!query.isLoading && conversations.length === 0 && <p className="px-8 py-12 text-center text-[14px]" style={{ color: IG.sub }}>No messages yet. They show up here when someone messages your account.</p>}

        {conversations.map(c => {
          const name = c.username || c.displayName || 'Instagram user';
          const unread = c.unreadCount > 0;
          const win = windowLeft(c.lastInboundAt, now);
          const selected = selectedId === c.id;
          return (
            <button key={c.id} onClick={() => onSelect(c)} className={cn('flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors', selected ? 'bg-[#efefef]' : 'hover:bg-[#fafafa]')}>
              <IgAvatar src={c.profilePicUrl} name={name} ring={unread} className="h-14 w-14" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] leading-[18px]" style={{ color: IG.text, fontWeight: unread ? 600 : 400 }}>{name}</p>
                <p className="flex items-center gap-1 text-[14px] leading-[18px]" style={{ color: unread ? IG.text : IG.sub, fontWeight: unread ? 600 : 400 }}>
                  <span className="truncate">{c.lastMessageDirection === 'outgoing' ? 'You: ' : ''}{c.lastMessagePreview || '—'}</span>
                  <span className="shrink-0" style={{ color: IG.sub, fontWeight: 400 }}>· {short(c.lastMessageAt)}</span>
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] leading-4" style={{ color: IG.faint }}>
                  {c.assigneeName ? <span>{c.assigneeName}</span> : <span style={{ color: '#ed4956' }}>Unassigned</span>}
                  {win.open && win.msLeft < 3 * 3_600_000 && <span className="inline-flex items-center gap-0.5"><Clock className="h-3 w-3" />{win.label}</span>}
                  {c.status !== 'open' && <span className="capitalize">{c.status}</span>}
                  {c.labels.slice(0, 2).map(l => <span key={l} className="rounded px-1.5" style={{ background: IG.soft }}>{l}</span>)}
                </p>
              </div>
              {unread && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: IG.blue }} aria-label={`${c.unreadCount} unread`} />}
            </button>
          );
        })}
        {query.hasNextPage && <button onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage} className="w-full py-3 text-[14px] font-semibold" style={{ color: IG.blue }}>{query.isFetchingNextPage ? 'Loading…' : 'Load more'}</button>}
      </div>
    </div>
  );
}
