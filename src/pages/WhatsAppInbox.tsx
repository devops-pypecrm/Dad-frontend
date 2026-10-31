import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { WhatsAppConnectionGate } from '@/components/WhatsApp/hub/WhatsAppConnectionGate';
import { NewChatDialog } from '@/components/WhatsApp/hub/NewChatDialog';
import { ConversationListPanel } from '@/components/WhatsApp/inbox/ConversationListPanel';
import { ThreadPanel } from '@/components/WhatsApp/inbox/ThreadPanel';
import { DetailsPanel } from '@/components/WhatsApp/inbox/DetailsPanel';
import { useInboxRealtime } from '@/components/WhatsApp/inbox/useInboxRealtime';
import { WA } from '@/components/WhatsApp/inbox/wa';
import { cn } from '@/lib/utils';

/** Team Inbox, laid out like WhatsApp Web: chat list | conversation | contact info. */
const WhatsAppInbox: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const queryClient = useQueryClient();
  useInboxRealtime();

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: WA.panel, fontFamily: WA.font }}>
      <WhatsAppConnectionGate returnPath="/whatsapp/inbox">
        <div className="flex min-h-0 flex-1 overflow-hidden border-t" style={{ borderColor: WA.line }}>
          {/* chat list */}
          <div className={cn('w-full shrink-0 flex-col border-r md:w-[360px] lg:w-[420px]', selectedId ? 'hidden md:flex' : 'flex')} style={{ borderColor: WA.line }}>
            <ConversationListPanel selectedId={selectedId} onSelect={c => setSelectedId(c.id)} onNewChat={() => setNewChatOpen(true)} />
          </div>

          {/* conversation or start screen */}
          <div className={cn('min-w-0 flex-1 flex-col', !selectedId ? 'hidden md:flex' : 'flex')}>
            {selectedId ? (
              <ThreadPanel key={selectedId} conversationId={selectedId} onBack={() => setSelectedId(null)} detailsOpen={detailsOpen} onToggleDetails={() => setDetailsOpen(o => !o)} />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center border-b-[6px] px-10 text-center" style={{ background: WA.panel, borderBottomColor: WA.green }}>
                <div className="mb-7 flex h-[150px] w-[150px] items-center justify-center rounded-full" style={{ background: '#e7f8ef' }}>
                  <div className="flex h-[96px] w-[96px] items-center justify-center rounded-full text-white" style={{ background: WA.green }}><MessageSquare className="h-12 w-12" strokeWidth={1.6} /></div>
                </div>
                <h1 className="text-[32px] font-light leading-[1.2]" style={{ color: '#41525d' }}>Team Inbox</h1>
                <p className="mt-4 max-w-[460px] text-[14px] leading-5" style={{ color: WA.sub }}>
                  Send and receive WhatsApp messages with your leads and contacts, right from the CRM.
                  Pick a chat on the left, or use the new-chat button to message someone.
                </p>
                <p className="mt-10 flex items-center gap-1.5 text-[13px]" style={{ color: '#8696a0' }}>Messages go through the official WhatsApp Business Platform</p>
              </div>
            )}
          </div>

          {/* contact info */}
          {selectedId && detailsOpen && (
            <div className="fixed inset-y-0 right-0 z-40 w-full shadow-xl sm:w-[360px] lg:static lg:z-auto lg:w-[400px] lg:shrink-0 lg:border-l lg:shadow-none" style={{ borderColor: WA.line }}>
              <DetailsPanel conversationId={selectedId} onClose={() => setDetailsOpen(false)} />
            </div>
          )}
        </div>

        <NewChatDialog
          open={newChatOpen}
          onOpenChange={setNewChatOpen}
          onSent={(conversationId) => { setSelectedId(conversationId); queryClient.invalidateQueries({ queryKey: ['whatsapp', 'inbox'] }); }}
        />
      </WhatsAppConnectionGate>
    </div>
  );
};

export default WhatsAppInbox;
