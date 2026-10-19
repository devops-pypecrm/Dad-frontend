import { useQuery } from '@tanstack/react-query';
import { instagramConnectionApi } from '@/services/instagramService';

export const INSTAGRAM_CONNECTION_KEY = ['instagram', 'connection'];

/** Single source of truth for "is Instagram connected?" across the Instagram section. */
export function useInstagramConnection(enabled = true) {
  return useQuery({ queryKey: INSTAGRAM_CONNECTION_KEY, queryFn: instagramConnectionApi.get, staleTime: 60_000, enabled, retry: false });
}
