import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, FileText, Send, History, Plug, Unplug, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { happileeApi } from '@/services/happileeService';
import { apiErrorMessage } from '@/lib/apiError';
import { HappileePage, useHappileeStatus, H_CARD } from '@/components/happilee/shared';
import { IgAutomationPhone, IG_GRADIENT, HAPPILEE_IG_KEYFRAMES } from '@/components/happilee/IgAutomationPreview';
import { ArrowRight } from 'lucide-react';
import { isOrgAdmin } from '@/lib/utils';

export default function HappileeOverview() {
  const { data, isLoading } = useHappileeStatus();
  const qc = useQueryClient();
  const admin = isOrgAdmin(JSON.parse(localStorage.getItem('userInfo') || 'null'));
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const refresh = () => qc.invalidateQueries({ queryKey: ['happilee'] });
  const connect = useMutation({ mutationFn: () => happileeApi.connect(key.trim(), label.trim() || undefined), onSuccess: () => { toast.success('Happilee connected'); setKey(''); refresh(); }, onError: e => toast.error(apiErrorMessage(e, 'Could not connect')) });
  const test = useMutation({ mutationFn: () => happileeApi.templates('', 1), onSuccess: t => toast.success(`Connection works. ${t.length} template(s) found.`), onError: e => toast.error(apiErrorMessage(e, 'Connection test failed')) });
  const connectError = connect.isError ? apiErrorMessage(connect.error, 'Could not connect') : test.isError ? apiErrorMessage(test.error, 'Connection test failed') : null;
  const disconnect = useMutation({ mutationFn: happileeApi.disconnect, onSuccess: () => { toast.success('Disconnected'); refresh(); }, onError: e => toast.error(apiErrorMessage(e, 'Could not disconnect')) });

  return (
    <HappileePage title="Happilee" subtitle="Send approved WhatsApp templates and broadcasts through your Happilee account">
      <section className="rounded-[var(--card-radius,14px)] border bg-card shadow-[var(--card-shadow,none)] p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {data?.connected ? <CheckCircle2 className="h-6 w-6 text-green-600" /> : <Plug className="h-6 w-6 text-muted-foreground" />}
            <div>
              <p className="font-medium">{isLoading ? 'Checking…' : data?.connected ? 'Connected' : 'Not connected'}</p>
              {data?.connected && <p className="text-sm text-muted-foreground">{data.label ? `${data.label} · ` : ''}API key ending …{data.keyHint}{data.connectedAt ? ` · since ${new Date(data.connectedAt).toLocaleDateString()}` : ''}</p>}
            </div>
          </div>
          <div className="flex gap-2">
          {data?.connected && <Button variant="outline" size="sm" disabled={test.isPending} onClick={() => test.mutate()}><Activity className="mr-1.5 h-4 w-4" />{test.isPending ? 'Testing…' : 'Test connection'}</Button>}
          {data?.connected && admin && <Button variant="outline" size="sm" disabled={disconnect.isPending} onClick={() => window.confirm('Disconnect Happilee? Sending will stop until you reconnect.') && disconnect.mutate()}><Unplug className="mr-1.5 h-4 w-4" />Disconnect</Button>}
          </div>
        </div>
        {connectError && (
          <div className="mt-4 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div><p className="font-medium text-destructive">Happilee says:</p><p className="break-words text-foreground">{connectError}</p></div>
          </div>
        )}

        {!data?.connected && (admin ? (
          <form className="mt-5 max-w-md space-y-3" onSubmit={e => { e.preventDefault(); connect.mutate(); }}>
            <div className="space-y-1.5"><Label>Happilee API key</Label><Input type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="Paste the x-api-key from your Happilee account" /></div>
            <div className="space-y-1.5"><Label>Label (optional)</Label><Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Main number" /></div>
            <Button type="submit" disabled={!key.trim() || connect.isPending}>{connect.isPending ? 'Checking key…' : 'Connect Happilee'}</Button>
            <p className="text-xs text-muted-foreground">The key is checked with Happilee and stored encrypted. It is never shown again.</p>
          </form>
        ) : <p className="mt-4 text-sm text-muted-foreground">Ask an organisation admin to connect the Happilee API key.</p>)}
      </section>

      <Link to="/happilee/instagram" className={`${H_CARD} group relative block overflow-hidden p-5 transition hover:border-primary`}>
        <style>{HAPPILEE_IG_KEYFRAMES}</style>
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: IG_GRADIENT }} />
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="flex-1 space-y-2">
            <span className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: IG_GRADIENT }}>Instagram automation</span>
            <h3 className="text-lg font-semibold">Turn Instagram comments into DMs automatically</h3>
            <p className="text-sm text-muted-foreground">Keyword comment-to-DM, story replies, follow-ups and analytics. See how it works and try a live simulator.</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">Explore Instagram automation <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </div>
          <IgAutomationPhone compact />
        </div>
      </Link>

      {data?.connected && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[['Messages sent', data.stats.sent], ['Failed', data.stats.failed], ['Last activity', data.stats.lastActivity ? new Date(data.stats.lastActivity).toLocaleString() : '—']].map(([l, v]) => (
              <div key={String(l)} className="rounded-[var(--card-radius,14px)] border bg-card shadow-[var(--card-shadow,none)] p-5"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-1 text-2xl font-semibold">{v}</p></div>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[['/happilee/templates', FileText, 'Templates', 'Browse your approved templates'], ['/happilee/send', Send, 'Send & Broadcast', 'Message one lead, many leads, sync contacts and tags'], ['/happilee/messages', History, 'Message Log', 'See what was sent and its delivery status']].map(([to, Icon, t, d]: any) => (
              <Link key={to} to={to} className="rounded-[var(--card-radius,14px)] border bg-card shadow-[var(--card-shadow,none)] p-5 transition hover:border-primary"><Icon className="mb-2 h-5 w-5 text-primary" /><p className="font-medium">{t}</p><p className="text-sm text-muted-foreground">{d}</p></Link>
            ))}
          </div>
        </>
      )}
    </HappileePage>
  );
}
