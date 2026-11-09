import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { InstagramPage } from '@/components/instagram/InstagramPage';
import { InstagramConnectionGate } from '@/components/instagram/InstagramConnectionGate';
import { PermissionNotice } from '@/components/instagram/tools/PermissionNotice';
import { IG } from '@/components/instagram/inbox/ig';
import { igToolsApi, type IgMessagingProfile } from '@/services/instagramToolsService';
import { apiErrorMessage } from '@/lib/apiError';

const FIELD = 'ig-flat w-full rounded-lg px-3 py-2 text-[14px]';

export default function InstagramDmSetup() {
  const q = useQuery({ queryKey: ['ig-tools', 'messaging-profile'], queryFn: igToolsApi.getMessagingProfile, retry: false });
  return (
    <InstagramPage title="DM Setup" subtitle="Ice breakers and a menu shown when someone opens a chat with you">
      <InstagramConnectionGate returnPath="/instagram/dm-setup">
        <PermissionNotice need="messages" />
        {q.error && <p className="text-[13px]" style={{ color: IG.red }}>{apiErrorMessage(q.error, 'Could not load your current settings')}</p>}
        {(q.data || q.error) && <DmForm key={JSON.stringify(q.data)} initial={q.data || { iceBreakers: [], persistentMenu: [] }} />}
      </InstagramConnectionGate>
    </InstagramPage>
  );
}

function DmForm({ initial }: { initial: IgMessagingProfile }) {
  const qc = useQueryClient();
  const [f, setF] = useState<IgMessagingProfile>(initial);
  const save = useMutation({ mutationFn: () => igToolsApi.saveMessagingProfile(f), onSuccess: () => { toast.success('Saved. It can take a few minutes to appear in Instagram.'); qc.invalidateQueries({ queryKey: ['ig-tools', 'messaging-profile'] }); }, onError: e => toast.error(apiErrorMessage(e, 'Could not save')) });

  return (
    <>
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3 rounded-xl border p-5" style={{ borderColor: IG.line }}>
            <h3 className="text-[15px] font-semibold" style={{ color: IG.text }}>Ice breakers</h3>
            <p className="text-[13px]" style={{ color: IG.sub }}>Up to 4 tappable questions on an empty chat. A tap is answered by your keyword chatbots like a typed message.</p>
            {[0, 1, 2, 3].map(i => <input key={i} maxLength={80} className={FIELD} style={{ background: IG.soft }} placeholder={`Question ${i + 1}`} value={f.iceBreakers[i] || ''} onChange={e => { const x = [...f.iceBreakers]; x[i] = e.target.value; setF({ ...f, iceBreakers: x }); }} />)}
          </section>
          <section className="space-y-3 rounded-xl border p-5" style={{ borderColor: IG.line }}>
            <h3 className="text-[15px] font-semibold" style={{ color: IG.text }}>Persistent menu</h3>
            <p className="text-[13px]" style={{ color: IG.sub }}>Up to 5 buttons always available in the chat: open a website, or ask a question your chatbots answer.</p>
            {f.persistentMenu.map((m, i) => (
              <div key={i} className="flex gap-2">
                <select className={`${FIELD} !w-28`} style={{ background: IG.soft }} value={m.type} onChange={e => { const x = [...f.persistentMenu]; x[i] = { ...m, type: e.target.value as 'web_url' | 'postback' }; setF({ ...f, persistentMenu: x }); }}><option value="web_url">Link</option><option value="postback">Question</option></select>
                <input maxLength={30} className={FIELD} style={{ background: IG.soft }} placeholder="Title" value={m.title} onChange={e => { const x = [...f.persistentMenu]; x[i] = { ...m, title: e.target.value }; setF({ ...f, persistentMenu: x }); }} />
                {m.type === 'web_url' && <input className={FIELD} style={{ background: IG.soft }} placeholder="https://…" value={m.url || ''} onChange={e => { const x = [...f.persistentMenu]; x[i] = { ...m, url: e.target.value }; setF({ ...f, persistentMenu: x }); }} />}
                <button aria-label="Remove" onClick={() => setF({ ...f, persistentMenu: f.persistentMenu.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" style={{ color: IG.sub }} /></button>
              </div>
            ))}
            {f.persistentMenu.length < 5 && <button className="inline-flex items-center gap-1 text-[14px] font-semibold" style={{ color: IG.blue }} onClick={() => setF({ ...f, persistentMenu: [...f.persistentMenu, { type: 'web_url', title: '', url: '' }] })}><Plus className="h-4 w-4" />Add button</button>}
          </section>
        </div>
        <button disabled={save.isPending} onClick={() => save.mutate()} className="rounded-lg px-6 py-2 text-[14px] font-semibold text-white disabled:opacity-50" style={{ background: IG.blue }}>{save.isPending ? 'Saving…' : 'Save'}</button>
    </>
  );
}
