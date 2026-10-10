import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Tag, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { inboxApi } from '@/services/whatsAppHubService';
import { apiErrorMessage } from '@/lib/apiError';
import { WhatsAppSection } from './WhatsAppSection';
import { EmptyState } from './EmptyRow';
import { WA_PRIMARY_BTN } from './whatsappStyles';

/** Admin tools for the Team Inbox: reusable quick replies and conversation labels. */
export function InboxToolsPanel() {
  const queryClient = useQueryClient();
  const [shortcut, setShortcut] = useState('');
  const [body, setBody] = useState('');
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#69a63a');

  const { data: replies = [] } = useQuery({ queryKey: ['whatsapp', 'inbox', 'quick-replies'], queryFn: inboxApi.quickReplies });
  const { data: labels = [] } = useQuery({ queryKey: ['whatsapp', 'inbox', 'labels'], queryFn: inboxApi.labels });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['whatsapp', 'inbox'] });
  const onError = (e: unknown) => toast.error(apiErrorMessage(e, 'Something went wrong'));

  const addReply = useMutation({ mutationFn: () => inboxApi.saveQuickReply({ shortcut, body }), onSuccess: () => { setShortcut(''); setBody(''); refresh(); }, onError });
  const delReply = useMutation({ mutationFn: inboxApi.deleteQuickReply, onSuccess: refresh, onError });
  const addLabel = useMutation({ mutationFn: () => inboxApi.createLabel({ name: label, color }), onSuccess: () => { setLabel(''); refresh(); }, onError });
  const delLabel = useMutation({ mutationFn: inboxApi.deleteLabel, onSuccess: refresh, onError });

  return (
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <WhatsAppSection title="Quick replies" description="Agents type / in a chat to insert these." icon={<Zap />}>
        <div className="space-y-2 mb-4">
          <Input className="rounded-[10px]" placeholder="Shortcut, e.g. pricing" value={shortcut} onChange={e => setShortcut(e.target.value)} />
          <Textarea rows={3} className="rounded-[10px]" placeholder="Message text" value={body} onChange={e => setBody(e.target.value)} />
          <Button className={WA_PRIMARY_BTN} disabled={!shortcut.trim() || !body.trim() || addReply.isPending} onClick={() => addReply.mutate()}><Plus className="h-4 w-4 mr-1.5" />Add quick reply</Button>
        </div>
        {replies.length === 0 ? <EmptyState>No quick replies yet.</EmptyState> : (
          <ul className="divide-y divide-border">
            {replies.map(r => (
              <li key={r.id} className="flex items-start gap-3 py-2.5">
                <div className="min-w-0 flex-1"><p className="text-sm font-medium text-[hsl(var(--chart-5))]">/{r.shortcut}</p><p className="text-xs text-muted-foreground whitespace-pre-wrap">{r.body}</p></div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => delReply.mutate(r.id)}><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        )}
      </WhatsAppSection>

      <WhatsAppSection title="Labels" description="Tag conversations so your team can filter them." icon={<Tag />}>
        <div className="flex gap-2 mb-4">
          <Input className="rounded-[10px]" placeholder="Label name, e.g. Hot lead" value={label} onChange={e => setLabel(e.target.value)} />
          <input type="color" aria-label="Label colour" className="h-10 w-12 shrink-0 cursor-pointer rounded-[10px] border border-border bg-white p-1" value={color} onChange={e => setColor(e.target.value)} />
          <Button className={WA_PRIMARY_BTN} disabled={!label.trim() || addLabel.isPending} onClick={() => addLabel.mutate()}><Plus className="h-4 w-4" /></Button>
        </div>
        {labels.length === 0 ? <EmptyState>No labels yet.</EmptyState> : (
          <div className="flex flex-wrap gap-2">
            {labels.map(l => (
              <span key={l.id} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-white" style={{ backgroundColor: l.color }}>
                {l.name}
                <button aria-label={`Delete ${l.name}`} onClick={() => window.confirm(`Delete label "${l.name}"? It will be removed from every conversation.`) && delLabel.mutate(l.id)}><Trash2 className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
      </WhatsAppSection>
    </div>
  );
}
