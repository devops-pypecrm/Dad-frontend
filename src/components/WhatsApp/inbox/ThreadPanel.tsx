import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isSameDay, isToday, isYesterday } from 'date-fns';
import { ArrowLeft, FileText, Image as ImageIcon, Info, Lock, Paperclip, Plus, Send, Smile } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { inboxApi, type WaMessage } from '@/services/whatsAppHubService';
import { apiErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';
import { useLivePoll } from '@/hooks/useLivePoll';
import TemplatePicker from '../TemplatePicker';
import { MessageBubble } from './MessageBubble';
import { EmojiPicker } from './EmojiPicker';
import { WaAvatar } from './WaAvatar';
import { CHAT_WALLPAPER, WA } from './wa';
import { useNow, windowLeft } from './useNow';

const dayLabel = (d: Date) => (isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'd MMMM yyyy'));

const pillSelect = 'h-8 gap-1 rounded-full border-0 px-3 text-[13px] shadow-none focus:ring-0 focus:ring-offset-0';

function AttachItem({ label, color, icon, onClick }: { label: string; color: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-xl px-3 py-1.5 hover:bg-[#f5f6f6]">
      <span className="flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ background: color }}>{icon}</span>
      <span className="pr-4 text-[14.5px]" style={{ color: WA.text }}>{label}</span>
    </button>
  );
}

interface Props { conversationId: string; onBack: () => void; onToggleDetails: () => void; detailsOpen: boolean }

export function ThreadPanel({ conversationId, onBack, onToggleDetails, detailsOpen }: Props) {
  const queryClient = useQueryClient();
  const now = useNow();
  const poll = useLivePoll(2000, 10000);
  const live = { refetchInterval: poll, refetchIntervalInBackground: false, refetchOnWindowFocus: true } as const;
  const [text, setText] = useState('');
  const [pickingTemplate, setPickingTemplate] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: convo } = useQuery({ queryKey: ['whatsapp', 'inbox', 'conv', conversationId], queryFn: () => inboxApi.get(conversationId), ...live });
  const { data: threadData, isLoading } = useQuery({ queryKey: ['whatsapp', 'inbox', 'messages', conversationId], queryFn: () => inboxApi.messages(conversationId), ...live });
  const { data: users = [] } = useQuery({ queryKey: ['whatsapp', 'inbox', 'users'], queryFn: inboxApi.users, staleTime: 5 * 60_000 });
  const { data: quickReplies = [] } = useQuery({ queryKey: ['whatsapp', 'inbox', 'quick-replies'], queryFn: inboxApi.quickReplies, staleTime: 5 * 60_000 });

  const messages: WaMessage[] = useMemo(() => threadData?.messages ?? [], [threadData]);
  const win = windowLeft(convo?.lastInboundAt ?? null, now);

  const unread = convo?.unreadCount ?? 0;
  useEffect(() => {
    if (unread > 0) inboxApi.read(conversationId).then(() => queryClient.invalidateQueries({ queryKey: ['whatsapp', 'inbox', 'counts'] })).catch(() => undefined);
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
    setEmojiOpen(false);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setAttachOpen(false);
    if (!file || !win.open) return;
    try {
      const up = await inboxApi.uploadMedia(file);
      const kind = file.type.split('/')[0];
      send.mutate({ media: { type: ['image', 'video', 'audio'].includes(kind) ? kind : 'document', mediaId: up.id, filename: file.name } });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Upload failed'));
    }
  };

  const pickDocument = () => docRef.current?.click();
  const pickMedia = () => mediaRef.current?.click();
  const pickTemplate = () => { setAttachOpen(false); setPickingTemplate(true); };

  const slash = text.startsWith('/') ? text.slice(1).toLowerCase() : null;
  const suggestions = slash !== null ? quickReplies.filter(q => q.shortcut.includes(slash)).slice(0, 5) : [];
  const name = convo?.displayName || (convo ? `+${convo.phoneNumber}` : '…');
  const canType = win.open;

  return (
    <div className="flex h-full flex-col" style={{ fontFamily: WA.font, background: WA.chat }}>
      {/* header */}
      <div className="flex h-[59px] shrink-0 items-center gap-3 px-4" style={{ background: WA.panel }}>
        <button className="md:hidden -ml-1 p-1" onClick={onBack} aria-label="Back" style={{ color: WA.icon }}><ArrowLeft className="h-5 w-5" /></button>
        <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={onToggleDetails} aria-label="Contact info">
          <WaAvatar name={name} className="h-10 w-10 text-[20px]" />
          <div className="min-w-0">
            <p className="truncate text-[16px] leading-5" style={{ color: WA.text }}>{name}</p>
            <p className="truncate text-[13px] leading-4" style={{ color: win.open ? WA.greenDark : WA.sub }}>
              {convo ? (win.open ? `+${convo.phoneNumber} · reply window ${win.label}` : `+${convo.phoneNumber} · 24-hour window closed`) : ''}
            </p>
          </div>
        </button>

        <Select value={convo?.assigneeId || 'none'} onValueChange={v => update.mutate({ assigneeId: v === 'none' ? null : v })}>
          <SelectTrigger className={cn(pillSelect, 'hidden w-[132px] sm:flex bg-white/80')}><SelectValue placeholder="Assign" /></SelectTrigger>
          <SelectContent><SelectItem value="none">Unassigned</SelectItem>{users.map(u => <SelectItem key={u.id} value={u.id}>{`${u.firstName} ${u.lastName || ''}`.trim()}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={convo?.status || 'open'} onValueChange={v => update.mutate({ status: v })}>
          <SelectTrigger className={cn(pillSelect, 'w-[104px] bg-white/80')}><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="open">Open</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent>
        </Select>
        <button onClick={onToggleDetails} aria-label="Contact info" className={cn('rounded-full p-2 hover:bg-black/5', detailsOpen && 'bg-black/10')} style={{ color: WA.icon }}><Info className="h-5 w-5" /></button>
      </div>

      {/* messages */}
      <div className="flex-1 overflow-y-auto py-3" style={{ backgroundImage: CHAT_WALLPAPER, backgroundColor: WA.chat }}>
        <div className="mx-auto mb-3 flex w-fit max-w-[80%] items-center gap-1.5 rounded-lg px-3 py-[5px] text-center text-[12.5px] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]" style={{ background: WA.notice, color: '#54656f' }}>
          <Lock className="h-3 w-3 shrink-0" />
          <span>Messages go through the official WhatsApp Business Platform. After 24 hours without a reply from the customer, only approved templates can be sent.</span>
        </div>

        {isLoading && <p className="text-center text-[13px]" style={{ color: WA.sub }}>Loading messages…</p>}
        {messages.map((m, i) => {
          const d = new Date(m.createdAt);
          const prev = messages[i - 1];
          const newDay = i === 0 || !isSameDay(d, new Date(prev.createdAt));
          const first = newDay || prev.direction !== m.direction;
          return (
            <div key={m.id}>
              {newDay && (
                <div className="my-3 flex justify-center">
                  <span className="rounded-lg px-3 py-[5px] text-[12.5px] uppercase shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]" style={{ background: WA.pill, color: '#54656f' }}>{dayLabel(d)}</span>
                </div>
              )}
              <MessageBubble m={m} first={first} />
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* composer */}
      {!canType ? (
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3" style={{ background: WA.panel }}>
          <p className="text-[13.5px]" style={{ color: WA.sub }}>The 24-hour window has closed. Send an approved template to start the conversation again.</p>
          <button onClick={() => setPickingTemplate(true)} className="flex shrink-0 items-center gap-2 rounded-full px-5 py-2 text-[14px] font-medium text-white" style={{ background: WA.green }}><FileText className="h-4 w-4" />Send template</button>
        </div>
      ) : (
        <div className="relative flex shrink-0 items-end gap-1 px-3 py-[10px]" style={{ background: WA.panel }}>
          {suggestions.length > 0 && (
            <div className="absolute bottom-full left-3 right-3 mb-1 overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(11,20,26,0.25)]">
              {suggestions.map(q => (
                <button key={q.id} className="block w-full px-4 py-2 text-left hover:bg-[#f5f6f6]" onClick={() => setText(q.body)}>
                  <span className="text-[13px] font-medium" style={{ color: WA.greenDark }}>/{q.shortcut}</span>
                  <p className="truncate text-[13px]" style={{ color: WA.sub }}>{q.body}</p>
                </button>
              ))}
            </div>
          )}

          <div className="relative">
            {emojiOpen && <EmojiPicker onPick={e => { setText(t => t + e); inputRef.current?.focus(); }} />}
            <button type="button" onClick={() => { setEmojiOpen(o => !o); setAttachOpen(false); }} className="rounded-full p-2 hover:bg-black/5" aria-label="Emoji" style={{ color: emojiOpen ? WA.green : WA.icon }}><Smile className="h-6 w-6" /></button>
          </div>

          <div className="relative">
            {attachOpen && (
              <div className="absolute bottom-full left-0 mb-2 flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-[0_2px_8px_rgba(11,20,26,0.25)]">
                <AttachItem label="Document" color="#7f66ff" icon={<FileText className="h-5 w-5" />} onClick={pickDocument} />
                <AttachItem label="Photos & videos" color="#007bfc" icon={<ImageIcon className="h-5 w-5" />} onClick={pickMedia} />
                <AttachItem label="Template" color={WA.green} icon={<Paperclip className="h-5 w-5" />} onClick={pickTemplate} />
              </div>
            )}
            <input ref={docRef} type="file" className="hidden" onChange={onFile} />
            <input ref={mediaRef} type="file" accept="image/*,video/*" className="hidden" onChange={onFile} />
            <button type="button" onClick={() => { setAttachOpen(o => !o); setEmojiOpen(false); }} className="rounded-full p-2 hover:bg-black/5" aria-label="Attach" style={{ color: WA.icon }}>
              <Plus className={cn('h-6 w-6 transition-transform', attachOpen && 'rotate-45')} />
            </button>
          </div>

          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={e => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitText(); } }}
            placeholder="Type a message"
            className="max-h-[120px] min-h-[42px] flex-1 resize-none rounded-lg border-0 bg-white px-3 py-[10px] text-[15px] leading-[20px] outline-none placeholder:text-[#667781] focus:ring-0"
            style={{ color: WA.text }}
          />

          <button type="button" onClick={submitText} disabled={!text.trim() || send.isPending} aria-label="Send" className="rounded-full p-2 transition-colors disabled:opacity-40 hover:bg-black/5" style={{ color: text.trim() ? WA.green : WA.icon }}>
            <Send className="h-6 w-6" />
          </button>
        </div>
      )}

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
