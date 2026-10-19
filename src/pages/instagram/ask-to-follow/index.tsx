import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Grid3x3, Instagram, MessageCircle, Pencil, Plus, RefreshCw, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InstagramPage } from '@/components/instagram/InstagramPage';
import { InstagramConnectionGate } from '@/components/instagram/InstagramConnectionGate';
import { IgAvatar } from '@/components/instagram/inbox/IgAvatar';
import { EmptyState } from '@/components/WhatsApp/hub/EmptyRow';
import { WhatsAppSection } from '@/components/WhatsApp/hub/WhatsAppSection';
import { WA_CARD, WA_OUTLINE_BTN, WA_PRIMARY_BTN } from '@/components/WhatsApp/hub/whatsappStyles';
import { instagramGateApi, startInstagramConnect } from '@/services/instagramService';
import { apiErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';
import { isAdmin } from '@/lib/utils';

/** Shown when Instagram is not connected yet: a blurred wall of posts with a connect button. */
function PostsConnectPrompt() {
  const [busy, setBusy] = useState(false);
  const user = (() => { try { return JSON.parse(localStorage.getItem('userInfo') || 'null'); } catch { return null; } })();
  const go = async () => { setBusy(true); try { await startInstagramConnect('/instagram/ask-to-follow'); } catch (e) { toast.error(apiErrorMessage(e, 'Could not start the Instagram connection')); setBusy(false); } };
  return (
    <div className={cn(WA_CARD, 'relative min-h-[420px]')}>
      <div className="absolute inset-0 grid grid-cols-3 gap-1 p-1 opacity-60 blur-md">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="rounded bg-gradient-to-br from-[#feda75]/60 via-[#d62976]/40 to-[#4f5bd5]/60" />)}</div>
      <div className="relative flex min-h-[420px] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="max-w-sm rounded-[12px] bg-white/90 p-6 shadow-lg">
          <p className="text-sm font-poppins text-muted-foreground">Connect your Instagram account to see your posts here.</p>
          <button onClick={go} disabled={busy || !isAdmin(user)} className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] px-6 py-3 text-sm font-medium font-poppins text-white shadow-md hover:opacity-90 disabled:opacity-50"><Instagram className="h-4 w-4" />{busy ? 'Opening Instagram…' : 'Connect Instagram Business'}</button>
          {!isAdmin(user) && <p className="mt-2 text-xs text-muted-foreground">Ask an organisation admin to connect the account.</p>}
        </div>
      </div>
    </div>
  );
}

export default function InstagramAskToFollow() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'posts' | 'bots'>('posts');

  const { data: overview, isFetching, refetch } = useQuery({ queryKey: ['instagram', 'gate'], queryFn: instagramGateApi.overview });
  const { data: media = [], isLoading: mediaLoading, error: mediaError } = useQuery({ queryKey: ['instagram', 'gate', 'media'], queryFn: instagramGateApi.media, enabled: !!overview?.connected, retry: false });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['instagram', 'gate'] });
  const toggle = useMutation({ mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => instagramGateApi.update(id, { isActive }), onSuccess: refresh, onError: e => toast.error(apiErrorMessage(e, 'Could not change status')) });
  const remove = useMutation({ mutationFn: instagramGateApi.remove, onSuccess: () => { toast.success('Bot deleted'); refresh(); }, onError: e => toast.error(apiErrorMessage(e, 'Could not delete')) });

  const acct = overview?.account;
  const stats = overview?.stats ?? { total: 0, active: 0, inactive: 0 };

  return (
    <InstagramPage
      title="Ask To Follow"
      subtitle="Auto-DM anyone who comments a keyword on your posts"
      actions={
        <>
          <Button variant="outline" size="icon" className={WA_OUTLINE_BTN} onClick={() => { refetch(); queryClient.invalidateQueries({ queryKey: ['instagram', 'gate', 'media'] }); }} aria-label="Refresh"><RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} /></Button>
          <Button className={WA_PRIMARY_BTN} disabled={!overview?.connected} onClick={() => navigate('/instagram/ask-to-follow/new')}><Plus className="h-4 w-4 mr-1.5" />Create New</Button>
        </>
      }
    >
      <InstagramConnectionGate returnPath="/instagram/ask-to-follow" fallback={<PostsConnectPrompt />}>
        <div className={cn(WA_CARD, 'flex flex-wrap items-center gap-6 p-5')}>
          <IgAvatar src={acct?.profilePicUrl} name={acct?.username || 'i'} className="h-20 w-20 text-2xl" />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-medium font-poppins text-[#833ab4]">@{acct?.username}</p>
            <p className="text-sm font-poppins text-muted-foreground">Ask to follow {acct?.name || acct?.username}</p>
            <p className="text-xs text-muted-foreground">Auto-DM anyone who comments a keyword on your posts</p>
          </div>
          <div className="flex gap-6 text-center">
            {[['TOTAL BOTS', stats.total, 'text-black'], ['ACTIVE', stats.active, 'text-emerald-600'], ['INACTIVE', stats.inactive, 'text-amber-600']].map(([l, v, c]) => (
              <div key={l as string}><p className={cn('text-2xl font-medium font-poppins', c as string)}>{v}</p><p className={cn('text-[10px] font-semibold tracking-widest', c as string)}>{l}</p></div>
            ))}
          </div>
        </div>

        <div className="flex gap-6 border-b border-border">
          {([['posts', 'POSTS', Grid3x3, media.length], ['bots', 'BOTS', UserPlus, stats.total]] as const).map(([k, label, Icon, n]) => (
            <button key={k} onClick={() => setTab(k)} className={cn('-mb-px flex items-center gap-1.5 border-b-2 px-1 pb-2.5 text-xs font-semibold tracking-wide font-poppins', tab === k ? 'border-black text-black' : 'border-transparent text-muted-foreground hover:text-foreground')}><Icon className="h-3.5 w-3.5" />{label}<span className="rounded-full bg-muted px-1.5 text-[10px]">{n}</span></button>
          ))}
        </div>

        {tab === 'posts' && (
          mediaLoading ? <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded bg-muted" />)}</div>
          : mediaError ? <EmptyState>{apiErrorMessage(mediaError, 'Could not load your posts')}</EmptyState>
          : media.length === 0 ? <EmptyState icon={<Grid3x3 strokeWidth={1.25} />}>No posts found on this account yet.</EmptyState>
          : (
            <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 lg:grid-cols-6">
              {media.map(m => (
                <button key={m.id} onClick={() => navigate(`/instagram/ask-to-follow/new?mediaId=${m.id}`)} className="group relative aspect-square overflow-hidden rounded bg-muted text-left" title="Create an Ask-to-Follow bot for this post">
                  <img src={m.thumbnailUrl} alt={m.caption.slice(0, 60)} referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  {m.bots > 0 && <span className={cn('absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white', m.activeBots ? 'bg-emerald-500' : 'bg-amber-500')}>{m.bots} bot{m.bots === 1 ? '' : 's'}</span>}
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"><Plus className="h-5 w-5" />Create bot<span className="flex items-center gap-1 text-[10px] opacity-80"><MessageCircle className="h-3 w-3" />{m.commentsCount ?? 0}</span></span>
                </button>
              ))}
            </div>
          )
        )}

        {tab === 'bots' && (
          <WhatsAppSection flush title="Your Ask-to-Follow bots" description="Each bot watches the comments on exactly one post." icon={<UserPlus />}>
            {(overview?.bots ?? []).length === 0 ? <EmptyState icon={<UserPlus strokeWidth={1.25} />}>No bots yet. Open a post and create your first one.</EmptyState> : (
              <Table>
                <TableHeader><TableRow className="bg-muted/30">{['Active', 'Bot', 'Post', 'Keywords', 'Comments', 'Rewarded'].map(h => <TableHead key={h} className="font-poppins text-xs">{h}</TableHead>)}<TableHead className="text-right font-poppins text-xs">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {overview!.bots.map(b => (
                    <TableRow key={b.id}>
                      <TableCell><Switch checked={b.isActive} disabled={toggle.isPending} onCheckedChange={v => toggle.mutate({ id: b.id, isActive: v })} /></TableCell>
                      <TableCell className="font-medium font-poppins">{b.name}</TableCell>
                      <TableCell>{b.mediaThumbUrl ? <a href={b.mediaPermalink || '#'} target="_blank" rel="noreferrer"><img src={b.mediaThumbUrl} alt="" referrerPolicy="no-referrer" className="h-10 w-10 rounded object-cover" /></a> : '—'}</TableCell>
                      <TableCell className="text-xs">{b.keywords.length ? b.keywords.join(', ') : 'Any comment'}</TableCell>
                      <TableCell className="text-sm">{b.comments ?? 0}</TableCell>
                      <TableCell className="text-sm">{b.rewarded ?? 0}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => navigate(`/instagram/ask-to-follow/${b.id}`)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive" aria-label="Delete" onClick={() => window.confirm('Delete this bot?') && remove.mutate(b.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </WhatsAppSection>
        )}
      </InstagramConnectionGate>
    </InstagramPage>
  );
}
