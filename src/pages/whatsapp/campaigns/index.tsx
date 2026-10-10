import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Megaphone, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WhatsAppPage } from '@/components/WhatsApp/hub/WhatsAppPage';
import { WhatsAppConnectionGate } from '@/components/WhatsApp/hub/WhatsAppConnectionGate';
import { WhatsAppStatsBar } from '@/components/WhatsApp/hub/WhatsAppStatsBar';
import { WhatsAppSection } from '@/components/WhatsApp/hub/WhatsAppSection';
import { StatusPill } from '@/components/WhatsApp/hub/StatusPill';
import { CAMPAIGN_TONE } from '@/components/WhatsApp/hub/campaignTone';
import { EmptyState } from '@/components/WhatsApp/hub/EmptyRow';
import { CampaignWizardDialog } from '@/components/WhatsApp/hub/CampaignWizardDialog';
import { WA_PRIMARY_BTN } from '@/components/WhatsApp/hub/whatsappStyles';
import { campaignApi } from '@/services/whatsAppHubService';
import { apiErrorMessage } from '@/lib/apiError';
import { formatIST } from '@/lib/dateUtils';

export default function WhatsAppCampaignsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [wizard, setWizard] = useState(false);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['whatsapp', 'campaigns'], queryFn: campaignApi.list,
    refetchInterval: q => (q.state.data?.some(c => c.status === 'sending') ? 5000 : false),
  });
  const remove = useMutation({
    mutationFn: campaignApi.remove,
    onSuccess: () => { toast.success('Campaign deleted'); queryClient.invalidateQueries({ queryKey: ['whatsapp', 'campaigns'] }); },
    onError: e => toast.error(apiErrorMessage(e, 'Could not delete')),
  });

  const sum = (k: 'sent' | 'delivered' | 'read' | 'replied') => campaigns.reduce((n, c) => n + (c.stats?.[k] || 0), 0);
  const rate = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');

  return (
    <WhatsAppPage
      title="Campaigns"
      emoji="📣"
      subtitle="Send template broadcasts to your leads and track every message."
      actions={<Button className={WA_PRIMARY_BTN} onClick={() => setWizard(true)}><Plus className="h-4 w-4 mr-1.5" />New campaign</Button>}
    >
      <WhatsAppConnectionGate returnPath="/whatsapp/campaigns">
        <WhatsAppStatsBar
          loading={isLoading}
          tiles={[
            { label: 'Campaigns', value: campaigns.length, accent: 'bg-[hsl(var(--chart-4))]' },
            { label: 'Messages sent', value: sum('sent'), accent: 'bg-emerald-500' },
            { label: 'Delivery rate', value: rate(sum('delivered'), sum('sent')), accent: 'bg-[hsl(var(--chart-5))]' },
            { label: 'Read rate', value: rate(sum('read'), sum('sent')), accent: 'bg-[hsl(var(--chart-2))]' },
            { label: 'Replies', value: sum('replied'), accent: 'bg-muted-foreground' },
          ]}
        />

        <WhatsAppSection flush title="Broadcast history" description="Click a campaign to see every recipient's delivery status." icon={<Megaphone />}>
          {isLoading ? <EmptyState>Loading campaigns…</EmptyState> : campaigns.length === 0 ? (
            <EmptyState icon={<Megaphone strokeWidth={1.25} />}>No campaigns yet. Create your first broadcast.</EmptyState>
          ) : (
            <Table>
              <TableHeader><TableRow className="bg-muted/30">
                {['Status', 'Name', 'Template', 'Sent', 'Delivered', 'Read', 'Failed', 'When'].map(h => <TableHead key={h} className="font-poppins text-xs">{h}</TableHead>)}
                <TableHead className="text-right font-poppins text-xs">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {campaigns.map(c => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-[hsl(var(--chart-5))]/5" onClick={() => navigate(`/whatsapp/campaigns/${c.id}`)}>
                    <TableCell><StatusPill tone={CAMPAIGN_TONE[c.status] || 'muted'}>{c.status}</StatusPill></TableCell>
                    <TableCell className="font-medium font-poppins">{c.name}</TableCell>
                    <TableCell className="font-mono text-xs">{c.templateId || <span className="text-muted-foreground">free text (legacy)</span>}</TableCell>
                    <TableCell className="text-sm">{c.stats?.sent ?? 0}</TableCell>
                    <TableCell className="text-sm">{c.stats?.delivered ?? 0}</TableCell>
                    <TableCell className="text-sm">{c.stats?.read ?? 0}</TableCell>
                    <TableCell className={c.stats?.failed ? 'text-sm text-destructive' : 'text-sm'}>{c.stats?.failed ?? 0}</TableCell>
                    <TableCell className="text-xs">{c.scheduledAt && c.status === 'scheduled' ? `Scheduled ${formatIST(c.scheduledAt, 'dd MMM, HH:mm')}` : formatIST(c.sentAt || c.createdAt, 'dd MMM yyyy')}</TableCell>
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="text-destructive" disabled={c.status === 'sending'} onClick={() => window.confirm('Delete this campaign?') && remove.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </WhatsAppSection>

        <CampaignWizardDialog open={wizard} onOpenChange={setWizard} onCreated={id => navigate(`/whatsapp/campaigns/${id}`)} />
      </WhatsAppConnectionGate>
    </WhatsAppPage>
  );
}
