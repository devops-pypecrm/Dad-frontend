import { useEffect, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { INSTAGRAM_CONNECTION_KEY, useInstagramConnection } from '@/hooks/useInstagramConnection';
import { isAdmin } from '@/lib/utils';
import { ConnectInstagramCard } from './ConnectInstagramCard';

interface Props { returnPath: string; children: ReactNode; fallback?: ReactNode }

/** Every Instagram page wraps its content in this so "not connected" lives in one place. */
export function InstagramConnectionGate({ returnPath, children, fallback }: Props) {
  const { data, isLoading } = useInstagramConnection();
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Result of the Instagram login round-trip (?instagram=connected | error)
  useEffect(() => {
    const r = params.get('instagram');
    if (!r) return;
    if (r === 'connected') toast.success('Instagram account connected');
    else toast.error(params.get('message') || 'Could not connect Instagram');
    queryClient.invalidateQueries({ queryKey: INSTAGRAM_CONNECTION_KEY });
    const next = new URLSearchParams(params); next.delete('instagram'); next.delete('message');
    setParams(next, { replace: true });
  }, [params, setParams, queryClient]);

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>;

  const user = (() => { try { return JSON.parse(localStorage.getItem('userInfo') || 'null'); } catch { return null; } })();
  if (!data?.connected) {
    return <>{fallback ?? <ConnectInstagramCard returnPath={returnPath} canConnect={isAdmin(user)} message={data && !data.configured ? 'Instagram has not been set up on this platform yet. Please contact Pype CRM support.' : undefined} />}</>;
  }
  if (data.healthy === false) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 bg-destructive/10 text-destructive text-sm px-4 py-2.5 rounded-[10px] mb-3">
          <AlertTriangle className="h-4 w-4 shrink-0" /> Instagram needs to be reconnected{data.account?.lastError ? `: ${data.account.lastError}` : '.'} Disconnect and connect again from the Shared Inbox.
        </div>
        {children}
      </div>
    );
  }
  return <>{children}</>;
}
