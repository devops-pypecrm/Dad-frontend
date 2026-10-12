import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MessageCircle, Search, ToggleRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/services/api';
import { apiErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';

interface Feature { key: string; label: string; description: string; enabledCount: number }
interface Org { id: string; name: string; slug: string; status: string; enabledFeatures: string[] }
interface FeatureData { features: Feature[]; organisations: Org[] }

const ICONS: Record<string, typeof MessageCircle> = { whatsapp: MessageCircle };

/** One feature: pick which organisations get it, then save. */
function FeatureCard({ feature, orgs }: { feature: Feature; orgs: Org[] }) {
  const queryClient = useQueryClient();
  const saved = useMemo(() => new Set(orgs.filter(o => o.enabledFeatures.includes(feature.key)).map(o => o.id)), [orgs, feature.key]);
  const [selected, setSelected] = useState<Set<string>>(saved);
  const [search, setSearch] = useState('');

  const visible = orgs.filter(o => `${o.name} ${o.slug}`.toLowerCase().includes(search.toLowerCase()));
  const toEnable = [...selected].filter(id => !saved.has(id));
  const toDisable = [...saved].filter(id => !selected.has(id));
  const dirty = toEnable.length + toDisable.length > 0;
  const nameOf = (id: string) => orgs.find(o => o.id === id)?.name || id;

  const save = useMutation({
    mutationFn: () => api.put(`/super-admin/features/${feature.key}`, { organisationIds: [...selected] }),
    onSuccess: () => {
      toast.success(`${feature.label} updated: ${toEnable.length} enabled, ${toDisable.length} disabled`);
      queryClient.invalidateQueries({ queryKey: ['super-admin-features'] });
      queryClient.invalidateQueries({ queryKey: ['organisations'] });
    },
    onError: err => toast.error(apiErrorMessage(err, 'Could not save feature settings')),
  });

  const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const setVisible = (on: boolean) => setSelected(prev => { const n = new Set(prev); visible.forEach(o => (on ? n.add(o.id) : n.delete(o.id))); return n; });

  const confirmAndSave = () => {
    if (toDisable.length) {
      const names = toDisable.map(nameOf).join(', ');
      if (!window.confirm(`Disable "${feature.label}" for: ${names}?\n\nTheir team loses access immediately and queued automations are cancelled.`)) return;
    }
    save.mutate();
  };

  const Icon = ICONS[feature.key] || ToggleRight;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-600"><Icon className="h-5 w-5" /></div>
            <div>
              <CardTitle className="text-foreground">{feature.label}</CardTitle>
              <CardDescription className="mt-1 max-w-2xl">{feature.description}</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">{saved.size} of {orgs.length} organisations</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search organisations…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" size="sm" onClick={() => setVisible(true)}>Select all{search ? ' shown' : ''}</Button>
          <Button variant="outline" size="sm" onClick={() => setVisible(false)}>Clear{search ? ' shown' : ''}</Button>
        </div>

        <div className="max-h-80 overflow-y-auto rounded-lg border border-border divide-y divide-border">
          {visible.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No organisations match.</p>}
          {visible.map(o => (
            <label key={o.id} className={cn('flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-muted/50', selected.has(o.id) && 'bg-green-500/5')}>
              <Checkbox checked={selected.has(o.id)} onCheckedChange={() => toggle(o.id)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{o.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{o.slug}</span>
              </span>
              {o.status !== 'active' && <Badge variant="secondary" className="capitalize">{o.status}</Badge>}
              {saved.has(o.id) && <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Enabled</Badge>}
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {dirty ? `Unsaved: ${toEnable.length} to enable${toDisable.length ? `, ${toDisable.length} to disable` : ''}` : 'No pending changes'}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" disabled={!dirty || save.isPending} onClick={() => setSelected(new Set(saved))}>Reset</Button>
            <Button size="sm" disabled={!dirty || save.isPending} onClick={confirmAndSave}>{save.isPending ? 'Saving…' : 'Save changes'}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FeatureSettings() {
  const { data, isLoading } = useQuery<FeatureData>({
    queryKey: ['super-admin-features'],
    queryFn: async () => (await api.get('/super-admin/features')).data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Feature Settings</h2>
        <p className="text-sm text-muted-foreground">Choose which organisations get each platform feature. Organisations that are not selected do not see or use it.</p>
      </div>
      {isLoading || !data ? <Skeleton className="h-96 w-full" /> : data.features.map(f => (
        // keyed by the saved selection so the card resets to the server state after every save/refetch
        <FeatureCard key={`${f.key}:${data.organisations.filter(o => o.enabledFeatures.includes(f.key)).map(o => o.id).join(',')}`} feature={f} orgs={data.organisations} />
      ))}
    </div>
  );
}
