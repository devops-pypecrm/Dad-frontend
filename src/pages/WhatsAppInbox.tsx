import React, { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { WhatsAppConnectionGate } from '@/components/WhatsApp/hub/WhatsAppConnectionGate';
import { NewChatDialog } from '@/components/WhatsApp/hub/NewChatDialog';
import { WhatsAppPage } from '@/components/WhatsApp/hub/WhatsAppPage';
import { WA_CARD, WA_PRIMARY_BTN } from '@/components/WhatsApp/hub/whatsappStyles';
import { ConversationListPanel } from '@/components/WhatsApp/inbox/ConversationListPanel';
import { ThreadPanel } from '@/components/WhatsApp/inbox/ThreadPanel';
import { DetailsPanel } from '@/components/WhatsApp/inbox/DetailsPanel';
import { useInboxRealtime } from '@/components/WhatsApp/inbox/useInboxRealtime';
import { cn } from '@/lib/utils';

const WhatsAppInbox: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const queryClient = useQueryClient();
  useInboxRealtime();

  return (
    <WhatsAppPage
      fullHeight
      title="Team Inbox"
      emoji="💬"
      subtitle="Chat with your leads and contacts on WhatsApp."
      actions={
        <Button className={WA_PRIMARY_BTN} onClick={() => setNewChatOpen(true)}>
          <MessageSquarePlus className="h-4 w-4 mr-1.5" /> New chat
        </Button>
      }
    >
      <WhatsAppConnectionGate returnPath="/whatsapp/inbox">
        <div className={cn(WA_CARD, 'flex flex-1 min-h-0')}>
          <div className={cn('w-full md:w-[340px] lg:w-[380px] shrink-0 flex-col border-r border-border bg-white', selectedId ? 'hidden md:flex' : 'flex')}>
            <ConversationListPanel selectedId={selectedId} onSelect={c => setSelectedId(c.id)} />
          </div>

          <div className={cn('flex-1 min-w-0 flex-col', !selectedId ? 'hidden md:flex' : 'flex')}>
            {selectedId ? (
              <ThreadPanel
                key={selectedId}
                conversationId={selectedId}
                onBack={() => setSelectedId(null)}
                detailsOpen={detailsOpen}
                onToggleDetails={() => setDetailsOpen(o => !o)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#f6f6f4]">
                <div className="h-28 w-28 rounded-full bg-[hsl(var(--chart-5))]/10 flex items-center justify-center mb-5">
                  <MessageSquarePlus strokeWidth={1.25} className="h-12 w-12 text-[hsl(var(--chart-5))]" />
                </div>
                <h3 className="text-xl font-medium font-poppins text-black mb-1">WhatsApp for CRM</h3>
                <p className="max-w-sm text-sm font-poppins text-muted-foreground">Select a conversation, or start a new chat with any lead or contact.</p>
              </div>
            )}
          </div>

          {selectedId && detailsOpen && (
            <div className="hidden lg:block w-[300px] shrink-0 border-l border-border">
              <DetailsPanel conversationId={selectedId} />
            </div>
          )}
        </div>

        <NewChatDialog
          open={newChatOpen}
          onOpenChange={setNewChatOpen}
          onSent={(conversationId) => {
            setSelectedId(conversationId);
            queryClient.invalidateQueries({ queryKey: ['whatsapp', 'inbox'] });
          }}
        />
      </WhatsAppConnectionGate>
    </WhatsAppPage>
  );
};

export default WhatsAppInbox;
