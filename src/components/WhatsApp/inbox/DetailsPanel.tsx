import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ExternalLink, Plus, StickyNote, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { inboxApi } from '@/services/whatsAppHubService';
import { apiErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';
import { WA_PRIMARY_BTN } from '../hub/whatsappStyles';

export function DetailsPanel({ conversationId }: { conversationId: string }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const { data: convo } = useQuery({ queryKey: ['whatsapp', 'inbox', 'conv', conversationId], queryFn: () => inboxApi.get(conversationId) });
  const { data: labels = [] } = useQuery({ queryKey: ['whatsapp', 'inbox', 'labels'], queryFn: inboxApi.labels });
  const { data: notes = [] } = useQuery({ queryKey: ['whatsapp', 'inbox', 'notes', conversationId], queryFn: () => inboxApi.notes(conversationId) });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['whatsapp', 'inbox'] });

  const setLabels = useMutation({ mutationFn: (l: string[]) => inboxApi.update(conversationId, { labels: l }), onSuccess: refresh, onError: e => toast.error(apiErrorMessage(e, 'Could not update labels')) });
  const addNote = useMutation({ mutationFn: () => inboxApi.addNote(conversationId, note), onSuccess: () => { setNote(''); refresh(); }, onError: e => toast.error(apiErrorMessage(e, 'Could not save note')) });
  const createLabel = useMutation({
    mutationFn: () => inboxApi.createLabel({ name: newLabel }),
    onSuccess: l => { setNewLabel(''); setLabels.mutate([...(convo?.labels || []), l.name]); },
    onError: e => toast.error(apiErrorMessage(e, 'Could not create label')),
  });

  if (!convo) return null;
  const toggle = (name: string) => setLabels.mutate(convo.labels.includes(name) ? convo.labels.filter(l => l !== name) : [...convo.labels, name]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-5 bg-white">
      <section>
        <h3 className="text-sm font-medium font-poppins text-black mb-2">Contact</h3>
        <div className="rounded-[10px] border border-border p-3 text-sm space-y-1">
          <p className="font-medium">{convo.displayName || `+${convo.phoneNumber}`}</p>
          <p className="text-xs text-muted-foreground">+{convo.phoneNumber}</p>
          {convo.optedOut && <p className="text-xs font-medium text-destructive">Opted out of messages</p>}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium font-poppins text-black mb-2">Lead</h3>
        {convo.lead ? (
          <div className="rounded-[10px] border border-border p-3 text-xs space-y-1.5">
            <Link to={`/leads/${convo.lead.id}`} className="flex items-center justify-between text-sm font-medium text-[hsl(var(--chart-5))] hover:underline">
              {convo.lead.firstName} {convo.lead.lastName} <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <p className="text-muted-foreground capitalize">Status: <span className="text-foreground">{convo.lead.status.replace(/_/g, ' ')}</span></p>
            <p className="text-muted-foreground capitalize">Source: <span className="text-foreground">{convo.lead.source.replace(/_/g, ' ')}</span></p>
            {convo.lead.nextFollowUp && <p className="text-muted-foreground">Next follow-up: <span className="text-foreground">{format(new Date(convo.lead.nextFollowUp), 'dd MMM, HH:mm')}</span></p>}
            {convo.lead.tags.length > 0 && <div className="flex flex-wrap gap-1 pt-1">{convo.lead.tags.map(t => <span key={t} className="rounded-full bg-muted px-2 py-px">{t}</span>)}</div>}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Not linked to a lead yet. Leads are created automatically from new inbound numbers.</p>
        )}
      </section>

      <section>
        <h3 className="text-sm font-medium font-poppins text-black mb-2 flex items-center gap-1.5"><Tag className="h-4 w-4 text-[hsl(var(--chart-5))]" />Labels</h3>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {labels.map(l => (
            <button key={l.id} onClick={() => toggle(l.name)} className={cn('rounded-full border px-2.5 py-0.5 text-xs transition-colors', convo.labels.includes(l.name) ? 'text-white border-transparent' : 'bg-white hover:bg-muted')} style={convo.labels.includes(l.name) ? { backgroundColor: l.color } : undefined}>
              {l.name}
            </button>
          ))}
          {labels.length === 0 && <p className="text-xs text-muted-foreground">No labels yet.</p>}
        </div>
        <div className="flex gap-2">
          <Input className="h-8 rounded-[10px] text-xs" placeholder="New label" value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && newLabel.trim() && createLabel.mutate()} />
          <Button size="sm" variant="outline" className="h-8 rounded-[10px]" disabled={!newLabel.trim()} onClick={() => createLabel.mutate()}><Plus className="h-4 w-4" /></Button>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium font-poppins text-black mb-2 flex items-center gap-1.5"><StickyNote className="h-4 w-4 text-[hsl(var(--chart-5))]" />Internal notes</h3>
        <p className="text-[11px] text-muted-foreground mb-2">Only your team sees these. They are never sent to the customer.</p>
        <div className="space-y-2 mb-2">
          {notes.map(n => (
            <div key={n.id} className="rounded-[10px] bg-amber-50 border border-amber-200/70 p-2.5 text-xs">
              <p className="whitespace-pre-wrap">{n.body}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">{n.authorName} · {format(new Date(n.createdAt), 'dd MMM, HH:mm')}</p>
            </div>
          ))}
        </div>
        <Textarea rows={2} className="rounded-[10px] text-xs" placeholder="Add a note…" value={note} onChange={e => setNote(e.target.value)} />
        <Button size="sm" className={cn('mt-2 w-full', WA_PRIMARY_BTN)} disabled={!note.trim() || addNote.isPending} onClick={() => addNote.mutate()}>Save note</Button>
      </section>
    </div>
  );
}
