import { ExternalLink, Phone, Reply } from 'lucide-react';

export interface PreviewButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
}

interface Props {
  header?: string;
  body: string;
  footer?: string;
  buttons?: PreviewButton[];
  /** Sample values substituted for {{1}}, {{2}}… */
  samples?: Record<string, string>;
}

const fill = (text: string, samples: Record<string, string> = {}) =>
  text.replace(/\{\{(\d+)\}\}/g, (m, n) => samples[n] || m);

/** WhatsApp-style bubble so users see what the customer will receive. */
export function TemplatePreview({ header, body, footer, buttons = [], samples }: Props) {
  return (
    <div className="rounded-xl bg-[#e5ddd5] dark:bg-muted/40 p-4">
      <div className="max-w-[300px] rounded-lg rounded-tl-none bg-white dark:bg-card shadow-sm overflow-hidden">
        <div className="p-3 space-y-1.5">
          {header && <p className="text-sm font-bold text-foreground">{fill(header, samples)}</p>}
          <p className="text-sm text-foreground whitespace-pre-wrap break-words">
            {body ? fill(body, samples) : <span className="text-muted-foreground">Your message body…</span>}
          </p>
          {footer && <p className="text-xs text-muted-foreground">{footer}</p>}
        </div>
        {buttons.length > 0 && (
          <div className="border-t border-border divide-y divide-border">
            {buttons.map((b, i) => (
              <div key={i} className="flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-sky-600">
                {b.type === 'URL' && <ExternalLink className="h-3.5 w-3.5" />}
                {b.type === 'PHONE_NUMBER' && <Phone className="h-3.5 w-3.5" />}
                {b.type === 'QUICK_REPLY' && <Reply className="h-3.5 w-3.5" />}
                {b.text || 'Button'}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
