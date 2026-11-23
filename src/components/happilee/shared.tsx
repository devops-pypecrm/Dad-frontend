import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageCircleHeart, Plug, Search, X } from 'lucide-react';
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

export function fillPreview(t: HappileeTemplate | undefined, values: Record<string, string>) {
  if (!t) return '';
  let body = t.body || '';
  for (const n of bodyParamNames(t)) body = body.split(`{{${n}}}`).join(values[n] || `{{${n}}}`);
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

export function ParamFields({ template, values, onChange }: { template?: HappileeTemplate; values: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
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
      <div className="whitespace-pre-wrap rounded-lg bg-accent p-3 text-sm text-accent-foreground">{fillPreview(template, values) || 'No preview available'}</div>
      {(template.header_url || (template.template_type || '').toLowerCase().includes('media')) && <p className="text-xs text-amber-600">This template has a media header. Header media is not filled in from here.</p>}
    </div>
  );
}

export const toParams = (v: Record<string, string>): Param[] => Object.entries(v).map(([name, value]) => ({ name, value }));

export function useTemplates() {
  return useQuery({ queryKey: ['happilee', 'templates', ''], queryFn: () => happileeApi.templates(), staleTime: 60_000 });
}

export interface PickedLead { id: string; name: string; phone: string }

export function LeadPicker({ picked, onChange, single }: { picked: PickedLead[]; onChange: (l: PickedLead[]) => void; single?: boolean }) {
  const [q, setQ] = useState('');
  const { data } = useQuery({
    queryKey: ['happilee', 'lead-search', q], enabled: q.trim().length >= 2,
    queryFn: () => getLeads({ search: q.trim(), limit: 8 } as any),
  });
  const results: any[] = (data?.leads || []).filter((l: any) => !picked.some(p => p.id === l.id));
  const add = (l: any) => { const p = { id: l.id, name: [l.firstName, l.lastName].filter(Boolean).join(' '), phone: l.phone }; onChange(single ? [p] : [...picked, p]); setQ(''); };
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
