import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useWhatsAppConnection } from '@/hooks/useWhatsAppConnection';
import { ConnectWhatsAppCard } from './ConnectWhatsAppCard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Props {
  returnPath: string;
  children: ReactNode;
  /** Rendered instead of the default connect card when WhatsApp is not connected. */
  fallback?: ReactNode;
}

/**
 * Every WhatsApp hub page wraps its content in this gate so the
 * "not connected" experience lives in one place.
 */
export function WhatsAppConnectionGate({ returnPath, children, fallback }: Props) {
  const { data, isLoading } = useWhatsAppConnection();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data?.connected) {
    return <>{fallback ?? <ConnectWhatsAppCard returnPath={returnPath} />}</>;
  }

  if (data.healthy === false) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 bg-destructive/10 text-destructive text-sm px-4 py-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          WhatsApp connection problem: {data.error || 'access token rejected by Meta'}. Reconnect your number in WhatsApp Settings.
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
