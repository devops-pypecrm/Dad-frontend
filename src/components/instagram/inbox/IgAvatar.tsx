import { cn } from '@/lib/utils';
import { IG } from './ig';

interface Props { src?: string | null; name: string; className?: string; /** Instagram's coloured story ring (used for unread conversations and profiles) */ ring?: boolean }

/** Round avatar: the person's photo, or Instagram's grey silhouette; optional gradient story ring. */
export function IgAvatar({ src, name, className, ring }: Props) {
  const inner = src ? (
    <img src={src} alt="" referrerPolicy="no-referrer" className="h-full w-full rounded-full object-cover" />
  ) : (
    <div className="flex h-full w-full items-center justify-center rounded-full" style={{ background: '#efefef' }} aria-label={name}>
      <svg viewBox="0 0 24 24" className="h-[60%] w-[60%]" fill="#c7c7c7" aria-hidden><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5z" /></svg>
    </div>
  );
  if (!ring) return <div className={cn('shrink-0 rounded-full', className)}>{inner}</div>;
  return (
    <div className={cn('shrink-0 rounded-full p-[2px]', className)} style={{ background: IG.story }}>
      <div className="h-full w-full rounded-full bg-white p-[2px]">{inner}</div>
    </div>
  );
}
