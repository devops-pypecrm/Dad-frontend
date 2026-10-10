import { Skeleton } from '@/components/ui/skeleton';
import { WA_CARD } from './whatsappStyles';

export interface StatTile {
  label: string;
  value: string | number;
  /** Tailwind background class for the thin top accent line. */
  accent: string;
}

/** Same strip as the dashboard QuickStatsBar: equal tiles with a thin colour line on top. */
export function WhatsAppStatsBar({ tiles, loading }: { tiles: StatTile[]; loading?: boolean }) {
  const cols = tiles.length >= 6 ? 'lg:grid-cols-6' : tiles.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4';
  return (
    <div className={WA_CARD}>
      <div className={`grid grid-cols-2 ${cols} divide-x divide-border [&>*:nth-child(n+3)]:border-t lg:[&>*]:border-t-0 border-border`}>
        {tiles.map(tile => (
          <div key={tile.label} className="relative flex flex-col items-center justify-center gap-1 px-4 py-4">
            <span className={`absolute top-0 left-0 right-0 h-0.5 ${tile.accent} opacity-70`} />
            <span className="text-xs font-poppins text-muted-foreground">{tile.label}</span>
            {loading ? (
              <Skeleton className="h-7 w-14 rounded-md" />
            ) : (
              <span className="text-xl sm:text-2xl font-medium font-poppins text-black">{tile.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
