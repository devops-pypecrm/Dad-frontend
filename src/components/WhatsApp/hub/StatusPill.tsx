import { cn } from '@/lib/utils';

const TONES = {
  success: 'bg-emerald-500/10 text-emerald-600',
  warning: 'bg-amber-500/10 text-amber-600',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-blue-500/10 text-blue-600',
  muted: 'bg-muted text-muted-foreground',
} as const;

export type PillTone = keyof typeof TONES;

export function StatusPill({ tone = 'muted', children }: { tone?: PillTone; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium font-poppins capitalize', TONES[tone])}>
      {children}
    </span>
  );
}
