import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { campaignApi, type AudienceFilter, type AudiencePreview, type ParamSpec } from '@/services/whatsAppHubService';
import { whatsAppAccountService } from '@/services/whatsAppAccountService';
import { whatsAppFlowService } from '@/services/whatsAppFlowService';
import { useLeadStatuses } from '@/hooks/useLeadStatuses';
import { apiErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';
import { TemplateParamsEditor } from './TemplateParamsEditor';
import { SourceMultiSelect } from './SourceMultiSelect';
import { WA_PRIMARY_BTN, WA_OUTLINE_BTN } from './whatsappStyles';

interface Props { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (id: string) => void }

const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);

export function CampaignWizardDialog({ open, onOpenChange, onCreated }: Props) {
  const queryClient = useQueryClient();
  const { statuses } = useLeadStatuses();
  const { data: accounts = [] } = useQuery({ queryKey: ['whatsapp-accounts'], queryFn: whatsAppAccountService.getWhatsAppAccounts, enabled: open });
  const { data: flows = [] } = useQuery({ queryKey: ['whatsapp-flows'], queryFn: whatsAppFlowService.getFlows, enabled: open });

  const [name, setName] = useState('');
  const [accountId, setAccountId] = useState('default');
  const [tpl, setTpl] = useState<{ templateName: string; templateLanguage: string; params: ParamSpec[] }>({ templateName: '', templateLanguage: 'en_US', params: [] });
  const [audienceMode, setAudienceMode] = useState<'filter' | 'test'>('filter');
  const [filter, setFilter] = useState<AudienceFilter>({ sources: [], statuses: [], tags: [] });
  const [tagText, setTagText] = useState('');
  const [testNumber, setTestNumber] = useState('');
  const [flowId, setFlowId] = useState('none');
  const [when, setWhen] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [preview, setPreview] = useState<AudiencePreview | null>(null);

  const activeFilter = (): AudienceFilter => ({
    ...(filter.sources?.length ? { sources: filter.sources } : {}),
    ...(filter.statuses?.length ? { statuses: filter.statuses } : {}),
    ...(tagText.trim() ? { tags: tagText.split(',').map(t => t.trim()).filter(Boolean) } : {}),
    ...(filter.createdFrom ? { createdFrom: filter.createdFrom } : {}),
    ...(filter.createdTo ? { createdTo: filter.createdTo } : {}),
  });
  const acct = accountId === 'default' ? null : accountId;

  const previewMut = useMutation({
    mutationFn: () => campaignApi.preview({ audienceFilter: audienceMode === 'filter' ? activeFilter() : undefined, recipients: audienceMode === 'test' ? [{ type: 'phone', phone: testNumber }] : undefined, whatsappAccountId: acct }),
    onSuccess: setPreview, onError: e => toast.error(apiErrorMessage(e, 'Could not build the audience')),
  });

  const reset = () => { setName(''); setTpl({ templateName: '', templateLanguage: 'en_US', params: [] }); setFilter({ sources: [], statuses: [], tags: [] }); setTagText(''); setTestNumber(''); setFlowId('none'); setWhen('now'); setScheduledAt(''); setPreview(null); setAudienceMode('filter'); };

  const create = useMutation({
    mutationFn: (sendNow: boolean) => campaignApi.create({
      name, whatsappAccountId: acct, templateId: tpl.templateName, templateLanguage: tpl.templateLanguage, templateParams: tpl.params,
      ...(audienceMode === 'filter' ? { audienceFilter: activeFilter() } : { testNumber }),
      flowId: flowId === 'none' ? undefined : flowId,
      scheduledAt: when === 'later' && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      status: sendNow ? 'sent' : 'draft',
    }),
    onSuccess: (c, sendNow) => {
      toast.success(sendNow ? 'Campaign is sending' : when === 'later' ? 'Campaign scheduled' : 'Draft saved');
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'campaigns'] });
      reset(); onOpenChange(false); onCreated(c.id);
    },
    onError: e => toast.error(apiErrorMessage(e, 'Could not create campaign')),
  });

  const audienceReady = audienceMode === 'test' ? testNumber.replace(/\D/g, '').length >= 8 : true;
  const canCreate = !!name.trim() && !!tpl.templateName && audienceReady && (when === 'now' || !!scheduledAt) && !(preview?.exceedsCapacity);

  return (
    <Dialog open={open} onOpenChange={o => { onOpenChange(o); }}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New WhatsApp campaign</DialogTitle>
          <DialogDescription>Broadcasts use approved templates only. People who replied STOP are skipped automatically.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Campaign name</Label><Input className="rounded-[10px]" placeholder="e.g. Diwali offer" value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Send from</Label>
              <Select value={accountId} onValueChange={setAccountId}><SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="default">Default number</SelectItem>{accounts.filter(a => a.provider === 'meta').map(a => <SelectItem key={a.id} value={a.id}>{a.displayName || a.phoneNumber}</SelectItem>)}</SelectContent></Select></div>
          </section>

          <section className="space-y-2"><h3 className="text-sm font-medium font-poppins">1 · Message</h3>
            <TemplateParamsEditor templateName={tpl.templateName} templateLanguage={tpl.templateLanguage} params={tpl.params} onChange={setTpl} /></section>

          <section className="space-y-3"><h3 className="text-sm font-medium font-poppins">2 · Audience</h3>
            <RadioGroup value={audienceMode} onValueChange={v => { setAudienceMode(v as 'filter' | 'test'); setPreview(null); }} className="flex gap-4">
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="filter" /> Leads matching a filter</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="test" /> A single test number</label>
            </RadioGroup>

            {audienceMode === 'filter' ? (
              <div className="space-y-3 rounded-[10px] border border-border p-3">
                <div className="space-y-1.5"><Label className="text-xs">Lead source</Label><SourceMultiSelect value={filter.sources || []} onChange={sources => { setFilter({ ...filter, sources }); setPreview(null); }} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Lead status</Label>
                  <div className="flex flex-wrap gap-1.5">{statuses.map(s => (
                    <button key={s.id} type="button" onClick={() => { setFilter({ ...filter, statuses: toggle(filter.statuses || [], s.id) }); setPreview(null); }}
                      className={cn('rounded-full border px-2.5 py-1 text-xs transition-colors', filter.statuses?.includes(s.id) ? 'bg-[hsl(var(--chart-5))] border-transparent text-white' : 'bg-white hover:bg-muted')}>{s.label}</button>))}</div></div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5"><Label className="text-xs">Tags (comma separated)</Label><Input className="h-9 rounded-[10px]" value={tagText} onChange={e => { setTagText(e.target.value); setPreview(null); }} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Created from</Label><Input type="date" className="h-9 rounded-[10px]" value={filter.createdFrom?.slice(0, 10) || ''} onChange={e => { setFilter({ ...filter, createdFrom: e.target.value ? new Date(e.target.value).toISOString() : undefined }); setPreview(null); }} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Created to</Label><Input type="date" className="h-9 rounded-[10px]" value={filter.createdTo?.slice(0, 10) || ''} onChange={e => { setFilter({ ...filter, createdTo: e.target.value ? new Date(`${e.target.value}T23:59:59`).toISOString() : undefined }); setPreview(null); }} /></div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5"><Label className="text-xs">Test number (with country code)</Label><Input className="rounded-[10px]" placeholder="+919876543210" value={testNumber} onChange={e => { setTestNumber(e.target.value); setPreview(null); }} /></div>
            )}

            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" className={WA_OUTLINE_BTN} disabled={!audienceReady || previewMut.isPending} onClick={() => previewMut.mutate()}><Users className="h-4 w-4 mr-1.5" />{previewMut.isPending ? 'Counting…' : 'Preview audience'}</Button>
              {preview && <span className="flex items-center gap-1.5 text-sm font-poppins"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{preview.count.toLocaleString()} recipient{preview.count === 1 ? '' : 's'}</span>}
            </div>
            {preview && (
              <div className="rounded-[10px] bg-muted/50 p-3 text-xs space-y-1">
                <p className="text-muted-foreground">Skipped: {preview.skipped.noNumber} without a valid number · {preview.skipped.optedOut} opted out · {preview.skipped.duplicates} duplicates</p>
                {preview.sample.length > 0 && <p className="text-muted-foreground">Sample: {preview.sample.map(s => `${s.name} (${s.phone})`).join(', ')}</p>}
                {preview.dailyCapacity !== null && <p className="text-muted-foreground">Today's remaining limit for this number: {preview.dailyCapacity.toLocaleString()}</p>}
                {preview.exceedsCapacity && <p className="flex items-center gap-1.5 text-destructive font-medium"><AlertTriangle className="h-3.5 w-3.5" />This audience is larger than today's limit for the number. Narrow it or schedule for tomorrow.</p>}
              </div>
            )}
          </section>

          <section className="space-y-3"><h3 className="text-sm font-medium font-poppins">3 · When &amp; replies</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <RadioGroup value={when} onValueChange={v => setWhen(v as 'now' | 'later')} className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="now" /> Send now</label>
                  <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="later" /> Schedule</label>
                </RadioGroup>
                {when === 'later' && <Input type="datetime-local" className="rounded-[10px]" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />}
              </div>
              <div className="space-y-1.5"><Label className="text-xs">When someone replies, start chatbot</Label>
                <Select value={flowId} onValueChange={setFlowId}><SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">None — replies go to the inbox</SelectItem>{flows.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </section>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" className={WA_OUTLINE_BTN} disabled={!canCreate || create.isPending} onClick={() => create.mutate(false)}>{when === 'later' ? 'Schedule' : 'Save draft'}</Button>
          {when === 'now' && <Button className={WA_PRIMARY_BTN} disabled={!canCreate || create.isPending} onClick={() => create.mutate(true)}>{create.isPending ? 'Starting…' : 'Send campaign'}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
