import { Link, Outlet } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeatureEnabled } from '@/hooks/useWhatsAppEnabled';

/** Wraps every /happilee/* route: organisations without the feature see an explanation instead. */
export function HappileeFeatureRoute() {
  const enabled = useFeatureEnabled('happilee');
  if (enabled) return <Outlet />;
  return (
    <div className="mx-auto mt-10 max-w-lg rounded-xl border bg-card p-10 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-muted"><Lock className="h-7 w-7" /></div>
      <h1 className="text-xl font-medium">Happilee is not enabled</h1>
      <p className="mt-2 text-sm text-muted-foreground">The Happilee module is switched on per organisation. Ask Pype CRM support to enable it for your account.</p>
      <Button asChild variant="outline" className="mt-6"><Link to="/dashboard">Back to dashboard</Link></Button>
    </div>
  );
}
