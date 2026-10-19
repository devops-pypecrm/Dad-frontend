import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bot, CheckCircle2, MessageSquare, Pencil, Plus, RefreshCw, Sparkles, Trash2, User, LayoutGrid, CircleSlash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InstagramPage } from '@/components/instagram/InstagramPage';
import { InstagramConnectionGate } from '@/components/instagram/InstagramConnectionGate';
import { WhatsAppSection } from '@/components/WhatsApp/hub/WhatsAppSection';
import { EmptyState } from '@/components/WhatsApp/hub/EmptyRow';
import { StatusPill } from '@/components/WhatsApp/hub/StatusPill';
import { WA_CARD, WA_OUTLINE_BTN, WA_PRIMARY_BTN } from '@/components/WhatsApp/hub/whatsappStyles';
import { instagramChatbotApi } from '@/services/instagramService';
import { minutesLabel } from '@/components/instagram/workflow/types';
import { apiErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const TILES = [
  { key: 'messagesSent', label: 'Messages sent', icon: MessageSquare, tone: 'bg-blue-500/10 text-blue-600' },
  { key: 'active', label: 'Active', icon: CheckCircle2, tone: 'bg-emerald-500/10 text-emerald-600' },
  { key: 'inactive', label: 'Inactive', icon: CircleSlash, tone: 'bg-amber-500/10 text-amber-600' },
  { key: 'custom', label: 'User created', icon: User, tone: 'bg-violet-500/10 text-violet-600' },
  { key: 'templates', label: 'Templates', icon: LayoutGrid, tone: 'bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))]' },
] as const;

export default function InstagramChatbotList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isFetching, refetch } = useQuery({ queryKey: ['instagram', 'chatbots'], queryFn: instagramChatbotApi.overview });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['instagram', 'chatbots'] });

  const toggle = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => instagramChatbotApi.update(id, { isActive }), onSuccess: refresh, onError: e => toast.error(apiErrorMessage(e, 'Could not change status')) });
  const remove = useMutation({ mutationFn: instagramChatbotApi.remove, onSuccess: () => { toast.success('Chatbot deleted'); refresh(); }, onError: e => toast.error(apiErrorMessage(e, 'Could not delete')) });
  const useTpl = useMutation({
    mutationFn: instagramChatbotApi.useTemplate,
    onSuccess: bot => { toast.success('Template added. Review it, then switch it on.'); refresh(); navigate(`/instagram/chatbots/${bot.id}`); },
    onError: e => toast.error(apiErrorMessage(e, 'Could not add template')),
  });

  const bots = data?.chatbots ?? [];
  const yours = bots.filter(b => !b.sourceTemplateKey).length;

  return (
    <InstagramPage
      title="Instagram Chatbots"
      subtitle="Keyword-triggered automation workflows"
      actions={
        <>
          <Button variant="outline" size="icon" className={WA_OUTLINE_BTN} onClick={() => refetch()} aria-label="Refresh"><RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} /></Button>
          <Button className={WA_PRIMARY_BTN} onClick={() => navigate('/instagram/chatbots/new')}><Plus className="h-4 w-4 mr-1.5" />New Chatbot</Button>
        </>
      }
    >
      <InstagramConnectionGate returnPath="/instagram/chatbots">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {TILES.map(t => (
            <div key={t.key} className={cn(WA_CARD, 'p-4')}>
              <div className="flex items-center gap-2"><span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', t.tone)}><t.icon className="h-4 w-4" /></span><span className="text-xs font-poppins text-muted-foreground">{t.label}</span></div>
              {isLoading ? <Skeleton className="mt-3 h-8 w-12" /> : <p className="mt-3 text-3xl font-medium font-poppins text-black">{(data?.stats[t.key] ?? 0).toLocaleString()}</p>}
            </div>
          ))}
        </div>

        <WhatsAppSection
          flush title="Chatbots" icon={<Bot />}
          description={`${yours} yours · ${data?.stats.templates ?? 0} templates`}
        >
          {bots.length === 0 ? (
            <EmptyState icon={<Bot strokeWidth={1.25} />}>
              <p className="text-sm font-medium font-poppins text-black">No chatbots yet</p>
              <p className="max-w-xs text-xs">Create your first keyword-triggered chatbot or activate a system template below.</p>
              <Button className={cn('mt-2', WA_PRIMARY_BTN)} onClick={() => navigate('/instagram/chatbots/new')}><Plus className="h-4 w-4 mr-1.5" />Create chatbot</Button>
            </EmptyState>
          ) : (
            <Table>
              <TableHeader><TableRow className="bg-muted/30">{['Active', 'Name', 'Keywords', 'Chat window', 'Triggered'].map(h => <TableHead key={h} className="font-poppins text-xs">{h}</TableHead>)}<TableHead className="text-right font-poppins text-xs">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {bots.map(b => (
                  <TableRow key={b.id} className="hover:bg-[hsl(var(--chart-5))]/5">
                    <TableCell><Switch checked={b.isActive} disabled={toggle.isPending} onCheckedChange={v => toggle.mutate({ id: b.id, isActive: v })} /></TableCell>
                    <TableCell className="font-medium font-poppins cursor-pointer" onClick={() => navigate(`/instagram/chatbots/${b.id}`)}>{b.name}{b.sourceTemplateKey && <span className="ml-2"><StatusPill tone="info">template</StatusPill></span>}</TableCell>
                    <TableCell className="text-xs"><div className="flex flex-wrap gap-1">{b.keywords.slice(0, 4).map(k => <span key={k} className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-700">{k}</span>)}{b.keywords.length > 4 && <span className="text-muted-foreground">+{b.keywords.length - 4}</span>}{b.keywords.length === 0 && <span className="text-amber-600">No keywords</span>}</div></TableCell>
                    <TableCell className="text-sm">{minutesLabel(b.chatWindowMinutes)}</TableCell>
                    <TableCell className="text-sm">{b.triggered ?? 0}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => navigate(`/instagram/chatbots/${b.id}`)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" aria-label="Delete" onClick={() => window.confirm('Delete this chatbot?') && remove.mutate(b.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </WhatsAppSection>

        <WhatsAppSection title="System templates" description="Ready-made chatbots. Add one, adjust the wording and links, then switch it on." icon={<Sparkles />}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(data?.templates ?? []).map(t => (
              <div key={t.key} className="flex flex-col rounded-[10px] border border-border p-4">
                <p className="text-sm font-medium font-poppins">{t.name}</p>
                <p className="mt-1 flex-1 text-xs text-muted-foreground">{t.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">{t.keywords.slice(0, 4).map(k => <span key={k} className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] text-violet-700">{k}</span>)}</div>
                <Button size="sm" className={cn('mt-3', t.used ? '' : WA_PRIMARY_BTN)} variant={t.used ? 'outline' : 'default'} disabled={t.used || useTpl.isPending} onClick={() => useTpl.mutate(t.key)}>{t.used ? 'Added' : 'Use template'}</Button>
              </div>
            ))}
          </div>
        </WhatsAppSection>
      </InstagramConnectionGate>
    </InstagramPage>
  );
}
