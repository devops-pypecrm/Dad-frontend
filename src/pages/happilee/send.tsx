import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Send, Megaphone, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { happileeApi } from '@/services/happileeService';
import { apiErrorMessage } from '@/lib/apiError';
import { isOrgAdmin } from '@/lib/utils';
import { getLeadById } from '@/services/leadService';
import { ConnectionGate, HappileePage, LeadPicker, MediaHeaderField, ParamFields, TemplateSelect, hasMediaHeader, suggestValues, toParams, useTemplates, type PickedLead } from '@/components/happilee/shared';

function useTemplateState() {
  const { data: templates = [] } = useTemplates();
  const [templateId, setTemplateId] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const template = useMemo(() => templates.find(t => String(t.template_id) === templateId), [templates, templateId]);
  return { templates, templateId, setTemplateId: (id: string) => { setTemplateId(id); setValues(suggestValues(templates.find(x => String(x.template_id) === id))); }, values, setValues, template };
}

function SingleSend() {
  const qc = useQueryClient();
  const t = useTemplateState();
  const [lead, setLead] = useState<PickedLead[]>([]);
  const [phone, setPhone] = useState('');
  const [media, setMedia] = useState('');
  const [params] = useSearchParams();
  const presetId = params.get('leadId');
  useEffect(() => {
    if (!presetId) return;
    getLeadById(presetId).then((l: any) => setLead([{ id: l.id, name: [l.firstName, l.lastName].filter(Boolean).join(' '), phone: l.phone, firstName: l.firstName, lastName: l.lastName, email: l.email, company: l.company }])).catch(() => toast.error('Could not load that lead'));
  }, [presetId]);
  const send = useMutation({
    mutationFn: () => happileeApi.sendTemplate({ leadId: lead[0]?.id, phone: lead[0] ? undefined : phone, templateId: t.templateId, templateName: t.template?.template_name, params: toParams(t.values), headerMediaUrl: media.trim() || undefined }),
    onSuccess: () => { toast.success('Message sent'); qc.invalidateQueries({ queryKey: ['happilee'] }); },
    onError: e => toast.error(apiErrorMessage(e, 'Could not send')),
  });
  const ready = !!t.templateId && (lead.length > 0 || phone.replace(/\D/g, '').length >= 8);
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="space-y-1.5"><Label>Send to a lead</Label><LeadPicker single picked={lead} onChange={setLead} /></div>
        {lead.length === 0 && <div className="space-y-1.5"><Label>…or a phone number (with country code)</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="919876543210" /></div>}
        <TemplateSelect templates={t.templates} value={t.templateId} onChange={t.setTemplateId} />
      </div>
      <div className="space-y-4">
        {hasMediaHeader(t.template) && <MediaHeaderField value={media} onChange={setMedia} />}
        <ParamFields template={t.template} values={t.values} onChange={t.setValues} lead={lead[0]} />
        <Button disabled={!ready || send.isPending} onClick={() => send.mutate()}><Send className="mr-1.5 h-4 w-4" />{send.isPending ? 'Sending…' : 'Send template'}</Button>
      </div>
    </div>
  );
}

function Broadcast() {
  const qc = useQueryClient();
  const t = useTemplateState();
  const [leads, setLeads] = useState<PickedLead[]>([]);
  const [numbers, setNumbers] = useState('');
  const [media, setMedia] = useState('');
  const parsed = useMemo(() => numbers.split('\n').map(l => l.trim()).filter(Boolean).map(l => { const [a, b] = l.split(',').map(s => s.trim()); return b ? { name: a, phone: b } : { name: '', phone: a }; }), [numbers]);
  const total = leads.length + parsed.length;
  const go = useMutation({
    mutationFn: () => happileeApi.broadcast({ templateId: t.templateId, templateName: t.template?.template_name, leadIds: leads.map(l => l.id), numbers: parsed, bodyParams: t.values, headerMediaUrl: media.trim() || undefined }),
    onSuccess: r => { toast.success(r.personalised ? `Sending ${r.recipients} personalised messages in the background. Check the Message Log.` : `Broadcast queued for ${r.recipients} recipients`); setLeads([]); setNumbers(''); qc.invalidateQueries({ queryKey: ['happilee'] }); },
    onError: e => toast.error(apiErrorMessage(e, 'Could not start the broadcast')),
  });
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <TemplateSelect templates={t.templates} value={t.templateId} onChange={t.setTemplateId} />
        <div className="space-y-1.5"><Label>Add leads</Label><LeadPicker picked={leads} onChange={setLeads} /></div>
        <div className="space-y-1.5">
          <Label>Or paste numbers (one per line: name, number with country code)</Label>
          <Textarea rows={5} value={numbers} onChange={e => setNumbers(e.target.value)} placeholder={'Asha, 919876543210\n919812345678'} />
        </div>
      </div>
      <div className="space-y-4">
        {hasMediaHeader(t.template) && <MediaHeaderField value={media} onChange={setMedia} />}
        <ParamFields template={t.template} values={t.values} onChange={t.setValues} />
        <p className="text-xs text-muted-foreground">Plain values go to every recipient in one broadcast (up to 1000). If you use placeholders like [first_name], each person gets their own message, sent one by one in the background (up to 300).</p>
        <Button disabled={!t.templateId || total === 0 || go.isPending} onClick={() => window.confirm(`Send "${t.template?.template_name}" to ${total} recipient(s)?`) && go.mutate()}>
          <Megaphone className="mr-1.5 h-4 w-4" />{go.isPending ? 'Starting…' : `Broadcast to ${total}`}
        </Button>
      </div>
    </div>
  );
}

function Contacts() {
  const [leads, setLeads] = useState<PickedLead[]>([]);
  const [tags, setTags] = useState('');
  const [phone, setPhone] = useState('');
  const [add, setAdd] = useState('');
  const [remove, setRemove] = useState('');
  const sync = useMutation({
    mutationFn: () => happileeApi.syncContacts(leads.map(l => l.id), tags.split(',').map(s => s.trim()).filter(Boolean)),
    onSuccess: r => { r.failed ? toast.error(`${r.synced} synced, ${r.failed} failed: ${r.errors[0] || ''}`) : toast.success(`${r.synced} contact(s) synced to Happilee`); setLeads([]); },
    onError: e => toast.error(apiErrorMessage(e, 'Sync failed')),
  });
  const tag = useMutation({ mutationFn: () => happileeApi.updateTags(phone, add.trim() || undefined, remove.trim() || undefined), onSuccess: () => toast.success('Tags updated'), onError: e => toast.error(apiErrorMessage(e, 'Could not update tags')) });
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-3 rounded-[var(--card-radius,14px)] border bg-card p-5 shadow-[var(--card-shadow,none)]">
        <h3 className="font-medium">Sync leads to Happilee contacts</h3>
        <LeadPicker picked={leads} onChange={setLeads} />
        <div className="space-y-1.5"><Label>Tags to apply (comma separated, optional)</Label><Input value={tags} onChange={e => setTags(e.target.value)} placeholder="lead, enquiry" /></div>
        <Button disabled={!leads.length || sync.isPending} onClick={() => sync.mutate()}><Users className="mr-1.5 h-4 w-4" />{sync.isPending ? 'Syncing…' : `Sync ${leads.length || ''} contact(s)`}</Button>
      </section>
      <section className="space-y-3 rounded-[var(--card-radius,14px)] border bg-card p-5 shadow-[var(--card-shadow,none)]">
        <h3 className="font-medium">Update a contact's tags</h3>
        <div className="space-y-1.5"><Label>Phone (with country code)</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="919876543210" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Add tag</Label><Input value={add} onChange={e => setAdd(e.target.value)} placeholder="paid" /></div>
          <div className="space-y-1.5"><Label>Remove tag</Label><Input value={remove} onChange={e => setRemove(e.target.value)} placeholder="unpaid" /></div>
        </div>
        <Button disabled={!phone.trim() || (!add.trim() && !remove.trim()) || tag.isPending} onClick={() => tag.mutate()}>Update tags</Button>
      </section>
    </div>
  );
}

export default function HappileeSend() {
  const admin = isOrgAdmin(JSON.parse(localStorage.getItem('userInfo') || 'null'));
  return (
    <HappileePage title="Send & Broadcast" subtitle="Message leads with approved Happilee templates">
      <ConnectionGate>
        <Tabs defaultValue="single">
          <TabsList>
            <TabsTrigger value="single">Single message</TabsTrigger>
            {admin && <TabsTrigger value="broadcast">Broadcast</TabsTrigger>}
            {admin && <TabsTrigger value="contacts">Contacts & tags</TabsTrigger>}
          </TabsList>
          <TabsContent value="single" className="pt-4"><SingleSend /></TabsContent>
          {admin && <TabsContent value="broadcast" className="pt-4"><Broadcast /></TabsContent>}
          {admin && <TabsContent value="contacts" className="pt-4"><Contacts /></TabsContent>}
        </Tabs>
      </ConnectionGate>
    </HappileePage>
  );
}
