import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import { ArrowLeft, Clock, FileText, Info, Lock, Paperclip, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { inboxApi, type WaMessage } from '@/services/whatsAppHubService';
import { apiErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';
import TemplatePicker from '../TemplatePicker';
import { WA_PRIMARY_BTN, WA_OUTLINE_BTN } from '../hub/whatsappStyles';
import { MessageBubble } from './MessageBubble';
import { useNow, windowLeft } from './useNow';

const dayLabel = (d: Date) => (isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'dd MMM yyyy'));

interface Props { conversationId: string; onBack: () => void; onToggleDetails: () => void; detailsOpen: boolean }

export function ThreadPanel({ conversationId, onBack, onToggleDetails, detailsOpen }: Props) {
  const queryClient = useQueryClient();
  const now = useNow();
  const [text, setText] = useState('');
  const [pickingTemplate, setPickingTemplate] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: convo } = useQuery({ queryKey: ['whatsapp', 'inbox', 'conv', conversationId], queryFn: () => inboxApi.get(conversationId) });
  const { data: threadData, isLoading } = useQuery({ queryKey: ['whatsapp', 'inbox', 'messages', conversationId], queryFn: () => inboxApi.messages(conversationId) });
  const { data: users = [] } = useQuery({ queryKey: ['whatsapp', 'inbox', 'users'], queryFn: inboxApi.users, staleTime: 5 * 60_000 });
  const { data: quickReplies = [] } = useQuery({ queryKey: ['whatsapp', 'inbox', 'quick-replies'], queryFn: inboxApi.quickReplies, staleTime: 5 * 60_000 });

  const messages: WaMessage[] = useMemo(() => threadData?.messages ?? [], [threadData]);
  const win = windowLeft(convo?.lastInboundAt ?? null, now);

  // mark as read when opened / when new inbound arrives while open
  const unread = convo?.unreadCount ?? 0;
  useEffect(() => {
    if (unread > 0) {
      inboxApi.read(conversationId).then(() => queryClient.invalidateQueries({ queryKey: ['whatsapp', 'inbox', 'counts'] })).catch(() => undefined);
    }
  }, [unread, conversationId, queryClient]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, conversationId]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['whatsapp', 'inbox'] });

  const send = useMutation({
    mutationFn: (body: Parameters<typeof inboxApi.send>[1]) => inboxApi.send(conversationId, body),
    onSuccess: refresh,
    onError: (err) => { toast.error(apiErrorMessage(err, 'Message could not be sent')); refresh(); },
  });
  const update = useMutation({
    mutationFn: (body: Parameters<typeof inboxApi.update>[1]) => inboxApi.update(conversationId, body),
    onSuccess: refresh,
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not update conversation')),
  });

  const submitText = () => {
    const t = text.trim();
    if (!t || !win.open || send.isPending) return;
    send.mutate({ text: t });
    setText('');
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !win.open) return;
    try {
      const up = await inboxApi.uploadMedia(file);
      const kind = file.type.split('/')[0];
      send.mutate({ media: { type: ['image', 'video', 'audio'].includes(kind) ? kind : 'document', mediaId: up.id, filename: file.name } });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Upload failed'));
    }
  };

  const slash = text.startsWith('/') ? text.slice(1).toLowerCase() : null;
  const suggestions = slash !== null ? quickReplies.filter(q => q.shortcut.includes(slash)).slice(0, 5) : [];

  const name = convo?.displayName || (convo ? `+${convo.phoneNumber}` : '…');

  return (
    <div className="flex flex-col h-full bg-[#f6f6f4]">
      {/* header */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-border">
        <Button variant="ghost" size="icon" className="md:hidden -ml-2" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="h-10 w-10 shrink-0 rounded-full bg-[hsl(var(--chart-5))]/15 text-[hsl(var(--chart-5))] flex items-center justify-center font-medium font-poppins">
          {name.replace('+', '').charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium font-poppins text-black">{name}</p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            {convo && `+${convo.phoneNumber}`}
            <span className={cn('inline-flex items-center gap-0.5', win.open ? 'text-emerald-600' : 'text-amber-600')}>
              <Clock className="h-3 w-3" />{win.label}
            </span>
          </p>
        </div>

        <Select value={convo?.assigneeId || 'none'} onValueChange={v => update.mutate({ assigneeId: v === 'none' ? null : v })}>
          <SelectTrigger className="h-8 w-[130px] rounded-[10px] text-xs hidden sm:flex"><SelectValue placeholder="Assign" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Unassigned</SelectItem>
            {users.map(u => <SelectItem key={u.id} value={u.id}>{`${u.firstName} ${u.lastName || ''}`.trim()}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={convo?.status || 'open'} onValueChange={v => update.mutate({ status: v })}>
          <SelectTrigger className="h-8 w-[105px] rounded-[10px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className={cn(detailsOpen && 'bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))]')} onClick={onToggleDetails} aria-label="Conversation details">
          <Info className="h-5 w-5" />
        </Button>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {isLoading && <p className="text-center text-xs text-muted-foreground">Loading messages…</p>}
        {messages.map((m, i) => {
          const d = new Date(m.createdAt);
          const showDay = i === 0 || !isSameDay(d, new Date(messages[i - 1].createdAt));
          return (
            <div key={m.id}>
              {showDay && <div className="my-3 text-center"><span className="rounded-full bg-white/80 border border-border px-3 py-0.5 text-[11px] text-muted-foreground">{dayLabel(d)}</span></div>}
              <MessageBubble m={m} />
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* composer */}
      <div className="bg-white border-t border-border p-3">
        {convo?.optedOut && (
          <p className="mb-2 flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
            <Lock className="h-3.5 w-3.5" /> This contact opted out of messages. You can reply only while their 24-hour window is open.
          </p>
        )}

        {!win.open ? (
          <div className="flex items-center justify-between gap-3 rounded-[10px] border border-amber-300/60 bg-amber-50 px-3 py-2.5">
            <p className="text-xs text-amber-800 font-poppins">
              <strong>24-hour window closed.</strong> WhatsApp only lets you start a conversation with an approved template.
            </p>
            <Button size="sm" className={WA_PRIMARY_BTN} onClick={() => setPickingTemplate(true)}><FileText className="h-4 w-4 mr-1.5" />Send template</Button>
          </div>
        ) : (
          <div className="relative">
            {suggestions.length > 0 && (
              <div className="absolute bottom-full mb-2 left-0 right-0 rounded-[10px] border border-border bg-white shadow-lg overflow-hidden">
                {suggestions.map(q => (
                  <button key={q.id} className="w-full text-left px-3 py-2 hover:bg-muted/60" onClick={() => setText(q.body)}>
                    <span className="text-xs font-semibold text-[hsl(var(--chart-5))]">/{q.shortcut}</span>
                    <p className="text-xs text-muted-foreground truncate">{q.body}</p>
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2">
              <input ref={fileRef} type="file" className="hidden" onChange={onFile} />
              <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()} aria-label="Attach file"><Paperclip className="h-5 w-5" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setPickingTemplate(true)} aria-label="Send template"><FileText className="h-5 w-5" /></Button>
              <Textarea
                rows={1}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitText(); } }}
                placeholder="Type a message — or / for quick replies"
                className="min-h-[40px] max-h-32 resize-none rounded-[10px]"
              />
              <Button className={WA_PRIMARY_BTN} onClick={submitText} disabled={!text.trim() || send.isPending} aria-label="Send"><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
        {win.open && <div className="mt-1.5 flex justify-end"><Button variant="outline" size="sm" className={cn('h-6 text-[11px]', WA_OUTLINE_BTN)} onClick={() => update.mutate({ status: 'resolved' })}>Mark resolved</Button></div>}
      </div>

      {pickingTemplate && (
        <TemplatePicker
          onClose={() => setPickingTemplate(false)}
          onSelect={(tpl, variables) => {
            setPickingTemplate(false);
            const values = Object.keys(variables).sort((a, b) => Number(a) - Number(b)).map(k => variables[k]);
            send.mutate({ template: { name: tpl.name, language: tpl.language, values } });
          }}
        />
      )}
    </div>
  );
}
