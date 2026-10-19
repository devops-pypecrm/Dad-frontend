import { useState } from 'react';
import { AlertTriangle, Clock, GripVertical, KeyRound, Layers, MessageSquareText, Minus, Plus, Maximize2, RotateCcw, Settings, Trash2, Zap, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { blankMessage, minutesLabel, type EditTarget, type WorkflowDraft } from './types';

const DND_NEW = 'text/ig-new-step';
const DND_MOVE = 'text/ig-move-step';

interface CardProps { icon: React.ReactNode; tone: 'pink' | 'purple' | 'red' | 'green'; title: string; subtitle: string; warning?: string; selected?: boolean; onEdit: () => void; onDelete?: () => void; deleteIcon?: 'trash' | 'reset'; draggable?: boolean; onDragStart?: (e: React.DragEvent) => void; onDragEnd?: () => void }

const TONE = {
  pink: { chip: 'bg-pink-500 text-white', ring: 'border-pink-400 ring-2 ring-pink-200' },
  purple: { chip: 'bg-violet-500 text-white', ring: 'border-violet-400 ring-2 ring-violet-200' },
  red: { chip: 'bg-red-500 text-white', ring: 'border-red-400 ring-2 ring-red-200' },
  green: { chip: 'bg-emerald-500 text-white', ring: 'border-emerald-400 ring-2 ring-emerald-200' },
};

function StepCard({ icon, tone, title, subtitle, warning, selected, onEdit, onDelete, deleteIcon = 'trash', draggable, onDragStart, onDragEnd }: CardProps) {
  return (
    <div
      draggable={draggable} onDragStart={onDragStart} onDragEnd={onDragEnd}
      className={cn('w-[300px] rounded-[12px] border bg-white p-3 shadow-sm transition-shadow hover:shadow-md', selected ? TONE[tone].ring : 'border-border', draggable && 'cursor-grab active:cursor-grabbing')}
    >
      <div className="flex items-center gap-3">
        {draggable && <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/60" />}
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg [&>svg]:h-4 [&>svg]:w-4', TONE[tone].chip)}>{icon}</div>
        <div className="min-w-0 flex-1"><p className="text-sm font-medium font-poppins text-black">{title}</p><p className="truncate text-xs text-muted-foreground">{subtitle}</p></div>
        <button aria-label={`Edit ${title}`} onClick={onEdit} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><Settings className="h-4 w-4" /></button>
        {onDelete && <button aria-label={deleteIcon === 'trash' ? `Delete ${title}` : `Reset ${title}`} onClick={onDelete} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive">{deleteIcon === 'trash' ? <Trash2 className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}</button>}
      </div>
      {warning && <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-700"><AlertTriangle className="h-3.5 w-3.5" />{warning}</div>}
    </div>
  );
}

const Connector = () => (<div className="flex flex-col items-center py-1"><span className="h-3 w-px bg-border" /><span className="h-1.5 w-1.5 rounded-full bg-border" /><span className="h-3 w-px bg-border" /></div>);

function DropZone({ onDrop, active, label }: { onDrop: (e: React.DragEvent) => void; active: boolean; label?: string }) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={e => { setOver(false); onDrop(e); }}
      className={cn('w-[300px] rounded-[12px] border-2 border-dashed text-center transition-all', over ? 'border-emerald-500 bg-emerald-50' : 'border-border bg-white/70', label ? 'py-5' : active ? 'h-8' : 'h-2 border-transparent')}
    >
      {label && (<div className="flex flex-col items-center gap-1 text-xs text-muted-foreground"><PlusCircle className={cn('h-5 w-5', over ? 'text-emerald-600' : 'text-emerald-500')} />{label}</div>)}
    </div>
  );
}

interface Props { draft: WorkflowDraft; onChange: (d: WorkflowDraft) => void; editing: EditTarget; onEdit: (t: EditTarget) => void; dragging: boolean; setDragging: (v: boolean) => void }

/** The vertical flow: Start → Trigger → Keywords → Chat Window → Freeform messages (drag to add / reorder). */
export function WorkflowCanvas({ draft, onChange, editing, onEdit, dragging, setDragging }: Props) {
  const [zoom, setZoom] = useState(1);
  const is = (k: string) => editing?.kind === k;

  const dropAt = (index: number) => (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const move = e.dataTransfer.getData(DND_MOVE);
    if (move !== '') {
      const from = Number(move);
      if (Number.isNaN(from)) return;
      const msgs = [...draft.messages];
      const [m] = msgs.splice(from, 1);
      msgs.splice(index > from ? index - 1 : index, 0, m);
      onChange({ ...draft, messages: msgs });
    } else if (e.dataTransfer.getData(DND_NEW) === 'message') {
      const m = blankMessage();
      const msgs = [...draft.messages]; msgs.splice(index, 0, m);
      onChange({ ...draft, messages: msgs });
      onEdit({ kind: 'message', id: m.id });
    }
  };

  return (
    <div className="relative h-full overflow-auto bg-[#f7f7f8] [background-image:radial-gradient(#d9d9de_1px,transparent_1px)] [background-size:18px_18px]">
      <div className="absolute left-4 top-4 z-10 flex items-center rounded-[10px] border border-border bg-white shadow-sm">
        <button aria-label="Zoom out" className="p-2 hover:bg-muted" onClick={() => setZoom(z => Math.max(0.5, +(z - 0.1).toFixed(1)))}><Minus className="h-4 w-4" /></button>
        <span className="w-12 text-center text-xs font-medium">{Math.round(zoom * 100)}%</span>
        <button aria-label="Zoom in" className="p-2 hover:bg-muted" onClick={() => setZoom(z => Math.min(1.5, +(z + 0.1).toFixed(1)))}><Plus className="h-4 w-4" /></button>
        <button aria-label="Fit" className="border-l border-border p-2 hover:bg-muted" onClick={() => setZoom(1)}><Maximize2 className="h-4 w-4" /></button>
      </div>

      <div className="flex min-h-full justify-center px-6 py-14" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 rounded-[10px] border border-border bg-white px-4 py-2 text-sm font-medium font-poppins shadow-sm"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500 text-white"><Layers className="h-4 w-4" /></span>Start Flow</div>
          <Connector />
          <StepCard tone="pink" icon={<Zap />} title="Trigger" subtitle={draft.matchType === 'exact' ? 'Exact keyword match' : 'Keyword response trigger'} selected={is('trigger')} onEdit={() => onEdit({ kind: 'trigger' })} onDelete={() => onChange({ ...draft, matchType: 'contains' })} deleteIcon="reset" />
          <Connector />
          <StepCard tone="purple" icon={<KeyRound />} title="Keywords" subtitle={draft.keywords.length ? draft.keywords.slice(0, 4).join(', ') + (draft.keywords.length > 4 ? ` +${draft.keywords.length - 4}` : '') : 'No keywords set'} warning={draft.keywords.length ? undefined : 'Configuration required'} selected={is('keywords')} onEdit={() => onEdit({ kind: 'keywords' })} onDelete={() => onChange({ ...draft, keywords: [] })} deleteIcon="reset" />
          <Connector />
          <StepCard tone="red" icon={<Clock />} title="Chat Window" subtitle={minutesLabel(draft.chatWindowMinutes)} selected={is('window')} onEdit={() => onEdit({ kind: 'window' })} onDelete={() => onChange({ ...draft, chatWindowMinutes: 60 })} deleteIcon="reset" />

          {draft.messages.map((m, i) => (
            <div key={m.id} className="flex flex-col items-center">
              <Connector />
              {dragging && <DropZone active onDrop={dropAt(i)} />}
              <StepCard
                tone="green" icon={<MessageSquareText />} title={`Freeform Message ${i + 1}`} subtitle={m.text.trim() ? m.text.trim().slice(0, 46) : 'Compose & send message'}
                warning={m.text.trim() ? undefined : 'Configuration required'} selected={editing?.kind === 'message' && editing.id === m.id}
                onEdit={() => onEdit({ kind: 'message', id: m.id })} onDelete={() => { onChange({ ...draft, messages: draft.messages.filter(x => x.id !== m.id) }); if (editing?.kind === 'message' && editing.id === m.id) onEdit(null); }}
                draggable onDragStart={e => { e.dataTransfer.setData(DND_MOVE, String(i)); e.dataTransfer.effectAllowed = 'move'; setDragging(true); }} onDragEnd={() => setDragging(false)}
              />
            </div>
          ))}

          <Connector />
          <DropZone active={dragging} onDrop={dropAt(draft.messages.length)} label="Drop Freeform Message here" />
        </div>
      </div>
    </div>
  );
}
