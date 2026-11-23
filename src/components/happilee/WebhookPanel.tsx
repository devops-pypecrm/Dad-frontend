import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, Copy, RefreshCw, Webhook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { happileeApi } from '@/services/happileeService';
import { apiErrorMessage } from '@/lib/apiError';
import { H_CARD } from './shared';

const outcomeCls = (o: string) => o === 'lead_created' ? 'bg-emerald-100 text-emerald-700' : o.startsWith('error') || o === 'no_phone' ? 'bg-red-100 text-red-700' : o === 'duplicate' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground';

/** Admin panel: webhook URLs to paste into Happilee, which types create leads, and the recent events received. */
export function WebhookPanel() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['happilee', 'webhook'], queryFn: happileeApi.webhook, refetchInterval: 15000 });
  const [createOn, setCreateOn] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { if (data) setCreateOn(data.types.filter(t => t.createLead).map(t => t.key)); }, [data]);
  const save = useMutation({ mutationFn: () => happileeApi.saveWebhookSettings(createOn), onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['happilee', 'webhook'] }); }, onError: e => toast.error(apiErrorMessage(e, 'Could not save')) });
  const rotate = useMutation({ mutationFn: happileeApi.rotateWebhook, onSuccess: () => { toast.success('New URLs generated. Update them in Happilee.'); qc.invalidateQueries({ queryKey: ['happilee', 'webhook'] }); }, onError: e => toast.error(apiErrorMessage(e, 'Could not regenerate')) });
  const copy = (t: string) => navigator.clipboard.writeText(t).then(() => toast.success('Copied'));
  const dirty = data && JSON.stringify([...createOn].sort()) !== JSON.stringify(data.types.filter(t => t.createLead).map(t => t.key).sort());

  return (
    <section className={`${H_CARD} space-y-4 p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3"><Webhook className="h-6 w-6 text-primary" /><div><p className="font-medium">Receive leads from Happilee (webhooks)</p><p className="text-sm text-muted-foreground">New contacts in Happilee can appear in the CRM automatically.</p></div></div>
        <Button variant="outline" size="sm" disabled={rotate.isPending} onClick={() => window.confirm('Generate new URLs? The current ones stop working until you update them in Happilee.') && rotate.mutate()}><RefreshCw className="mr-1.5 h-4 w-4" />New URLs</Button>
      </div>

      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>In Happilee open <b>Webhooks</b> and click add. Each webhook has a <b>Name</b>, a <b>Type</b> and a <b>URL</b>.</li>
        <li>For each type below, pick the same type in Happilee and paste its URL (copy button). Use any name, for example "PypeCRM new contact".</li>
        <li>Tick the types that should <b>create a lead</b> in the CRM and click Save. The rest are only recorded.</li>
      </ol>

      {error && <p className="text-sm text-destructive">{apiErrorMessage(error, 'Could not load webhook details')}</p>}
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {data && (
        <div className="divide-y rounded-lg border">
          {data.types.map(t => (
            <div key={t.key} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
              <label className="flex w-full items-center gap-2 text-sm font-medium sm:w-72"><Checkbox checked={createOn.includes(t.key)} onCheckedChange={v => setCreateOn(v ? [...createOn, t.key] : createOn.filter(k => k !== t.key))} />{t.label}<span className="text-xs font-normal text-muted-foreground">{createOn.includes(t.key) ? '· creates lead' : '· log only'}</span></label>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1.5 text-xs">{t.url}</code>
                <Button size="sm" variant="outline" onClick={() => copy(t.url)}><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {dirty && <Button disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Saving…' : 'Save which types create leads'}</Button>}

      {data && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Recent events from Happilee</p>
          {!data.events.length ? <p className="text-sm text-muted-foreground">Nothing received yet. Once Happilee sends an event it will show here, with its raw data so we can check the mapping.</p> : (
            <div className="divide-y rounded-lg border text-sm">
              {data.events.map(e => (
                <div key={e.id}>
                  <button className="flex w-full items-center gap-2 p-3 text-left hover:bg-accent" onClick={() => setOpen(open === e.id ? null : e.id)}>
                    {open === e.id ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                    <span className="w-44 shrink-0 font-mono text-xs">{e.type}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${outcomeCls(e.outcome)}`}>{e.outcome}</span>
                    <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</span>
                  </button>
                  {open === e.id && <pre className="max-h-64 overflow-auto bg-muted p-3 text-xs">{JSON.stringify(e.payload, null, 2)}</pre>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
