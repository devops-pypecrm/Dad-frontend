import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Megaphone, MessagesSquare, FileText } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WhatsAppPage } from '@/components/WhatsApp/hub/WhatsAppPage';
import { WhatsAppConnectionGate } from '@/components/WhatsApp/hub/WhatsAppConnectionGate';
import { WhatsAppStatsBar } from '@/components/WhatsApp/hub/WhatsAppStatsBar';
import { WhatsAppSection } from '@/components/WhatsApp/hub/WhatsAppSection';
import { EmptyState } from '@/components/WhatsApp/hub/EmptyRow';
import { AccountPicker, Unavailable } from '@/components/WhatsApp/tools/AccountPicker';
import { waToolsApi } from '@/services/whatsAppToolsService';
import { apiErrorMessage } from '@/lib/apiError';

const GREEN = '#25D366', TEAL = '#128C7E';
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');
const label = (s: string) => s.toLowerCase().replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());

export default function WhatsAppAnalytics() {
  const [accountId, setAccountId] = useState<string | undefined>();
  const [days, setDays] = useState(30);
  const q = useQuery({ queryKey: ['wa-tools', 'analytics', accountId, days], queryFn: () => waToolsApi.analytics(accountId, days), retry: false });
  const refs = useQuery({ queryKey: ['wa-tools', 'referrals', days], queryFn: () => waToolsApi.referrals(days) });

  const msg = q.data?.messaging.available ? q.data.messaging.data : [];
  const conv = q.data?.conversations.available ? q.data.conversations.data : [];
  const sent = msg.reduce((s, d) => s + d.sent, 0), delivered = msg.reduce((s, d) => s + d.delivered, 0);
  const convoTotal = conv.reduce((s, d) => s + d.conversations, 0), cost = conv.reduce((s, d) => s + d.cost, 0);
  const catTotals = new Map<string, number>();
  for (const c of conv) catTotals.set(c.category, (catTotals.get(c.category) || 0) + c.conversations);
  const byCategory = [...catTotals.entries()].map(([name, value]) => ({ name: label(name), value }));

  return (
    <WhatsAppPage
      title="Analytics"
      subtitle="Message delivery, conversations and template performance, straight from Meta"
      actions={<>
        <AccountPicker value={accountId} onChange={setAccountId} />
        <Select value={String(days)} onValueChange={v => setDays(Number(v))}>
          <SelectTrigger className="h-9 w-[130px] text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>{[7, 30, 60, 90].map(d => <SelectItem key={d} value={String(d)}>Last {d} days</SelectItem>)}</SelectContent>
        </Select>
      </>}
    >
      <WhatsAppConnectionGate returnPath="/whatsapp/analytics">
        {q.error ? <Unavailable error={apiErrorMessage(q.error, 'Could not load analytics')} /> : <>
          <WhatsAppStatsBar loading={q.isLoading} tiles={[
            { label: 'Messages sent', value: sent.toLocaleString() },
            { label: 'Delivered', value: delivered.toLocaleString() },
            { label: 'Delivery rate', value: pct(delivered, sent) },
            { label: 'Conversations', value: convoTotal.toLocaleString() },
            { label: 'Meta charges', value: cost ? cost.toFixed(2) : '—' },
          ]} />

          <WhatsAppSection title="Messages over time" description="Sent vs delivered per day" icon={<BarChart3 />}>
            {q.data && !q.data.messaging.available ? <Unavailable error={q.data.messaging.error} /> : msg.length === 0 ? <EmptyState>No messages in this period.</EmptyState> : (
              <div className="h-64"><ResponsiveContainer width="100%" height="100%">
                <AreaChart data={msg}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} /><YAxis tick={{ fontSize: 11 }} allowDecimals={false} /><Tooltip />
                  <Area type="monotone" dataKey="sent" stroke={TEAL} fill={TEAL} fillOpacity={0.15} /><Area type="monotone" dataKey="delivered" stroke={GREEN} fill={GREEN} fillOpacity={0.25} /></AreaChart>
              </ResponsiveContainer></div>
            )}
          </WhatsAppSection>

          <div className="grid gap-6 lg:grid-cols-2">
            <WhatsAppSection title="Conversations by category" description="Marketing, utility, authentication and service" icon={<MessagesSquare />}>
              {q.data && !q.data.conversations.available ? <Unavailable error={q.data.conversations.error} /> : byCategory.length === 0 ? <EmptyState>No conversation data yet.</EmptyState> : (
                <div className="h-56"><ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCategory}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill={TEAL} radius={[4, 4, 0, 0]} /></BarChart>
                </ResponsiveContainer></div>
              )}
            </WhatsAppSection>

            <WhatsAppSection title="Template performance" description="Top approved templates in this period" icon={<FileText />} flush>
              {q.data && !q.data.templates.available ? <div className="p-5"><Unavailable error={q.data.templates.error} /></div> : !q.data?.templates.available || q.data.templates.data.length === 0 ? <EmptyState>No template activity yet.</EmptyState> : (
                <Table><TableHeader><TableRow>{['Template', 'Sent', 'Delivered', 'Read', 'Clicked'].map(h => <TableHead key={h} className="text-xs">{h}</TableHead>)}</TableRow></TableHeader>
                  <TableBody>{q.data.templates.data.map(t => (
                    <TableRow key={t.name}><TableCell className="font-medium">{t.name}</TableCell><TableCell>{t.sent}</TableCell><TableCell>{t.delivered}</TableCell><TableCell>{t.read} <span className="text-xs text-muted-foreground">({pct(t.read, t.delivered)})</span></TableCell><TableCell>{t.clicked}</TableCell></TableRow>
                  ))}</TableBody></Table>
              )}
            </WhatsAppSection>
          </div>

          <WhatsAppSection title="Click-to-WhatsApp ads" description="Chats that started from a Facebook or Instagram ad or post" icon={<Megaphone />} flush>
            {!refs.data || refs.data.total === 0 ? <EmptyState icon={<Megaphone strokeWidth={1.25} />}>No ad-driven chats yet. When someone taps a Click-to-WhatsApp ad and messages you, it is tracked here.</EmptyState> : (
              <div>
                <div className="grid grid-cols-2 gap-4 px-5 pb-3 text-sm"><div><p className="text-muted-foreground">Chats from ads</p><p className="text-2xl font-light">{refs.data.total}</p></div><div><p className="text-muted-foreground">Unique people</p><p className="text-2xl font-light">{refs.data.uniqueContacts}</p></div></div>
                <Table><TableHeader><TableRow>{['Ad / post', 'Type', 'Chats', 'People'].map(h => <TableHead key={h} className="text-xs">{h}</TableHead>)}</TableRow></TableHeader>
                  <TableBody>{refs.data.sources.map(s => (
                    <TableRow key={s.sourceId || s.headline}><TableCell className="font-medium">{s.sourceUrl ? <a className="hover:underline" href={s.sourceUrl} target="_blank" rel="noreferrer">{s.headline || s.sourceId}</a> : (s.headline || s.sourceId || 'Unknown')}</TableCell><TableCell className="capitalize">{s.sourceType || '—'}</TableCell><TableCell>{s.chats}</TableCell><TableCell>{s.contacts}</TableCell></TableRow>
                  ))}</TableBody></Table>
              </div>
            )}
          </WhatsAppSection>
        </>}
      </WhatsAppConnectionGate>
    </WhatsAppPage>
  );
}
