import { Skeleton } from '@/components/ui/skeleton';
import { WA_CARD } from './whatsappStyles';

export interface StatTile {
  label: string;
  value: string | number;
  /** Kept for compatibility; the WhatsApp look uses flat tiles without coloured accent lines. */
  accent?: string;
}

/** Flat white tiles divided by hairlines, big light numbers: the way WhatsApp shows counts. */
export function WhatsAppStatsBar({ tiles, loading }: { tiles: StatTile[]; loading?: boolean }) {
  const cols = tiles.length >= 6 ? 'lg:grid-cols-6' : tiles.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4';
  return (
    <div className={WA_CARD}>
      <div className={`grid grid-cols-2 ${cols} divide-x divide-border [&>*:nth-child(n+3)]:border-t lg:[&>*]:border-t-0 border-border`}>
        {tiles.map(tile => (
          <div key={tile.label} className="flex flex-col items-start justify-center gap-1 px-5 py-4">
            <span className="text-[13px] text-muted-foreground">{tile.label}</span>
            {loading ? <Skeleton className="h-8 w-14 rounded-md" /> : <span className="text-[28px] font-light leading-8 text-foreground">{tile.value}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
