import { Badge } from '@/components/ui/badge';
import { useWhatsAppConnection } from '@/hooks/useWhatsAppConnection';
import { cn } from '@/lib/utils';

/** Small header chip showing the connected number and its health. */
export function ConnectionBadge() {
  const { data, isLoading } = useWhatsAppConnection();
  if (isLoading) return null;

  if (!data?.connected) {
    return <Badge variant="outline" className="text-muted-foreground">Not connected</Badge>;
  }
  const healthy = data.healthy !== false;
  return (
    <Badge variant="outline" className="gap-2 font-medium">
      <span className={cn('h-2 w-2 rounded-full', healthy ? 'bg-emerald-500' : 'bg-destructive')} />
      {data.phoneNumber || 'Connected'}
      {data.verifiedName && <span className="text-muted-foreground font-normal">· {data.verifiedName}</span>}
    </Badge>
  );
}
