import type { ReactNode } from 'react';
import { ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DiagramStep { icon: ReactNode; title: string; detail?: string; tone?: 'green' | 'blue' | 'amber' | 'red' | 'muted' }

const TONE = {
  green: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  red: 'bg-destructive/10 text-destructive border-destructive/20',
  muted: 'bg-muted text-muted-foreground border-border',
};

/** Vertical "how it works" flow, in the spirit of the reference workflow images. */
export function WorkflowDiagram({ steps }: { steps: DiagramStep[] }) {
  return (
    <div className="flex flex-col items-stretch">
      {steps.map((s, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className={cn('w-full flex items-center gap-3 rounded-[10px] border px-3 py-2.5', TONE[s.tone || 'green'])}>
            <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{s.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium font-poppins text-foreground">{s.title}</p>
              {s.detail && <p className="text-[11px] text-muted-foreground leading-snug">{s.detail}</p>}
            </div>
          </div>
          {i < steps.length - 1 && <ArrowDown className="h-4 w-4 my-1 text-muted-foreground/60" />}
        </div>
      ))}
    </div>
  );
}
