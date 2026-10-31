import { cn } from '@/lib/utils';

/** Round contact avatar: WhatsApp's grey silhouette on a light circle, or the person's initial in colour. */
export function WaAvatar({ name, className }: { name: string; className?: string }) {
  const initial = name.replace(/[^\p{L}\p{N}]/gu, '').charAt(0).toUpperCase();
  const hue = Array.from(name).reduce((n, c) => n + c.charCodeAt(0), 0) % 360;
  return (
    <div className={cn('flex shrink-0 items-center justify-center rounded-full text-white', className)} style={{ background: initial ? `hsl(${hue} 45% 52%)` : '#dfe5e7' }} aria-hidden>
      {initial ? <span className="font-light" style={{ fontSize: '45%' }}>{initial}</span> : (
        <svg viewBox="0 0 212 212" className="h-[80%] w-[80%]"><path fill="#fff" d="M106 106c15 0 28-13 28-29S121 48 106 48 78 61 78 77s13 29 28 29zm0 12c-25 0-62 13-62 36v10h124v-10c0-23-37-36-62-36z" /></svg>
      )}
    </div>
  );
}
