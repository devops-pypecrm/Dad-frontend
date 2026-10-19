import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Grid3x3, PenLine, Plus, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PhonePreview, type PreviewTab } from '@/components/instagram/PhonePreview';
import { useInstagramConnection } from '@/hooks/useInstagramConnection';
import { instagramGateApi, type IgGateInput } from '@/services/instagramService';
import { apiErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';
import { WA_CARD, WA_OUTLINE_BTN, WA_PRIMARY_BTN } from '@/components/WhatsApp/hub/whatsappStyles';

const STEPS = ['Post', 'Keywords', 'Public reply', 'Follow request', 'Reward'] as const;
const STEP_TAB: PreviewTab[] = ['post', 'comments', 'comments', 'dm', 'dm'];

interface Form {
  name: string; isActive: boolean; mediaId: string; keywords: string[]; publicReplies: string[];
  askMessage: string; followButton: string; notFollowingMessage: string; rewardMessage: string; rewardLink: string;
}
const initial: Form = {
  name: '', isActive: true, mediaId: '', keywords: [], publicReplies: [],
  askMessage: 'Thanks for your comment! Follow us, then tap the button below to get your link.', followButton: "I'm following",
  notFollowingMessage: "We couldn't see a follow yet. Please follow the account, then tap the button again.",
  rewardMessage: "You're in! Here is your link:", rewardLink: '',
};

/** "New Comment-Gate Bot": watches one post, DMs commenters, rewards them once they follow. */
export default function InstagramGateBotPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const [search] = useSearchParams();
  const { data: bot, isLoading } = useQuery({ queryKey: ['instagram', 'gate', 'bot', id], queryFn: () => instagramGateApi.get(id!), enabled: !isNew });
  if (!isNew && isLoading) return <div className="p-10 text-center text-sm text-muted-foreground">Loading bot…</div>;

  const start: Form = bot
    ? { name: bot.name, isActive: bot.isActive, mediaId: bot.mediaId, keywords: bot.keywords, publicReplies: bot.publicReplies, askMessage: bot.askMessage, followButton: bot.followButton, notFollowingMessage: bot.notFollowingMessage, rewardMessage: bot.rewardMessage, rewardLink: bot.rewardLink || '' }
    : { ...initial, mediaId: search.get('mediaId') || '' };
  // keyed so the form state starts from the loaded bot
  return <GateBotForm key={bot?.id || 'new'} id={id} isNew={isNew} start={start} botThumb={bot?.mediaThumbUrl} botCaption={bot?.mediaCaption} />;
}

function GateBotForm({ id, isNew, start, botThumb, botCaption }: { id?: string; isNew: boolean; start: Form; botThumb?: string | null; botCaption?: string | null }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: conn } = useInstagramConnection();

  const [form, setForm] = useState<Form>(start);
  const [step, setStep] = useState(0);
  const [tab, setTab] = useState<PreviewTab>('post');
  const [kw, setKw] = useState('');
  const [reply, setReply] = useState('');

  const { data: media = [], error: mediaError } = useQuery({ queryKey: ['instagram', 'gate', 'media'], queryFn: instagramGateApi.media, enabled: !!conn?.connected, retry: false });

  const selected = media.find(m => m.id === form.mediaId);
  const thumb = selected?.thumbnailUrl || botThumb || null;
  const set = (p: Partial<Form>) => setForm(f => ({ ...f, ...p }));
  const goStep = (n: number) => { setStep(n); setTab(STEP_TAB[n]); };

  const problems: string[] = [];
  if (!form.name.trim()) problems.push('Give the bot a name');
  if (!form.mediaId) problems.push('Choose a post');
  if (!form.askMessage.trim() || !form.followButton.trim()) problems.push('Write the follow request message and button');
  if (!form.rewardMessage.trim()) problems.push('Write the reward message');
  if (form.rewardLink.trim() && !/^https?:\/\//i.test(form.rewardLink.trim())) problems.push('The reward link must start with https://');

  const save = useMutation({
    mutationFn: (live: boolean) => {
      const body: IgGateInput = { ...form, name: form.name.trim(), rewardLink: form.rewardLink.trim() || null, isActive: live ? true : form.isActive };
      return isNew ? instagramGateApi.create(body) : instagramGateApi.update(id!, body);
    },
    onSuccess: (_b, live) => {
      toast.success(live ? 'Bot is live' : 'Bot saved');
      queryClient.invalidateQueries({ queryKey: ['instagram', 'gate'] });
      navigate('/instagram/ask-to-follow');
    },
    onError: e => toast.error(apiErrorMessage(e, 'Could not save the bot')),
  });

  const addKeywords = () => { const n = kw.split(',').map(k => k.trim().toLowerCase()).filter(k => k.length >= 2); if (n.length) set({ keywords: Array.from(new Set([...form.keywords, ...n])).slice(0, 30) }); setKw(''); };
  const addReply = () => { if (reply.trim() && form.publicReplies.length < 5) set({ publicReplies: [...form.publicReplies, reply.trim()] }); setReply(''); };

  const body = [
    // 1
    <div key="1" className="space-y-3">
      <p className="text-xs text-muted-foreground">This config watches exactly one post. To gate another post, create another config.</p>
      {mediaError ? <p className="rounded-[10px] border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">{apiErrorMessage(mediaError, 'Could not load your posts')}</p> : (
        <div className="grid max-h-72 grid-cols-3 gap-1.5 overflow-y-auto pr-1">
          {media.map(m => (
            <button key={m.id} onClick={() => { set({ mediaId: m.id }); setTab('post'); }} className={cn('relative aspect-square overflow-hidden rounded-lg border-2', form.mediaId === m.id ? 'border-[hsl(var(--chart-5))]' : 'border-transparent')}>
              <img src={m.thumbnailUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
              {form.mediaId === m.id && <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--chart-5))] text-white"><Check className="h-3 w-3" /></span>}
            </button>
          ))}
          {media.length === 0 && !mediaError && <p className="col-span-3 py-6 text-center text-xs text-muted-foreground">Loading your posts…</p>}
        </div>
      )}
    </div>,
    // 2
    <div key="2" className="space-y-3">
      <p className="text-xs text-muted-foreground">The bot runs when a comment contains one of these keywords. Leave empty to run for every comment.</p>
      <div className="flex gap-2"><Input className="rounded-[10px]" placeholder="link, guide, price" value={kw} onChange={e => setKw(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKeywords()} /><Button variant="outline" className={WA_OUTLINE_BTN} onClick={addKeywords}><Plus className="h-4 w-4" /></Button></div>
      <div className="flex flex-wrap gap-1.5">{form.keywords.map(k => <span key={k} className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs text-violet-700">{k}<button aria-label={`Remove ${k}`} onClick={() => set({ keywords: form.keywords.filter(x => x !== k) })}><X className="h-3 w-3" /></button></span>)}{form.keywords.length === 0 && <span className="text-xs text-muted-foreground">Any comment will trigger the bot.</span>}</div>
    </div>,
    // 3
    <div key="3" className="space-y-3">
      <p className="text-xs text-muted-foreground">Optional. Reply under the comment so the commenter knows to check their DMs. One of these is picked at random.</p>
      <div className="flex gap-2"><Input maxLength={300} className="rounded-[10px]" placeholder="Check your DMs! 📩" value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && addReply()} /><Button variant="outline" className={WA_OUTLINE_BTN} disabled={form.publicReplies.length >= 5} onClick={addReply}><Plus className="h-4 w-4" /></Button></div>
      <ul className="space-y-1.5">{form.publicReplies.map((r, i) => <li key={i} className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-1.5 text-xs"><span className="flex-1">{r}</span><button aria-label="Remove reply" onClick={() => set({ publicReplies: form.publicReplies.filter((_, j) => j !== i) })}><X className="h-3.5 w-3.5" /></button></li>)}</ul>
    </div>,
    // 4
    <div key="4" className="space-y-3">
      <p className="text-xs text-muted-foreground">The first DM asks them to follow you and tap the button. The bot then checks that they really follow.</p>
      <div className="space-y-1.5"><Label className="text-xs">Message</Label><Textarea rows={3} maxLength={900} className="rounded-[10px]" value={form.askMessage} onChange={e => set({ askMessage: e.target.value })} /></div>
      <div className="space-y-1.5"><Label className="text-xs">Button text</Label><Input maxLength={20} className="rounded-[10px]" value={form.followButton} onChange={e => set({ followButton: e.target.value })} /></div>
      <div className="space-y-1.5"><Label className="text-xs">If they have not followed yet</Label><Textarea rows={2} maxLength={900} className="rounded-[10px]" value={form.notFollowingMessage} onChange={e => set({ notFollowingMessage: e.target.value })} /></div>
    </div>,
    // 5
    <div key="5" className="space-y-3">
      <p className="text-xs text-muted-foreground">Sent once the bot sees that they follow your account.</p>
      <div className="space-y-1.5"><Label className="text-xs">Message</Label><Textarea rows={3} maxLength={900} className="rounded-[10px]" value={form.rewardMessage} onChange={e => set({ rewardMessage: e.target.value })} /></div>
      <div className="space-y-1.5"><Label className="text-xs">Link to share (optional)</Label><Input className="rounded-[10px]" placeholder="https://…" value={form.rewardLink} onChange={e => set({ rewardLink: e.target.value })} /></div>
    </div>,
  ];
  const heading = ['When someone comments on', 'And the comment contains', 'Reply to the comment publicly', 'Then ask them to follow', 'Finally, send the reward'];
  const Icons = [Grid3x3, PenLine, Sparkles, Sparkles, Sparkles];
  const StepIcon = Icons[step];

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="relative flex items-center border-b border-border px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/instagram/ask-to-follow')} aria-label="Back"><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="absolute inset-x-0 text-center text-sm font-medium font-poppins pointer-events-none">{isNew ? 'New Comment-Gate Bot' : 'Edit Comment-Gate Bot'}</h1>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex flex-1 items-center justify-center overflow-y-auto bg-[#f6f6f8] p-6">
          <div className="w-full max-w-lg space-y-4">
            <div className={cn(WA_CARD, 'p-4 space-y-3')}>
              <div className="flex items-center gap-2 text-xs font-poppins font-medium"><PenLine className="h-3.5 w-3.5 text-violet-500" />Bot Name</div>
              <Input className="rounded-[10px] bg-muted/50" placeholder='e.g., "Product Access Bot" or "VIP Gate"' value={form.name} onChange={e => set({ name: e.target.value })} />
              <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-poppins font-medium"><Sparkles className="h-3.5 w-3.5 text-violet-500" />Bot status</span><label className="flex items-center gap-2 text-xs text-emerald-600">{form.isActive ? 'Active' : 'Inactive'}<Switch checked={form.isActive} onCheckedChange={v => set({ isActive: v })} /></label></div>
            </div>

            <div className="grid grid-cols-5 gap-1.5">{STEPS.map((s, i) => <button key={s} onClick={() => goStep(i)} aria-label={`Step ${i + 1}: ${s}`} className={cn('h-1 rounded-full', i <= step ? 'bg-violet-500' : 'bg-muted-foreground/20')} />)}</div>

            <div className={cn(WA_CARD, 'p-5 space-y-4')}>
              <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600"><StepIcon className="h-4 w-4" /></span><div><p className="text-sm font-medium font-poppins">{heading[step]}</p><p className="text-[11px] text-muted-foreground">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p></div></div>
              {body[step]}
              <div className="flex justify-between pt-2">
                <Button variant="ghost" disabled={step === 0} onClick={() => goStep(step - 1)}>Back</Button>
                {step < STEPS.length - 1 ? <Button className="rounded-[10px] bg-violet-600 text-white hover:bg-violet-700" onClick={() => goStep(step + 1)}>Next<ArrowRight className="ml-1.5 h-4 w-4" /></Button> : <Button className={WA_PRIMARY_BTN} disabled={problems.length > 0 || save.isPending} onClick={() => save.mutate(false)}>{save.isPending ? 'Saving…' : 'Save bot'}</Button>}
              </div>
            </div>
            {problems.length > 0 && step === STEPS.length - 1 && <ul className="list-disc pl-5 text-xs text-amber-700">{problems.map(p => <li key={p}>{p}</li>)}</ul>}
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-4 overflow-y-auto bg-[#eef1f2] p-6 lg:w-[460px]">
          <div className="flex w-full items-center justify-between"><span className="text-xs font-poppins text-muted-foreground">Preview</span>
            <Button size="sm" className="rounded-[10px] bg-violet-600 text-white hover:bg-violet-700" disabled={problems.length > 0 || save.isPending} title={problems[0]} onClick={() => save.mutate(true)}>Go Live</Button></div>
          <PhonePreview
            tab={tab} onTab={setTab} username={conn?.account?.username || 'username'} avatar={conn?.account?.profilePicUrl} thumb={thumb} caption={selected?.caption || botCaption || ''}
            sampleKeyword={form.keywords[0] || 'link'} publicReply={form.publicReplies[0]} askMessage={form.askMessage} followButton={form.followButton} rewardMessage={form.rewardMessage} rewardLink={form.rewardLink}
          />
        </div>
      </div>
    </div>
  );
}
