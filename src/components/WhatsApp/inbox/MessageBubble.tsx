import { AlertCircle, Bot, Check, CheckCheck, Clock, MapPin, Megaphone, Sparkles, Workflow, Zap } from 'lucide-react';
import { format } from 'date-fns';
import MediaPreview from '../MediaPreview';
import type { WaMessage } from '@/services/whatsAppHubService';
import { cn } from '@/lib/utils';

const SOURCE_LABEL: Record<string, { label: string; icon: typeof Bot }> = {
  ai: { label: 'AI assistant', icon: Sparkles },
  flow: { label: 'Chatbot', icon: Bot },
  campaign: { label: 'Campaign', icon: Megaphone },
  auto_responder: { label: 'Auto responder', icon: Zap },
  nurture: { label: 'Nurture', icon: Workflow },
  workflow: { label: 'Automation', icon: Workflow },
};

function Ticks({ status }: { status: WaMessage['status'] }) {
  if (status === 'failed') return <AlertCircle className="h-3.5 w-3.5 text-red-200" />;
  if (status === 'pending') return <Clock className="h-3 w-3 opacity-70" />;
  if (status === 'sent') return <Check className="h-3.5 w-3.5 opacity-80" />;
  return <CheckCheck className={cn('h-3.5 w-3.5', status === 'read' ? 'text-sky-200' : 'opacity-80')} />;
}

export function MessageBubble({ m }: { m: WaMessage }) {
  const out = m.direction === 'outgoing';
  const c = m.content || {};
  const src = m.source ? SOURCE_LABEL[m.source] : undefined;

  const mediaType = (['image', 'video', 'audio', 'document'] as const).find(t => t === m.messageType);

  return (
    <div className={cn('flex', out ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[82%] md:max-w-[68%] rounded-2xl px-3.5 py-2.5 shadow-sm text-sm',
          out ? 'bg-[hsl(var(--chart-5))] text-white rounded-br-md' : 'bg-white text-foreground border border-border rounded-bl-md',
          m.status === 'failed' && 'bg-red-500 text-white'
        )}
      >
        {out && (src || m.agent) && (
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide opacity-80 mb-1">
            {src ? <><src.icon className="h-3 w-3" /> {src.label}</> : `${m.agent!.firstName} ${m.agent!.lastName || ''}`.trim()}
          </div>
        )}

        {m.messageType === 'template' && (
          <div className="text-[10px] font-semibold uppercase tracking-wide opacity-80 mb-1">
            Template · {c.templateName?.replace(/_/g, ' ')}
          </div>
        )}

        {mediaType && c.mediaUrl && <div className="mb-1"><MediaPreview mediaId={c.mediaUrl} type={mediaType} caption={c.caption} filename={c.fileName} /></div>}
        {m.messageType === 'location' && c.latitude != null && (
          <a className="flex items-center gap-1 underline mb-1" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${c.latitude},${c.longitude}`}>
            <MapPin className="h-4 w-4" /> Open location
          </a>
        )}

        {(c.text || c.caption) && <p className="whitespace-pre-wrap break-words">{c.text || c.caption}</p>}
        {m.messageType === 'template' && !c.text && <p className="italic opacity-80 text-xs">Approved template sent</p>}

        {c.buttons && c.buttons.length > 0 && (
          <div className="mt-2 space-y-1">
            {c.buttons.map(b => (
              <div key={b.id} className={cn('rounded-md px-2 py-1 text-center text-xs font-medium', out ? 'bg-white/20' : 'bg-muted')}>{b.title}</div>
            ))}
          </div>
        )}

        {m.status === 'failed' && m.errorMessage && <p className="mt-1 text-[11px] opacity-90">Not delivered: {m.errorMessage}</p>}

        <div className={cn('mt-1 flex items-center justify-end gap-1 text-[10px]', out ? 'opacity-80' : 'text-muted-foreground')}>
          {format(new Date(m.createdAt), 'HH:mm')}
          {out && <Ticks status={m.status} />}
        </div>
      </div>
    </div>
  );
}
