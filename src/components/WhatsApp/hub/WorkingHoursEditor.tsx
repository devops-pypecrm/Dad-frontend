import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { WorkingHours } from '@/services/whatsAppHubService';

const DAYS: { key: keyof WorkingHours; label: string }[] = [
  { key: 'mon', label: 'Monday' }, { key: 'tue', label: 'Tuesday' }, { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' }, { key: 'fri', label: 'Friday' }, { key: 'sat', label: 'Saturday' }, { key: 'sun', label: 'Sunday' },
];

export function WorkingHoursEditor({ value, onChange }: { value: WorkingHours; onChange: (v: WorkingHours) => void }) {
  return (
    <div className="rounded-[10px] border border-border divide-y divide-border">
      {DAYS.map(({ key, label }) => {
        const day = value[key];
        return (
          <div key={key} className="flex items-center gap-3 px-3 py-2">
            <Switch checked={!!day} onCheckedChange={on => onChange({ ...value, [key]: on ? { start: '09:00', end: '18:00' } : null })} />
            <span className="w-24 text-sm font-poppins">{label}</span>
            {day ? (
              <div className="flex items-center gap-2">
                <Input type="time" className="h-8 w-28 rounded-lg" value={day.start} onChange={e => onChange({ ...value, [key]: { ...day, start: e.target.value } })} />
                <span className="text-xs text-muted-foreground">to</span>
                <Input type="time" className="h-8 w-28 rounded-lg" value={day.end} onChange={e => onChange({ ...value, [key]: { ...day, end: e.target.value } })} />
              </div>
            ) : <span className="text-xs text-muted-foreground">Closed</span>}
          </div>
        );
      })}
    </div>
  );
}
