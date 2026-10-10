import type { ReactNode } from 'react';

/** Centered empty/loading message for table bodies. */
export function EmptyState({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-sm font-poppins text-muted-foreground text-center">
      {icon && <span className="text-[hsl(var(--chart-5))]/60 [&>svg]:h-8 [&>svg]:w-8">{icon}</span>}
      {children}
    </div>
  );
}
