import { useQuery } from '@tanstack/react-query';
import { templateApi } from '@/services/whatsAppHubService';

/** Templates that WhatsApp has approved: the only ones usable for business-initiated messages. */
export function useApprovedTemplates() {
  const query = useQuery({ queryKey: ['whatsapp', 'templates'], queryFn: () => templateApi.list(false), staleTime: 60_000 });
  return { ...query, approved: (query.data ?? []).filter(t => t.status === 'APPROVED') };
}
