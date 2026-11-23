import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { happileeApi } from '@/services/happileeService';
import { ConnectionGate, HappileePage, statusBadge } from '@/components/happilee/shared';
import { apiErrorMessage } from '@/lib/apiError';

export default function HappileeTemplates() {
  const [q, setQ] = useState('');
  const { data, isLoading, error } = useQuery({ queryKey: ['happilee', 'templates', q], queryFn: () => happileeApi.templates(q), retry: false });
  return (
    <HappileePage title="Templates" subtitle="Templates come from your Happilee account. Create or edit them in Happilee.">
      <ConnectionGate>
        <div className="relative max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search templates…" value={q} onChange={e => setQ(e.target.value)} /></div>
        {error && <p className="text-sm text-destructive">{apiErrorMessage(error, 'Could not load templates')}</p>}
        {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : !data?.length ? <p className="text-sm text-muted-foreground">No templates found.</p> : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.map(t => (
              <div key={t.template_id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between gap-2"><p className="break-all font-medium">{t.template_name}</p>{statusBadge(t.status)}</div>
                <p className="text-xs text-muted-foreground">{[t.category, t.language, t.template_type].filter(Boolean).join(' · ')}</p>
                <div className="flex-1 whitespace-pre-wrap rounded-lg bg-green-50 p-3 text-sm text-green-950">{[t.header, t.body, t.footer].filter(Boolean).join('\n') || '—'}</div>
                {!!t.body_params?.length && <p className="text-xs text-muted-foreground">Variables: {t.body_params.join(', ')}</p>}
              </div>
            ))}
          </div>
        )}
      </ConnectionGate>
    </HappileePage>
  );
}
