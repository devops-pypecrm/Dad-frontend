import { cn } from '@/lib/utils';

export function IgAvatar({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  if (src) return <img src={src} alt="" referrerPolicy="no-referrer" className={cn('rounded-full object-cover bg-muted', className)} />;
  return (
    <div className={cn('rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white flex items-center justify-center font-medium font-poppins', className)}>
      {name.replace('@', '').charAt(0).toUpperCase()}
    </div>
  );
}
