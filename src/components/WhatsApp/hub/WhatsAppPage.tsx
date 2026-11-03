import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { WhatsAppLogo } from '@/components/icons/BrandLogos';
import { ConnectionBadge } from './ConnectionBadge';

interface Props {
  title: string;
  /** Kept for compatibility; WhatsApp's own screens don't use emoji in titles. */
  emoji?: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Fill the viewport height and let the body manage its own scrolling. */
  fullHeight?: boolean;
  showConnection?: boolean;
}

/** Page chrome for the WhatsApp section: WhatsApp-grey canvas, green logo chip, light title. */
export function WhatsAppPage({ title, subtitle, actions, children, fullHeight, showConnection = true }: Props) {
  return (
    <div
      className={cn('animate-in fade-in duration-300 p-6 bg-[var(--page-bg,#fff)]', fullHeight ? 'flex flex-col h-full gap-4 overflow-hidden' : 'space-y-4 sm:space-y-6 min-h-full')}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 shrink-0 rounded-full bg-[#25D366] flex items-center justify-center text-white"><WhatsAppLogo className="h-6 w-6" /></div>
          <div className="min-w-0">
            <h1 className="text-[22px] sm:text-[26px] font-medium leading-tight text-foreground">{title}</h1>
            <p className="text-[13.5px] text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {showConnection && <ConnectionBadge />}
          {actions}
        </div>
      </div>
      {children}
    </div>
  );
}
