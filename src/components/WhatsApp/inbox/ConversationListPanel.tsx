import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { Search, Clock, UserRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { inboxApi, type WaConversation } from '@/services/whatsAppHubService';
import { cn } from '@/lib/utils';
import { windowLeft, useNow } from './useNow';

const VIEWS = [
  { key: 'all', label: 'All' },
  { key: 'mine', label: 'Mine' },
  { key: 'unassigned', label: 'Unassigned' },
  { key: 'unread', label: 'Unread' },
] as const;

const STATUS_DOT: Record<string, string> = { open: 'bg-emerald-500', pending: 'bg-amber-500', resolved: 'bg-muted-foreground/40' };

interface Props { selectedId: string | null; onSelect: (c: WaConversation) => void }

export function ConversationListPanel({ selectedId, onSelect }: Props) {
  const [view, setView] = useState<(typeof VIEWS)[number]['key']>('all');
  const [status, setStatus] = useState('active');
  const [label, setLabel] = useState('all');
  const [search, setSearch] = useState('');
  const now = useNow();

  const { data: counts } = useQuery({ queryKey: ['whatsapp', 'inbox', 'counts'], queryFn: inboxApi.counts });
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
  });

  const all = query.data?.pages.flatMap(p => p.conversations) ?? [];
  const conversations = status === 'active' ? all.filter(c => c.status !== 'resolved') : all;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 space-y-2.5 border-b border-border pb-3">
        <div className="flex gap-1 rounded-[10px] bg-muted/60 p-1">
          {VIEWS.map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={cn(
                'flex-1 rounded-lg px-2 py-1.5 text-xs font-medium font-poppins transition-colors',
                view === v.key ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {v.label}
              {counts && counts[v.key] > 0 && (
                <span className={cn('ml-1 rounded-full px-1.5 text-[10px]', v.key === 'unread' ? 'bg-[hsl(var(--chart-5))] text-white' : 'bg-muted-foreground/15')}>{counts[v.key]}</span>
              )}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 h-9 rounded-[10px]" placeholder="Search name, number or message" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 rounded-[10px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Open &amp; pending</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={label} onValueChange={setLabel}>
            <SelectTrigger className="h-8 rounded-[10px] text-xs"><SelectValue placeholder="Label" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All labels</SelectItem>
              {labels.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {query.isLoading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 p-3"><Skeleton className="h-11 w-11 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-3/4" /></div></div>
        ))}

        {!query.isLoading && conversations.length === 0 && (
          <div className="p-10 text-center text-sm font-poppins text-muted-foreground">No conversations match these filters.</div>
        )}

        {conversations.map(c => {
          const name = c.displayName || `+${c.phoneNumber}`;
          const win = windowLeft(c.lastInboundAt, now);
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className={cn(
                'w-full flex gap-3 px-3 py-3 text-left border-b border-border/60 transition-colors hover:bg-[hsl(var(--chart-5))]/5',
                selectedId === c.id && 'bg-[hsl(var(--chart-5))]/10'
              )}
            >
              <div className="relative shrink-0">
                <div className="h-11 w-11 rounded-full bg-[hsl(var(--chart-5))]/15 text-[hsl(var(--chart-5))] flex items-center justify-center font-medium font-poppins">
                  {name.replace('+', '').charAt(0).toUpperCase()}
                </div>
                <span className={cn('absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white', STATUS_DOT[c.status])} title={c.status} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn('truncate text-sm font-poppins', c.unreadCount > 0 ? 'font-semibold text-black' : 'font-medium')}>{name}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{formatDistanceToNowStrict(new Date(c.lastMessageAt))}</span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className={cn('truncate text-xs', c.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground')}>
                    {c.lastMessageDirection === 'outgoing' && <span className="opacity-70">You: </span>}{c.lastMessagePreview || '—'}
                  </p>
                  {c.unreadCount > 0 && (
                    <span className="shrink-0 min-w-[18px] rounded-full bg-[hsl(var(--chart-5))] px-1.5 text-center text-[10px] font-bold text-white">{c.unreadCount}</span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {c.assigneeName
                    ? <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><UserRound className="h-3 w-3" />{c.assigneeName}</span>
                    : <span className="text-[10px] text-amber-600 font-medium">Unassigned</span>}
                  {win.open && win.msLeft < 3 * 3_600_000 && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600"><Clock className="h-3 w-3" />{win.label}</span>
                  )}
                  {c.labels.slice(0, 2).map(l => <span key={l} className="rounded-full bg-muted px-1.5 py-px text-[10px]">{l}</span>)}
                </div>
              </div>
            </button>
          );
        })}

        {query.hasNextPage && (
          <button onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage} className="w-full py-3 text-xs font-poppins text-[hsl(var(--chart-5))] hover:underline">
            {query.isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  );
}
