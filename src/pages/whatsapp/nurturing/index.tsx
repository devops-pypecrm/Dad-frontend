import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BellRing, Hourglass, MessageCircleReply, Pencil, Plus, Sprout, Trash2, UserMinus, UserPlus, Users, Workflow } from 'lucide-react';
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
import { StatusPill, type PillTone } from '@/components/WhatsApp/hub/StatusPill';
import { EmptyState } from '@/components/WhatsApp/hub/EmptyRow';
import { WorkflowDiagram } from '@/components/WhatsApp/hub/WorkflowDiagram';
import { TemplateParamsEditor } from '@/components/WhatsApp/hub/TemplateParamsEditor';
import { SourceMultiSelect } from '@/components/WhatsApp/hub/SourceMultiSelect';
import { WA_OUTLINE_BTN, WA_PRIMARY_BTN } from '@/components/WhatsApp/hub/whatsappStyles';
import { nurtureApi, type WaNurture, type WaNurtureStep } from '@/services/whatsAppHubService';
import { apiErrorMessage } from '@/lib/apiError';
import { formatIST } from '@/lib/dateUtils';

type Draft = Partial<WaNurture> & { steps: WaNurtureStep[] };

const UNITS = [{ k: 'minutes', f: 1 }, { k: 'hours', f: 60 }, { k: 'days', f: 1440 }] as const;
const split = (mins: number) => { const u = mins % 1440 === 0 ? UNITS[2] : mins % 60 === 0 ? UNITS[1] : UNITS[0]; return { value: mins / u.f, unit: u.k as string }; };
const toMinutes = (value: number, unit: string) => Math.max(5, Math.round(value * (UNITS.find(u => u.k === unit)?.f || 1)));
const describe = (mins: number) => { const s = split(mins); return `${s.value} ${s.value === 1 ? s.unit.slice(0, -1) : s.unit}`; };

const emptyStep = (delayMinutes: number): WaNurtureStep => ({ delayMinutes, templateName: '', templateLanguage: 'en_US', templateParams: [] });
const recommended = (): WaNurtureStep[] => [emptyStep(1440), emptyStep(2880), emptyStep(5760)]; // 1d, +2d (day 3), +4d (day 7)

const ENROLL_TONE: Record<string, PillTone> = { active: 'info', completed: 'success', replied: 'success', opted_out: 'muted', failed: 'danger', cancelled: 'muted' };

export default function WhatsAppNurturingPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [viewing, setViewing] = useState<WaNurture | null>(null);

  const { data: sequences = [], isLoading } = useQuery({ queryKey: ['whatsapp', 'nurture'], queryFn: nurtureApi.list });
  const { data: enrollments = [] } = useQuery({ queryKey: ['whatsapp', 'nurture', 'enrollments', viewing?.id], queryFn: () => nurtureApi.enrollments(viewing!.id), enabled: !!viewing });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['whatsapp', 'nurture'] });
  const save = useMutation({
    mutationFn: (d: Draft) => (d.id ? nurtureApi.update(d.id, d) : nurtureApi.create(d)),
    onSuccess: () => { toast.success('Sequence saved'); setEditing(null); refresh(); },
    onError: e => toast.error(apiErrorMessage(e, 'Could not save sequence')),
  });
  const toggle = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => nurtureApi.update(id, { isActive }), onSuccess: refresh, onError: e => toast.error(apiErrorMessage(e, 'Could not change status')) });
  const remove = useMutation({ mutationFn: nurtureApi.remove, onSuccess: () => { toast.success('Deleted'); refresh(); }, onError: e => toast.error(apiErrorMessage(e, 'Could not delete')) });

  const sum = (k: string) => sequences.reduce((n, s) => n + (s.stats?.[k] || 0), 0);
  const setStep = (i: number, patch: Partial<WaNurtureStep>) => editing && setEditing({ ...editing, steps: editing.steps.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  const stepsValid = !!editing && editing.steps.length > 0 && editing.steps.every(s => s.templateName);

  return (
    <WhatsAppPage
      title="Lead Nurturing"
      emoji="🌱"
      subtitle="Follow up with new leads automatically until they reply."
      actions={<Button className={WA_PRIMARY_BTN} onClick={() => setEditing({ name: 'New lead follow-up', sources: [], stopOnReply: true, isActive: false, steps: recommended() })}><Plus className="h-4 w-4 mr-1.5" />New sequence</Button>}
    >
      <WhatsAppConnectionGate returnPath="/whatsapp/nurturing">
        <WhatsAppStatsBar
          loading={isLoading}
          tiles={[
            { label: 'Sequences', value: sequences.length, accent: 'bg-[hsl(var(--chart-4))]' },
            { label: 'Leads in progress', value: sum('active'), accent: 'bg-[hsl(var(--chart-2))]' },
            { label: 'Replied', value: sum('replied'), accent: 'bg-emerald-500' },
            { label: 'Completed', value: sum('completed'), accent: 'bg-[hsl(var(--chart-5))]' },
          ]}
        />

        <div className="grid lg:grid-cols-[1fr_320px] gap-4 items-start">
          <WhatsAppSection flush title="Lead nurturing configuration" description="Each sequence sends approved templates with a delay between steps." icon={<Sprout />}>
            {sequences.length === 0 ? (
              <EmptyState icon={<Workflow strokeWidth={1.25} />}>No sequences yet. Create one to re-engage leads that go quiet.</EmptyState>
            ) : (
              <Table>
                <TableHeader><TableRow className="bg-muted/30">
                  <TableHead className="font-poppins text-xs">Sequence</TableHead><TableHead className="font-poppins text-xs">Steps</TableHead>
                  <TableHead className="font-poppins text-xs">Leads</TableHead><TableHead className="font-poppins text-xs">Active</TableHead>
                  <TableHead className="text-right font-poppins text-xs">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {sequences.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium font-poppins">{s.name}<div className="text-[11px] text-muted-foreground font-normal">{s.sources.length ? s.sources.map(x => x.replace(/_/g, ' ')).join(', ') : 'All sources'}</div></TableCell>
                      <TableCell className="text-xs">{s.steps.map((st, i) => <div key={i}>{i + 1}. {describe(st.delayMinutes)} → <span className="font-mono">{st.templateName}</span></div>)}</TableCell>
                      <TableCell className="text-xs">{s.stats?.active ?? 0} in progress<div className="text-muted-foreground">{s.stats?.replied ?? 0} replied · {s.stats?.completed ?? 0} done</div></TableCell>
                      <TableCell><Switch checked={s.isActive} disabled={toggle.isPending} onCheckedChange={v => toggle.mutate({ id: s.id, isActive: v })} /></TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" aria-label="Leads" onClick={() => setViewing(s)}><Users className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing({ ...s })}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" aria-label="Delete" onClick={() => window.confirm('Delete this sequence? Leads in progress will stop receiving it.') && remove.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </WhatsAppSection>

          <WhatsAppSection title="How it works" icon={<Workflow />}>
            <WorkflowDiagram steps={[
              { icon: <UserPlus />, title: 'Unqualified lead', detail: 'A new lead enters the sequence', tone: 'blue' },
              { icon: <BellRing />, title: 'Reminder 1 · after 1 day', detail: 'Approved template', tone: 'green' },
              { icon: <BellRing />, title: 'Reminder 2 · after 3 days', tone: 'green' },
              { icon: <BellRing />, title: 'Reminder 3 · after 7 days', tone: 'green' },
              { icon: <MessageCircleReply />, title: 'Any reply stops the sequence', detail: 'The chat moves to your Team Inbox', tone: 'amber' },
              { icon: <UserMinus />, title: 'No reply at the end', detail: 'Lead is tagged "whatsapp_unengaged"', tone: 'muted' },
            ]} />
          </WhatsAppSection>
        </div>

        {/* editor */}
        <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing?.id ? 'Edit sequence' : 'New sequence'}</DialogTitle><DialogDescription>Each step waits after the previous one. A reply from the lead stops the sequence.</DialogDescription></DialogHeader>
            {editing && (
              <div className="space-y-4">
                <div className="space-y-1.5"><Label>Name</Label><Input className="rounded-[10px]" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Lead sources</Label><SourceMultiSelect value={editing.sources || []} onChange={sources => setEditing({ ...editing, sources })} /></div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between"><Label>Steps</Label>
                    <Button type="button" variant="outline" size="sm" className={WA_OUTLINE_BTN} disabled={editing.steps.length >= 10} onClick={() => setEditing({ ...editing, steps: [...editing.steps, emptyStep(1440)] })}><Plus className="h-3.5 w-3.5 mr-1" />Add step</Button></div>
                  {editing.steps.map((st, i) => {
                    const d = split(st.delayMinutes);
                    return (
                      <div key={i} className="rounded-[10px] border border-border p-3 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--chart-5))]/15 text-xs font-semibold text-[hsl(var(--chart-5))]">{i + 1}</span>
                          <Hourglass className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{i === 0 ? 'Send' : 'Then send'} after</span>
                          <Input type="number" min={1} className="h-8 w-20 rounded-lg" value={d.value} onChange={e => setStep(i, { delayMinutes: toMinutes(Number(e.target.value) || 1, d.unit) })} />
                          <Select value={d.unit} onValueChange={u => setStep(i, { delayMinutes: toMinutes(d.value, u) })}>
                            <SelectTrigger className="h-8 w-28 rounded-lg"><SelectValue /></SelectTrigger>
                            <SelectContent>{UNITS.map(u => <SelectItem key={u.k} value={u.k}>{u.k}</SelectItem>)}</SelectContent>
                          </Select>
                          <span className="text-xs text-muted-foreground">{i === 0 ? 'the lead arrives' : 'the previous step'}</span>
                          <Button type="button" variant="ghost" size="icon" className="ml-auto text-destructive" disabled={editing.steps.length <= 1} onClick={() => setEditing({ ...editing, steps: editing.steps.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <TemplateParamsEditor
                          templateName={st.templateName} templateLanguage={st.templateLanguage} params={st.templateParams || []}
                          onChange={v => setStep(i, { templateName: v.templateName, templateLanguage: v.templateLanguage, templateParams: v.params })}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between rounded-[10px] border border-border p-3">
                  <div><p className="text-sm font-medium font-poppins">Stop when the lead replies</p><p className="text-xs text-muted-foreground">Recommended: a human or chatbot takes over from there.</p></div>
                  <Switch checked={editing.stopOnReply !== false} onCheckedChange={v => setEditing({ ...editing, stopOnReply: v })} />
                </div>
                <div className="flex items-center justify-between rounded-[10px] border border-border p-3">
                  <div><p className="text-sm font-medium font-poppins">Switch on now</p><p className="text-xs text-muted-foreground">Starts with leads that arrive from this moment.</p></div>
                  <Switch checked={!!editing.isActive} onCheckedChange={v => setEditing({ ...editing, isActive: v })} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button className={WA_PRIMARY_BTN} disabled={!stepsValid || save.isPending} onClick={() => editing && save.mutate(editing)}>{save.isPending ? 'Saving…' : 'Save sequence'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* enrolments */}
        <Dialog open={!!viewing} onOpenChange={o => !o && setViewing(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Leads in “{viewing?.name}”</DialogTitle><DialogDescription>The 100 most recently updated.</DialogDescription></DialogHeader>
            {enrollments.length === 0 ? <EmptyState>No leads enrolled yet.</EmptyState> : (
              <Table><TableHeader><TableRow><TableHead>Lead</TableHead><TableHead>Status</TableHead><TableHead>Progress</TableHead><TableHead>Next message</TableHead></TableRow></TableHeader>
                <TableBody>{enrollments.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-poppins text-sm">{e.leadName || `+${e.phoneNumber}`}{e.lastError && <div className="text-[11px] text-destructive">{e.lastError}</div>}</TableCell>
                    <TableCell><StatusPill tone={ENROLL_TONE[e.status] || 'muted'}>{e.status.replace('_', ' ')}</StatusPill></TableCell>
                    <TableCell className="text-sm">{e.stepsSent}/{viewing?.steps.length}</TableCell>
                    <TableCell className="text-xs">{e.nextRunAt ? formatIST(e.nextRunAt, 'dd MMM, HH:mm') : '—'}</TableCell>
                  </TableRow>
                ))}</TableBody></Table>
            )}
          </DialogContent>
        </Dialog>
      </WhatsAppConnectionGate>
    </WhatsAppPage>
  );
}
