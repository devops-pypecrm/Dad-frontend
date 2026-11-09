import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';
import { toast } from 'sonner';
import { EyeOff, Eye, MessageSquareOff, Trash2 } from 'lucide-react';
import { InstagramPage } from '@/components/instagram/InstagramPage';
import { InstagramConnectionGate } from '@/components/instagram/InstagramConnectionGate';
import { PermissionNotice } from '@/components/instagram/tools/PermissionNotice';
import { IG } from '@/components/instagram/inbox/ig';
import { igToolsApi, type IgComment } from '@/services/instagramToolsService';
import { apiErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';

function CommentRow({ c, mediaId }: { c: IgComment; mediaId: string }) {
  const qc = useQueryClient();
  const [reply, setReply] = useState('');
  const [open, setOpen] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: ['ig-tools', 'comments', mediaId] });
  const err = (e: unknown) => toast.error(apiErrorMessage(e, 'Action failed'));
  const send = useMutation({ mutationFn: () => igToolsApi.reply(c.id, reply), onSuccess: () => { setReply(''); setOpen(false); toast.success('Reply posted'); refresh(); }, onError: err });
  const hide = useMutation({ mutationFn: () => igToolsApi.hide(c.id, !c.hidden), onSuccess: refresh, onError: err });
  const del = useMutation({ mutationFn: () => igToolsApi.remove(c.id), onSuccess: () => { toast.success('Comment deleted'); refresh(); }, onError: err });
  return (
    <li className={cn('space-y-1.5 border-b py-3', c.hidden && 'opacity-60')} style={{ borderColor: IG.soft }}>
      <p className="text-[14px]" style={{ color: IG.text }}><b className="font-semibold">{c.username}</b> {c.text} <span className="text-[12px]" style={{ color: IG.faint }}>{formatDistanceToNowStrict(new Date(c.timestamp))}</span></p>
      <div className="flex items-center gap-4 text-[12px] font-semibold" style={{ color: IG.sub }}>
        <span>{c.like_count || 0} likes</span>
        <button onClick={() => setOpen(o => !o)}>Reply</button>
        <button onClick={() => hide.mutate()} className="inline-flex items-center gap-1">{c.hidden ? <><Eye className="h-3.5 w-3.5" />Unhide</> : <><EyeOff className="h-3.5 w-3.5" />Hide</>}</button>
        <button onClick={() => window.confirm('Delete this comment permanently?') && del.mutate()} className="inline-flex items-center gap-1" style={{ color: IG.red }}><Trash2 className="h-3.5 w-3.5" />Delete</button>
      </div>
      {c.replies?.data?.map(r => <p key={r.id} className="ml-8 text-[13px]" style={{ color: IG.text }}><b className="font-semibold">{r.username}</b> {r.text}</p>)}
      {open && (
        <div className="ml-8 flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: IG.line }}>
          <input autoFocus className="ig-bare flex-1 text-[14px]" placeholder={`Reply to ${c.username}…`} value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && reply.trim() && send.mutate()} />
          <button disabled={!reply.trim() || send.isPending} onClick={() => send.mutate()} className="text-[14px] font-semibold disabled:opacity-40" style={{ color: IG.blue }}>Post</button>
        </div>
      )}
    </li>
  );
}

export default function InstagramComments() {
  const [mediaId, setMediaId] = useState<string | null>(null);
  const qc = useQueryClient();
  const media = useQuery({ queryKey: ['ig-tools', 'media'], queryFn: igToolsApi.media, retry: false });
  const comments = useQuery({ queryKey: ['ig-tools', 'comments', mediaId], queryFn: () => igToolsApi.comments(mediaId!), enabled: !!mediaId, retry: false });
  const toggle = useMutation({ mutationFn: (enabled: boolean) => igToolsApi.setCommentsEnabled(mediaId!, enabled), onSuccess: (_d, enabled) => { toast.success(enabled ? 'Comments turned on' : 'Comments turned off'); qc.invalidateQueries({ queryKey: ['ig-tools', 'comments', mediaId] }); }, onError: e => toast.error(apiErrorMessage(e, 'Could not change comment settings')) });

  return (
    <InstagramPage fullHeight title="Comments" subtitle="Read, reply to, hide and delete comments on your posts">
      <InstagramConnectionGate returnPath="/instagram/comments">
        <div className="flex min-h-0 flex-1">
          <div className={cn('w-full shrink-0 overflow-y-auto border-r md:w-[320px]', mediaId && 'hidden md:block')} style={{ borderColor: IG.line }}>
            <div className="p-4"><PermissionNotice need="comments" /></div>
            {media.error ? <p className="p-5 text-[13px]" style={{ color: IG.sub }}>{apiErrorMessage(media.error, 'Could not load your posts')}</p> : (
              <ul>{(media.data || []).map(m => (
                <li key={m.id}><button onClick={() => setMediaId(m.id)} className={cn('flex w-full items-center gap-3 px-4 py-2.5 text-left', mediaId === m.id ? 'bg-[#efefef]' : 'hover:bg-[#fafafa]')}>
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-[#efefef]">{(m.thumbnail_url || m.media_url) && <img src={m.thumbnail_url || m.media_url} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />}</div>
                  <div className="min-w-0"><p className="truncate text-[14px]" style={{ color: IG.text }}>{m.caption || 'No caption'}</p><p className="text-[12px]" style={{ color: IG.sub }}>{m.comments_count ?? 0} comments</p></div>
                </button></li>
              ))}</ul>
            )}
          </div>
          <div className={cn('min-w-0 flex-1 overflow-y-auto p-5', !mediaId && 'hidden md:block')}>
            {!mediaId ? <p className="py-20 text-center text-[14px]" style={{ color: IG.sub }}>Choose a post to manage its comments.</p> : <>
              <div className="mb-3 flex items-center justify-between">
                <button className="text-[13px] font-semibold md:hidden" style={{ color: IG.blue }} onClick={() => setMediaId(null)}>← Posts</button>
                <button onClick={() => window.confirm('Turn off commenting on this post?') && toggle.mutate(false)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold" style={{ background: IG.soft, color: IG.text }}><MessageSquareOff className="h-4 w-4" />Turn off comments</button>
              </div>
              {comments.error ? <p className="py-10 text-center text-[13px]" style={{ color: IG.sub }}>{apiErrorMessage(comments.error, 'Could not load comments')}</p> : comments.isLoading ? <p className="py-10 text-center text-[13px]" style={{ color: IG.sub }}>Loading…</p> : (comments.data || []).length === 0 ? <p className="py-10 text-center text-[14px]" style={{ color: IG.sub }}>No comments on this post yet.</p> : <ul>{comments.data!.map(c => <CommentRow key={c.id} c={c} mediaId={mediaId} />)}</ul>}
            </>}
          </div>
        </div>
      </InstagramConnectionGate>
    </InstagramPage>
  );
}
