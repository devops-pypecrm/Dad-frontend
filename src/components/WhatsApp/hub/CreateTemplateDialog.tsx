import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createWhatsAppTemplate } from '@/services/whatsAppService';
import { apiErrorMessage } from '@/lib/apiError';
import { WA_PRIMARY_BTN } from './whatsappStyles';
import { TemplatePreview, type PreviewButton } from './TemplatePreview';

const LANGUAGES = [
  { code: 'en_US', label: 'English (US)' },
  { code: 'en_GB', label: 'English (UK)' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'kn', label: 'Kannada' },
  { code: 'mr', label: 'Marathi' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'bn', label: 'Bengali' },
];

interface ButtonDraft extends PreviewButton {
  value: string; // url or phone number
}

const slugify = (v: string) => v.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 512);
const variablesIn = (text: string) =>
  Array.from(new Set((text.match(/\{\{(\d+)\}\}/g) || []).map(m => m.replace(/[{}]/g, '')))).sort((a, b) => +a - +b);

export function CreateTemplateDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'MARKETING' | 'UTILITY'>('UTILITY');
  const [language, setLanguage] = useState('en_US');
  const [header, setHeader] = useState('');
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState('');
  const [buttons, setButtons] = useState<ButtonDraft[]>([]);
  const [samples, setSamples] = useState<Record<string, string>>({});

  const bodyVars = useMemo(() => variablesIn(body), [body]);
  const headerVars = useMemo(() => variablesIn(header), [header]);
  // Meta allows at most one variable in a text header
  const headerVarsValid = headerVars.length <= 1;

  const reset = () => {
    setName(''); setCategory('UTILITY'); setLanguage('en_US');
    setHeader(''); setBody(''); setFooter(''); setButtons([]); setSamples({});
  };

  const missingSamples = [...bodyVars, ...headerVars.map(v => `h${v}`)].some(v => !samples[v]?.trim());
  const canSubmit = name.trim() && body.trim() && headerVarsValid && !missingSamples;

  const mutation = useMutation({
    mutationFn: () => {
      const components: Array<Record<string, unknown>> = [];
      if (header.trim()) {
        components.push({
          type: 'HEADER',
          format: 'TEXT',
          text: header.trim(),
          ...(headerVars.length ? { example: { header_text: [samples[`h${headerVars[0]}`]] } } : {}),
        });
      }
      components.push({
        type: 'BODY',
        text: body.trim(),
        ...(bodyVars.length ? { example: { body_text: [bodyVars.map(v => samples[v])] } } : {}),
      });
      if (footer.trim()) components.push({ type: 'FOOTER', text: footer.trim() });
      if (buttons.length) {
        components.push({
          type: 'BUTTONS',
          buttons: buttons.map(b => ({
            type: b.type,
            text: b.text,
            ...(b.type === 'URL' ? { url: b.value } : {}),
            ...(b.type === 'PHONE_NUMBER' ? { phone_number: b.value } : {}),
          })),
        });
      }
      return createWhatsAppTemplate({ name: slugify(name), category, language, components });
    },
    onSuccess: () => {
      toast.success('Template submitted to Meta for review');
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'templates'] });
      reset();
      onOpenChange(false);
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'Failed to create template')),
  });

  const addButton = () => {
    if (buttons.length >= 3) return;
    setButtons([...buttons, { type: 'QUICK_REPLY', text: '', value: '' }]);
  };
  const updateButton = (i: number, patch: Partial<ButtonDraft>) =>
    setButtons(buttons.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));

  const previewSamples: Record<string, string> = { ...samples };
  headerVars.forEach(v => { previewSamples[v] = samples[`h${v}`] || ''; });

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create message template</DialogTitle>
          <DialogDescription>
            Templates are reviewed by WhatsApp, usually within minutes. Only approved templates can be sent to customers.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="tpl-name">Template name</Label>
                <Input id="tpl-name" value={name} onChange={e => setName(e.target.value)} placeholder="order_confirmation" />
                <p className="text-xs text-muted-foreground">Saved as: <span className="font-mono">{slugify(name) || '—'}</span></p>
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as 'MARKETING' | 'UTILITY')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTILITY">Utility</SelectItem>
                    <SelectItem value="MARKETING">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(l => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-header">Header (optional)</Label>
              <Input id="tpl-header" maxLength={60} value={header} onChange={e => setHeader(e.target.value)} placeholder="Your order is confirmed" />
              {!headerVarsValid && <p className="text-xs text-destructive">A header can contain at most one variable.</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-body">Body</Label>
              <Textarea
                id="tpl-body" rows={5} maxLength={1024} value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={'Hi {{1}}, your order {{2}} has been confirmed.'}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Use {'{{1}}'}, {'{{2}}'}… for variables.</span>
                <span>{body.length}/1024</span>
              </div>
            </div>

            {(bodyVars.length > 0 || headerVars.length > 0) && (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <Label>Sample values (required by Meta for review)</Label>
                <div className="grid sm:grid-cols-2 gap-2">
                  {headerVars.map(v => (
                    <Input key={`h${v}`} placeholder={`Header {{${v}}} example`} value={samples[`h${v}`] || ''}
                      onChange={e => setSamples({ ...samples, [`h${v}`]: e.target.value })} />
                  ))}
                  {bodyVars.map(v => (
                    <Input key={v} placeholder={`Body {{${v}}} example`} value={samples[v] || ''}
                      onChange={e => setSamples({ ...samples, [v]: e.target.value })} />
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="tpl-footer">Footer (optional)</Label>
              <Input id="tpl-footer" maxLength={60} value={footer} onChange={e => setFooter(e.target.value)} placeholder="Reply STOP to opt out" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Buttons (optional, max 3)</Label>
                <Button type="button" variant="outline" size="sm" onClick={addButton} disabled={buttons.length >= 3}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add button
                </Button>
              </div>
              {buttons.map((b, i) => (
                <div key={i} className="grid grid-cols-[130px_1fr_auto] gap-2 items-start">
                  <Select value={b.type} onValueChange={(v) => updateButton(i, { type: v as ButtonDraft['type'], value: '' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QUICK_REPLY">Quick reply</SelectItem>
                      <SelectItem value="URL">Website</SelectItem>
                      <SelectItem value="PHONE_NUMBER">Call phone</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="space-y-2">
                    <Input maxLength={25} placeholder="Button text" value={b.text} onChange={e => updateButton(i, { text: e.target.value })} />
                    {b.type !== 'QUICK_REPLY' && (
                      <Input
                        placeholder={b.type === 'URL' ? 'https://example.com' : '+919876543210'}
                        value={b.value}
                        onChange={e => updateButton(i, { value: e.target.value })}
                      />
                    )}
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setButtons(buttons.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="md:sticky md:top-0 self-start space-y-2">
            <Label>Preview</Label>
            <TemplatePreview header={header} body={body} footer={footer} buttons={buttons} samples={previewSamples} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className={WA_PRIMARY_BTN} disabled={!canSubmit || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Submitting…' : 'Submit for review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
