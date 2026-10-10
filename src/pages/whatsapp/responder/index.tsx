import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Clock, FileText, History, Pencil, Plus, Send, Trash2, UserPlus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WhatsAppPage } from '@/components/WhatsApp/hub/WhatsAppPage';
import { WhatsAppConnectionGate } from '@/components/WhatsApp/hub/WhatsAppConnectionGate';
import { WhatsAppStatsBar } from '@/components/WhatsApp/hub/WhatsAppStatsBar';
import { WhatsAppSection } from '@/components/WhatsApp/hub/WhatsAppSection';
import { StatusPill } from '@/components/WhatsApp/hub/StatusPill';
import { EmptyState } from '@/components/WhatsApp/hub/EmptyRow';
import { WorkflowDiagram } from '@/components/WhatsApp/hub/WorkflowDiagram';
import { TemplateParamsEditor } from '@/components/WhatsApp/hub/TemplateParamsEditor';
import { WorkingHoursEditor } from '@/components/WhatsApp/hub/WorkingHoursEditor';
import { SourceMultiSelect } from '@/components/WhatsApp/hub/SourceMultiSelect';
import { WA_OUTLINE_BTN, WA_PRIMARY_BTN } from '@/components/WhatsApp/hub/whatsappStyles';
import { DEFAULT_WORKING_HOURS, responderApi, type WaResponder } from '@/services/whatsAppHubService';
import { apiErrorMessage } from '@/lib/apiError';
import { formatIST } from '@/lib/dateUtils';

const DELAYS = [
  { v: 0, l: 'Immediately' }, { v: 2, l: 'After 2 minutes' }, { v: 5, l: 'After 5 minutes' }, { v: 15, l: 'After 15 minutes' },
  { v: 30, l: 'After 30 minutes' }, { v: 60, l: 'After 1 hour' }, { v: 240, l: 'After 4 hours' }, { v: 1440, l: 'After 1 day' },
];
const TIMEZONES = ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Australia/Sydney'];

const blank = (): Partial<WaResponder> & { templateParams: NonNullable<WaResponder['templateParams']> } => ({
  name: 'Welcome new leads', templateName: '', templateLanguage: 'en_US', templateParams: [], delayMinutes: 0, sources: [],
  workingHoursEnabled: false, workingHours: DEFAULT_WORKING_HOURS, timezone: 'Asia/Kolkata', outsideHoursBehavior: 'wait', isActive: false,
});

export default function WhatsAppResponderPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<(ReturnType<typeof blank> & { id?: string }) | null>(null);
  const [logsFor, setLogsFor] = useState<WaResponder | null>(null);

  const { data: responders = [], isLoading } = useQuery({ queryKey: ['whatsapp', 'responders'], queryFn: responderApi.list });
  const { data: logs = [] } = useQuery({ queryKey: ['whatsapp', 'responders', 'logs', logsFor?.id], queryFn: () => responderApi.logs(logsFor!.id), enabled: !!logsFor });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['whatsapp', 'responders'] });
  const save = useMutation({
    mutationFn: (r: NonNullable<typeof editing>) => (r.id ? responderApi.update(r.id, r) : responderApi.create(r)),
    onSuccess: () => { toast.success('Auto responder saved'); setEditing(null); refresh(); },
    onError: e => toast.error(apiErrorMessage(e, 'Could not save auto responder')),
  });
  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => responderApi.update(id, { isActive }),
    onSuccess: refresh, onError: e => toast.error(apiErrorMessage(e, 'Could not change status')),
  });
  const remove = useMutation({ mutationFn: responderApi.remove, onSuccess: () => { toast.success('Deleted'); refresh(); }, onError: e => toast.error(apiErrorMessage(e, 'Could not delete')) });

  const total = (k: 'sent' | 'failed') => responders.reduce((n, r) => n + (r.stats?.[k] || 0), 0);

  return (
    <WhatsAppPage
      title="Auto Responder"
      emoji="⚡"
      subtitle="Automatically message every new lead the moment they arrive."
      actions={<Button className={WA_PRIMARY_BTN} onClick={() => setEditing(blank())}><Plus className="h-4 w-4 mr-1.5" />New auto responder</Button>}
    >
      <WhatsAppConnectionGate returnPath="/whatsapp/responder">
        <WhatsAppStatsBar
          loading={isLoading}
          tiles={[
            { label: 'Responders', value: responders.length, accent: 'bg-[hsl(var(--chart-4))]' },
            { label: 'Active', value: responders.filter(r => r.isActive).length, accent: 'bg-emerald-500' },
            { label: 'Messages sent', value: total('sent'), accent: 'bg-[hsl(var(--chart-5))]' },
            { label: 'Failed', value: total('failed'), accent: 'bg-destructive' },
          ]}
        />

        <div className="grid lg:grid-cols-[1fr_320px] gap-4 items-start">
          <WhatsAppSection flush title="Auto-responder configuration" description="This message is sent to new leads from any of your integrations." icon={<Zap />}>
            {responders.length === 0 ? (
              <EmptyState icon={<Send strokeWidth={1.25} />}>No auto responder yet. Create one to greet new leads instantly.</EmptyState>
            ) : (
              <Table>
                <TableHeader><TableRow className="bg-muted/30">
                  <TableHead className="font-poppins text-xs">Name</TableHead><TableHead className="font-poppins text-xs">Template</TableHead>
                  <TableHead className="font-poppins text-xs">Timing</TableHead><TableHead className="font-poppins text-xs">Sent / Failed</TableHead>
                  <TableHead className="font-poppins text-xs">Active</TableHead><TableHead className="text-right font-poppins text-xs">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {responders.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium font-poppins">{r.name}<div className="text-[11px] text-muted-foreground font-normal">{r.sources.length ? r.sources.map(s => s.replace(/_/g, ' ')).join(', ') : 'All sources'}</div></TableCell>
                      <TableCell className="font-mono text-xs">{r.templateName}</TableCell>
                      <TableCell className="text-xs">{DELAYS.find(d => d.v === r.delayMinutes)?.l || `After ${r.delayMinutes} min`}{r.workingHoursEnabled && <div className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Working hours only</div>}</TableCell>
                      <TableCell className="text-sm">{r.stats?.sent ?? 0} / <span className={r.stats?.failed ? 'text-destructive' : ''}>{r.stats?.failed ?? 0}</span></TableCell>
                      <TableCell><Switch checked={r.isActive} disabled={toggle.isPending} onCheckedChange={v => toggle.mutate({ id: r.id, isActive: v })} /></TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" aria-label="Activity" onClick={() => setLogsFor(r)}><History className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing({ ...r, templateParams: r.templateParams || [], workingHours: r.workingHours || DEFAULT_WORKING_HOURS })}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" aria-label="Delete" onClick={() => window.confirm('Delete this auto responder?') && remove.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </WhatsAppSection>

          <WhatsAppSection title="How it works" icon={<FileText />}>
            <WorkflowDiagram steps={[
              { icon: <UserPlus />, title: 'New lead captured', detail: 'From Meta Ads, web forms, imports or manual entry', tone: 'blue' },
              { icon: <Clock />, title: 'Wait for your delay & hours', detail: 'Optionally hold until working hours open', tone: 'amber' },
              { icon: <Send />, title: 'Approved template sent', detail: 'Variables filled from the lead (name, source…)', tone: 'green' },
              { icon: <FileText />, title: 'Reply lands in Team Inbox', detail: 'Chatbot, AI agent or your team takes over', tone: 'green' },
            ]} />
            <p className="mt-3 text-[11px] text-muted-foreground leading-snug">Only leads created <strong>after</strong> you switch a responder on are messaged. WhatsApp requires an approved template to message someone first, and people who reply STOP are never contacted.</p>
          </WhatsAppSection>
        </div>

        {/* editor */}
        <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing?.id ? 'Edit auto responder' : 'New auto responder'}</DialogTitle><DialogDescription>Choose what new leads receive and when.</DialogDescription></DialogHeader>
            {editing && (
              <div className="space-y-4">
                <div className="space-y-1.5"><Label>Name</Label><Input className="rounded-[10px]" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
                <TemplateParamsEditor
                  templateName={editing.templateName || ''} templateLanguage={editing.templateLanguage || 'en_US'} params={editing.templateParams}
                  onChange={v => setEditing({ ...editing, templateName: v.templateName, templateLanguage: v.templateLanguage, templateParams: v.params })}
                />
                <div className="space-y-1.5">
                  <Label>Send</Label>
                  <Select value={String(editing.delayMinutes ?? 0)} onValueChange={v => setEditing({ ...editing, delayMinutes: Number(v) })}>
                    <SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{DELAYS.map(d => <SelectItem key={d.v} value={String(d.v)}>{d.l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Lead sources</Label><SourceMultiSelect value={editing.sources || []} onChange={sources => setEditing({ ...editing, sources })} /></div>

                <div className="rounded-[10px] border border-border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium font-poppins">Working hours only</p><p className="text-xs text-muted-foreground">Avoid messaging leads at night.</p></div>
                    <Switch checked={!!editing.workingHoursEnabled} onCheckedChange={v => setEditing({ ...editing, workingHoursEnabled: v })} />
                  </div>
                  {editing.workingHoursEnabled && (
                    <>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5"><Label className="text-xs">Time zone</Label>
                          <Select value={editing.timezone} onValueChange={v => setEditing({ ...editing, timezone: v })}><SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger><SelectContent>{TIMEZONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                        <div className="space-y-1.5"><Label className="text-xs">Outside working hours</Label>
                          <Select value={editing.outsideHoursBehavior} onValueChange={v => setEditing({ ...editing, outsideHoursBehavior: v as 'wait' | 'skip' })}><SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="wait">Wait until we open</SelectItem><SelectItem value="skip">Don't send</SelectItem></SelectContent></Select></div>
                      </div>
                      <WorkingHoursEditor value={editing.workingHours || DEFAULT_WORKING_HOURS} onChange={workingHours => setEditing({ ...editing, workingHours })} />
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-[10px] border border-border p-3">
                  <div><p className="text-sm font-medium font-poppins">Switch on now</p><p className="text-xs text-muted-foreground">Starts with leads that arrive from this moment.</p></div>
                  <Switch checked={!!editing.isActive} onCheckedChange={v => setEditing({ ...editing, isActive: v })} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button className={WA_PRIMARY_BTN} disabled={!editing?.templateName || save.isPending} onClick={() => editing && save.mutate(editing)}>{save.isPending ? 'Saving…' : 'Save'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* activity */}
        <Dialog open={!!logsFor} onOpenChange={o => !o && setLogsFor(null)}>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Recent activity · {logsFor?.name}</DialogTitle><DialogDescription>The latest 50 leads this responder handled.</DialogDescription></DialogHeader>
            {logs.length === 0 ? <EmptyState>No leads yet.</EmptyState> : (
              <Table><TableHeader><TableRow><TableHead>Lead</TableHead><TableHead>Status</TableHead><TableHead>When</TableHead></TableRow></TableHeader>
                <TableBody>{logs.map(l => (
                  <TableRow key={l.id}><TableCell className="font-poppins text-sm">{l.leadName}{l.error && <div className="text-[11px] text-muted-foreground">{l.error}</div>}</TableCell>
                    <TableCell><StatusPill tone={l.status === 'sent' ? 'success' : l.status === 'failed' ? 'danger' : l.status === 'skipped' ? 'muted' : 'warning'}>{l.status}</StatusPill></TableCell>
                    <TableCell className="text-xs">{formatIST(l.sentAt || l.scheduledFor, 'dd MMM, HH:mm')}</TableCell></TableRow>
                ))}</TableBody></Table>
            )}
            <Button variant="outline" className={WA_OUTLINE_BTN} onClick={() => setLogsFor(null)}>Close</Button>
          </DialogContent>
        </Dialog>
      </WhatsAppConnectionGate>
    </WhatsAppPage>
  );
}
