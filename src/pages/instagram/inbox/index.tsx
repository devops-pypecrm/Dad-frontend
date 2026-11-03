import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Unplug } from 'lucide-react';
import { toast } from 'sonner';
import { InstagramPage } from '@/components/instagram/InstagramPage';
import { InstagramConnectionGate } from '@/components/instagram/InstagramConnectionGate';
import { IgConversationList } from '@/components/instagram/inbox/IgConversationList';
import { IgThread } from '@/components/instagram/inbox/IgThread';
import { IgDetails } from '@/components/instagram/inbox/IgDetails';
import { useIgRealtime } from '@/components/instagram/inbox/useIgRealtime';
import { INSTAGRAM_CONNECTION_KEY, useInstagramConnection } from '@/hooks/useInstagramConnection';
import { instagramConnectionApi } from '@/services/instagramService';
import { apiErrorMessage } from '@/lib/apiError';
import { isAdmin } from '@/lib/utils';
import { IG } from '@/components/instagram/inbox/ig';
import { cn } from '@/lib/utils';

export default function InstagramSharedInbox() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: conn } = useInstagramConnection();
  useIgRealtime();

  const user = (() => { try { return JSON.parse(localStorage.getItem('userInfo') || 'null'); } catch { return null; } })();
  const disconnect = useMutation({
    mutationFn: instagramConnectionApi.disconnect,
    onSuccess: () => { toast.success('Instagram disconnected'); queryClient.invalidateQueries({ queryKey: INSTAGRAM_CONNECTION_KEY }); setSelectedId(null); },
    onError: e => toast.error(apiErrorMessage(e, 'Could not disconnect')),
  });

  return (
    <InstagramPage
      fullHeight
      title="Shared Inbox"
      subtitle="Reply to your Instagram DMs together, from inside the CRM."
      actions={conn?.connected && isAdmin(user) && (
        <button className="inline-flex items-center rounded-lg px-4 py-1.5 text-[14px] font-semibold disabled:opacity-50" style={{ background: IG.soft, color: IG.text }} disabled={disconnect.isPending} onClick={() => window.confirm('Disconnect Instagram? Chatbots and Ask-to-Follow bots will be switched off.') && disconnect.mutate()}><Unplug className="mr-1.5 h-4 w-4" />Disconnect</button>
      )}
    >
      <InstagramConnectionGate returnPath="/instagram/inbox">
        <div className="flex min-h-0 flex-1">
          <div style={{ borderColor: IG.line }} className={cn('w-full shrink-0 flex-col border-r bg-background md:w-[360px] lg:w-[397px]', selectedId ? 'hidden md:flex' : 'flex')}>
            <IgConversationList selectedId={selectedId} onSelect={c => setSelectedId(c.id)} />
          </div>
          <div className={cn('flex-1 min-w-0 flex-col', !selectedId ? 'hidden md:flex' : 'flex')}>
            {selectedId ? (
              <IgThread key={selectedId} conversationId={selectedId} onBack={() => setSelectedId(null)} detailsOpen={detailsOpen} onToggleDetails={() => setDetailsOpen(o => !o)} />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center bg-background p-8 text-center" style={{ fontFamily: IG.font }}>
                <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2" style={{ borderColor: IG.text, color: IG.text }}><Send className="h-10 w-10 -rotate-12" strokeWidth={1.5} /></div>
                <h3 className="mb-1 text-[20px] font-normal" style={{ color: IG.text }}>Your messages</h3>
                <p className="max-w-sm text-[14px] leading-5" style={{ color: IG.sub }}>Send private photos and messages to a friend or group.</p>
              </div>
            )}
          </div>
          {selectedId && detailsOpen && <div style={{ borderColor: IG.line }} className="hidden w-[320px] shrink-0 border-l lg:block"><IgDetails conversationId={selectedId} /></div>}
        </div>
      </InstagramConnectionGate>
    </InstagramPage>
  );
}
