import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ConnectionBadge } from './ConnectionBadge';

interface Props {
  title: string;
  emoji?: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
  /** Fill the viewport height and let the body manage its own scrolling (inbox). */
  fullHeight?: boolean;
  showConnection?: boolean;
}

/** Page chrome that mirrors the DashboardV2 header: white canvas, Poppins title, subtitle, actions on the right. */
export function WhatsAppPage({ title, emoji, subtitle, actions, children, fullHeight, showConnection = true }: Props) {
  return (
    <div
      className={cn(
        'bg-white animate-in fade-in duration-500 p-6',
        fullHeight ? 'flex flex-col h-full gap-4 overflow-hidden' : 'space-y-4 sm:space-y-8'
      )}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl sm:text-3xl font-medium font-poppins tracking-tight text-foreground flex items-center gap-2">
            {title} {emoji && <span aria-hidden>{emoji}</span>}
          </h1>
          <p className="text-gray-600 tracking-tight font-poppins mt-0.5 text-[12px] sm:text-[14px] opacity-80">
            {subtitle}
          </p>
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
