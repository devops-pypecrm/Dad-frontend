import { useState } from 'react';
import { CheckCircle2, Phone, ShieldCheck, Zap, Facebook } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { WhatsAppLogo } from '@/components/icons/BrandLogos';
import { WA_CARD, WA_PRIMARY_BTN } from './whatsappStyles';
import { startWhatsAppConnect } from '@/services/whatsAppConnectService';
import { apiErrorMessage } from '@/lib/apiError';

const requirements = [
  { icon: Facebook, title: 'Active Facebook Account', desc: 'Required to authenticate and manage your business profile' },
  { icon: Phone, title: 'Valid Phone Number', desc: 'A phone number not currently registered on WhatsApp' },
  { icon: ShieldCheck, title: 'Business Verification', desc: 'Complete business information and verification process' },
];

interface Props {
  title?: string;
  description?: string;
  returnPath: string;
}

export function ConnectWhatsAppCard({
  title = 'Connect WhatsApp Business',
  description = 'Seamlessly integrate your WhatsApp Business Account to start engaging with customers instantly.',
  returnPath,
}: Props) {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await startWhatsAppConnect(returnPath);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to start WhatsApp connection'));
      setConnecting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col items-center text-center">
          <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center ring-8 ring-emerald-500/5 mb-6">
            <WhatsAppLogo className="h-12 w-12 text-emerald-500" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-medium font-poppins tracking-tight text-foreground">{title}</h2>
          <p className="mt-3 text-muted-foreground max-w-sm">{description}</p>
          <Button
            size="lg"
            className={`mt-8 gap-2 ${WA_PRIMARY_BTN}`}
            onClick={handleConnect}
            disabled={connecting}
          >
            <WhatsAppLogo className="h-5 w-5" />
            {connecting ? 'Connecting…' : 'Connect WhatsApp'}
          </Button>
        </div>

        <div className={`${WA_CARD} p-6`}>
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-medium font-poppins text-black">Before You Begin</h3>
          </div>
          <ul className="divide-y divide-border">
            {requirements.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex gap-3 py-4">
                <div className="h-9 w-9 shrink-0 rounded-lg bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))] flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2 rounded-lg bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))] text-xs px-3 py-2.5">
            <Zap className="h-4 w-4 shrink-0" />
            Setup takes less than 5 minutes and is completely secure
          </div>
        </div>
      </div>
    </div>
  );
}
