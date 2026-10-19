import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { instagramChatbotApi, type IgChatbotInput } from '@/services/instagramService';
import { apiErrorMessage } from '@/lib/apiError';
import { WA_PRIMARY_BTN } from '@/components/WhatsApp/hub/whatsappStyles';
import { WorkflowCanvas } from '@/components/instagram/workflow/WorkflowCanvas';
import { StepPanel } from '@/components/instagram/workflow/StepPanel';
import { draftFromBot, draftIssues, emptyDraft, type EditTarget, type WorkflowDraft } from '@/components/instagram/workflow/types';

const toInput = (d: WorkflowDraft): IgChatbotInput => ({
  name: d.name.trim() || 'Untitled Workflow', keywords: d.keywords, matchType: d.matchType, chatWindowMinutes: d.chatWindowMinutes,
  messages: d.messages.map(m => ({ text: m.text.trim(), buttons: m.buttons.filter(b => b.title.trim() && b.url.trim()) })).filter(m => m.text),
  isActive: d.isActive,
});

/** Drag-and-drop workflow builder for a keyword-triggered Instagram chatbot. */
export default function InstagramChatbotEditor() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const { data: bot, isLoading } = useQuery({ queryKey: ['instagram', 'chatbot', id], queryFn: () => instagramChatbotApi.get(id!), enabled: !isNew });
  if (!isNew && isLoading) return <div className="p-10 text-center text-sm text-muted-foreground">Loading workflow…</div>;
  // keyed so the form state starts from the loaded chatbot
  return <EditorInner key={bot?.id || 'new'} id={id} isNew={isNew} initial={bot ? draftFromBot(bot) : emptyDraft()} />;
}

function EditorInner({ id, isNew, initial }: { id?: string; isNew: boolean; initial: WorkflowDraft }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<WorkflowDraft>(initial);
  const [editing, setEditing] = useState<EditTarget>(null);
  const [dragging, setDragging] = useState(false);

  const issues = useMemo(() => draftIssues(draft), [draft]);

  const save = useMutation({
    mutationFn: () => (isNew ? instagramChatbotApi.create(toInput(draft)) : instagramChatbotApi.update(id!, toInput(draft))),
    onSuccess: saved => {
      toast.success('Workflow saved');
      queryClient.invalidateQueries({ queryKey: ['instagram', 'chatbots'] });
      queryClient.invalidateQueries({ queryKey: ['instagram', 'chatbot', saved.id] });
      if (isNew) navigate(`/instagram/chatbots/${saved.id}`, { replace: true });
    },
    onError: e => toast.error(apiErrorMessage(e, 'Could not save the workflow')),
  });

  const setActive = (v: boolean) => {
    if (v && (issues.keywords || issues.messages)) { toast.error('Add keywords and at least one message before switching the chatbot on.'); return; }
    setDraft(d => ({ ...d, isActive: v }));
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
        <Button variant="ghost" size="icon" onClick={() => navigate('/instagram/chatbots')} aria-label="Back"><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1 flex justify-center"><Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} className="h-9 max-w-xs rounded-[10px] bg-muted/50 text-center font-poppins" aria-label="Workflow name" /></div>
        <label className="flex items-center gap-2 text-xs font-poppins text-muted-foreground"><Switch checked={draft.isActive} onCheckedChange={setActive} />{draft.isActive ? 'Active' : 'Inactive'}</label>
        <Button className={WA_PRIMARY_BTN} disabled={save.isPending} onClick={() => save.mutate()}><Save className="h-4 w-4 mr-1.5" />{save.isPending ? 'Saving…' : 'Save Workflow'}</Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="min-h-[420px] flex-1 min-w-0">
          <WorkflowCanvas draft={draft} onChange={setDraft} editing={editing} onEdit={setEditing} dragging={dragging} setDragging={setDragging} />
        </div>
        <aside className="w-full shrink-0 overflow-y-auto border-t border-border bg-white md:w-[300px] md:border-l md:border-t-0">
          <StepPanel draft={draft} onChange={setDraft} editing={editing} onEdit={setEditing} setDragging={setDragging} />
        </aside>
      </div>
    </div>
  );
}
