import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ExternalLink, Plus, StickyNote, Tag, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { instagramInboxApi } from '@/services/instagramService';
import { apiErrorMessage } from '@/lib/apiError';
import { WA_PRIMARY_BTN } from '@/components/WhatsApp/hub/whatsappStyles';
import { IgAvatar } from './IgAvatar';

export function IgDetails({ conversationId }: { conversationId: string }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [label, setLabel] = useState('');
  const { data: convo } = useQuery({ queryKey: ['instagram', 'inbox', 'conv', conversationId], queryFn: () => instagramInboxApi.get(conversationId) });
  const { data: notes = [] } = useQuery({ queryKey: ['instagram', 'inbox', 'notes', conversationId], queryFn: () => instagramInboxApi.notes(conversationId) });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['instagram', 'inbox'] });
  const setLabels = useMutation({ mutationFn: (l: string[]) => instagramInboxApi.update(conversationId, { labels: l }), onSuccess: refresh, onError: e => toast.error(apiErrorMessage(e, 'Could not update labels')) });
  const addNote = useMutation({ mutationFn: () => instagramInboxApi.addNote(conversationId, note), onSuccess: () => { setNote(''); refresh(); }, onError: e => toast.error(apiErrorMessage(e, 'Could not save note')) });
  if (!convo) return null;
  const name = convo.username ? `@${convo.username}` : convo.displayName || 'Instagram user';

  return (
    <div className="h-full overflow-y-auto p-4 space-y-5 bg-white">
      <section className="flex flex-col items-center text-center gap-2">
        <IgAvatar src={convo.profilePicUrl} name={name} className="h-16 w-16 text-xl" />
        <div><p className="font-medium font-poppins">{name}</p>{convo.displayName && convo.username && <p className="text-xs text-muted-foreground">{convo.displayName}</p>}</div>
        {convo.username && <a href={`https://instagram.com/${convo.username}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[hsl(var(--chart-5))] hover:underline">View on Instagram <ExternalLink className="h-3 w-3" /></a>}
      </section>

      <section>
        <h3 className="text-sm font-medium font-poppins text-black mb-2 flex items-center gap-1.5"><Tag className="h-4 w-4 text-[hsl(var(--chart-5))]" />Labels</h3>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {convo.labels.map(l => <span key={l} className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--chart-5))]/10 px-2.5 py-0.5 text-xs text-[hsl(var(--chart-5))]">{l}<button aria-label={`Remove ${l}`} onClick={() => setLabels.mutate(convo.labels.filter(x => x !== l))}><X className="h-3 w-3" /></button></span>)}
          {convo.labels.length === 0 && <p className="text-xs text-muted-foreground">No labels yet.</p>}
        </div>
        <div className="flex gap-2">
          <Input className="h-8 rounded-[10px] text-xs" placeholder="Add label" value={label} onChange={e => setLabel(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && label.trim()) { setLabels.mutate([...convo.labels, label.trim()]); setLabel(''); } }} />
          <Button size="sm" variant="outline" className="h-8 rounded-[10px]" disabled={!label.trim()} onClick={() => { setLabels.mutate([...convo.labels, label.trim()]); setLabel(''); }}><Plus className="h-4 w-4" /></Button>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium font-poppins text-black mb-2 flex items-center gap-1.5"><StickyNote className="h-4 w-4 text-[hsl(var(--chart-5))]" />Internal notes</h3>
        <p className="text-[11px] text-muted-foreground mb-2">Only your team sees these. They are never sent to the customer.</p>
        <div className="space-y-2 mb-2">{notes.map(n => <div key={n.id} className="rounded-[10px] bg-amber-50 border border-amber-200/70 p-2.5 text-xs"><p className="whitespace-pre-wrap">{n.body}</p><p className="mt-1 text-[10px] text-muted-foreground">{n.authorName} · {format(new Date(n.createdAt), 'dd MMM, HH:mm')}</p></div>)}</div>
        <Textarea rows={2} className="rounded-[10px] text-xs" placeholder="Add a note…" value={note} onChange={e => setNote(e.target.value)} />
        <Button size="sm" className={`mt-2 w-full ${WA_PRIMARY_BTN}`} disabled={!note.trim() || addNote.isPending} onClick={() => addNote.mutate()}>Save note</Button>
      </section>
    </div>
  );
}
