import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ExternalLink, Plus, StickyNote, Tag, X } from 'lucide-react';
import { toast } from 'sonner';
import { inboxApi } from '@/services/whatsAppHubService';
import { apiErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';
import { WaAvatar } from './WaAvatar';
import { WA } from './wa';

const Section = ({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) => (
  <section className="mt-2 bg-white px-[30px] py-4 shadow-[0_1px_3px_rgba(11,20,26,0.08)]">
    <h3 className="mb-3 flex items-center gap-2 text-[14px]" style={{ color: WA.sub }}>{icon}{title}</h3>
    {children}
  </section>
);

/** WhatsApp-style "Contact info" panel. */
export function DetailsPanel({ conversationId, onClose }: { conversationId: string; onClose: () => void }) {
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

  const name = convo?.displayName || (convo ? `+${convo.phoneNumber}` : '');
  const toggle = (n: string) => convo && setLabels.mutate(convo.labels.includes(n) ? convo.labels.filter(l => l !== n) : [...convo.labels, n]);

  return (
    <div className="flex h-full flex-col" style={{ background: WA.panel, fontFamily: WA.font }}>
      <div className="flex h-[59px] shrink-0 items-center gap-6 px-4" style={{ background: WA.panel }}>
        <button onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-black/5" style={{ color: WA.icon }}><X className="h-5 w-5" /></button>
        <span className="text-[16px] font-medium" style={{ color: WA.text }}>Contact info</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {convo && (
          <>
            <section className="flex flex-col items-center bg-white px-6 pb-5 pt-7 shadow-[0_1px_3px_rgba(11,20,26,0.08)]">
              <WaAvatar name={name} className="h-[200px] w-[200px] text-[90px]" />
              <h2 className="mt-3 text-center text-[22px] leading-7" style={{ color: WA.text }}>{name}</h2>
              <p className="text-[16px]" style={{ color: WA.sub }}>+{convo.phoneNumber}</p>
              {convo.optedOut && <p className="mt-2 rounded-full px-3 py-0.5 text-[12.5px] font-medium" style={{ background: '#fde7ea', color: '#ea0038' }}>Opted out of messages</p>}
            </section>

            <Section title="Lead">
              {convo.lead ? (
                <div className="space-y-1.5 text-[14.5px]" style={{ color: WA.text }}>
                  <Link to={`/leads/${convo.lead.id}`} className="flex items-center justify-between text-[16px] hover:underline" style={{ color: WA.greenDark }}>{convo.lead.firstName} {convo.lead.lastName}<ExternalLink className="h-4 w-4" /></Link>
                  <p style={{ color: WA.sub }}>Status: <span className="capitalize" style={{ color: WA.text }}>{convo.lead.status.replace(/_/g, ' ')}</span></p>
                  <p style={{ color: WA.sub }}>Source: <span className="capitalize" style={{ color: WA.text }}>{convo.lead.source.replace(/_/g, ' ')}</span></p>
                  {convo.lead.nextFollowUp && <p style={{ color: WA.sub }}>Next follow-up: <span style={{ color: WA.text }}>{format(new Date(convo.lead.nextFollowUp), 'dd MMM, h:mm a')}</span></p>}
                  {convo.lead.tags.length > 0 && <div className="flex flex-wrap gap-1 pt-1">{convo.lead.tags.map(t => <span key={t} className="rounded-full px-2 py-0.5 text-[12px]" style={{ background: WA.panel }}>{t}</span>)}</div>}
                </div>
              ) : <p className="text-[14px]" style={{ color: WA.sub }}>Not linked to a lead yet. Leads are created automatically from new inbound numbers.</p>}
            </Section>

            <Section title="Labels" icon={<Tag className="h-4 w-4" />}>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {labels.map(l => {
                  const on = convo.labels.includes(l.name);
                  return <button key={l.id} onClick={() => toggle(l.name)} className={cn('rounded-full border px-3 py-1 text-[13px] transition-colors', !on && 'bg-white hover:bg-[#f5f6f6]')} style={on ? { background: l.color, color: '#fff', borderColor: l.color } : { borderColor: WA.line, color: WA.text }}>{l.name}</button>;
                })}
                {labels.length === 0 && <p className="text-[13.5px]" style={{ color: WA.sub }}>No labels yet.</p>}
              </div>
              <div className="flex items-center gap-2 rounded-lg px-3" style={{ background: WA.panel }}>
                <input value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && newLabel.trim() && createLabel.mutate()} placeholder="New label" className="h-9 flex-1 border-0 bg-transparent text-[14px] outline-none focus:ring-0" />
                <button disabled={!newLabel.trim()} onClick={() => createLabel.mutate()} aria-label="Add label" className="disabled:opacity-40" style={{ color: WA.green }}><Plus className="h-5 w-5" /></button>
              </div>
            </Section>

            <Section title="Internal notes" icon={<StickyNote className="h-4 w-4" />}>
              <p className="mb-2 text-[12.5px]" style={{ color: WA.sub }}>Only your team sees these. They are never sent to the customer.</p>
              <div className="mb-3 space-y-2">
                {notes.map(n => (
                  <div key={n.id} className="rounded-lg px-3 py-2 text-[14px]" style={{ background: '#fff6d6' }}>
                    <p className="whitespace-pre-wrap" style={{ color: WA.text }}>{n.body}</p>
                    <p className="mt-1 text-[11.5px]" style={{ color: WA.sub }}>{n.authorName} · {format(new Date(n.createdAt), 'dd MMM, h:mm a')}</p>
                  </div>
                ))}
              </div>
              <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note" className="w-full resize-none rounded-lg border-0 px-3 py-2 text-[14px] outline-none focus:ring-0" style={{ background: WA.panel }} />
              <button disabled={!note.trim() || addNote.isPending} onClick={() => addNote.mutate()} className="mt-2 w-full rounded-full py-2 text-[14px] font-medium text-white disabled:opacity-40" style={{ background: WA.green }}>Save note</button>
            </Section>
            <div className="h-4" />
          </>
        )}
      </div>
    </div>
  );
}
