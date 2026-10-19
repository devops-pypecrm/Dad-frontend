import { useState } from 'react';
import { ArrowLeft, Clock, KeyRound, MessageSquareText, Plus, Trash2, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { WA_OUTLINE_BTN } from '@/components/WhatsApp/hub/whatsappStyles';
import { blankMessage, minutesLabel, type EditTarget, type WorkflowDraft } from './types';

const DND_NEW = 'text/ig-new-step';

function PaletteItem({ icon, title, subtitle, tone, disabled, draggable, onDragStart, onDragEnd, onClick }: { icon: React.ReactNode; title: string; subtitle: string; tone: string; disabled?: boolean; draggable?: boolean; onDragStart?: (e: React.DragEvent) => void; onDragEnd?: () => void; onClick?: () => void }) {
  return (
    <div
      draggable={draggable && !disabled} onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={disabled ? undefined : onClick}
      className={cn('flex items-center gap-3 rounded-[12px] border bg-white p-3 transition-all', disabled ? 'opacity-45 cursor-not-allowed border-border' : 'cursor-grab border-emerald-200 shadow-sm hover:shadow-md active:cursor-grabbing')}
      title={disabled ? 'Already part of this workflow' : 'Drag onto the canvas, or click to add'}
    >
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white [&>svg]:h-4 [&>svg]:w-4', tone)}>{icon}</div>
      <div className="min-w-0"><p className="text-sm font-medium font-poppins text-black">{title}</p><p className="truncate text-xs text-muted-foreground">{subtitle}</p></div>
    </div>
  );
}

interface Props { draft: WorkflowDraft; onChange: (d: WorkflowDraft) => void; editing: EditTarget; onEdit: (t: EditTarget) => void; setDragging: (v: boolean) => void }

/** Right-hand panel: the "Workflow Steps" palette, or the settings of the selected step. */
export function StepPanel({ draft, onChange, editing, onEdit, setDragging }: Props) {
  const [kw, setKw] = useState('');

  const addKeywords = () => {
    const next = kw.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length >= 2);
    if (!next.length) return;
    onChange({ ...draft, keywords: Array.from(new Set([...draft.keywords, ...next])).slice(0, 30) });
    setKw('');
  };

  if (!editing) {
    return (
      <div className="space-y-3 p-4">
        <p className="text-sm font-medium font-poppins text-black">Workflow Steps</p>
        <PaletteItem tone="bg-pink-500" icon={<Zap />} title="Trigger" subtitle="Keyword response trigger" disabled />
        <PaletteItem tone="bg-violet-500" icon={<KeyRound />} title="Keywords" subtitle="Match keywords" disabled />
        <PaletteItem tone="bg-red-500" icon={<Clock />} title="Chat Window" subtitle="Set time limit" disabled />
        <PaletteItem
          tone="bg-emerald-500" icon={<MessageSquareText />} title="Freeform Message" subtitle="Compose & send message" draggable
          onDragStart={e => { e.dataTransfer.setData(DND_NEW, 'message'); e.dataTransfer.effectAllowed = 'copy'; setDragging(true); }} onDragEnd={() => setDragging(false)}
          onClick={() => { const m = blankMessage(); onChange({ ...draft, messages: [...draft.messages, m] }); onEdit({ kind: 'message', id: m.id }); }}
        />
        <p className="pt-2 text-[11px] leading-snug text-muted-foreground">Drag <strong>Freeform Message</strong> onto the canvas to add a reply. Click the gear on any step to configure it.</p>
      </div>
    );
  }

  const back = (title: string) => (
    <button onClick={() => onEdit(null)} className="mb-3 flex items-center gap-1.5 text-xs font-poppins text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Back to steps<span className="ml-auto font-medium text-black">{title}</span></button>
  );

  if (editing.kind === 'trigger') {
    return (
      <div className="p-4 space-y-4">{back('Trigger')}
        <p className="text-xs text-muted-foreground">The workflow starts when someone sends your account a DM that matches the keywords.</p>
        <div className="space-y-1.5"><Label className="text-xs">Match</Label>
          <Select value={draft.matchType} onValueChange={v => onChange({ ...draft, matchType: v as 'contains' | 'exact' })}>
            <SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="contains">Message contains a keyword</SelectItem><SelectItem value="exact">Message is exactly a keyword</SelectItem></SelectContent>
          </Select></div>
      </div>
    );
  }

  if (editing.kind === 'keywords') {
    return (
      <div className="p-4 space-y-3">{back('Keywords')}
        <Label className="text-xs">Add keywords (comma separated)</Label>
        <div className="flex gap-2"><Input className="rounded-[10px]" placeholder="price, pricing, cost" value={kw} onChange={e => setKw(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKeywords()} /><Button variant="outline" className={WA_OUTLINE_BTN} onClick={addKeywords}><Plus className="h-4 w-4" /></Button></div>
        <div className="flex flex-wrap gap-1.5">
          {draft.keywords.map(k => <span key={k} className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs text-violet-700">{k}<button aria-label={`Remove ${k}`} onClick={() => onChange({ ...draft, keywords: draft.keywords.filter(x => x !== k) })}><X className="h-3 w-3" /></button></span>)}
          {draft.keywords.length === 0 && <p className="text-xs text-muted-foreground">No keywords yet. The chatbot needs at least one.</p>}
        </div>
        <p className="text-[11px] text-muted-foreground">Matching ignores capital letters.</p>
      </div>
    );
  }

  if (editing.kind === 'window') {
    const presets = [15, 60, 360, 1440];
    return (
      <div className="p-4 space-y-3">{back('Chat Window')}
        <p className="text-xs text-muted-foreground">After the workflow runs for someone, it will not run again for them until this time has passed. This stops repeat messages when people send the keyword several times.</p>
        <div className="flex flex-wrap gap-1.5">{presets.map(p => <button key={p} onClick={() => onChange({ ...draft, chatWindowMinutes: p })} className={cn('rounded-full border px-3 py-1 text-xs', draft.chatWindowMinutes === p ? 'bg-[hsl(var(--chart-5))] border-transparent text-white' : 'bg-white hover:bg-muted')}>{minutesLabel(p)}</button>)}</div>
        <div className="flex items-center gap-2"><Input type="number" min={1} max={10080} className="w-28 rounded-[10px]" value={draft.chatWindowMinutes} onChange={e => onChange({ ...draft, chatWindowMinutes: Math.min(10080, Math.max(1, Number(e.target.value) || 1)) })} /><span className="text-xs text-muted-foreground">minutes</span></div>
      </div>
    );
  }

  const msg = draft.messages.find(m => m.id === editing.id);
  if (!msg) return <div className="p-4">{back('Message')}<p className="text-xs text-muted-foreground">This message was removed.</p></div>;
  const patch = (p: Partial<typeof msg>) => onChange({ ...draft, messages: draft.messages.map(m => (m.id === msg.id ? { ...m, ...p } : m)) });
  return (
    <div className="p-4 space-y-4">{back(`Freeform Message ${draft.messages.indexOf(msg) + 1}`)}
      <div className="space-y-1.5"><Label className="text-xs">Message</Label><Textarea rows={6} maxLength={1000} className="rounded-[10px]" placeholder="Hi! Thanks for reaching out…" value={msg.text} onChange={e => patch({ text: e.target.value })} /><p className="text-right text-[11px] text-muted-foreground">{msg.text.length}/1000</p></div>
      <div className="space-y-2">
        <div className="flex items-center justify-between"><Label className="text-xs">Link buttons (optional, max 3)</Label><Button type="button" size="sm" variant="outline" className={cn('h-7', WA_OUTLINE_BTN)} disabled={msg.buttons.length >= 3} onClick={() => patch({ buttons: [...msg.buttons, { title: '', url: '' }] })}><Plus className="h-3.5 w-3.5 mr-1" />Add</Button></div>
        {msg.buttons.map((b, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1 space-y-1.5"><Input maxLength={20} className="h-8 rounded-lg text-xs" placeholder="Button text" value={b.title} onChange={e => patch({ buttons: msg.buttons.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} /><Input className="h-8 rounded-lg text-xs" placeholder="https://…" value={b.url} onChange={e => patch({ buttons: msg.buttons.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} /></div>
            <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => patch({ buttons: msg.buttons.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
      <div className="rounded-[12px] bg-[#f0f0f3] p-3"><p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
        <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white p-2.5 text-sm shadow-sm">{msg.text || <span className="text-muted-foreground">Your message…</span>}{msg.buttons.filter(b => b.title).map((b, i) => <div key={i} className="mt-2 rounded-md bg-muted px-2 py-1 text-center text-xs font-medium text-sky-600">{b.title}</div>)}</div></div>
    </div>
  );
}
