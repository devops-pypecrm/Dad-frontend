import { Bookmark, ChevronLeft, Heart, MessageCircle, MoreHorizontal, Phone, Send, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PreviewTab = 'post' | 'comments' | 'dm';

interface Props {
  tab: PreviewTab; onTab: (t: PreviewTab) => void;
  username: string; avatar?: string | null; thumb?: string | null; caption?: string;
  sampleKeyword: string; publicReply?: string;
  askMessage: string; followButton: string; rewardMessage: string; rewardLink?: string | null;
}

const Avatar = ({ src, className }: { src?: string | null; className?: string }) =>
  src ? <img src={src} alt="" referrerPolicy="no-referrer" className={cn('rounded-full object-cover', className)} /> : <div className={cn('rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5]', className)} />;

/** Phone mock-up showing the post, the comment thread and the DM the bot will send. */
export function PhonePreview(p: Props) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-[520px] w-[260px] rounded-[38px] border-[7px] border-black bg-[#0c1013] shadow-xl overflow-hidden text-white">
        <div className="flex items-center justify-between px-4 pt-2 text-[9px] font-semibold"><span>5:39</span><span className="h-3 w-3 rounded-full bg-black" /><span>▮▮▮</span></div>

        {p.tab === 'post' && (
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 px-3 py-2"><ChevronLeft className="h-4 w-4" /><div><p className="text-[8px] text-neutral-400 leading-none">{p.username}</p><p className="text-[11px] font-semibold leading-tight">Posts</p></div></div>
            <div className="flex items-center gap-2 px-3 pb-2"><Avatar src={p.avatar} className="h-6 w-6" /><span className="text-[11px] font-semibold flex-1">{p.username}</span><MoreHorizontal className="h-4 w-4" /></div>
            <div className="aspect-square w-full bg-neutral-800">{p.thumb ? <img src={p.thumb} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[10px] text-neutral-500">Choose a post</div>}</div>
            <div className="flex items-center gap-3 px-3 py-2"><Heart className="h-4 w-4" /><MessageCircle className="h-4 w-4" /><Send className="h-4 w-4" /><Bookmark className="ml-auto h-4 w-4" /></div>
            <p className="px-3 text-[10px] leading-snug line-clamp-3"><span className="font-semibold">{p.username}</span> {p.caption || ''}</p>
            <p className="px-3 pt-1 text-[10px] text-neutral-500">View all comments</p>
          </div>
        )}

        {p.tab === 'comments' && (
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 px-3 py-2"><ChevronLeft className="h-4 w-4" /><span className="text-[11px] font-semibold">{p.username}</span></div>
            <div className="aspect-[16/7] w-full bg-neutral-800">{p.thumb && <img src={p.thumb} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover opacity-70" />}</div>
            <div className="flex-1 rounded-t-2xl bg-[#121820] px-3 pt-2">
              <div className="mx-auto mb-2 h-1 w-8 rounded-full bg-neutral-600" /><p className="mb-2 text-center text-[11px] font-semibold">Comments</p>
              <div className="flex gap-2"><div className="h-6 w-6 shrink-0 rounded-full bg-neutral-600" /><div><p className="text-[10px]"><span className="font-semibold">username</span> <span className="text-neutral-500">now</span></p><p className="text-[10px]">{p.sampleKeyword || 'link'}</p><p className="text-[9px] text-neutral-500">Reply</p></div></div>
              {p.publicReply && <div className="ml-8 mt-2 flex gap-2"><Avatar src={p.avatar} className="h-5 w-5 shrink-0" /><div><p className="text-[10px]"><span className="font-semibold">{p.username}</span> <span className="text-neutral-500">now</span></p><p className="text-[10px]">{p.publicReply}</p></div></div>}
            </div>
            <div className="flex items-center gap-2 border-t border-neutral-800 px-3 py-2"><div className="h-5 w-5 rounded-full bg-neutral-600" /><span className="text-[10px] text-neutral-500">Add a comment…</span></div>
          </div>
        )}

        {p.tab === 'dm' && (
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 px-3 py-2"><ChevronLeft className="h-4 w-4" /><Avatar src={p.avatar} className="h-6 w-6" /><span className="text-[11px] font-semibold flex-1">{p.username}</span><Phone className="h-3.5 w-3.5" /><Video className="h-3.5 w-3.5" /></div>
            <div className="flex-1 space-y-2 overflow-hidden px-3 pt-2">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-neutral-800 px-2.5 py-1.5 text-[10px] leading-snug">{p.askMessage}
                <div className="mt-1.5 rounded-lg bg-neutral-700 px-2 py-1 text-center text-[10px] font-medium text-sky-400">{p.followButton || "I'm following"}</div></div>
              <div className="ml-auto w-fit max-w-[70%] rounded-2xl rounded-br-sm bg-gradient-to-r from-violet-600 to-fuchsia-600 px-2.5 py-1.5 text-[10px]">{p.followButton || "I'm following"}</div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-neutral-800 px-2.5 py-1.5 text-[10px] leading-snug">{p.rewardMessage}{p.rewardLink && <p className="mt-0.5 text-sky-400 break-all">{p.rewardLink}</p>}</div>
            </div>
            <div className="m-2 rounded-full border border-neutral-700 px-3 py-1.5 text-[10px] text-neutral-500">Message…</div>
          </div>
        )}
      </div>

      <div className="grid w-full max-w-[300px] grid-cols-3 rounded-[10px] bg-muted/70 p-1">
        {([['post', 'Post'], ['comments', 'Comments'], ['dm', 'DM']] as const).map(([k, label]) => (
          <button key={k} onClick={() => p.onTab(k)} className={cn('rounded-lg py-1.5 text-xs font-medium font-poppins transition-colors', p.tab === k ? 'bg-white text-black shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{label}</button>
        ))}
      </div>
    </div>
  );
}
