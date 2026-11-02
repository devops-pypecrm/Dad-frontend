import type { ReactNode } from 'react';
import { Instagram } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInstagramConnection } from '@/hooks/useInstagramConnection';
import { IG } from './inbox/ig';

function ConnectionBadge() {
  const { data, isLoading } = useInstagramConnection();
  if (isLoading) return null;
  if (!data?.connected) return <span className="text-[13px]" style={{ color: IG.sub }}>Not connected</span>;
  const ok = data.healthy !== false;
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: IG.text }}>
      <span className={cn('h-2 w-2 rounded-full', ok ? 'bg-[#58c322]' : 'bg-[#ed4956]')} />@{data.account?.username}
    </span>
  );
}

interface Props { title: string; subtitle: string; actions?: ReactNode; children: ReactNode; fullHeight?: boolean; showConnection?: boolean }

/** Page chrome in Instagram's style: white canvas, bold system-font title, hairline divider. */
export function InstagramPage({ title, subtitle, actions, children, fullHeight, showConnection = true }: Props) {
  return (
    <div className={cn('animate-in fade-in duration-300 bg-white', fullHeight ? 'flex h-full flex-col overflow-hidden' : 'min-h-full')} style={{ fontFamily: IG.font }}>
      <div className="flex shrink-0 flex-col items-start justify-between gap-3 border-b px-6 py-4 sm:flex-row sm:items-center" style={{ borderColor: IG.line }}>
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: IG.story }}><Instagram className="h-5 w-5" /></span>
          <div className="min-w-0">
            <h1 className="text-[20px] font-semibold leading-6" style={{ color: IG.text }}>{title}</h1>
            <p className="text-[13px]" style={{ color: IG.sub }}>{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {showConnection && <ConnectionBadge />}
          {actions}
        </div>
      </div>
      <div className={cn(fullHeight ? 'flex min-h-0 flex-1 flex-col' : 'space-y-6 p-6')}>{children}</div>
    </div>
  );
}
