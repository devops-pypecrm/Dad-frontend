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
    <div className="flex-1 flex items-center justify-center p-6 overflow-auto bg-[var(--page-bg,transparent)]">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col items-center text-center">
          <div className="h-[150px] w-[150px] rounded-full bg-[#DCF8C6] flex items-center justify-center mb-6">
            <div className="h-[96px] w-[96px] rounded-full bg-[#25D366] flex items-center justify-center text-white"><WhatsAppLogo className="h-12 w-12" /></div>
          </div>
          <h2 className="text-[30px] font-light leading-9 text-foreground">{title}</h2>
          <p className="mt-3 text-[14px] leading-5 text-muted-foreground max-w-sm">{description}</p>
          <Button
            size="lg"
            className={`mt-8 gap-2 h-11 px-8 ${WA_PRIMARY_BTN}`}
            onClick={handleConnect}
            disabled={connecting}
          >
            <WhatsAppLogo className="h-5 w-5" />
            {connecting ? 'Connecting…' : 'Connect WhatsApp'}
          </Button>
        </div>

        <div className={`${WA_CARD} p-6`}>
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="h-9 w-9 rounded-full bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))] flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <h3 className="text-[17px] font-normal text-foreground">Before you begin</h3>
          </div>
          <ul className="divide-y divide-border">
            {requirements.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex gap-3 py-4">
                <div className="h-9 w-9 shrink-0 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[14.5px] text-foreground">{title}</p>
                  <p className="text-[13px] text-muted-foreground">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2 rounded-lg bg-[#DCF8C6] text-[#075E54] text-[13px] px-3 py-2.5">
            <Zap className="h-4 w-4 shrink-0" />
            Setup takes less than 5 minutes and is completely secure
          </div>
        </div>
      </div>
    </div>
  );
}
