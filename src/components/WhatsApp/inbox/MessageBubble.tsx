import { AlertCircle, Check, CheckCheck, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import MediaPreview from '../MediaPreview';
import type { WaMessage } from '@/services/whatsAppHubService';
import { cn } from '@/lib/utils';
import { WA } from './wa';

const SOURCE_LABEL: Record<string, string> = {
  ai: 'AI assistant', flow: 'Chatbot', campaign: 'Campaign', auto_responder: 'Auto responder', nurture: 'Nurture', workflow: 'Automation',
};

export function Ticks({ status, className }: { status: WaMessage['status']; className?: string }) {
  if (status === 'failed') return <AlertCircle className={cn('h-[15px] w-[15px]', className)} style={{ color: '#ea0038' }} />;
  if (status === 'pending') return <Clock className={cn('h-[13px] w-[13px]', className)} style={{ color: WA.sub }} />;
  if (status === 'sent') return <Check className={cn('h-[16px] w-[16px]', className)} style={{ color: WA.sub }} />;
  return <CheckCheck className={cn('h-[16px] w-[16px]', className)} style={{ color: status === 'read' ? WA.tick : WA.sub }} />;
}

const Tail = ({ out }: { out: boolean }) => (
  <svg viewBox="0 0 8 13" width="8" height="13" className={cn('absolute top-0', out ? '-right-[7px] -scale-x-100' : '-left-[7px]')} aria-hidden>
    <path d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" fill={out ? WA.out : WA.inn} />
  </svg>
);

/** One chat bubble in WhatsApp's style: tail on the first of a run, time and ticks inside, bottom-right. */
export function MessageBubble({ m, first }: { m: WaMessage; first: boolean }) {
  const out = m.direction === 'outgoing';
  const c = m.content || {};
  const failed = m.status === 'failed';
  const label = out ? (m.source && SOURCE_LABEL[m.source]) || (m.agent ? `${m.agent.firstName} ${m.agent.lastName || ''}`.trim() : '') : '';
  const mediaType = (['image', 'video', 'audio', 'document'] as const).find(t => t === m.messageType);
  const text = c.text || c.caption;

  const meta = (
    <span className="absolute bottom-[3px] right-[7px] flex items-center gap-[3px] text-[11px] leading-none" style={{ color: WA.sub }}>
      {format(new Date(m.createdAt), 'h:mm a').toLowerCase()}
      {out && <Ticks status={m.status} />}
    </span>
  );

  return (
    <div className={cn('flex px-[7%] md:px-[9%]', out ? 'justify-end' : 'justify-start', first ? 'mt-[10px]' : 'mt-[2px]')}>
      <div
        className={cn('relative max-w-[85%] md:max-w-[65%] rounded-[7.5px] px-[9px] pb-[6px] pt-[6px] text-[14.2px] leading-[19px] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]', first && (out ? 'rounded-tr-none' : 'rounded-tl-none'))}
        style={{ background: out ? WA.out : WA.inn, color: WA.text }}
      >
        {first && <Tail out={out} />}
        {label && <p className="mb-0.5 text-[12.8px] font-medium" style={{ color: '#06cf9c' }}>{label}</p>}

        {m.messageType === 'template' && !c.text && <p className="italic" style={{ color: WA.sub }}>Template · {c.templateName?.replace(/_/g, ' ')}</p>}

        {mediaType && c.mediaUrl && <div className="-mx-1 mb-1 overflow-hidden rounded-md"><MediaPreview mediaId={c.mediaUrl} type={mediaType} caption={c.caption} filename={c.fileName} /></div>}
        {m.messageType === 'location' && c.latitude != null && (
          <a className="mb-1 flex items-center gap-1 underline" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${c.latitude},${c.longitude}`}><MapPin className="h-4 w-4" />Open location</a>
        )}

        {text && (
          <p className="whitespace-pre-wrap break-words">
            {text}
            <span className="inline-block h-[1px] w-[74px]" aria-hidden />
          </p>
        )}
        {!text && <span className="inline-block h-[14px] w-[74px]" aria-hidden />}

        {c.buttons && c.buttons.length > 0 && (
          <div className="-mx-[9px] mt-1.5 border-t" style={{ borderColor: WA.line }}>
            {c.buttons.map(b => <div key={b.id} className="border-b py-2 text-center text-[14px] font-medium last:border-b-0" style={{ color: '#027eb5', borderColor: WA.line }}>{b.title}</div>)}
          </div>
        )}

        {failed && m.errorMessage && <p className="mt-1 text-[12px]" style={{ color: '#ea0038' }}>Not delivered: {m.errorMessage}</p>}
        {meta}
      </div>
    </div>
  );
}
