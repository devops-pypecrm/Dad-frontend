import type { ReactNode } from 'react';
import { Instagram } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useInstagramConnection } from '@/hooks/useInstagramConnection';

function ConnectionBadge() {
  const { data, isLoading } = useInstagramConnection();
  if (isLoading) return null;
  if (!data?.connected) return <Badge variant="outline" className="text-muted-foreground">Not connected</Badge>;
  const ok = data.healthy !== false;
  return (
    <Badge variant="outline" className="gap-2 font-medium">
      <span className={cn('h-2 w-2 rounded-full', ok ? 'bg-emerald-500' : 'bg-destructive')} />
      @{data.account?.username}
    </Badge>
  );
}

interface Props { title: string; subtitle: string; actions?: ReactNode; children: ReactNode; fullHeight?: boolean; showConnection?: boolean }

/** Page chrome mirroring the dashboard header (white canvas, Poppins title, subtitle, actions on the right). */
export function InstagramPage({ title, subtitle, actions, children, fullHeight, showConnection = true }: Props) {
  return (
    <div className={cn('bg-white animate-in fade-in duration-500 p-6', fullHeight ? 'flex flex-col h-full gap-4 overflow-hidden' : 'space-y-4 sm:space-y-8')}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 rounded-[10px] bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] flex items-center justify-center text-white"><Instagram className="h-6 w-6" /></div>
          <div>
            <h1 className="text-xl sm:text-3xl font-medium font-poppins tracking-tight text-foreground">{title}</h1>
            <p className="text-gray-600 tracking-tight font-poppins mt-0.5 text-[12px] sm:text-[14px] opacity-80">{subtitle}</p>
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
