import { useQuery } from '@tanstack/react-query';
import { getWhatsAppConnection } from '@/services/whatsAppService';

export const WHATSAPP_CONNECTION_KEY = ['whatsapp', 'connection'];

/**
 * Single source of truth for "is WhatsApp connected?" across the WhatsApp hub.
 */
export function useWhatsAppConnection() {
  return useQuery({
    queryKey: WHATSAPP_CONNECTION_KEY,
    queryFn: getWhatsAppConnection,
    staleTime: 60_000,
  });
}
