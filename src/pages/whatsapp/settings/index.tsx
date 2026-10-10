import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { toast } from 'sonner';
import { Activity, BarChart3, CheckCircle2, Copy, Link2, Phone, Plus, RefreshCw, Settings as SettingsIcon, ShieldCheck, Star, Trash2, Unplug, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WhatsAppPage } from '@/components/WhatsApp/hub/WhatsAppPage';
import { WhatsAppStatsBar } from '@/components/WhatsApp/hub/WhatsAppStatsBar';
import { WhatsAppSection } from '@/components/WhatsApp/hub/WhatsAppSection';
import { StatusPill, type PillTone } from '@/components/WhatsApp/hub/StatusPill';
import { EmptyState } from '@/components/WhatsApp/hub/EmptyRow';
import { InboxToolsPanel } from '@/components/WhatsApp/hub/InboxToolsPanel';
import { AddWhatsAppAccountDialog } from '@/components/WhatsApp/AddWhatsAppAccountDialog';
import { WhatsAppAssignmentRuleDialog } from '@/components/WhatsApp/WhatsAppAssignmentRuleDialog';
import { WA_OUTLINE_BTN, WA_PRIMARY_BTN } from '@/components/WhatsApp/hub/whatsappStyles';
import { whatsAppAccountService, type WhatsAppAccount } from '@/services/whatsAppAccountService';
import { startWhatsAppConnect } from '@/services/whatsAppConnectService';
import { settingsApi, type WaAccountHealth } from '@/services/whatsAppHubService';
import { WHATSAPP_CONNECTION_KEY } from '@/hooks/useWhatsAppConnection';
import { api } from '@/services/api';
import { apiErrorMessage } from '@/lib/apiError';
import { formatIST } from '@/lib/dateUtils';

const QUALITY_TONE: Record<string, PillTone> = { GREEN: 'success', YELLOW: 'warning', RED: 'danger' };
const tier = (t?: string | null) => (t ? t.replace('TIER_', '').replace('UNLIMITED', '∞') + (/^\d/.test(t.replace('TIER_', '')) ? ' / day' : '') : '—');

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-sm font-poppins">
      {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-destructive" />}{label}
    </li>
  );
}

export default function WhatsAppSettingsPage() {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [addOpen, setAddOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<WhatsAppAccount | null>(null);
  const [ruleAccount, setRuleAccount] = useState<WhatsAppAccount | null>(null);
  const [days, setDays] = useState('7');
  const [optPhone, setOptPhone] = useState('');
  const [connecting, setConnecting] = useState(false);

  const { data: overview, isLoading } = useQuery({ queryKey: ['whatsapp', 'settings'], queryFn: settingsApi.overview });
  const { data: accountRows = [] } = useQuery({ queryKey: ['whatsapp-accounts'], queryFn: whatsAppAccountService.getWhatsAppAccounts });
  const { data: insights } = useQuery({ queryKey: ['whatsapp', 'insights', days], queryFn: () => settingsApi.insights(Number(days)) });
  const { data: optOuts = [] } = useQuery({ queryKey: ['whatsapp', 'optouts'], queryFn: settingsApi.optOuts });

  const refreshAll = () => {
    ['settings', 'insights', 'optouts'].forEach(k => queryClient.invalidateQueries({ queryKey: ['whatsapp', k] }));
    queryClient.invalidateQueries({ queryKey: ['whatsapp-accounts'] });
    queryClient.invalidateQueries({ queryKey: WHATSAPP_CONNECTION_KEY });
  };

  // Result of the Meta OAuth round-trip
  useEffect(() => {
    const result = params.get('whatsapp');
    const error = params.get('error');
    if (!result && !error) return;
    if (error) toast.error(params.get('message') || 'Failed to connect to Meta');
    else if (result === 'connected') toast.success('WhatsApp number connected');
    else if (result === 'no_account_found') toast.error('No WhatsApp Business Account found for that Facebook login. Make sure the number is registered under your Business Manager.');
    refreshAll();
    setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onError = (e: unknown) => toast.error(apiErrorMessage(e, 'Something went wrong'));
  const healthAll = useMutation({ mutationFn: settingsApi.refreshAll, onSuccess: () => { toast.success('Health refreshed'); refreshAll(); }, onError });
  const healthOne = useMutation({ mutationFn: settingsApi.refreshAccount, onSuccess: () => { toast.success('Checked with Meta'); refreshAll(); }, onError });
  const makeDefault = useMutation({ mutationFn: (id: string) => whatsAppAccountService.updateWhatsAppAccount(id, { isDefault: true }), onSuccess: refreshAll, onError });
  const disconnect = useMutation({ mutationFn: (phoneNumberId: string) => api.post('/meta/disconnect', { type: 'whatsapp', phoneNumberId }), onSuccess: () => { toast.success('Number disconnected'); refreshAll(); }, onError });
  const remove = useMutation({ mutationFn: whatsAppAccountService.deleteWhatsAppAccount, onSuccess: () => { toast.success('Number removed'); refreshAll(); }, onError });
  const addOpt = useMutation({ mutationFn: () => settingsApi.addOptOut(optPhone), onSuccess: () => { setOptPhone(''); refreshAll(); }, onError });
  const delOpt = useMutation({ mutationFn: settingsApi.removeOptOut, onSuccess: refreshAll, onError });

  const connect = async () => {
    setConnecting(true);
    try { await startWhatsAppConnect('/whatsapp/settings'); } catch (e) { onError(e); setConnecting(false); }
  };

  const rowFor = (a: WaAccountHealth) => accountRows.find(r => r.id === a.id) || null;
  const delivery = insights?.delivery;
  const rate = delivery?.sent ? Math.round((delivery.delivered / delivery.sent) * 100) : 0;
  const readRate = delivery?.sent ? Math.round((delivery.read / delivery.sent) * 100) : 0;

  const daily = useMemo(() => {
    const byDay = new Map<string, { in: number; out: number }>();
    (insights?.daily || []).forEach(r => {
      const k = r.day.slice(0, 10);
      const cur = byDay.get(k) || { in: 0, out: 0 };
      if (r.direction === 'incoming') cur.in += r.count; else cur.out += r.count;
      byDay.set(k, cur);
    });
    return Array.from(byDay.entries()).map(([day, v]) => ({ day, ...v }));
  }, [insights]);
  const maxDay = Math.max(1, ...daily.map(d => d.in + d.out));

  const copy = (t: string) => navigator.clipboard.writeText(t).then(() => toast.success('Copied'));

  return (
    <WhatsAppPage
      title="WhatsApp Settings"
      emoji="⚙️"
      subtitle="Numbers, health, webhook, consent and insights, all in one place."
      showConnection={false}
      actions={
        <>
          <Button variant="outline" className={WA_OUTLINE_BTN} disabled={healthAll.isPending} onClick={() => healthAll.mutate()}><RefreshCw className={`h-4 w-4 mr-1.5 ${healthAll.isPending ? 'animate-spin' : ''}`} />Check health</Button>
          <Button variant="outline" className={WA_OUTLINE_BTN} onClick={() => { setEditAccount(null); setAddOpen(true); }}>Add manually</Button>
          <Button className={WA_PRIMARY_BTN} disabled={connecting} onClick={connect}><Plus className="h-4 w-4 mr-1.5" />{connecting ? 'Connecting…' : 'Connect via Meta'}</Button>
        </>
      }
    >
      <WhatsAppStatsBar
        loading={isLoading}
        tiles={[
          { label: 'Connected numbers', value: overview?.accounts.length ?? 0, accent: 'bg-[hsl(var(--chart-4))]' },
          { label: 'Open conversations', value: insights?.conversations.open ?? 0, accent: 'bg-[hsl(var(--chart-5))]' },
          { label: `Delivery rate (${days}d)`, value: delivery ? `${rate}%` : '—', accent: 'bg-emerald-500' },
          { label: 'Opted-out contacts', value: overview?.optOutCount ?? 0, accent: 'bg-[hsl(var(--chart-2))]' },
        ]}
      />

      <Tabs defaultValue="numbers" className="space-y-4">
        <TabsList className="rounded-[10px] flex-wrap h-auto">
          <TabsTrigger value="numbers" className="rounded-lg gap-1.5"><Phone className="h-4 w-4" />Numbers</TabsTrigger>
          <TabsTrigger value="inbox" className="rounded-lg gap-1.5"><SettingsIcon className="h-4 w-4" />Inbox tools</TabsTrigger>
          <TabsTrigger value="compliance" className="rounded-lg gap-1.5"><ShieldCheck className="h-4 w-4" />Webhook &amp; consent</TabsTrigger>
          <TabsTrigger value="insights" className="rounded-lg gap-1.5"><BarChart3 className="h-4 w-4" />Insights</TabsTrigger>
        </TabsList>

        {/* ---- numbers ---- */}
        <TabsContent value="numbers" className="mt-0">
          <WhatsAppSection flush title="Connected numbers" description="Quality rating and daily limit come straight from Meta." icon={<Phone />}>
            {!overview || overview.accounts.length === 0 ? (
              <EmptyState icon={<Phone strokeWidth={1.25} />}>No numbers yet. Use “Connect via Meta” to link your WhatsApp Business number.</EmptyState>
            ) : (
              <Table>
                <TableHeader><TableRow className="bg-muted/30">
                  {['Number', 'Quality', 'Daily limit', 'Webhook', 'Status', 'Routing'].map(h => <TableHead key={h} className="font-poppins text-xs">{h}</TableHead>)}
                  <TableHead className="text-right font-poppins text-xs">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {overview.accounts.map(a => {
                    const row = rowFor(a);
                    return (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="font-medium font-poppins flex items-center gap-1.5">{a.displayName || a.phoneNumber}{a.isDefault && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-label="Default" />}</div>
                          <div className="text-[11px] text-muted-foreground">{a.phoneNumber} · <span className="capitalize">{a.provider}</span></div>
                          {a.lastError && <div className="text-[11px] text-destructive max-w-[220px] truncate" title={a.lastError}>{a.lastError}</div>}
                        </TableCell>
                        <TableCell>{a.qualityRating ? <StatusPill tone={QUALITY_TONE[a.qualityRating] || 'muted'}>{a.qualityRating.toLowerCase()}</StatusPill> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-sm">{tier(a.messagingTier)}</TableCell>
                        <TableCell className="text-xs">
                          {a.provider !== 'meta' ? '—' : a.webhookSubscribedAt || a.lastWebhookAt
                            ? <><span className="text-emerald-600">Subscribed</span>{a.lastWebhookAt && <div className="text-muted-foreground">Last event {formatDistanceToNowStrict(new Date(a.lastWebhookAt))} ago</div>}</>
                            : <span className="text-amber-600">No events yet</span>}
                        </TableCell>
                        <TableCell><StatusPill tone={a.status === 'active' ? 'success' : 'muted'}>{a.status}</StatusPill></TableCell>
                        <TableCell><Button variant="ghost" size="sm" className="h-8 gap-1" disabled={!row} onClick={() => row && setRuleAccount(row)}><SettingsIcon className="h-3 w-3" />{a.assignmentRules.length ? `${a.assignmentRules.length} rule(s)` : 'Add rule'}</Button></TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {!a.isDefault && <Button variant="ghost" size="icon" title="Make default" onClick={() => makeDefault.mutate(a.id)}><Star className="h-4 w-4" /></Button>}
                          {a.provider === 'meta' && <Button variant="ghost" size="icon" title="Check with Meta" disabled={healthOne.isPending} onClick={() => healthOne.mutate(a.id)}><Activity className="h-4 w-4" /></Button>}
                          {a.connectionType === 'oauth' && a.phoneNumberId ? (
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive" onClick={() => window.confirm('Disconnect this number? Rules for it will be deactivated.') && disconnect.mutate(a.phoneNumberId!)}><Unplug className="h-3.5 w-3.5 mr-1" />Disconnect</Button>
                          ) : (
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => window.confirm('Remove this number?') && remove.mutate(a.id)}><Trash2 className="h-4 w-4" /></Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </WhatsAppSection>
        </TabsContent>

        {/* ---- inbox tools ---- */}
        <TabsContent value="inbox" className="mt-0"><InboxToolsPanel /></TabsContent>

        {/* ---- webhook & consent ---- */}
        <TabsContent value="compliance" className="mt-0">
          <div className="grid lg:grid-cols-2 gap-4 items-start">
            <WhatsAppSection title="Webhook" description="Meta sends messages and delivery updates to this address." icon={<Link2 />}>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Callback URL</p>
                  <div className="flex gap-2"><Input readOnly className="rounded-[10px] font-mono text-xs" value={overview?.webhook.callbackUrl || ''} /><Button variant="outline" size="icon" onClick={() => copy(overview?.webhook.callbackUrl || '')}><Copy className="h-4 w-4" /></Button></div>
                </div>
                <ul className="space-y-2">
                  <Check ok={!!overview?.webhook.verifyTokenConfigured} label="Verify token configured on the server" />
                  <Check ok={!!overview?.webhook.appSecretConfigured} label="App secret configured (signatures are verified)" />
                </ul>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Subscribe these fields in your Meta app</p>
                  <div className="flex flex-wrap gap-1.5">{overview?.webhook.subscribedFields.map(f => <code key={f} className="rounded bg-muted px-2 py-0.5 text-[11px]">{f}</code>)}</div>
                </div>
              </div>
            </WhatsAppSection>

            <WhatsAppSection title="Opted-out contacts" description="People who replied STOP never receive campaigns, nurturing or auto-responder messages." icon={<ShieldCheck />}>
              <div className="flex gap-2 mb-3">
                <Input className="rounded-[10px]" placeholder="Add a number, e.g. +919876543210" value={optPhone} onChange={e => setOptPhone(e.target.value)} />
                <Button className={WA_PRIMARY_BTN} disabled={optPhone.replace(/\D/g, '').length < 8 || addOpt.isPending} onClick={() => addOpt.mutate()}>Add</Button>
              </div>
              {optOuts.length === 0 ? <EmptyState>No opted-out contacts.</EmptyState> : (
                <ul className="divide-y divide-border max-h-72 overflow-y-auto">
                  {optOuts.map(o => (
                    <li key={o.id} className="flex items-center justify-between py-2">
                      <div><p className="text-sm">+{o.phoneNumber}</p><p className="text-[11px] text-muted-foreground">{o.reason === 'keyword' ? 'Replied STOP' : 'Added by your team'} · {formatIST(o.createdAt, 'dd MMM yyyy')}</p></div>
                      <Button variant="ghost" size="sm" onClick={() => delOpt.mutate(o.phoneNumber)}>Remove</Button>
                    </li>
                  ))}
                </ul>
              )}
            </WhatsAppSection>
          </div>
        </TabsContent>

        {/* ---- insights ---- */}
        <TabsContent value="insights" className="mt-0 space-y-4">
          <div className="flex justify-end">
            <Select value={days} onValueChange={setDays}><SelectTrigger className="h-8 w-36 rounded-[10px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="7">Last 7 days</SelectItem><SelectItem value="30">Last 30 days</SelectItem><SelectItem value="90">Last 90 days</SelectItem></SelectContent></Select>
          </div>
          <div className="grid lg:grid-cols-2 gap-4 items-start">
            <WhatsAppSection title="Messages per day" description="Sent by you vs received from customers." icon={<BarChart3 />}>
              {daily.length === 0 ? <EmptyState>No messages in this period.</EmptyState> : (
                <div className="flex items-end gap-1.5 h-40">
                  {daily.map(d => (
                    <div key={d.day} className="flex-1 flex flex-col justify-end h-full group" title={`${d.day}: ${d.out} sent, ${d.in} received`}>
                      <div className="w-full rounded-t bg-[hsl(var(--chart-4))]" style={{ height: `${(d.in / maxDay) * 100}%` }} />
                      <div className="w-full bg-[hsl(var(--chart-5))]" style={{ height: `${(d.out / maxDay) * 100}%` }} />
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-4 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[hsl(var(--chart-5))]" />Sent</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[hsl(var(--chart-4))]" />Received</span></div>
            </WhatsAppSection>

            <WhatsAppSection title="Delivery" description="Of the messages you sent." icon={<CheckCircle2 />}>
              <div className="space-y-3 text-xs">
                {[
                  ['Sent', delivery?.sent ?? 0, 100],
                  ['Delivered', delivery?.delivered ?? 0, rate],
                  ['Read', delivery?.read ?? 0, readRate],
                  ['Failed', delivery?.failed ?? 0, delivery?.sent ? Math.round(((delivery?.failed ?? 0) / (delivery.sent + (delivery.failed ?? 0))) * 100) : 0],
                ].map(([label, n, pct]) => (
                  <div key={label as string}><div className="flex justify-between mb-1"><span>{label}</span><span className="text-muted-foreground">{(n as number).toLocaleString()}{label !== 'Sent' && ` · ${pct}%`}</span></div><Progress value={pct as number} className="h-1.5" /></div>
                ))}
              </div>
              {insights && insights.outgoingBySource.length > 0 && (
                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground mb-2">Who sent them</p>
                  <ul className="space-y-1 text-xs">{insights.outgoingBySource.map(s => <li key={s.source} className="flex justify-between"><span className="capitalize">{s.source.replace(/_/g, ' ')}</span><span className="text-muted-foreground">{s.count.toLocaleString()}</span></li>)}</ul>
                </div>
              )}
              {insights && <p className="mt-4 text-[11px] text-muted-foreground">AI assistant replies this month: {insights.aiMessagesThisMonth.toLocaleString()}</p>}
            </WhatsAppSection>
          </div>
        </TabsContent>
      </Tabs>

      <AddWhatsAppAccountDialog open={addOpen} onOpenChange={o => { setAddOpen(o); if (!o) refreshAll(); }} accountToEdit={editAccount} />
      {ruleAccount && (
        <WhatsAppAssignmentRuleDialog
          open
          onOpenChange={o => { if (!o) { setRuleAccount(null); refreshAll(); } }}
          whatsappAccountId={ruleAccount.id}
          ruleToEdit={ruleAccount.assignmentRules?.[0] || null}
        />
      )}
    </WhatsAppPage>
  );
}
