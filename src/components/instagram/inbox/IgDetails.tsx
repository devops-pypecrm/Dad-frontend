import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { instagramInboxApi } from '@/services/instagramService';
import { apiErrorMessage } from '@/lib/apiError';
import { IgAvatar } from './IgAvatar';
import { IG } from './ig';

const H = ({ children }: { children: string }) => <h3 className="mb-2 text-[14px] font-semibold" style={{ color: IG.text }}>{children}</h3>;
const FIELD = 'ig-flat w-full rounded-lg border-0 px-3 py-2 text-[14px] outline-none focus:ring-0 placeholder:text-[#8e8e8e]';

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
  const name = convo.username || convo.displayName || 'Instagram user';
  const addLabel = () => { if (!label.trim()) return; setLabels.mutate([...convo.labels, label.trim()]); setLabel(''); };

  return (
    <div className="h-full space-y-6 overflow-y-auto bg-white p-5" style={{ fontFamily: IG.font }}>
      <h2 className="text-[16px] font-semibold" style={{ color: IG.text }}>Details</h2>
      <section className="flex flex-col items-center gap-1 text-center">
        <IgAvatar src={convo.profilePicUrl} name={name} className="h-20 w-20" />
        <p className="mt-1 text-[16px] font-semibold" style={{ color: IG.text }}>{name}</p>
        {convo.displayName && convo.username && <p className="text-[13px]" style={{ color: IG.sub }}>{convo.displayName}</p>}
        {convo.username && <a href={`https://instagram.com/${convo.username}`} target="_blank" rel="noreferrer" className="mt-2 rounded-lg px-4 py-1.5 text-[14px] font-semibold" style={{ background: IG.soft, color: IG.text }}>View profile</a>}
      </section>

      <section>
        <H>Labels</H>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {convo.labels.map(l => <span key={l} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[13px] font-medium" style={{ background: IG.soft, color: IG.text }}>{l}<button aria-label={`Remove ${l}`} onClick={() => setLabels.mutate(convo.labels.filter(x => x !== l))}><X className="h-3 w-3" /></button></span>)}
          {convo.labels.length === 0 && <p className="text-[13px]" style={{ color: IG.sub }}>No labels yet.</p>}
        </div>
        <div className="flex items-center gap-2">
          <input className={FIELD} style={{ background: IG.soft }} placeholder="Add label" value={label} onChange={e => setLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLabel()} />
          <button disabled={!label.trim()} onClick={addLabel} className="text-[14px] font-semibold disabled:opacity-40" style={{ color: IG.blue }}>Add</button>
        </div>
      </section>

      <section>
        <H>Internal notes</H>
        <p className="mb-2 text-[12px]" style={{ color: IG.sub }}>Only your team sees these. They are never sent to the customer.</p>
        <div className="mb-2 space-y-2">{notes.map(n => <div key={n.id} className="rounded-lg p-3 text-[13px]" style={{ background: IG.panel, border: `1px solid ${IG.line}`, color: IG.text }}><p className="whitespace-pre-wrap">{n.body}</p><p className="mt-1 text-[11px]" style={{ color: IG.sub }}>{n.authorName} · {format(new Date(n.createdAt), 'dd MMM, HH:mm')}</p></div>)}</div>
        <textarea rows={2} className={FIELD} style={{ background: IG.soft }} placeholder="Add a note…" value={note} onChange={e => setNote(e.target.value)} />
        <button disabled={!note.trim() || addNote.isPending} onClick={() => addNote.mutate()} className="mt-2 w-full rounded-lg py-2 text-[14px] font-semibold text-white disabled:opacity-50" style={{ background: IG.blue }}>Save note</button>
      </section>
    </div>
  );
}
