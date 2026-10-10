import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApprovedTemplates } from '@/hooks/useApprovedTemplates';
import { bodyVariableCount, PARAM_SOURCE_OPTIONS, type ParamSpec } from '@/services/whatsAppHubService';
import { TemplatePreview } from './TemplatePreview';

interface Props {
  templateName: string;
  templateLanguage: string;
  params: ParamSpec[];
  onChange: (v: { templateName: string; templateLanguage: string; params: ParamSpec[] }) => void;
}

const SAMPLE: Record<string, string> = {
  'lead.firstName': 'Asha', 'lead.lastName': 'Nair', 'lead.fullName': 'Asha Nair', 'lead.source': 'meta ads',
  'lead.company': 'Acme Ltd', 'lead.enquiryAbout': 'Product demo', 'org.name': 'Your business',
};

/** Pick an approved template and map each {{n}} variable to a lead field or fixed text. */
export function TemplateParamsEditor({ templateName, templateLanguage, params, onChange }: Props) {
  const { approved, isLoading } = useApprovedTemplates();
  const key = templateName ? `${templateName}::${templateLanguage}` : '';
  const tpl = approved.find(t => t.name === templateName && t.language === templateLanguage);
  const count = tpl ? bodyVariableCount(tpl) : 0;

  const pick = (k: string) => {
    const [name, language] = k.split('::');
    const t = approved.find(x => x.name === name && x.language === language);
    const n = t ? bodyVariableCount(t) : 0;
    onChange({ templateName: name, templateLanguage: language, params: Array.from({ length: n }, (_, i) => params[i] || { source: i === 0 ? 'lead.firstName' : 'static', value: '' }) });
  };
  const setParam = (i: number, p: ParamSpec) => onChange({ templateName, templateLanguage, params: Array.from({ length: count }, (_, j) => (j === i ? p : params[j] || { source: 'static', value: '' })) });

  const samples = Object.fromEntries(Array.from({ length: count }, (_, i) => {
    const p = params[i];
    return [String(i + 1), p ? (p.source === 'static' ? p.value || '…' : SAMPLE[p.source] || '…') : '…'];
  }));
  const comp = (t: string) => tpl?.components.find(c => c.type === t);

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Template</Label>
        <Select value={key} onValueChange={pick}>
          <SelectTrigger className="rounded-[10px]"><SelectValue placeholder={isLoading ? 'Loading templates…' : 'Choose an approved template'} /></SelectTrigger>
          <SelectContent>
            {approved.map(t => <SelectItem key={`${t.name}::${t.language}`} value={`${t.name}::${t.language}`}>{t.name} · {t.language}</SelectItem>)}
          </SelectContent>
        </Select>
        {!isLoading && approved.length === 0 && (
          <p className="text-xs text-muted-foreground">No approved templates yet. <Link to="/whatsapp/templates" className="text-[hsl(var(--chart-5))] underline">Create one</Link> and wait for WhatsApp to approve it.</p>
        )}
      </div>

      {tpl && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            {count === 0 && <p className="text-xs text-muted-foreground">This template has no variables.</p>}
            {Array.from({ length: count }, (_, i) => {
              const p = params[i] || { source: 'static', value: '' };
              return (
                <div key={i} className="space-y-1">
                  <Label className="text-xs">{`{{${i + 1}}}`} fills with</Label>
                  <Select value={p.source} onValueChange={v => setParam(i, { source: v, value: p.value })}>
                    <SelectTrigger className="h-9 rounded-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{PARAM_SOURCE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                  {p.source === 'static' && <Input className="h-9 rounded-[10px]" placeholder="Fixed text" value={p.value || ''} onChange={e => setParam(i, { source: 'static', value: e.target.value })} />}
                </div>
              );
            })}
          </div>
          <TemplatePreview header={comp('HEADER')?.text} body={comp('BODY')?.text || ''} footer={comp('FOOTER')?.text} buttons={comp('BUTTONS')?.buttons} samples={samples} />
        </div>
      )}
    </div>
  );
}
