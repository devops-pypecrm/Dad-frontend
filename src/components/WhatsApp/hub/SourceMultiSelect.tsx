import { LEAD_SOURCE_OPTIONS } from '@/services/whatsAppHubService';
import { cn } from '@/lib/utils';

/** Toggle chips for lead sources. Empty selection means "all sources". */
export function SourceMultiSelect({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (s: string) => onChange(value.includes(s) ? value.filter(x => x !== s) : [...value, s]);
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {LEAD_SOURCE_OPTIONS.map(s => (
          <button
            key={s} type="button" onClick={() => toggle(s)}
            className={cn('rounded-full border px-2.5 py-1 text-xs capitalize transition-colors',
              value.includes(s) ? 'bg-[hsl(var(--chart-5))] border-transparent text-white' : 'bg-white hover:bg-muted')}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">{value.length ? `Only leads from: ${value.map(s => s.replace(/_/g, ' ')).join(', ')}` : 'All lead sources'}</p>
    </div>
  );
}
