import { useState } from 'react';
import { AtSign, Instagram, KeyRound, MessageSquareText, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { startInstagramConnect } from '@/services/instagramService';
import { apiErrorMessage } from '@/lib/apiError';
import { WA_CARD } from '@/components/WhatsApp/hub/whatsappStyles';

const requirements = [
  { icon: AtSign, title: 'Instagram Business or Creator account', desc: 'Personal accounts are not supported. Convert yours in Instagram settings first.' },
  { icon: MessageSquareText, title: 'Messaging permission', desc: 'Lets the CRM read and reply to your Instagram DMs.' },
  { icon: KeyRound, title: 'Comments permission', desc: 'Lets Ask-to-Follow bots reply to comments and DM the commenter.' },
  { icon: ShieldCheck, title: 'Organisation admin', desc: 'Only an admin of your organisation can connect the account.' },
];

/** Connect screen: "Connect Instagram Business Account" + Requirements. */
export function ConnectInstagramCard({ returnPath, canConnect = true, message }: { returnPath: string; canConnect?: boolean; message?: string }) {
  const [busy, setBusy] = useState(false);
  const connect = async () => {
    setBusy(true);
    try { await startInstagramConnect(returnPath); } catch (e) { toast.error(apiErrorMessage(e, 'Could not start the Instagram connection')); setBusy(false); }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
      <div className="w-full max-w-4xl grid md:grid-cols-[1fr_auto_1fr] gap-10 items-center">
        <div className="flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-[22px] bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] flex items-center justify-center text-white shadow-lg"><Instagram className="h-10 w-10" /></div>
          <h2 className="mt-6 text-2xl font-medium font-poppins tracking-tight text-black">Connect Instagram</h2>
          <h2 className="text-2xl font-semibold font-poppins tracking-tight bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] bg-clip-text text-transparent">Business Account</h2>
          <p className="mt-3 max-w-xs text-sm font-poppins text-muted-foreground">{message || 'Manage your Instagram DMs directly inside the CRM, with no switching tabs.'}</p>
          <button
            onClick={connect}
            disabled={busy || !canConnect}
            className="mt-7 inline-flex items-center gap-2 rounded-[10px] bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] px-6 py-3 text-sm font-medium font-poppins text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Instagram className="h-4 w-4" />{busy ? 'Opening Instagram…' : 'Connect Instagram Business'}
          </button>
          {!canConnect && <p className="mt-2 text-xs text-muted-foreground">Ask an organisation admin to connect the account.</p>}
        </div>

        <div className="hidden md:block h-64 w-px bg-border" />

        <div className={`${WA_CARD} p-6`}>
          <h3 className="text-lg font-medium font-poppins text-black pb-3 border-b border-border">Requirements</h3>
          <ul className="divide-y divide-border">
            {requirements.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex gap-3 py-3.5">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))] flex items-center justify-center"><Icon className="h-4 w-4" /></div>
                <div><p className="text-sm font-semibold text-foreground">{title}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
