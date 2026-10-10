import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Ban, RotateCcw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WhatsAppPage } from '@/components/WhatsApp/hub/WhatsAppPage';
import { WhatsAppStatsBar } from '@/components/WhatsApp/hub/WhatsAppStatsBar';
import { WhatsAppSection } from '@/components/WhatsApp/hub/WhatsAppSection';
import { StatusPill, type PillTone } from '@/components/WhatsApp/hub/StatusPill';
import { EmptyState } from '@/components/WhatsApp/hub/EmptyRow';
import { WA_OUTLINE_BTN, WA_PRIMARY_BTN } from '@/components/WhatsApp/hub/whatsappStyles';
import { campaignApi } from '@/services/whatsAppHubService';
import { apiErrorMessage } from '@/lib/apiError';
import { formatIST } from '@/lib/dateUtils';
import { CAMPAIGN_TONE } from '@/components/WhatsApp/hub/campaignTone';

const MSG_TONE: Record<string, PillTone> = { sent: 'info', delivered: 'success', read: 'success', failed: 'danger', pending: 'muted' };

export default function WhatsAppCampaignDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['whatsapp', 'campaigns', id, status, page],
    queryFn: () => campaignApi.get(id, { status: status === 'all' ? undefined : status, page }),
    refetchInterval: q => (q.state.data?.campaign.status === 'sending' ? 4000 : false),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['whatsapp', 'campaigns'] });
  const act = (fn: () => Promise<unknown>, ok: string) => ({ mutationFn: fn, onSuccess: () => { toast.success(ok); refresh(); }, onError: (e: unknown) => toast.error(apiErrorMessage(e, 'Action failed')) });
  const sendNow = useMutation(act(() => campaignApi.send(id), 'Campaign is sending'));
  const retry = useMutation(act(() => campaignApi.retryFailed(id), 'Retrying failed recipients'));
  const cancel = useMutation(act(() => campaignApi.cancel(id), 'Campaign cancelled'));

  const c = data?.campaign;
  const stats = c?.stats;
  const pct = (a = 0, b = 0) => (b ? `${Math.round((a / b) * 100)}%` : '—');

  return (
    <WhatsAppPage
      title={c?.name || 'Campaign'}
      emoji="📣"
      subtitle={c ? `Template ${c.templateId || '—'} · ${c.audienceCount ?? 0} recipients` : 'Loading…'}
      showConnection={false}
      actions={
        <>
          <Button variant="outline" className={WA_OUTLINE_BTN} onClick={() => navigate('/whatsapp/campaigns')}><ArrowLeft className="h-4 w-4 mr-1.5" />All campaigns</Button>
          {c && ['draft', 'scheduled'].includes(c.status) && <>
            <Button variant="outline" className={WA_OUTLINE_BTN} disabled={cancel.isPending} onClick={() => cancel.mutate()}><Ban className="h-4 w-4 mr-1.5" />Cancel</Button>
            <Button className={WA_PRIMARY_BTN} disabled={sendNow.isPending} onClick={() => sendNow.mutate()}><Send className="h-4 w-4 mr-1.5" />Send now</Button>
          </>}
          {c && ['sent', 'failed'].includes(c.status) && (stats?.failed || 0) > 0 && (
            <Button className={WA_PRIMARY_BTN} disabled={retry.isPending} onClick={() => retry.mutate()}><RotateCcw className="h-4 w-4 mr-1.5" />Retry failed</Button>
          )}
        </>
      }
    >
      {c?.status && <div className="flex items-center gap-2 text-sm font-poppins">Status: <StatusPill tone={CAMPAIGN_TONE[c.status] || 'muted'}>{c.status}</StatusPill>{c.scheduledAt && c.status === 'scheduled' && <span className="text-xs text-muted-foreground">Starts {formatIST(c.scheduledAt, 'dd MMM yyyy, HH:mm')}</span>}</div>}
      {stats?.error && <p className="rounded-[10px] border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{stats.error}</p>}

      <WhatsAppStatsBar
        loading={isLoading}
        tiles={[
          { label: 'Sent', value: stats?.sent ?? 0, accent: 'bg-[hsl(var(--chart-4))]' },
          { label: `Delivered (${pct(stats?.delivered, stats?.sent)})`, value: stats?.delivered ?? 0, accent: 'bg-emerald-500' },
          { label: `Read (${pct(stats?.read, stats?.sent)})`, value: stats?.read ?? 0, accent: 'bg-[hsl(var(--chart-5))]' },
          { label: 'Replied', value: stats?.replied ?? 0, accent: 'bg-[hsl(var(--chart-2))]' },
          { label: 'Failed', value: stats?.failed ?? 0, accent: 'bg-destructive' },
        ]}
      />

      <WhatsAppSection
        flush title="Recipients" description="Delivery status for every message in this campaign."
        actions={<Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}><SelectTrigger className="h-8 w-36 rounded-[10px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{['all', 'sent', 'delivered', 'read', 'failed'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select>}
      >
        {!data || data.recipients.length === 0 ? <EmptyState>{isLoading ? 'Loading…' : 'No messages yet.'}</EmptyState> : (
          <>
            <Table>
              <TableHeader><TableRow className="bg-muted/30">{['Recipient', 'Number', 'Status', 'Sent at', 'Detail'].map(h => <TableHead key={h} className="font-poppins text-xs">{h}</TableHead>)}</TableRow></TableHeader>
              <TableBody>
                {data.recipients.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-poppins text-sm">{r.lead ? <Link className="text-[hsl(var(--chart-5))] hover:underline" to={`/leads/${r.lead.id}`}>{r.lead.firstName} {r.lead.lastName}</Link> : '—'}</TableCell>
                    <TableCell className="text-xs">+{r.phoneNumber}</TableCell>
                    <TableCell><StatusPill tone={MSG_TONE[r.status] || 'muted'}>{r.status}</StatusPill></TableCell>
                    <TableCell className="text-xs">{formatIST(r.createdAt, 'dd MMM, HH:mm')}</TableCell>
                    <TableCell className="text-xs text-destructive max-w-[280px] truncate">{r.errorMessage || ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between px-5 py-3 border-t border-border text-xs text-muted-foreground">
              <span>{data.total} message{data.total === 1 ? '' : 's'}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page * data.pageSize >= data.total} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </WhatsAppSection>
    </WhatsAppPage>
  );
}
