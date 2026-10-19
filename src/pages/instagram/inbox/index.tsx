import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Instagram, Unplug } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { WA_CARD, WA_OUTLINE_BTN } from '@/components/WhatsApp/hub/whatsappStyles';
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
        <Button variant="outline" className={WA_OUTLINE_BTN} disabled={disconnect.isPending} onClick={() => window.confirm('Disconnect Instagram? Chatbots and Ask-to-Follow bots will be switched off.') && disconnect.mutate()}><Unplug className="h-4 w-4 mr-1.5" />Disconnect</Button>
      )}
    >
      <InstagramConnectionGate returnPath="/instagram/inbox">
        <div className={cn(WA_CARD, 'flex flex-1 min-h-0')}>
          <div className={cn('w-full md:w-[340px] lg:w-[380px] shrink-0 flex-col border-r border-border bg-white', selectedId ? 'hidden md:flex' : 'flex')}>
            <IgConversationList selectedId={selectedId} onSelect={c => setSelectedId(c.id)} />
          </div>
          <div className={cn('flex-1 min-w-0 flex-col', !selectedId ? 'hidden md:flex' : 'flex')}>
            {selectedId ? (
              <IgThread key={selectedId} conversationId={selectedId} onBack={() => setSelectedId(null)} detailsOpen={detailsOpen} onToggleDetails={() => setDetailsOpen(o => !o)} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f6f6f4]">
                <div className="h-24 w-24 rounded-[26px] bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] flex items-center justify-center text-white mb-5"><Instagram className="h-11 w-11" /></div>
                <h3 className="text-xl font-medium font-poppins text-black mb-1">Instagram Shared Inbox</h3>
                <p className="max-w-sm text-sm font-poppins text-muted-foreground">Select a conversation to read and reply. New DMs appear here instantly.</p>
              </div>
            )}
          </div>
          {selectedId && detailsOpen && <div className="hidden lg:block w-[300px] shrink-0 border-l border-border"><IgDetails conversationId={selectedId} /></div>}
        </div>
      </InstagramConnectionGate>
    </InstagramPage>
  );
}
