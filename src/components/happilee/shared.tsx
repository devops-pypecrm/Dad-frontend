import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ImagePlus, MessageCircleHeart, Plug, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { happileeApi, type HappileeTemplate, type Param } from '@/services/happileeService';
import { getLeads } from '@/services/leadService';

export const H_CARD = 'rounded-[var(--card-radius,14px)] border border-border bg-card shadow-[var(--card-shadow,none)]';
export const H_GRADIENT = 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 55%, #2563eb 100%)';

export function HappileePage({ title, subtitle, actions, children }: { title: string; subtitle: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-full space-y-6 bg-background p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="relative overflow-hidden rounded-[var(--card-radius,14px)] p-5 text-white sm:p-6" style={{ background: H_GRADIENT }}>
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-12 right-24 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur"><MessageCircleHeart className="h-6 w-6" /></span>
            <div>
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
              <p className="text-sm text-white/80">{subtitle}</p>
            </div>
          </div>
          {actions}
        </div>
      </div>
      {children}
    </div>
  );
}

export function useHappileeStatus() {
  return useQuery({ queryKey: ['happilee', 'status'], queryFn: happileeApi.status });
}

/** Shows children only when an API key is connected; otherwise a prompt to connect. */
export function ConnectionGate({ children }: { children: ReactNode }) {
  const { data, isLoading } = useHappileeStatus();
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data?.connected) {
    return (
      <div className="rounded-[var(--card-radius,14px)] border border-dashed border-primary/40 bg-card p-10 text-center">
        <Plug className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="font-medium">Happilee is not connected</p>
        <p className="mt-1 text-sm text-muted-foreground">An admin needs to add the Happilee API key first.</p>
        <Link to="/happilee/overview" className="mt-4 inline-block text-sm font-medium text-primary underline">Go to Happilee overview</Link>
      </div>
    );
  }
  return <>{children}</>;
}

export const statusBadge = (s?: string) => {
  const v = (s || '').toLowerCase();
  const cls = v === 'approved' || v === 'delivered' || v === 'read' || v === 'sent' ? 'bg-emerald-100 text-emerald-700' : v === 'failed' || v === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
  return <Badge variant="secondary" className={cls}>{s || 'unknown'}</Badge>;
};

/** Variable names a template expects, from the template's own body_params (sorted as Happilee returns them). */
export const bodyParamNames = (t?: HappileeTemplate) => t?.body_params || [];

export const TOKENS = ['name', 'first_name', 'last_name', 'phone', 'email', 'company'] as const;
export interface TokenLead { name?: string; firstName?: string; lastName?: string; phone?: string; email?: string; company?: string }
const SAMPLE: TokenLead = { firstName: 'Meera', lastName: 'Nair', phone: '9876543210', email: 'meera@example.com', company: 'Acme' };
/** Same rules as the server: fills [first_name] etc. from the lead (or a sample person). */
export function fillTokens(text: string, lead?: TokenLead) {
  const l = lead && (lead.firstName || lead.name) ? lead : SAMPLE;
  return text.replace(/\[(name|first_name|last_name|phone|email|company)\]/gi, (_m, k: string) => {
    switch (k.toLowerCase()) {
      case 'first_name': return l.firstName || '';
      case 'last_name': return l.lastName || '';
      case 'phone': return l.phone || '';
      case 'email': return l.email || '';
      case 'company': return l.company || '';
      default: return l.name || [l.firstName, l.lastName].filter(Boolean).join(' ');
    }
  }).replace(/\s{2,}/g, ' ').trim();
}
/** Pre-fill variables whose names look like a lead field, so the common case needs no typing. */
export function suggestValues(t?: HappileeTemplate): Record<string, string> {
  const out: Record<string, string> = {};
  for (const n of bodyParamNames(t)) {
    const k = n.toLowerCase();
    if (/first/.test(k)) out[n] = '[first_name]';
    else if (/last|surname/.test(k)) out[n] = '[last_name]';
    else if (/name/.test(k) || k === '1') out[n] = '[name]';
    else if (/phone|mobile/.test(k)) out[n] = '[phone]';
    else if (/mail/.test(k)) out[n] = '[email]';
    else if (/company|org|business/.test(k)) out[n] = '[company]';
  }
  return out;
}

export function fillPreview(t: HappileeTemplate | undefined, values: Record<string, string>, lead?: TokenLead) {
  if (!t) return '';
  let body = t.body || '';
  for (const n of bodyParamNames(t)) body = body.split(`{{${n}}}`).join(values[n] ? fillTokens(values[n], lead) : `{{${n}}}`);
  return [t.header, body, t.footer].filter(Boolean).join('\n');
}

export function TemplateSelect({ templates, value, onChange }: { templates: HappileeTemplate[]; value: string; onChange: (id: string) => void }) {
  const approved = templates.filter(t => !t.status || /^approved$/i.test(t.status));
  return (
    <div className="space-y-1.5">
      <Label>Template</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={approved.length ? 'Choose an approved template' : 'No approved templates found'} /></SelectTrigger>
        <SelectContent>{approved.map(t => <SelectItem key={t.template_id} value={String(t.template_id)}>{t.template_name}{t.language ? ` (${t.language})` : ''}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

export const hasMediaHeader = (t?: HappileeTemplate) => !!t && (!!t.header_url || /image|video|document|media/i.test(t.template_type || ''));

export function MediaHeaderField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const pick = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try { onChange(await happileeApi.upload(f)); toast.success('File uploaded'); } catch (e: any) { toast.error(e?.response?.data?.message || 'Upload failed'); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-1.5">
      <Label>Header media (image, video or document)</Label>
      <div className="flex gap-2">
        <Input value={value} onChange={e => onChange(e.target.value)} placeholder="Paste a public URL, or upload a file" />
        <label className="inline-flex shrink-0 cursor-pointer">
          <input type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }} />
          <span className="inline-flex h-10 items-center gap-1.5 rounded-md border px-3 text-sm hover:bg-accent"><ImagePlus className="h-4 w-4" />{busy ? 'Uploading…' : 'Upload'}</span>
        </label>
      </div>
      {value && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(value) && <img src={value} alt="Header preview" className="mt-1 max-h-28 rounded-lg border" />}
    </div>
  );
}

export function ParamFields({ template, values, onChange, lead }: { template?: HappileeTemplate; values: Record<string, string>; onChange: (v: Record<string, string>) => void; lead?: TokenLead }) {
  const names = bodyParamNames(template);
  if (!template) return null;
  return (
    <div className="space-y-3">
      {names.length > 0 && <Label>Template variables</Label>}
      {names.map(n => (
        <div key={n} className="flex items-center gap-2">
          <span className="w-28 shrink-0 truncate rounded bg-muted px-2 py-1.5 text-xs font-mono">{`{{${n}}}`}</span>
          <Input value={values[n] || ''} onChange={e => onChange({ ...values, [n]: e.target.value })} placeholder={`Value for ${n}`} />
        </div>
      ))}
      {names.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          Fill from the lead:
          {TOKENS.map(t => <span key={t} className="rounded-full bg-accent px-2 py-0.5 font-mono text-accent-foreground">[{t}]</span>)}
          <span>Type these into any value; each person gets their own details.</span>
        </div>
      )}
      <div className="whitespace-pre-wrap rounded-lg bg-accent p-3 text-sm text-accent-foreground">{fillPreview(template, values, lead) || 'No preview available'}</div>
    </div>
  );
}

export const toParams = (v: Record<string, string>): Param[] => Object.entries(v).map(([name, value]) => ({ name, value }));

export function useTemplates() {
  return useQuery({ queryKey: ['happilee', 'templates', ''], queryFn: () => happileeApi.templates(), staleTime: 60_000 });
}

export interface PickedLead { id: string; name: string; phone: string; firstName?: string; lastName?: string; email?: string; company?: string }

export function LeadPicker({ picked, onChange, single }: { picked: PickedLead[]; onChange: (l: PickedLead[]) => void; single?: boolean }) {
  const [q, setQ] = useState('');
  const { data } = useQuery({
    queryKey: ['happilee', 'lead-search', q], enabled: q.trim().length >= 2,
    queryFn: () => getLeads({ search: q.trim(), limit: 8 } as any),
  });
  const results: any[] = (data?.leads || []).filter((l: any) => !picked.some(p => p.id === l.id));
  const add = (l: any) => { const p = { id: l.id, name: [l.firstName, l.lastName].filter(Boolean).join(' '), phone: l.phone, firstName: l.firstName, lastName: l.lastName, email: l.email, company: l.company }; onChange(single ? [p] : [...picked, p]); setQ(''); };
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search leads by name or phone…" value={q} onChange={e => setQ(e.target.value)} />
        {results.length > 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border bg-popover shadow-md">
            {results.map(l => (
              <button type="button" key={l.id} onClick={() => add(l)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent">
                <span>{[l.firstName, l.lastName].filter(Boolean).join(' ')}</span><span className="text-muted-foreground">{l.phone}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {picked.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {picked.map(p => (
            <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
              {p.name} · {p.phone}
              <button type="button" onClick={() => onChange(picked.filter(x => x.id !== p.id))}><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
