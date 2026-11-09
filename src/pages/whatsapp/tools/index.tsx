import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Ban, Download, Plus, QrCode, Save, Store, Trash2, Zap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WhatsAppPage } from '@/components/WhatsApp/hub/WhatsAppPage';
import { WhatsAppConnectionGate } from '@/components/WhatsApp/hub/WhatsAppConnectionGate';
import { WhatsAppSection } from '@/components/WhatsApp/hub/WhatsAppSection';
import { EmptyState } from '@/components/WhatsApp/hub/EmptyRow';
import { WA_OUTLINE_BTN, WA_PRIMARY_BTN } from '@/components/WhatsApp/hub/whatsappStyles';
import { AccountPicker, Unavailable } from '@/components/WhatsApp/tools/AccountPicker';
import { waToolsApi, type WaBusinessProfile, type WaStarters } from '@/services/whatsAppToolsService';
import { apiErrorMessage } from '@/lib/apiError';

const VERTICALS = ['AUTO', 'BEAUTY', 'APPAREL', 'EDU', 'ENTERTAIN', 'EVENT_PLAN', 'FINANCE', 'GROCERY', 'GOVT', 'HOTEL', 'HEALTH', 'NONPROFIT', 'PROF_SERVICES', 'RETAIL', 'TRAVEL', 'RESTAURANT', 'OTHER'];
const label = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
const Field = ({ l, children, hint }: { l: string; children: React.ReactNode; hint?: string }) => <div className="space-y-1.5"><Label className="text-sm">{l}</Label>{children}{hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>;

function ProfileTab({ accountId }: { accountId?: string }) {
  const q = useQuery({ queryKey: ['wa-tools', 'profile', accountId], queryFn: () => waToolsApi.getProfile(accountId), retry: false });
  if (q.error) return <Unavailable error={apiErrorMessage(q.error, 'Could not load the business profile')} />;
  if (!q.data) return <p className="text-sm text-muted-foreground">Loading…</p>;
  return <ProfileForm key={JSON.stringify(q.data)} accountId={accountId} initial={q.data} />;
}

function ProfileForm({ accountId, initial }: { accountId?: string; initial: WaBusinessProfile }) {
  const qc = useQueryClient();
  const [f, setF] = useState<WaBusinessProfile>(initial);
  const save = useMutation({ mutationFn: () => waToolsApi.saveProfile(accountId, f), onSuccess: () => { toast.success('Business profile updated'); qc.invalidateQueries({ queryKey: ['wa-tools', 'profile'] }); }, onError: e => toast.error(apiErrorMessage(e, 'Could not update the profile')) });
  return (
    <WhatsAppSection title="Business profile" description="What customers see when they tap your business name in WhatsApp" icon={<Store />}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field l="About" hint="Up to 139 characters"><Input maxLength={139} value={f.about || ''} onChange={e => setF({ ...f, about: e.target.value })} /></Field>
        <Field l="Category"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={f.vertical || ''} onChange={e => setF({ ...f, vertical: e.target.value })}><option value="">Select…</option>{VERTICALS.map(v => <option key={v} value={v}>{label(v)}</option>)}</select></Field>
        <Field l="Description" hint="Up to 512 characters"><Textarea rows={3} maxLength={512} value={f.description || ''} onChange={e => setF({ ...f, description: e.target.value })} /></Field>
        <Field l="Address"><Textarea rows={3} maxLength={256} value={f.address || ''} onChange={e => setF({ ...f, address: e.target.value })} /></Field>
        <Field l="Email"><Input type="email" value={f.email || ''} onChange={e => setF({ ...f, email: e.target.value })} /></Field>
        <Field l="Websites (up to 2, one per line)"><Textarea rows={2} value={(f.websites || []).join('\n')} onChange={e => setF({ ...f, websites: e.target.value.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 2) })} /></Field>
      </div>
      <Button className={`mt-5 ${WA_PRIMARY_BTN}`} disabled={save.isPending} onClick={() => save.mutate()}><Save className="mr-1.5 h-4 w-4" />{save.isPending ? 'Saving…' : 'Save profile'}</Button>
    </WhatsAppSection>
  );
}

function QrTab({ accountId }: { accountId?: string }) {
  const qc = useQueryClient();
  const [msg, setMsg] = useState('');
  const q = useQuery({ queryKey: ['wa-tools', 'qr', accountId], queryFn: () => waToolsApi.qrList(accountId), retry: false });
  const refresh = () => qc.invalidateQueries({ queryKey: ['wa-tools', 'qr'] });
  const create = useMutation({ mutationFn: () => waToolsApi.qrCreate(accountId, msg), onSuccess: () => { setMsg(''); toast.success('QR code created'); refresh(); }, onError: e => toast.error(apiErrorMessage(e, 'Could not create the QR code')) });
  const del = useMutation({ mutationFn: (code: string) => waToolsApi.qrDelete(accountId, code), onSuccess: () => { toast.success('Deleted'); refresh(); }, onError: e => toast.error(apiErrorMessage(e, 'Could not delete')) });
  return (
    <WhatsAppSection title="QR codes & short links" description="Print a QR code or share a wa.me link that opens a chat with your pre-filled message" icon={<QrCode />}>
      <div className="mb-5 flex gap-2">
        <Input maxLength={140} placeholder='Pre-filled message, e.g. "Hi, I saw your poster and want a quote"' value={msg} onChange={e => setMsg(e.target.value)} />
        <Button className={WA_PRIMARY_BTN} disabled={!msg.trim() || create.isPending} onClick={() => create.mutate()}><Plus className="mr-1.5 h-4 w-4" />Create</Button>
      </div>
      {q.error ? <Unavailable error={apiErrorMessage(q.error, 'Could not load QR codes')} /> : (q.data || []).length === 0 ? <EmptyState icon={<QrCode strokeWidth={1.25} />}>No QR codes yet.</EmptyState> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data!.map(c => (
            <div key={c.code} className="flex gap-3 rounded-lg border border-border p-3">
              {c.qr_image_url && <img src={c.qr_image_url} alt="QR code" className="h-24 w-24 shrink-0" />}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="line-clamp-3 text-sm">{c.prefilled_message}</p>
                <a href={c.deep_link_url} target="_blank" rel="noreferrer" className="block truncate text-xs text-[hsl(var(--chart-5))] hover:underline">{c.deep_link_url}</a>
                <div className="flex gap-1 pt-1">
                  {c.qr_image_url && <a href={c.qr_image_url} download={`whatsapp-qr-${c.code}.png`}><Button size="sm" variant="outline" className={WA_OUTLINE_BTN}><Download className="h-3.5 w-3.5" /></Button></a>}
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => window.confirm('Delete this QR code? Printed copies will stop working.') && del.mutate(c.code)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </WhatsAppSection>
  );
}

function StartersTab({ accountId }: { accountId?: string }) {
  const q = useQuery({ queryKey: ['wa-tools', 'starters', accountId], queryFn: () => waToolsApi.getStarters(accountId), retry: false });
  if (q.error) return <Unavailable error={apiErrorMessage(q.error, 'Could not load conversation starters')} />;
  if (!q.data) return <p className="text-sm text-muted-foreground">Loading…</p>;
  return <StartersForm key={JSON.stringify(q.data)} accountId={accountId} initial={q.data} />;
}

function StartersForm({ accountId, initial }: { accountId?: string; initial: WaStarters }) {
  const qc = useQueryClient();
  const [f, setF] = useState<WaStarters>(initial);
  const save = useMutation({ mutationFn: () => waToolsApi.saveStarters(accountId, f), onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['wa-tools', 'starters'] }); }, onError: e => toast.error(apiErrorMessage(e, 'Could not save')) });
  return (
    <WhatsAppSection title="Conversation starters" description="Shown to a customer the first time they open a chat with you" icon={<Zap />}>
      <div className="space-y-6">
        <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3 text-sm"><span><b className="font-medium">Welcome message</b><br /><span className="text-muted-foreground">Show your starter prompts when a new customer opens the chat.</span></span><Switch checked={f.enableWelcomeMessage} onCheckedChange={v => setF({ ...f, enableWelcomeMessage: v })} /></label>
        <Field l="Ice breakers (up to 4)" hint="Tappable questions, e.g. “What are your prices?”. Max 80 characters each.">
          <div className="space-y-2">{[0, 1, 2, 3].map(i => <Input key={i} maxLength={80} placeholder={`Question ${i + 1}`} value={f.prompts[i] || ''} onChange={e => { const p = [...f.prompts]; p[i] = e.target.value; setF({ ...f, prompts: p }); }} />)}</div>
        </Field>
        <Field l="Commands" hint="Shortcuts customers can type after “/”, e.g. /pricing.">
          <div className="space-y-2">
            {f.commands.map((c, i) => (
              <div key={i} className="flex gap-2"><Input className="w-40" maxLength={32} placeholder="pricing" value={c.command_name} onChange={e => { const x = [...f.commands]; x[i] = { ...c, command_name: e.target.value }; setF({ ...f, commands: x }); }} /><Input maxLength={256} placeholder="What it does" value={c.command_description} onChange={e => { const x = [...f.commands]; x[i] = { ...c, command_description: e.target.value }; setF({ ...f, commands: x }); }} /><Button variant="ghost" size="icon" onClick={() => setF({ ...f, commands: f.commands.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button></div>
            ))}
            <Button variant="outline" size="sm" className={WA_OUTLINE_BTN} onClick={() => setF({ ...f, commands: [...f.commands, { command_name: '', command_description: '' }] })}><Plus className="mr-1 h-4 w-4" />Add command</Button>
          </div>
        </Field>
        <Button className={WA_PRIMARY_BTN} disabled={save.isPending} onClick={() => save.mutate()}><Save className="mr-1.5 h-4 w-4" />{save.isPending ? 'Saving…' : 'Save'}</Button>
      </div>
    </WhatsAppSection>
  );
}

function BlockedTab({ accountId }: { accountId?: string }) {
  const qc = useQueryClient();
  const [phone, setPhone] = useState('');
  const q = useQuery({ queryKey: ['wa-tools', 'blocked', accountId], queryFn: () => waToolsApi.blocked(accountId), retry: false });
  const refresh = () => qc.invalidateQueries({ queryKey: ['wa-tools', 'blocked'] });
  const block = useMutation({ mutationFn: () => waToolsApi.block(accountId, phone), onSuccess: () => { setPhone(''); toast.success('Number blocked'); refresh(); }, onError: e => toast.error(apiErrorMessage(e, 'Could not block')) });
  const unblock = useMutation({ mutationFn: (p: string) => waToolsApi.unblock(accountId, p), onSuccess: () => { toast.success('Unblocked'); refresh(); }, onError: e => toast.error(apiErrorMessage(e, 'Could not unblock')) });
  return (
    <WhatsAppSection title="Blocked numbers" description="Blocked people cannot message you on this number. They are not told." icon={<Ban />}>
      <div className="mb-4 flex gap-2"><Input placeholder="Phone with country code, e.g. 919876543210" value={phone} onChange={e => setPhone(e.target.value)} /><Button className={WA_PRIMARY_BTN} disabled={!phone.trim() || block.isPending} onClick={() => block.mutate()}>Block</Button></div>
      {q.error ? <Unavailable error={apiErrorMessage(q.error, 'Could not load the block list')} /> : (q.data || []).length === 0 ? <EmptyState>No blocked numbers.</EmptyState> : (
        <ul className="divide-y divide-border">{q.data!.map(n => <li key={n} className="flex items-center justify-between py-2 text-sm">+{n}<Button size="sm" variant="outline" className={WA_OUTLINE_BTN} onClick={() => unblock.mutate(n)}>Unblock</Button></li>)}</ul>
      )}
    </WhatsAppSection>
  );
}

function HealthTab({ accountId }: { accountId?: string }) {
  const q = useQuery({ queryKey: ['wa-tools', 'health', accountId], queryFn: () => waToolsApi.numberStatus(accountId), retry: false });
  if (q.error) return <Unavailable error={apiErrorMessage(q.error, 'Could not load number status')} />;
  const d = q.data;
  const rows: [string, string | undefined][] = [
    ['Verified name', d?.verified_name], ['Number', d?.display_phone_number], ['Display name review', d?.name_status], ['Status', d?.status],
    ['Quality rating', d?.quality_rating], ['Messaging limit', d?.messaging_limit_tier?.replace('TIER_', '').replace(/_/g, ' ')], ['Throughput', d?.throughput?.level],
    ['Platform', d?.platform_type], ['Two-step PIN', d ? (d.is_pin_enabled ? 'Enabled' : 'Not enabled') : undefined], ['Verification', d?.code_verification_status],
  ];
  return (
    <WhatsAppSection title="Number health" description="Live status of this number from Meta" icon={<Activity />}>
      {q.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">{rows.map(([k, v]) => <div key={k} className="flex justify-between border-b border-border pb-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v || '—'}</dd></div>)}</dl>
      )}
    </WhatsAppSection>
  );
}

export default function WhatsAppGrowthTools() {
  const [accountId, setAccountId] = useState<string | undefined>();
  return (
    <WhatsAppPage title="Growth Tools" subtitle="Business profile, QR codes, conversation starters, blocked numbers and number health" actions={<AccountPicker value={accountId} onChange={setAccountId} />}>
      <WhatsAppConnectionGate returnPath="/whatsapp/tools">
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList><TabsTrigger value="profile">Business profile</TabsTrigger><TabsTrigger value="qr">QR codes & links</TabsTrigger><TabsTrigger value="starters">Conversation starters</TabsTrigger><TabsTrigger value="blocked">Blocked numbers</TabsTrigger><TabsTrigger value="health">Number health</TabsTrigger></TabsList>
          <TabsContent value="profile"><ProfileTab accountId={accountId} /></TabsContent>
          <TabsContent value="qr"><QrTab accountId={accountId} /></TabsContent>
          <TabsContent value="starters"><StartersTab accountId={accountId} /></TabsContent>
          <TabsContent value="blocked"><BlockedTab accountId={accountId} /></TabsContent>
          <TabsContent value="health"><HealthTab accountId={accountId} /></TabsContent>
        </Tabs>
      </WhatsAppConnectionGate>
    </WhatsAppPage>
  );
}
