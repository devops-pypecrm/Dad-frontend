import { useSocket } from '@/contexts/useSocket';

/**
 * Refetch interval for "live" screens such as the inboxes.
 * The socket pushes updates instantly; polling is the safety net, so it is slow while the socket is
 * connected and fast when it is not. Queries should also set refetchIntervalInBackground: false so
 * hidden tabs don't poll.
 */
export function useLivePoll(fastMs = 2500, slowMs = 15000): number {
  const { connected } = useSocket();
  return connected ? slowMs : fastMs;
}
