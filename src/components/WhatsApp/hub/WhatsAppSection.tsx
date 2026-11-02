import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { WA_CARD } from './whatsappStyles';

interface Props {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  /** Remove body padding (tables run edge to edge). */
  flush?: boolean;
  className?: string;
}

/** White panel with a titled header, used across the WhatsApp (and Instagram) pages. */
export function WhatsAppSection({ title, description, icon, actions, children, flush, className }: Props) {
  return (
    <div className={cn(WA_CARD, className)}>
      <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-normal text-foreground flex items-center gap-2">
            {icon && <span className="text-[hsl(var(--chart-5))] [&>svg]:h-5 [&>svg]:w-5">{icon}</span>}
            {title}
          </h2>
          {description && <p className="text-[13px] text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {actions}
      </div>
      <div className={flush ? '' : 'px-5 pb-5'}>{children}</div>
    </div>
  );
}
