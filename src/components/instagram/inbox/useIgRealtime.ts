import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/contexts/useSocket';

/** Refresh the Instagram inbox whenever the server reports activity for this organisation. */
export function useIgRealtime() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!socket) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (timer) return;
      timer = setTimeout(() => { timer = null; queryClient.invalidateQueries({ queryKey: ['instagram', 'inbox'] }); }, 250);
    };
    const events = ['instagram_message_received', 'instagram_message_status', 'instagram_conversation_updated'];
    events.forEach(e => socket.on(e, refresh));
    return () => { events.forEach(e => socket.off(e, refresh)); if (timer) clearTimeout(timer); };
  }, [socket, queryClient]);
}
