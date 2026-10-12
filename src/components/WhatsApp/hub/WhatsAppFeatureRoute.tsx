import { Link, Outlet } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWhatsAppEnabled } from '@/hooks/useWhatsAppEnabled';
import { WA_CARD } from './whatsappStyles';

/** Wraps every /whatsapp/* route: organisations without the feature see an explanation instead. */
export function WhatsAppFeatureRoute() {
  const enabled = useWhatsAppEnabled();
  if (enabled) return <Outlet />;

  return (
    <div className="bg-white p-6 animate-in fade-in duration-500">
      <div className={`${WA_CARD} mx-auto mt-10 max-w-lg p-10 text-center`}>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--chart-5))]/10">
          <Lock className="h-7 w-7 text-[hsl(var(--chart-5))]" />
        </div>
        <h1 className="text-xl font-medium font-poppins tracking-tight text-black">WhatsApp is not enabled</h1>
        <p className="mt-2 text-sm font-poppins text-muted-foreground">
          The WhatsApp integration is switched on per organisation. Ask Pype CRM support to enable it for your account and it will appear here.
        </p>
        <Button asChild variant="outline" className="mt-6 rounded-[10px]"><Link to="/dashboard">Back to dashboard</Link></Button>
      </div>
    </div>
  );
}
