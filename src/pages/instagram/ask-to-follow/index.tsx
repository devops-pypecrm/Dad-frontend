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
import { IG } from '@/components/instagram/inbox/ig';
import { EmptyState } from '@/components/WhatsApp/hub/EmptyRow';
import { WhatsAppSection } from '@/components/WhatsApp/hub/WhatsAppSection';
import { WA_CARD } from '@/components/WhatsApp/hub/whatsappStyles';
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
        <div className="max-w-sm rounded-[12px] bg-card/90 p-6 shadow-lg">
          <p className="text-sm text-muted-foreground">Connect your Instagram account to see your posts here.</p>
          <button onClick={go} disabled={busy || !isAdmin(user)} className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-[#0095f6] hover:bg-[#1877f2] px-6 py-3 text-sm font-medium text-white shadow-md hover:opacity-90 disabled:opacity-50"><Instagram className="h-4 w-4" />{busy ? 'Opening Instagram…' : 'Connect Instagram Business'}</button>
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
  const postCount = acct?.mediaCount ?? media.length;
  const formatCount = (value: number | null | undefined) => value == null ? '—' : new Intl.NumberFormat().format(value);

  return (
    <InstagramPage
      title="Ask To Follow"
      subtitle="Auto-DM anyone who comments a keyword on your posts"
    >
      <InstagramConnectionGate returnPath="/instagram/ask-to-follow" fallback={<PostsConnectPrompt />}>
        <div className="mx-auto w-full max-w-[935px]">
          <header className="flex flex-col items-center gap-6 px-4 pb-10 pt-4 sm:flex-row sm:items-start sm:gap-20 sm:px-0">
            <div className="shrink-0 sm:mx-[30px]">
              <IgAvatar src={acct?.profilePicUrl} name={acct?.username || 'i'} ring className="h-[100px] w-[100px] sm:h-[150px] sm:w-[150px]" />
            </div>
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-[20px] font-normal leading-6" style={{ color: IG.text }}>{acct?.username}</h2>
                <button disabled={!overview?.connected} onClick={() => navigate('/instagram/ask-to-follow/new')} className="rounded-lg bg-[#0095f6] px-4 py-1.5 text-[14px] font-semibold text-white hover:bg-[#1877f2] disabled:opacity-50">Create bot</button>
                <button onClick={() => { refetch(); queryClient.invalidateQueries({ queryKey: ['instagram', 'gate', 'media'] }); }} aria-label="Refresh" className="rounded-lg px-4 py-1.5 text-[14px] font-semibold hover:opacity-80" style={{ background: IG.soft, color: IG.text }}><RefreshCw className={cn('inline h-4 w-4', isFetching && 'animate-spin')} /></button>
              </div>
              <ul className="hidden gap-10 text-[16px] sm:flex" style={{ color: IG.text }}>
                <li><b className="font-semibold">{formatCount(postCount)}</b> posts</li>
                <li><b className="font-semibold">{formatCount(acct?.followersCount)}</b> followers</li>
                <li><b className="font-semibold">{formatCount(acct?.followingCount)}</b> following</li>
              </ul>
              <div className="text-[14px] leading-5" style={{ color: IG.text }}>
                <p className="font-semibold">{acct?.name || acct?.username}</p>
                {acct?.biography && <p className="whitespace-pre-line">{acct.biography}</p>}
                <p>Auto-DM anyone who comments a keyword on your posts.</p>
              </div>
            </div>
          </header>
          <ul className="flex justify-around border-t py-3 text-center text-[14px] sm:hidden" style={{ borderColor: IG.line, color: IG.sub }}>
            <li><b className="block font-semibold" style={{ color: IG.text }}>{formatCount(postCount)}</b>posts</li>
            <li><b className="block font-semibold" style={{ color: IG.text }}>{formatCount(acct?.followersCount)}</b>followers</li>
            <li><b className="block font-semibold" style={{ color: IG.text }}>{formatCount(acct?.followingCount)}</b>following</li>
          </ul>

          <div className="flex justify-center gap-14 border-t" style={{ borderColor: IG.line }}>
            {([['posts', 'Posts', Grid3x3], ['bots', 'Bots', UserPlus]] as const).map(([k, label, Icon]) => (
              <button key={k} onClick={() => setTab(k)} className="-mt-px flex items-center gap-1.5 border-t py-4 text-[12px] font-semibold uppercase tracking-[1px]" style={{ borderColor: tab === k ? IG.text : 'transparent', color: tab === k ? IG.text : IG.faint }}><Icon className="h-3 w-3" />{label}</button>
            ))}
          </div>

        {tab === 'posts' && (
          mediaLoading ? <div className="grid grid-cols-3 gap-1">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse bg-[#efefef]" />)}</div>
          : mediaError ? <EmptyState>{apiErrorMessage(mediaError, 'Could not load your posts')}</EmptyState>
          : media.length === 0 ? <EmptyState icon={<Grid3x3 strokeWidth={1.25} />}>No posts found on this account yet.</EmptyState>
          : (
            <div className="grid grid-cols-3 gap-1">
              {media.map(m => (
                <button key={m.id} onClick={() => navigate(`/instagram/ask-to-follow/new?mediaId=${m.id}`)} className="group relative aspect-[3/4] overflow-hidden bg-[#efefef] text-left" title="Create an Ask-to-Follow bot for this post">
                  <img src={m.thumbnailUrl} alt={m.caption.slice(0, 60)} referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform " />
                  {m.bots > 0 && <span className={cn('absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white', m.activeBots ? 'bg-emerald-500' : 'bg-amber-500')}>{m.bots} bot{m.bots === 1 ? '' : 's'}</span>}
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/30 text-[16px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"><Plus className="h-5 w-5" />Create bot<span className="flex items-center gap-1 text-[10px] opacity-80"><MessageCircle className="h-3 w-3" />{m.commentsCount ?? 0}</span></span>
                </button>
              ))}
            </div>
          )
        )}

        {tab === 'bots' && (
          <WhatsAppSection flush title="Your Ask-to-Follow bots" description="Each bot watches the comments on exactly one post." icon={<UserPlus />}>
            {(overview?.bots ?? []).length === 0 ? <EmptyState icon={<UserPlus strokeWidth={1.25} />}>No bots yet. Open a post and create your first one.</EmptyState> : (
              <Table>
                <TableHeader><TableRow className="bg-muted/30">{['Active', 'Bot', 'Post', 'Keywords', 'Comments', 'Rewarded'].map(h => <TableHead key={h} className=" text-xs">{h}</TableHead>)}<TableHead className="text-right text-xs">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {overview!.bots.map(b => (
                    <TableRow key={b.id}>
                      <TableCell><Switch checked={b.isActive} disabled={toggle.isPending} onCheckedChange={v => toggle.mutate({ id: b.id, isActive: v })} /></TableCell>
                      <TableCell className="font-medium">{b.name}</TableCell>
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
        </div>
      </InstagramConnectionGate>
    </InstagramPage>
  );
}
