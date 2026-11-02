import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, ChevronDown, Copy, Instagram, MessageCircle, Search, ToggleRight, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/services/api';
import { apiErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';

interface FeatureSetup { callbackUrl: string; oauthRedirectUri?: string; subscribedFields: string[]; checks: { label: string; ok: boolean }[] }
interface Feature { key: string; label: string; description: string; enabledCount: number; setup?: FeatureSetup | null }
interface Org { id: string; name: string; slug: string; status: string; enabledFeatures: string[] }
interface FeatureData { features: Feature[]; organisations: Org[] }

const ICONS: Record<string, typeof MessageCircle> = { whatsapp: MessageCircle, instagram: Instagram };

function CopyRow({ label, value }: { label: string; value: string }) {
  const copy = () => navigator.clipboard.writeText(value).then(() => toast.success('Copied'));
  return (
    <div>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <div className="flex gap-2"><code className="flex-1 break-all rounded border border-border bg-muted/40 px-2 py-1.5 text-xs">{value}</code><Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={copy} aria-label={`Copy ${label}`}><Copy className="h-3.5 w-3.5" /></Button></div>
    </div>
  );
}

/** One-time Meta app configuration for the whole platform (not per organisation). */
function PlatformSetup({ setup }: { setup: FeatureSetup }) {
  const [open, setOpen] = useState(false);
  const allOk = setup.checks.every(c => c.ok);
  return (
    <div className="rounded-lg border border-border">
      <button type="button" onClick={() => setOpen(o => !o)} className="flex w-full items-center gap-2 px-4 py-3 text-left">
        <span className="flex-1 text-sm font-medium text-foreground">Platform setup <span className="font-normal text-muted-foreground">(Meta app, configured once for every organisation)</span></span>
        {allOk ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border p-4">
          <CopyRow label="Webhook callback URL" value={setup.callbackUrl} />
          {setup.oauthRedirectUri && <CopyRow label="OAuth redirect URI" value={setup.oauthRedirectUri} />}
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Subscribe these fields in the Meta app</p>
            <div className="flex flex-wrap gap-1.5">{setup.subscribedFields.map(f => <code key={f} className="rounded bg-muted px-2 py-0.5 text-[11px]">{f}</code>)}</div>
          </div>
          <ul className="space-y-1.5">
            {setup.checks.map(c => (
              <li key={c.label} className="flex items-center gap-2 text-sm">{c.ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-destructive" />}{c.label}</li>
            ))}
          </ul>
          <p className="text-[11px] text-muted-foreground">Organisations never see or set any of this. They only connect their own number or account.</p>
        </div>
      )}
    </div>
  );
}

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
        {feature.setup && <PlatformSetup setup={feature.setup} />}
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
