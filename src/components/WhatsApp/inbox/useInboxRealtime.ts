import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/contexts/useSocket';

/** Refresh inbox queries whenever the server reports WhatsApp activity for this organisation. */
export function useInboxRealtime() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (timer) return; // coalesce bursts
      timer = setTimeout(() => {
        timer = null;
        queryClient.invalidateQueries({ queryKey: ['whatsapp', 'inbox'] });
      }, 250);
    };
    const events = ['whatsapp_message_received', 'whatsapp_status_update', 'whatsapp_conversation_updated', 'whatsapp_handoff'];
    events.forEach(e => socket.on(e, refresh));
    return () => {
      events.forEach(e => socket.off(e, refresh));
      if (timer) clearTimeout(timer);
    };
  }, [socket, queryClient]);
}
