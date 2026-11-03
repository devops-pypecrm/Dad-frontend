import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { Check, Filter, Search, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { instagramInboxApi, type IgConversation } from '@/services/instagramService';
import { useInstagramConnection } from '@/hooks/useInstagramConnection';
import { useLivePoll } from '@/hooks/useLivePoll';
import { cn } from '@/lib/utils';
import { IgAvatar } from './IgAvatar';
import { IG } from './ig';
import { isAdmin } from '@/lib/utils';

const VIEWS = [
  { key: 'all', label: 'All' },
  { key: 'mine', label: 'Mine' },
  { key: 'unassigned', label: 'Unassigned' },
  { key: 'unread', label: 'Unread' },
] as const;

const short = (iso: string) => formatDistanceToNowStrict(new Date(iso))
  .replace(/ seconds?/, 's').replace(/ minutes?/, 'm').replace(/ hours?/, 'h')
  .replace(/ days?/, 'd').replace(/ months?/, 'mo').replace(/ years?/, 'y');

export function IgConversationList({ selectedId, onSelect }: { selectedId: string | null; onSelect: (c: IgConversation) => void }) {
  const [view, setView] = useState<(typeof VIEWS)[number]['key']>('all');
  const [search, setSearch] = useState('');
  const [assigneeId, setAssigneeId] = useState('all');
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('userInfo') || 'null'); } catch { return null; } })();
  const canFilterAssignee = isAdmin(currentUser);
  const poll = useLivePoll(4000, 15000);
  const { data: conn } = useInstagramConnection();
  const { data: users = [] } = useQuery({ queryKey: ['instagram', 'inbox', 'users'], queryFn: instagramInboxApi.users, enabled: canFilterAssignee });
  const selectedAssignee = canFilterAssignee && assigneeId !== 'all' ? assigneeId : undefined;
  const { data: counts } = useQuery({ queryKey: ['instagram', 'inbox', 'counts', selectedAssignee], queryFn: () => instagramInboxApi.counts(selectedAssignee), refetchInterval: poll, refetchIntervalInBackground: false, refetchOnWindowFocus: true });
  const query = useInfiniteQuery({
    queryKey: ['instagram', 'inbox', 'list', view, 'open', search, selectedAssignee],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => instagramInboxApi.list({ view, status: 'open', search: search || undefined, assigneeId: selectedAssignee, cursor: pageParam }),
    getNextPageParam: last => last.nextCursor ?? undefined,
    refetchInterval: poll,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
  const conversations = query.data?.pages.flatMap(page => page.conversations) ?? [];

  return (
    <div className="flex h-full flex-col bg-background" style={{ fontFamily: IG.font }}>
      <div className="flex h-[72px] shrink-0 items-center px-6">
        <h2 className="text-[20px] font-bold leading-6" style={{ color: IG.text }}>
          {conn?.account?.username || 'Messages'}
        </h2>
      </div>

      <div className="px-6 pb-3">
        <div className="flex items-center gap-2">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-lg px-4 transition-colors" style={{ background: IG.soft }}>
            <Search className="h-4 w-4 shrink-0 text-[#8e8e8e]" strokeWidth={2} />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') { setSearch(''); e.currentTarget.blur(); } }}
              placeholder="Search"
              aria-label="Search conversations"
              autoComplete="off"
              className="ig-bare h-full min-w-0 flex-1 appearance-none text-[14px] placeholder:text-[#8e8e8e] focus:ring-0 [&::-webkit-search-cancel-button]:hidden"
              style={{ color: IG.text }}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c7c7c7] text-white hover:bg-[#a8a8a8]">
                <X className="h-3 w-3" strokeWidth={3} />
              </button>
            )}
          </label>
          {canFilterAssignee && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" aria-label="Filter by assignee" title="Filter by assignee" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-accent" style={{ color: IG.text, background: assigneeId === 'all' ? 'transparent' : IG.soft }}>
                  <Filter className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Assigned to</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setAssigneeId('all')} className="cursor-pointer"><span className="flex-1">All assignees</span>{assigneeId === 'all' && <Check className="h-4 w-4" />}</DropdownMenuItem>
                {users.map(user => {
                  const name = `${user.firstName} ${user.lastName || ''}`.trim();
                  return <DropdownMenuItem key={user.id} onClick={() => setAssigneeId(user.id)} className="cursor-pointer"><span className="flex-1 truncate">{name}</span>{assigneeId === user.id && <Check className="h-4 w-4" />}</DropdownMenuItem>;
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex items-center px-6 pb-2">
        <h3 className="text-[18px] font-semibold" style={{ color: IG.text }}>Messages</h3>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b px-6 pb-3 scrollbar-thin" style={{ borderColor: IG.line }}>
        {VIEWS.map(item => {
          const active = view === item.key;
          const count = counts?.[item.key] ?? 0;
          return (
            <button key={item.key} onClick={() => setView(item.key)} className="shrink-0 rounded-lg px-3 py-2 text-[14px] font-semibold transition-colors" style={{ background: active ? IG.text : IG.soft, color: active ? 'var(--ig-panel)' : IG.text }}>
              {item.label}{item.key !== 'all' && count > 0 ? ` ${count}` : ''}
            </button>
          );
        })}
      </div>

      <div className="scrollbar-hide flex-1 overflow-y-auto py-2">
        {query.isLoading && Array.from({ length: 7 }).map((_, i) => <div key={i} className="flex items-center gap-3 px-6 py-2"><Skeleton className="h-14 w-14 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-3/4" /></div></div>)}
        {!query.isLoading && conversations.length === 0 && <p className="px-8 py-12 text-center text-[14px]" style={{ color: IG.sub }}>{search ? `No results for “${search}”` : 'No messages yet.'}</p>}
        {conversations.map(conversation => {
          const name = conversation.username || conversation.displayName || 'Instagram user';
          const unread = conversation.unreadCount > 0;
          return (
            <button key={conversation.id} onClick={() => onSelect(conversation)} className="flex w-full items-center gap-3 px-6 py-2 text-left transition-colors hover:bg-accent" style={{ background: selectedId === conversation.id ? IG.soft : undefined }}>
              <IgAvatar src={conversation.profilePicUrl} name={name} ring={unread} className="h-14 w-14" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] leading-[18px]" style={{ color: IG.text, fontWeight: unread ? 600 : 400 }}>{name}</p>
                <p className="flex items-center gap-1 text-[14px] leading-[18px]" style={{ color: unread ? IG.text : IG.sub, fontWeight: unread ? 600 : 400 }}>
                  <span className="truncate">{conversation.lastMessageDirection === 'outgoing' ? 'You: ' : ''}{conversation.lastMessagePreview || 'Message'}</span>
                  <span className="shrink-0 font-normal" style={{ color: IG.sub }}>· {short(conversation.lastMessageAt)}</span>
                </p>
                {conversation.assigneeName && <p className="truncate text-[12px] leading-[17px]" style={{ color: IG.sub }}>{conversation.assigneeName}</p>}
              </div>
              {unread && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: IG.blue }} aria-label={`${conversation.unreadCount} unread`} />}
            </button>
          );
        })}
        {query.hasNextPage && <button onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage} className="w-full py-3 text-[14px] font-semibold" style={{ color: IG.blue }}>{query.isFetchingNextPage ? 'Loading…' : 'Load more'}</button>}
      </div>
    </div>
  );
}
