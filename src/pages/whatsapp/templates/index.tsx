import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Eye, FileCheck2, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { deleteWhatsAppTemplate } from '@/services/whatsAppService';
import { templateApi } from '@/services/whatsAppHubService';
import { useSocket } from '@/contexts/useSocket';
import { WhatsAppConnectionGate } from '@/components/WhatsApp/hub/WhatsAppConnectionGate';
import { WhatsAppPage } from '@/components/WhatsApp/hub/WhatsAppPage';
import { WhatsAppStatsBar } from '@/components/WhatsApp/hub/WhatsAppStatsBar';
import { WhatsAppSection } from '@/components/WhatsApp/hub/WhatsAppSection';
import { StatusPill, type PillTone } from '@/components/WhatsApp/hub/StatusPill';
import { EmptyState } from '@/components/WhatsApp/hub/EmptyRow';
import { WA_OUTLINE_BTN, WA_PRIMARY_BTN } from '@/components/WhatsApp/hub/whatsappStyles';
import { CreateTemplateDialog } from '@/components/WhatsApp/hub/CreateTemplateDialog';
import { TemplatePreview } from '@/components/WhatsApp/hub/TemplatePreview';
import { cn } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/apiError';

interface Template {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
  rejectedReason?: string | null;
  components: Array<{ type: string; text?: string; buttons?: Array<{ type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'; text: string }> }>;
}

const STATUS_TONES: Record<string, PillTone> = {
  APPROVED: 'success',
  PENDING: 'warning',
  IN_APPEAL: 'warning',
  REJECTED: 'danger',
  PAUSED: 'warning',
  DISABLED: 'muted',
};

export default function WhatsAppTemplatesPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Template | null>(null);

  const { socket } = useSocket();
  const { data: templates = [], isFetching } = useQuery<Template[]>({
    queryKey: ['whatsapp', 'templates'],
    queryFn: () => templateApi.list(false),
  });
  const syncMutation = useMutation({
    mutationFn: () => templateApi.list(true),
    onSuccess: rows => { queryClient.setQueryData(['whatsapp', 'templates'], rows); toast.success('Templates synced with WhatsApp'); },
    onError: (err) => toast.error(apiErrorMessage(err, 'Could not sync templates')),
  });

  // WhatsApp reviews templates asynchronously; the server pushes the result.
  useEffect(() => {
    if (!socket) return;
    const onUpdate = (d: { name: string; status: string }) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'templates'] });
      toast.info(`Template “${d.name}” is now ${d.status.toLowerCase()}`);
    };
    socket.on('whatsapp_template_updated', onUpdate);
    return () => { socket.off('whatsapp_template_updated', onUpdate); };
  }, [socket, queryClient]);

  const deleteMutation = useMutation({
    mutationFn: (name: string) => deleteWhatsAppTemplate(name),
    onSuccess: () => {
      toast.success('Template deleted');
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'templates'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Failed to delete template')),
  });

  const filtered = useMemo(
    () => templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase())),
    [templates, search]
  );

  const part = (t: Template, type: string) => t.components.find(c => c.type === type);

  const countBy = (status: string) => templates.filter(t => t.status === status).length;

  return (
    <WhatsAppPage
      title="Message Templates"
      emoji="📄"
      subtitle="Create and manage WhatsApp templates approved by Meta."
      actions={
        <Button className={WA_PRIMARY_BTN} onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Create template
        </Button>
      }
    >
      <WhatsAppConnectionGate returnPath="/whatsapp/templates">
        <WhatsAppStatsBar
          loading={isFetching && templates.length === 0}
          tiles={[
            { label: 'Total', value: templates.length, accent: 'bg-[hsl(var(--chart-4))]' },
            { label: 'Approved', value: countBy('APPROVED'), accent: 'bg-emerald-500' },
            { label: 'Pending', value: countBy('PENDING') + countBy('IN_APPEAL'), accent: 'bg-[hsl(var(--chart-2))]' },
            { label: 'Rejected', value: countBy('REJECTED'), accent: 'bg-destructive' },
          ]}
        />

        <div className="grid lg:grid-cols-[1fr_340px] gap-4 items-start">
          <WhatsAppSection
            flush
            title="All templates"
            description="Select a template to preview it."
            icon={<FileCheck2 />}
            actions={
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9 h-9 w-48 rounded-[10px]" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Button variant="outline" size="icon" className={cn('h-9 w-9', WA_OUTLINE_BTN)} onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} aria-label="Sync with WhatsApp" title="Sync with WhatsApp">
                  <RefreshCw className={cn('h-4 w-4', (isFetching || syncMutation.isPending) && 'animate-spin')} />
                </Button>
              </div>
            }
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-poppins text-xs">Name</TableHead>
                  <TableHead className="font-poppins text-xs">Category</TableHead>
                  <TableHead className="font-poppins text-xs">Language</TableHead>
                  <TableHead className="font-poppins text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <EmptyState icon={<FileCheck2 strokeWidth={1.25} />}>
                        {isFetching ? 'Loading templates…' : 'No templates yet. Create your first one.'}
                      </EmptyState>
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(t => (
                  <TableRow
                    key={t.id || `${t.name}-${t.language}`}
                    onClick={() => setSelected(t)}
                    className={cn('cursor-pointer hover:bg-[hsl(var(--chart-5))]/5', selected?.id === t.id && 'bg-[hsl(var(--chart-5))]/10')}
                  >
                    <TableCell className="font-mono text-sm">{t.name}</TableCell>
                    <TableCell className="capitalize font-poppins text-sm">{t.category?.toLowerCase()}</TableCell>
                    <TableCell className="font-poppins text-sm">{t.language}</TableCell>
                    <TableCell>
                      <StatusPill tone={STATUS_TONES[t.status] || 'muted'}>{t.status?.replace('_', ' ').toLowerCase()}</StatusPill>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </WhatsAppSection>

          <WhatsAppSection title="Preview" icon={<Eye />}>
            {selected ? (
              <div className="space-y-3">
                <TemplatePreview
                  header={part(selected, 'HEADER')?.text}
                  body={part(selected, 'BODY')?.text || ''}
                  footer={part(selected, 'FOOTER')?.text}
                  buttons={part(selected, 'BUTTONS')?.buttons}
                />
                {selected.status === 'REJECTED' && (
                  <p className="rounded-[10px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    Rejected{selected.rejectedReason ? `: ${selected.rejectedReason.replace(/_/g, ' ').toLowerCase()}` : ''}. Edit the wording and submit it again under a new name.
                  </p>
                )}
                <Button
                  variant="outline"
                  className="w-full rounded-[10px] text-destructive hover:text-destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`Delete template "${selected.name}" in all languages?`)) deleteMutation.mutate(selected.name);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete template
                </Button>
              </div>
            ) : (
              <EmptyState icon={<Eye strokeWidth={1.25} />}>Select a template to preview it.</EmptyState>
            )}
          </WhatsAppSection>
        </div>

        <CreateTemplateDialog open={createOpen} onOpenChange={setCreateOpen} />
      </WhatsAppConnectionGate>
    </WhatsAppPage>
  );
}
