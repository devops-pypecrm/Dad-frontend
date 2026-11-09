import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { waToolsApi } from '@/services/whatsAppToolsService';

/** Lets an admin with several numbers choose which one a Growth Tools page works on (empty = default number). */
function useWaToolAccounts() {
  return useQuery({ queryKey: ['wa-tools', 'accounts'], queryFn: waToolsApi.accounts, staleTime: 5 * 60_000 });
}

export function AccountPicker({ value, onChange }: { value?: string; onChange: (id: string | undefined) => void }) {
  const { data = [] } = useWaToolAccounts();
  if (data.length < 2) return null;
  return (
    <Select value={value ?? 'default'} onValueChange={v => onChange(v === 'default' ? undefined : v)}>
      <SelectTrigger className="h-9 w-[210px] text-sm"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="default">Default number</SelectItem>
        {data.map(a => <SelectItem key={a.id} value={a.id}>{a.displayName || a.phoneNumber}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

/** Inline notice for a Meta section that could not load (missing permission, no data yet, etc.). */
export function Unavailable({ error }: { error: string }) {
  return <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">{error}</p>;
}
