import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { igToolsApi, type IgToolsStatus } from '@/services/instagramToolsService';
import { IG } from '../inbox/ig';

/** Shown on a Growth Tools page when the connected account has not been granted the permission it needs. */
export function PermissionNotice({ need }: { need: keyof IgToolsStatus['permissions'] }) {
  const { data } = useQuery({ queryKey: ['ig-tools', 'status'], queryFn: igToolsApi.status, staleTime: 60_000 });
  if (!data?.connected || data.permissions[need]) return null;
  const extended = need === 'insights' || need === 'publishing';
  return (
    <div className="flex gap-3 rounded-xl p-4 text-[14px]" style={{ background: '#e0f1ff', color: IG.text }}>
      <Info className="mt-0.5 h-5 w-5 shrink-0" style={{ color: IG.blue }} />
      <p>
        {extended && !data.extendedScopesEnabled
          ? 'This feature needs extra Instagram permissions that are not switched on for this platform yet. Ask your Pype CRM administrator to enable them (see the Meta setup guide), then reconnect your Instagram account.'
          : 'Your Instagram account was connected before this permission existed. Disconnect and connect Instagram again to grant it.'}
      </p>
    </div>
  );
}
