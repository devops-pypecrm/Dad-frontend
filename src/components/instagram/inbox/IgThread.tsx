import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import { AlertCircle, ArrowLeft, Bot, Info, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { instagramInboxApi, type IgMessage } from '@/services/instagramService';
import { apiErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';
import { useNow, windowLeft } from '@/components/WhatsApp/inbox/useNow';
import { useLivePoll } from '@/hooks/useLivePoll';
import { IgAvatar } from './IgAvatar';
import { IG } from './ig';

const dayLabel = (d: Date) => (isToday(d) ? format(d, 'p') : isYesterday(d) ? `Yesterday ${format(d, 'p')}` : format(d, 'dd MMM yyyy, p'));
const SOURCE: Record<string, string> = { chatbot: 'Chatbot', comment_bot: 'Ask to Follow', app: 'Sent from Instagram app' };
const TYPE_LABEL: Record<string, string> = { image: '📷 Photo', video: '🎬 Video', audio: '🎤 Voice message', share: '🔗 Shared a post', story_reply: '↩️ Replied to your story', story_mention: '@ Mentioned you in a story', unsupported: 'Unsupported message' };

function Bubble({ m, last }: { m: IgMessage; last: boolean }) {
  const out = m.direction === 'outgoing';
  const failed = m.status === 'failed';
  const c = m.content || {};
  const style = failed ? { background: IG.red, color: '#fff' } : out ? { background: IG.outgoing, backgroundAttachment: 'fixed', color: '#fff' } : { background: IG.soft, color: IG.text };
  return (
    <div className={cn('flex flex-col', out ? 'items-end' : 'items-start')}>
      <div className="max-w-[75%] rounded-[22px] px-4 py-2.5 text-[15px] leading-[20px]" style={style}>
        {out && m.source && SOURCE[m.source] && <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold opacity-80">{m.source !== 'app' && <Bot className="h-3 w-3" />}{SOURCE[m.source]}</div>}
        {TYPE_LABEL[m.messageType] && <p className="mb-1 text-[13px] opacity-80">{TYPE_LABEL[m.messageType]}</p>}
        {m.messageType === 'image' && c.mediaUrl && <img src={c.mediaUrl} alt="" className="mb-1 max-h-56 rounded-xl" />}
        {c.text && <p className="whitespace-pre-wrap break-words">{c.text}</p>}
        {c.buttons?.map((b, i) => <div key={i} className="mt-2 rounded-full border px-3 py-1 text-center text-[13px] font-semibold" style={{ borderColor: out ? 'rgba(255,255,255,.6)' : IG.line }}>{b.title}</div>)}
      </div>
      {failed && <p className="mt-1 flex items-center gap-1 text-[12px]" style={{ color: IG.red }}><AlertCircle className="h-3.5 w-3.5" />Not delivered{m.errorMessage ? `: ${m.errorMessage}` : ''}</p>}
      {out && last && !failed && <p className="mt-1 text-[12px]" style={{ color: IG.sub }}>{m.status === 'read' ? 'Seen' : 'Sent'}</p>}
    </div>
  );
}

interface Props { conversationId: string; onBack: () => void; onToggleDetails: () => void; detailsOpen: boolean }

export function IgThread({ conversationId, onBack, onToggleDetails, detailsOpen }: Props) {
  const queryClient = useQueryClient();
  const now = useNow();
  const poll = useLivePoll(2000, 10000);
  const live = { refetchInterval: poll, refetchIntervalInBackground: false, refetchOnWindowFocus: true } as const;
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const { data: convo } = useQuery({ queryKey: ['instagram', 'inbox', 'conv', conversationId], queryFn: () => instagramInboxApi.get(conversationId), ...live });
  const { data: thread, isLoading } = useQuery({ queryKey: ['instagram', 'inbox', 'messages', conversationId], queryFn: () => instagramInboxApi.messages(conversationId), ...live });
  const { data: users = [] } = useQuery({ queryKey: ['instagram', 'inbox', 'users'], queryFn: instagramInboxApi.users, staleTime: 5 * 60_000 });
  const messages = useMemo(() => thread?.messages ?? [], [thread]);
  const win = windowLeft(convo?.lastInboundAt ?? null, now);

  const unread = convo?.unreadCount ?? 0;
  useEffect(() => {
    if (unread > 0) instagramInboxApi.read(conversationId).then(() => queryClient.invalidateQueries({ queryKey: ['instagram', 'inbox', 'counts'] })).catch(() => undefined);
  }, [unread, conversationId, queryClient]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, conversationId]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['instagram', 'inbox'] });
  const send = useMutation({ mutationFn: (t: string) => instagramInboxApi.send(conversationId, t), onSuccess: refresh, onError: e => { toast.error(apiErrorMessage(e, 'Message could not be sent')); refresh(); } });
  const update = useMutation({ mutationFn: (b: Parameters<typeof instagramInboxApi.update>[1]) => instagramInboxApi.update(conversationId, b), onSuccess: refresh, onError: e => toast.error(apiErrorMessage(e, 'Could not update conversation')) });

  const submit = () => { const t = text.trim(); if (!t || !win.open || send.isPending) return; send.mutate(t); setText(''); };
  const name = convo ? (convo.username || convo.displayName || 'Instagram user') : '…';

  return (
    <div className="flex h-full flex-col bg-white" style={{ fontFamily: IG.font }}>
      <div className="flex shrink-0 items-center gap-3 border-b px-5 py-3" style={{ borderColor: IG.line }}>
        <button className="md:hidden -ml-1" onClick={onBack} aria-label="Back"><ArrowLeft className="h-6 w-6" style={{ color: IG.text }} /></button>
        <IgAvatar src={convo?.profilePicUrl} name={name} className="h-11 w-11 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold leading-5" style={{ color: IG.text }}>{name}</p>
          <p className="truncate text-[12px]" style={{ color: win.open ? IG.sub : '#b45309' }}>
            {convo?.displayName && convo.username ? `${convo.displayName} · ` : ''}{win.open ? `Reply window ${win.label}` : win.label}
          </p>
        </div>
        <Select value={convo?.assigneeId || 'none'} onValueChange={v => update.mutate({ assigneeId: v === 'none' ? null : v })}>
          <SelectTrigger className="hidden h-8 w-[130px] text-[13px] sm:flex"><SelectValue placeholder="Assign" /></SelectTrigger>
          <SelectContent><SelectItem value="none">Unassigned</SelectItem>{users.map(u => <SelectItem key={u.id} value={u.id}>{`${u.firstName} ${u.lastName || ''}`.trim()}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={convo?.status || 'open'} onValueChange={v => update.mutate({ status: v })}>
          <SelectTrigger className="h-8 w-[105px] text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent>
        </Select>
        <button onClick={onToggleDetails} aria-label="Details" className="p-1"><Info className="h-6 w-6" style={{ color: detailsOpen ? IG.blue : IG.text }} strokeWidth={detailsOpen ? 2.5 : 2} /></button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-5 py-4">
        {isLoading && <p className="text-center text-[12px]" style={{ color: IG.sub }}>Loading messages…</p>}
        {convo && (
          <div className="flex flex-col items-center gap-1 pb-6 pt-4 text-center">
            <IgAvatar src={convo.profilePicUrl} name={name} className="h-24 w-24" />
            <p className="mt-2 text-[20px] font-semibold" style={{ color: IG.text }}>{convo.displayName || name}</p>
            {convo.username && <p className="text-[14px]" style={{ color: IG.sub }}>{convo.username} · Instagram</p>}
          </div>
        )}
        {messages.map((m, i) => {
          const d = new Date(m.createdAt);
          const showDay = i === 0 || !isSameDay(d, new Date(messages[i - 1].createdAt));
          const lastOut = m.direction === 'outgoing' && !messages.slice(i + 1).some(x => x.direction === 'outgoing');
          return <div key={m.id}>{showDay && <p className="my-3 text-center text-[12px]" style={{ color: IG.sub }}>{dayLabel(d)}</p>}<Bubble m={m} last={lastOut} /></div>;
        })}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 p-4">
        {!win.open ? (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-[13px]" style={{ background: IG.panel, border: `1px solid ${IG.line}`, color: IG.sub }}>
            <Lock className="h-4 w-4 shrink-0" /> <span><strong style={{ color: IG.text }}>24-hour window closed.</strong> Instagram only lets you reply within 24 hours of their last message.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full border px-4 py-2" style={{ borderColor: IG.line }}>
            <input value={text} maxLength={1000} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }} placeholder="Message..." className="ig-bare min-w-0 flex-1 text-[14px] placeholder:text-[#8e8e8e]" style={{ color: IG.text }} />
            {text.trim() && <button onClick={submit} disabled={send.isPending} className="text-[14px] font-semibold disabled:opacity-50" style={{ color: IG.blue }}>Send</button>}
          </div>
        )}
      </div>
    </div>
  );
}
