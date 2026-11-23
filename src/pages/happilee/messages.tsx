import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { happileeApi } from '@/services/happileeService';
import { ConnectionGate, HappileePage, statusBadge } from '@/components/happilee/shared';
import { apiErrorMessage } from '@/lib/apiError';

export default function HappileeMessages() {
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['happilee', 'messages', page], queryFn: () => happileeApi.messages(page) });
  const refresh = useMutation({ mutationFn: happileeApi.refreshStatus, onSuccess: () => qc.invalidateQueries({ queryKey: ['happilee', 'messages'] }), onError: e => toast.error(apiErrorMessage(e, 'Could not check status')) });
  return (
    <HappileePage title="Message Log" subtitle="Everything sent from this module. Use refresh to pull the latest delivery status from Happilee.">
      <ConnectionGate>
        <div className="overflow-x-auto rounded-[var(--card-radius,14px)] border bg-card shadow-[var(--card-shadow,none)]">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground"><tr><th className="p-3">When</th><th className="p-3">To</th><th className="p-3">Template</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
            <tbody>
              {isLoading && <tr><td className="p-4 text-muted-foreground" colSpan={5}>Loading…</td></tr>}
              {!isLoading && !data?.data.length && <tr><td className="p-4 text-muted-foreground" colSpan={5}>Nothing sent yet.</td></tr>}
              {data?.data.map(m => (
                <tr key={m.id} className="border-t">
                  <td className="p-3 whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</td>
                  <td className="p-3">{m.kind === 'broadcast' ? `${m.recipientCount} recipients (broadcast)` : m.phone}</td>
                  <td className="p-3">{m.templateName || '—'}</td>
                  <td className="p-3">{statusBadge(m.status)}{m.error && <p className="mt-1 max-w-xs text-xs text-destructive">{m.error}</p>}</td>
                  <td className="p-3 text-right">{m.messageUid && <Button size="sm" variant="ghost" disabled={refresh.isPending} onClick={() => refresh.mutate(m.id)}><RefreshCw className="h-4 w-4" /></Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!!data && data.pages > 1 && (
          <div className="flex items-center justify-end gap-2 text-sm">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span>{page} / {data.pages}</span>
            <Button size="sm" variant="outline" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        )}
      </ConnectionGate>
    </HappileePage>
  );
}
