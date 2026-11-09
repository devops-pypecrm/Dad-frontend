import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';
import { InstagramPage } from '@/components/instagram/InstagramPage';
import { InstagramConnectionGate } from '@/components/instagram/InstagramConnectionGate';
import { PermissionNotice } from '@/components/instagram/tools/PermissionNotice';
import { IG } from '@/components/instagram/inbox/ig';
import { igToolsApi, type IgScheduledPost } from '@/services/instagramToolsService';
import { apiErrorMessage } from '@/lib/apiError';

const STATUS: Record<IgScheduledPost['status'], { l: string; c: string }> = {
  scheduled: { l: 'Scheduled', c: '#0074cc' }, publishing: { l: 'Publishing…', c: '#9a6a00' }, published: { l: 'Published', c: '#1a7f37' }, failed: { l: 'Failed', c: '#ed4956' }, cancelled: { l: 'Cancelled', c: '#8e8e8e' },
};
const FIELD = 'w-full rounded-lg px-3 py-2 text-[14px]';

export default function InstagramPublishing() {
  const qc = useQueryClient();
  const file = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<'IMAGE' | 'REELS' | 'STORIES'>('IMAGE');
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [when, setWhen] = useState('');
  const posts = useQuery({ queryKey: ['ig-tools', 'posts'], queryFn: igToolsApi.posts, refetchInterval: 15000 });
  const refresh = () => qc.invalidateQueries({ queryKey: ['ig-tools', 'posts'] });
  const upload = useMutation({ mutationFn: (f: File) => igToolsApi.upload(f), onSuccess: u => { setUrl(u); toast.success('File uploaded'); }, onError: e => toast.error(apiErrorMessage(e, 'Upload failed')) });
  const create = useMutation({
    mutationFn: () => igToolsApi.createPost({ mediaType: type, mediaUrl: url, caption, scheduledFor: when ? new Date(when).toISOString() : undefined }),
    onSuccess: () => { toast.success(when ? 'Post scheduled' : 'Publishing now…'); setUrl(''); setCaption(''); setWhen(''); refresh(); },
    onError: e => toast.error(apiErrorMessage(e, 'Could not schedule the post')),
  });
  const cancel = useMutation({ mutationFn: (id: string) => igToolsApi.cancelPost(id), onSuccess: refresh, onError: e => toast.error(apiErrorMessage(e, 'Could not cancel')) });

  return (
    <InstagramPage title="Publishing" subtitle="Publish or schedule photos, reels and stories">
      <InstagramConnectionGate returnPath="/instagram/publishing">
        <PermissionNotice need="publishing" />
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <section className="space-y-4 rounded-xl border p-5" style={{ borderColor: IG.line }}>
            <h3 className="text-[15px] font-semibold" style={{ color: IG.text }}>New post</h3>
            <div className="flex gap-2">{(['IMAGE', 'REELS', 'STORIES'] as const).map(t => <button key={t} onClick={() => setType(t)} className="rounded-lg px-3 py-1.5 text-[13px] font-semibold" style={{ background: type === t ? IG.text : IG.soft, color: type === t ? '#fff' : IG.text }}>{t === 'IMAGE' ? 'Photo' : t === 'REELS' ? 'Reel' : 'Story'}</button>)}</div>
            <div className="space-y-2">
              <input className={`ig-flat ${FIELD}`} style={{ background: IG.soft }} placeholder="Public https:// link to the image or video" value={url} onChange={e => setUrl(e.target.value)} />
              <input ref={file} type="file" hidden accept="image/jpeg,image/png,video/mp4,video/quicktime" onChange={e => e.target.files?.[0] && upload.mutate(e.target.files[0])} />
              <button onClick={() => file.current?.click()} disabled={upload.isPending} className="inline-flex items-center gap-1.5 text-[13px] font-semibold disabled:opacity-50" style={{ color: IG.blue }}><Upload className="h-4 w-4" />{upload.isPending ? 'Uploading…' : 'Or upload a file'}</button>
              <p className="text-[12px]" style={{ color: IG.sub }}>Photos: JPEG. Reels and stories: MP4/MOV, 9:16 works best.</p>
            </div>
            {type !== 'STORIES' && <textarea rows={4} maxLength={2200} className={`ig-flat ${FIELD}`} style={{ background: IG.soft }} placeholder="Write a caption…" value={caption} onChange={e => setCaption(e.target.value)} />}
            <div className="space-y-1"><label className="text-[13px] font-semibold" style={{ color: IG.text }}>Schedule (leave empty to publish now)</label><input type="datetime-local" className={`ig-flat ${FIELD}`} style={{ background: IG.soft }} value={when} onChange={e => setWhen(e.target.value)} /></div>
            <button disabled={!url || create.isPending} onClick={() => create.mutate()} className="w-full rounded-lg py-2 text-[14px] font-semibold text-white disabled:opacity-50" style={{ background: IG.blue }}>{create.isPending ? 'Saving…' : when ? 'Schedule' : 'Publish now'}</button>
          </section>

          <section className="rounded-xl border" style={{ borderColor: IG.line }}>
            <h3 className="border-b px-5 py-3 text-[15px] font-semibold" style={{ borderColor: IG.line, color: IG.text }}>Queue & history</h3>
            {(posts.data || []).length === 0 ? <p className="px-5 py-10 text-center text-[14px]" style={{ color: IG.sub }}>Nothing scheduled yet.</p> : (
              <ul>{posts.data!.map(p => (
                <li key={p.id} className="flex items-center gap-3 border-b px-5 py-3 last:border-0" style={{ borderColor: IG.soft }}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px]" style={{ color: IG.text }}>{p.caption || p.mediaUrl}</p>
                    <p className="text-[12px]" style={{ color: IG.sub }}>{p.mediaType === 'IMAGE' ? 'Photo' : p.mediaType === 'REELS' ? 'Reel' : 'Story'} · {format(new Date(p.scheduledFor), 'dd MMM, HH:mm')}{p.error && <span style={{ color: IG.red }}> · {p.error}</span>}</p>
                  </div>
                  <span className="text-[12px] font-semibold" style={{ color: STATUS[p.status].c }}>{STATUS[p.status].l}</span>
                  {p.permalink && <a href={p.permalink} target="_blank" rel="noreferrer" className="text-[12px] font-semibold" style={{ color: IG.blue }}>View</a>}
                  {p.status === 'scheduled' && <button aria-label="Cancel" onClick={() => cancel.mutate(p.id)}><X className="h-4 w-4" style={{ color: IG.sub }} /></button>}
                </li>
              ))}</ul>
            )}
          </section>
        </div>
      </InstagramConnectionGate>
    </InstagramPage>
  );
}
