import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertTriangle, BookOpen, Bot, ChevronDown, FileText, Loader2, Sparkles, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { aiApi, type WaAIStatus } from '@/services/whatsAppHubService';
import { useWhatsAppConnection } from '@/hooks/useWhatsAppConnection';
import { apiErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';
import { WhatsAppSection } from '../hub/WhatsAppSection';
import { StatusPill } from '../hub/StatusPill';
import { WA_CARD, WA_OUTLINE_BTN, WA_PRIMARY_BTN } from '../hub/whatsappStyles';

function KnowledgeRow({ cat, onSaved }: { cat: WaAIStatus['categories'][number]; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(cat.content);
  const save = useMutation({
    mutationFn: () => aiApi.saveSection(cat.key, value),
    onSuccess: () => { toast.success(`${cat.label} saved`); onSaved(); },
    onError: e => toast.error(apiErrorMessage(e, 'Could not save')),
  });
  const dirty = value !== cat.content;
  return (
    <div className="rounded-[10px] border border-border bg-white">
      <button className="flex w-full items-center gap-3 px-3 py-2.5 text-left" onClick={() => setOpen(o => !o)}>
        <span className={cn('h-2 w-2 rounded-full', cat.content.trim() ? 'bg-emerald-500' : 'bg-muted-foreground/30')} />
        <span className="flex-1">
          <span className="block text-sm font-medium font-poppins">{cat.label}</span>
          <span className="block text-[11px] text-muted-foreground">{cat.hint}</span>
        </span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="border-t border-border p-3 space-y-2">
          <Textarea rows={5} maxLength={8000} value={value} onChange={e => setValue(e.target.value)} placeholder={`Write what the assistant should know about: ${cat.label.toLowerCase()}`} />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{value.length}/8000</span>
            <Button size="sm" className={WA_PRIMARY_BTN} disabled={!dirty || save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AIAgentTab() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const { data: conn } = useWhatsAppConnection();
  const { data, isLoading } = useQuery({ queryKey: ['whatsapp', 'ai'], queryFn: aiApi.status });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['whatsapp', 'ai'] });
  const updateAgent = useMutation({ mutationFn: aiApi.updateAgent, onSuccess: refresh, onError: e => toast.error(apiErrorMessage(e, 'Could not update')) });
  const upload = useMutation({
    mutationFn: aiApi.upload,
    onSuccess: d => { if (d.status === 'failed') toast.error(d.errorMessage || 'File could not be read'); else toast.success('Document added'); refresh(); },
    onError: e => toast.error(apiErrorMessage(e, 'Upload failed')),
  });
  const delDoc = useMutation({ mutationFn: aiApi.deleteDoc, onSuccess: refresh, onError: e => toast.error(apiErrorMessage(e, 'Could not delete')) });
  const test = useMutation({
    mutationFn: aiApi.test,
    onSuccess: r => setTestResult(r.answer ?? r.reason ?? 'No answer'),
    onError: e => setTestResult(apiErrorMessage(e, 'Test failed')),
  });

  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [footerDraft, setFooterDraft] = useState<string | null>(null);

  if (isLoading || !data) return <div className={cn(WA_CARD, 'p-10 text-center text-sm text-muted-foreground')}>Loading AI agent…</div>;
  const { agent, usage, knowledge } = data;
  const usagePct = Math.min(100, Math.round((usage.used / Math.max(usage.limit, 1)) * 100));

  return (
    <div className="space-y-4">
      {!data.aiProviderConfigured && (
        <div className="flex items-start gap-2 rounded-[10px] border border-amber-300/60 bg-amber-50 px-4 py-3 text-xs text-amber-800 font-poppins">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>The AI provider has not been set up for this platform yet, so the assistant cannot answer. Ask your platform administrator to configure it under <strong>Super Admin → AI Integration</strong>. Your knowledge base is saved meanwhile.</span>
        </div>
      )}

      <div className="grid xl:grid-cols-[280px_1fr_300px] gap-4 items-start">
        {/* left: status */}
        <div className={cn(WA_CARD)}>
          <div className="bg-[hsl(var(--chart-5))] px-4 py-3 text-white flex items-center gap-2"><Bot className="h-5 w-5" /><div><p className="text-sm font-medium font-poppins">AI Agent</p><p className="text-[11px] opacity-80">Configuration</p></div></div>
          <div className="p-4 space-y-4 text-sm">
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-[hsl(var(--chart-5))] mb-1.5">WHATSAPP CONNECTION</p>
              <dl className="space-y-1 text-xs">
                <div className="flex justify-between"><dt className="text-muted-foreground">Phone</dt><dd>{conn?.phoneNumber || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Display name</dt><dd className="truncate max-w-[140px]">{conn?.verifiedName || '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Tier</dt><dd>{conn?.messagingTier?.replace('TIER_', '') || '—'}</dd></div>
              </dl>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-[hsl(var(--chart-5))] mb-1.5">AI AGENT STATUS</p>
              <div className="flex items-center justify-between"><span className="text-xs">Answer customers automatically</span>
                <Switch checked={agent.isEnabled} disabled={updateAgent.isPending} onCheckedChange={v => updateAgent.mutate({ isEnabled: v })} /></div>
              <div className="mt-2 flex justify-between text-xs"><span className="text-muted-foreground">Trained documents</span><span>{data.documents.filter(d => d.status === 'ready').length} files</span></div>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-[hsl(var(--chart-5))] mb-1.5">KNOWLEDGE BASE</p>
              <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Sections filled</span><span>{knowledge.filled} / {knowledge.total}</span></div>
              <Progress value={knowledge.percent} className="h-1.5" />
              <p className="mt-1 text-[11px] text-muted-foreground">{knowledge.percent}% complete</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-[hsl(var(--chart-5))] mb-1.5">AI MESSAGES THIS MONTH</p>
              <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{usage.used.toLocaleString()} / {usage.limit.toLocaleString()}</span><span>{usagePct}%</span></div>
              <Progress value={usagePct} className="h-1.5" />
            </div>
          </div>
        </div>

        {/* middle: knowledge base */}
        <WhatsAppSection title="Knowledge Base" description="Train your AI — expand each section and upload files." icon={<BookOpen />}>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-[10px] border border-border p-3 space-y-2">
                <Label className="text-xs">Chatbot name</Label>
                <div className="flex gap-2">
                  <Input className="h-9 rounded-[10px]" value={nameDraft ?? agent.chatbotName} onChange={e => setNameDraft(e.target.value)} />
                  <Button size="sm" className={WA_PRIMARY_BTN} disabled={nameDraft === null || !nameDraft.trim()} onClick={() => { updateAgent.mutate({ chatbotName: nameDraft! }); setNameDraft(null); }}>Save</Button>
                </div>
              </div>
              <div className="rounded-[10px] border border-border p-3 space-y-2">
                <div className="flex items-center justify-between"><Label className="text-xs">Chat footer</Label><Switch checked={agent.showFooter} onCheckedChange={v => updateAgent.mutate({ showFooter: v })} /></div>
                <div className="flex gap-2">
                  <Input className="h-9 rounded-[10px]" disabled={!agent.showFooter} value={footerDraft ?? agent.footerText} onChange={e => setFooterDraft(e.target.value)} />
                  <Button size="sm" className={WA_PRIMARY_BTN} disabled={footerDraft === null} onClick={() => { updateAgent.mutate({ footerText: footerDraft! }); setFooterDraft(null); }}>Save</Button>
                </div>
              </div>
              <div className="rounded-[10px] border border-border p-3 space-y-2">
                <Label className="text-xs">Tone</Label>
                <Select value={agent.tone} onValueChange={v => updateAgent.mutate({ tone: v })}>
                  <SelectTrigger className="h-9 rounded-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="friendly">Friendly</SelectItem><SelectItem value="professional">Professional</SelectItem><SelectItem value="concise">Concise</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="rounded-[10px] border border-border p-3 space-y-2">
                <Label className="text-xs">When it can't answer</Label>
                <Input className="h-9 rounded-[10px]" defaultValue={agent.handoffMessage} onBlur={e => e.target.value !== agent.handoffMessage && updateAgent.mutate({ handoffMessage: e.target.value })} />
              </div>
            </div>

            <p className="text-center text-[10px] font-semibold tracking-widest text-muted-foreground">KNOWLEDGE CATEGORIES</p>
            <div className="space-y-2">{data.categories.map(c => <KnowledgeRow key={c.key + c.content.length} cat={c} onSaved={refresh} />)}</div>

            <div className="rounded-[10px] border border-dashed border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div><p className="text-sm font-medium font-poppins">Documents</p><p className="text-[11px] text-muted-foreground">PDF, Word, Excel, CSV or text · up to 10 MB each</p></div>
                <>
                  <input ref={fileRef} type="file" className="hidden" accept=".pdf,.docx,.xlsx,.csv,.txt,.md" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload.mutate(f); }} />
                  <Button size="sm" variant="outline" className={WA_OUTLINE_BTN} disabled={upload.isPending} onClick={() => fileRef.current?.click()}>
                    {upload.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Upload className="h-4 w-4 mr-1.5" />}Upload
                  </Button>
                </>
              </div>
              {data.documents.length === 0 ? <p className="text-xs text-muted-foreground">No documents yet.</p> : (
                <ul className="divide-y divide-border">
                  {data.documents.map(d => (
                    <li key={d.id} className="flex items-center gap-3 py-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div className="min-w-0 flex-1"><p className="truncate text-sm">{d.fileName}</p><p className="text-[11px] text-muted-foreground">{(d.sizeBytes / 1024).toFixed(0)} KB{d.status === 'ready' && ` · ${d.chunkCount} passages`}{d.errorMessage && ` · ${d.errorMessage}`}</p></div>
                      <StatusPill tone={d.status === 'ready' ? 'success' : d.status === 'failed' ? 'danger' : 'warning'}>{d.status}</StatusPill>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => delDoc.mutate(d.id)}><Trash2 className="h-4 w-4" /></Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </WhatsAppSection>

        {/* right: how it works + test */}
        <div className="space-y-4">
          <WhatsAppSection title="Try it" description="Ask a question the way a customer would." icon={<Sparkles />}>
            <div className="space-y-2">
              <Textarea rows={2} className="rounded-[10px]" placeholder="What are your opening hours?" value={question} onChange={e => setQuestion(e.target.value)} />
              <Button size="sm" className={cn('w-full', WA_PRIMARY_BTN)} disabled={!question.trim() || test.isPending} onClick={() => { setTestResult(null); test.mutate(question); }}>{test.isPending ? 'Thinking…' : 'Ask'}</Button>
              {testResult && <div className="rounded-[10px] bg-muted/60 p-3 text-xs whitespace-pre-wrap">{testResult}</div>}
            </div>
          </WhatsAppSection>
          <WhatsAppSection title="How it works" icon={<Bot />}>
            <ol className="space-y-2.5 text-xs">
              {[
                ['Upload & train', 'Add your products, pricing, FAQs and policies under each category.'],
                ['AI processes', 'It reads your content and builds a searchable knowledge base.'],
                ['Auto-respond', 'Customer messages that no chatbot flow handles are answered from your knowledge.'],
                ['Hand-off', 'If it does not know, it says so and passes the chat to your team.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-2.5"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--chart-5))]/15 text-[10px] font-semibold text-[hsl(var(--chart-5))]">{i + 1}</span><span><strong className="font-medium">{t}.</strong> <span className="text-muted-foreground">{d}</span></span></li>
              ))}
            </ol>
          </WhatsAppSection>
        </div>
      </div>
    </div>
  );
}
