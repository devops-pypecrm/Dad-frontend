import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import { AlertCircle, ArrowLeft, Bot, Check, CheckCheck, Clock, Info, Lock, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { instagramInboxApi, type IgMessage } from '@/services/instagramService';
import { apiErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';
import { WA_PRIMARY_BTN } from '@/components/WhatsApp/hub/whatsappStyles';
import { useNow, windowLeft } from '@/components/WhatsApp/inbox/useNow';
import { IgAvatar } from './IgAvatar';
import { useLivePoll } from '@/hooks/useLivePoll';

const dayLabel = (d: Date) => (isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'dd MMM yyyy'));
const SOURCE: Record<string, string> = { chatbot: 'Chatbot', comment_bot: 'Ask to Follow', app: 'Sent from Instagram app' };
const TYPE_LABEL: Record<string, string> = { image: '📷 Photo', video: '🎬 Video', audio: '🎤 Voice message', share: '🔗 Shared a post', story_reply: '↩️ Replied to your story', story_mention: '@ Mentioned you in a story', unsupported: 'Unsupported message' };

function Bubble({ m }: { m: IgMessage }) {
  const out = m.direction === 'outgoing';
  const c = m.content || {};
  return (
    <div className={cn('flex', out ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[82%] md:max-w-[68%] rounded-2xl px-3.5 py-2.5 shadow-sm text-sm', out ? 'bg-[hsl(var(--chart-5))] text-white rounded-br-md' : 'bg-white text-foreground border border-border rounded-bl-md', m.status === 'failed' && 'bg-red-500 text-white')}>
        {out && m.source && SOURCE[m.source] && <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide opacity-80 mb-1">{m.source !== 'app' && <Bot className="h-3 w-3" />}{SOURCE[m.source]}</div>}
        {TYPE_LABEL[m.messageType] && <p className="text-xs opacity-80 mb-1">{TYPE_LABEL[m.messageType]}</p>}
        {m.messageType === 'image' && c.mediaUrl && <img src={c.mediaUrl} alt="" className="mb-1 max-h-56 rounded-lg" />}
        {c.text && <p className="whitespace-pre-wrap break-words">{c.text}</p>}
        {c.buttons?.map((b, i) => <div key={i} className={cn('mt-2 rounded-md px-2 py-1 text-center text-xs font-medium', out ? 'bg-white/20' : 'bg-muted')}>{b.title}</div>)}
        {m.status === 'failed' && m.errorMessage && <p className="mt-1 text-[11px] opacity-90">Not delivered: {m.errorMessage}</p>}
        <div className={cn('mt-1 flex items-center justify-end gap-1 text-[10px]', out ? 'opacity-80' : 'text-muted-foreground')}>
          {format(new Date(m.createdAt), 'HH:mm')}
          {out && (m.status === 'failed' ? <AlertCircle className="h-3.5 w-3.5" /> : m.status === 'read' ? <CheckCheck className="h-3.5 w-3.5 text-sky-200" /> : <Check className="h-3.5 w-3.5 opacity-80" />)}
        </div>
      </div>
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
  const name = convo ? (convo.username ? `@${convo.username}` : convo.displayName || 'Instagram user') : '…';

  return (
    <div className="flex flex-col h-full bg-[#f6f6f4]">
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-border">
        <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <IgAvatar src={convo?.profilePicUrl} name={name} className="h-10 w-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium font-poppins text-black">{name}</p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            {convo?.displayName && convo.username ? convo.displayName : 'Instagram'}
            <span className={cn('inline-flex items-center gap-0.5', win.open ? 'text-emerald-600' : 'text-amber-600')}><Clock className="h-3 w-3" />{win.label}</span>
          </p>
        </div>
        <Select value={convo?.assigneeId || 'none'} onValueChange={v => update.mutate({ assigneeId: v === 'none' ? null : v })}>
          <SelectTrigger className="h-8 w-[130px] rounded-[10px] text-xs hidden sm:flex"><SelectValue placeholder="Assign" /></SelectTrigger>
          <SelectContent><SelectItem value="none">Unassigned</SelectItem>{users.map(u => <SelectItem key={u.id} value={u.id}>{`${u.firstName} ${u.lastName || ''}`.trim()}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={convo?.status || 'open'} onValueChange={v => update.mutate({ status: v })}>
          <SelectTrigger className="h-8 w-[105px] rounded-[10px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className={cn(detailsOpen && 'bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))]')} onClick={onToggleDetails} aria-label="Details"><Info className="h-5 w-5" /></Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {isLoading && <p className="text-center text-xs text-muted-foreground">Loading messages…</p>}
        {messages.map((m, i) => {
          const d = new Date(m.createdAt);
          const showDay = i === 0 || !isSameDay(d, new Date(messages[i - 1].createdAt));
          return <div key={m.id}>{showDay && <div className="my-3 text-center"><span className="rounded-full bg-white/80 border border-border px-3 py-0.5 text-[11px] text-muted-foreground">{dayLabel(d)}</span></div>}<Bubble m={m} /></div>;
        })}
        <div ref={endRef} />
      </div>

      <div className="bg-white border-t border-border p-3">
        {!win.open ? (
          <div className="flex items-center gap-2 rounded-[10px] border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 font-poppins">
            <Lock className="h-4 w-4 shrink-0" /> <span><strong>24-hour window closed.</strong> Instagram only lets you reply within 24 hours of their last message. You can reply again when they message you.</span>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <Textarea rows={1} value={text} maxLength={1000} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }} placeholder="Type a message…" className="min-h-[40px] max-h-32 resize-none rounded-[10px]" />
            <Button className={WA_PRIMARY_BTN} onClick={submit} disabled={!text.trim() || send.isPending} aria-label="Send"><Send className="h-4 w-4" /></Button>
          </div>
        )}
      </div>
    </div>
  );
}
