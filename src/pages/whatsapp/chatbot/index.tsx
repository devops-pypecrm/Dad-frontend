import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bot, Edit2, GitBranch, Plus, Sparkles, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { WhatsAppPage } from '@/components/WhatsApp/hub/WhatsAppPage';
import { WhatsAppConnectionGate } from '@/components/WhatsApp/hub/WhatsAppConnectionGate';
import { WhatsAppStatsBar } from '@/components/WhatsApp/hub/WhatsAppStatsBar';
import { WhatsAppSection } from '@/components/WhatsApp/hub/WhatsAppSection';
import { StatusPill } from '@/components/WhatsApp/hub/StatusPill';
import { EmptyState } from '@/components/WhatsApp/hub/EmptyRow';
import { AIAgentTab } from '@/components/WhatsApp/ai/AIAgentTab';
import { WA_CARD, WA_PRIMARY_BTN, WA_OUTLINE_BTN } from '@/components/WhatsApp/hub/whatsappStyles';
import { chatbotApi, type WaLibraryBot } from '@/services/whatsAppHubService';
import { whatsAppFlowService } from '@/services/whatsAppFlowService';
import { apiErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';

const BADGE_TONE = { 'High Impact': 'text-[hsl(var(--chart-5))] bg-[hsl(var(--chart-5))]/10', Useful: 'text-blue-600 bg-blue-500/10', Essential: 'text-rose-600 bg-rose-500/10' } as const;
const CATEGORY_BAR: Record<string, string> = {
  'Real Estate': 'bg-blue-500', Healthcare: 'bg-rose-500', Education: 'bg-amber-500', Finance: 'bg-emerald-600', Beauty: 'bg-pink-500',
  'Food & Beverage': 'bg-orange-500', Fitness: 'bg-lime-600', Travel: 'bg-sky-500', Automotive: 'bg-slate-600',
};
const PAGE = 8;

export default function WhatsAppChatbotPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState('chatbot');
  const [category, setCategory] = useState('All');
  const [shown, setShown] = useState(PAGE);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const { data: overview, isLoading } = useQuery({ queryKey: ['whatsapp', 'chatbot'], queryFn: chatbotApi.overview });
  const { data: flows = [] } = useQuery({ queryKey: ['whatsapp-flows'], queryFn: whatsAppFlowService.getFlows });

  const refresh = () => { queryClient.invalidateQueries({ queryKey: ['whatsapp', 'chatbot'] }); queryClient.invalidateQueries({ queryKey: ['whatsapp-flows'] }); };
  const use = useMutation({
    mutationFn: chatbotApi.use,
    onSuccess: flow => { toast.success('Chatbot added to your account'); refresh(); navigate(`/whatsapp/chatbot/${flow.id}`); },
    onError: e => toast.error(apiErrorMessage(e, 'Could not add chatbot')),
  });
  const publish = useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) => chatbotApi.publish(id, publish),
    onSuccess: refresh, onError: e => toast.error(apiErrorMessage(e, 'Could not change status')),
  });
  const create = useMutation({
    mutationFn: () => whatsAppFlowService.createFlow({ name: newName }),
    onSuccess: flow => { setCreating(false); setNewName(''); refresh(); navigate(`/whatsapp/chatbot/${flow.id}`); },
    onError: () => toast.error('Failed to create chatbot'),
  });
  const remove = useMutation({ mutationFn: whatsAppFlowService.deleteFlow, onSuccess: () => { toast.success('Deleted'); refresh(); }, onError: () => toast.error('Failed to delete') });

  const library = overview?.library ?? [];
  const categories = ['All', ...Array.from(new Set(library.map(b => b.category)))];
  const filtered = library.filter(b => category === 'All' || b.category === category);

  const toggleBot = (b: WaLibraryBot, on: boolean) => b.flowId && publish.mutate({ id: b.flowId, publish: on });

  return (
    <WhatsAppPage
      title="Chatbot"
      emoji="🤖"
      subtitle="Manage and customize your WhatsApp chatbots and AI agent."
      actions={tab === 'chatbot' && <Button className={WA_PRIMARY_BTN} onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1.5" />Create new</Button>}
    >
      <WhatsAppConnectionGate returnPath="/whatsapp/chatbot">
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList className="rounded-[10px]">
            <TabsTrigger value="chatbot" className="rounded-lg gap-1.5"><Bot className="h-4 w-4" />Chatbot</TabsTrigger>
            <TabsTrigger value="ai" className="rounded-lg gap-1.5"><Sparkles className="h-4 w-4" />AI Agent</TabsTrigger>
          </TabsList>

          <TabsContent value="chatbot" className="space-y-4 mt-0">
            <WhatsAppStatsBar
              loading={isLoading}
              tiles={[
                { label: 'Messages sent', value: overview?.stats.messagesSent ?? 0, accent: 'bg-[hsl(var(--chart-4))]' },
                { label: 'Active chatbots', value: overview?.stats.active ?? 0, accent: 'bg-emerald-500' },
                { label: 'Inactive', value: overview?.stats.inactive ?? 0, accent: 'bg-[hsl(var(--chart-2))]' },
                { label: 'Created by you', value: overview?.stats.custom ?? 0, accent: 'bg-[hsl(var(--chart-5))]' },
                { label: 'System templates', value: overview?.stats.systemTemplates ?? 0, accent: 'bg-muted-foreground' },
              ]}
            />

            <WhatsAppSection title="Ready-made chatbots" description="Trigger-based chatbots you can switch on in minutes — then edit freely." icon={<Zap />}>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {categories.map(c => (
                  <button key={c} onClick={() => { setCategory(c); setShown(PAGE); }} className={cn('rounded-full border px-3 py-1 text-xs font-poppins transition-colors', category === c ? 'bg-[hsl(var(--chart-5))] border-transparent text-white' : 'bg-white hover:bg-muted')}>{c}</button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {filtered.slice(0, shown).map(b => (
                  <div key={b.key} className={cn(WA_CARD, 'flex flex-col')}>
                    <div className={cn('h-1', CATEGORY_BAR[b.category] || 'bg-[hsl(var(--chart-5))]')} />
                    <div className="flex-1 p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div><p className="text-sm font-medium font-poppins leading-snug">{b.name}</p><p className="text-[11px] text-muted-foreground">{b.category}</p></div>
                        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', BADGE_TONE[b.badge])}>{b.badge}</span>
                      </div>
                      <StatusPill tone="info">Trigger-based</StatusPill>
                      <p className="text-xs text-muted-foreground leading-snug">{b.description}</p>
                      <div className="flex flex-wrap gap-1">{b.tags.map(t => <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{t}</span>)}</div>
                      <p className="text-[11px] text-muted-foreground">Triggers: {b.triggerKeywords.map(k => `“${k}”`).join(', ')}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
                      <span className="text-[11px] font-medium text-[hsl(var(--chart-5))]">↗ {b.benefit}</span>
                      {b.flowId ? (
                        <div className="flex items-center gap-2">
                          <Switch checked={b.isPublished} disabled={publish.isPending} onCheckedChange={v => toggleBot(b, v)} aria-label="Publish" />
                          <Button size="sm" variant="outline" className={cn('h-7', WA_OUTLINE_BTN)} onClick={() => navigate(`/whatsapp/chatbot/${b.flowId}`)}>Edit</Button>
                        </div>
                      ) : (
                        <Button size="sm" className={cn('h-7', WA_PRIMARY_BTN)} disabled={use.isPending} onClick={() => use.mutate(b.key)}>Use</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {filtered.length > shown && (
                <div className="mt-4 text-center"><Button variant="outline" className={WA_OUTLINE_BTN} onClick={() => setShown(s => s + PAGE)}>Load more ({filtered.length - shown} remaining)</Button></div>
              )}
            </WhatsAppSection>

            <WhatsAppSection flush title="Your chatbots" description="Every chatbot in your account, including ones you built from scratch." icon={<GitBranch />}>
              {flows.length === 0 ? <EmptyState icon={<GitBranch strokeWidth={1.25} />}>You have no chatbots yet. Pick one above or create your own.</EmptyState> : (
                <Table>
                  <TableHeader><TableRow className="bg-muted/30">
                    {['Status', 'Name', 'Number', 'Trigger', 'Chats'].map(h => <TableHead key={h} className="font-poppins text-xs">{h}</TableHead>)}
                    <TableHead className="text-right font-poppins text-xs">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {flows.map(f => (
                      <TableRow key={f.id} className="hover:bg-[hsl(var(--chart-5))]/5">
                        <TableCell><Switch checked={f.isActive} disabled={publish.isPending} onCheckedChange={v => publish.mutate({ id: f.id, publish: v })} /></TableCell>
                        <TableCell className="font-medium font-poppins cursor-pointer" onClick={() => navigate(`/whatsapp/chatbot/${f.id}`)}>{f.name}</TableCell>
                        <TableCell className="text-sm">{f.whatsappAccount?.displayName || f.whatsappAccount?.phoneNumber || 'All numbers'}</TableCell>
                        <TableCell className="text-sm capitalize">{f.triggerType === 'keyword' ? `Keyword: ${f.triggerKeywords.join(', ') || '—'}` : f.triggerType.replace('_', ' ')}</TableCell>
                        <TableCell className="text-sm">{f._count?.sessions ?? 0}</TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Button variant="ghost" size="icon" onClick={() => navigate(`/whatsapp/chatbot/${f.id}`)}><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => window.confirm('Delete this chatbot?') && remove.mutate(f.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </WhatsAppSection>
          </TabsContent>

          <TabsContent value="ai" className="mt-0"><AIAgentTab /></TabsContent>
        </Tabs>

        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader><DialogTitle>Create a chatbot</DialogTitle></DialogHeader>
            <div className="space-y-2 py-2"><Label htmlFor="bot-name">Name</Label><Input id="bot-name" className="rounded-[10px]" placeholder="e.g. New lead welcome" value={newName} onChange={e => setNewName(e.target.value)} /></div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
              <Button className={WA_PRIMARY_BTN} disabled={!newName.trim() || create.isPending} onClick={() => create.mutate()}>{create.isPending ? 'Creating…' : 'Create & edit'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </WhatsAppConnectionGate>
    </WhatsAppPage>
  );
}
