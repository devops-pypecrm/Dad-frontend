import { useEffect, useState } from 'react';

export const IG_GRADIENT = 'linear-gradient(45deg, #feda75 0%, #fa7e1e 25%, #d62976 50%, #962fbf 75%, #4f5bd5 100%)';

export const HAPPILEE_IG_KEYFRAMES = `
@keyframes hl-fade-up { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: none } }
@keyframes hl-pop { 0% { opacity: 0; transform: scale(.85) translateY(8px) } 100% { opacity: 1; transform: none } }
@keyframes hl-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
@keyframes hl-dot { 0%,80%,100% { opacity: .25; transform: scale(.8) } 40% { opacity: 1; transform: scale(1) } }
@keyframes hl-marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
@keyframes hl-pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(214,41,118,.5) } 100% { box-shadow: 0 0 0 14px rgba(214,41,118,0) } }
@keyframes hl-shimmer { from { background-position: 0% 50% } to { background-position: 200% 50% } }
.hl-pop { animation: hl-pop .45s cubic-bezier(.2,.8,.2,1) both }
.hl-float { animation: hl-float 5s ease-in-out infinite }
.hl-dot { animation: hl-dot 1.2s infinite }
.hl-reveal { opacity: 0; transform: translateY(18px); transition: opacity .6s ease, transform .6s ease }
.hl-reveal.hl-in { opacity: 1; transform: none }
@media (prefers-reduced-motion: reduce) { .hl-pop, .hl-float, .hl-dot { animation: none } .hl-reveal { opacity: 1; transform: none; transition: none } }
`;

/** Looping comment -> auto-DM demo, drawn as a phone. `compact` is the small version for the Overview card. */
export function IgAutomationPhone({ keyword = 'LINK', compact = false }: { keyword?: string; compact?: boolean }) {
  const [step, setStep] = useState(0);
  const [count, setCount] = useState(2847);
  useEffect(() => {
    const t = setInterval(() => setStep(s => { const n = (s + 1) % 6; if (n === 3) setCount(c => c + 1); return n; }), 1400);
    return () => clearInterval(t);
  }, []);
  return (
    <div className={`hl-float relative mx-auto ${compact ? 'w-[200px]' : 'w-[270px]'} rounded-[28px] border-[6px] border-neutral-900 bg-white p-2.5 text-neutral-900 shadow-2xl`}>
      <div className="mb-2 flex items-center gap-2">
        <span className="h-7 w-7 rounded-full p-[2px]" style={{ background: IG_GRADIENT }}><span className="block h-full w-full rounded-full border-2 border-white bg-neutral-200" /></span>
        <div className="leading-tight"><p className="text-[11px] font-semibold">fit.with.anu</p><p className="text-[9px] text-neutral-500">Reel · 8-week plan</p></div>
      </div>
      <div className="space-y-1.5 rounded-xl bg-neutral-50 p-2 text-[11px]">
        <p className="text-neutral-500">Comments</p>
        <p><b>riya_k</b> Love this!</p>
        {step >= 1 && <p className="hl-pop rounded-md bg-pink-50 px-1.5 py-1"><b>meera.s</b> <span className="font-semibold text-pink-600">{keyword}</span></p>}
      </div>
      <div className="mt-2 min-h-[110px] space-y-1.5 rounded-xl bg-neutral-50 p-2 text-[11px]">
        <p className="text-neutral-500">Direct message</p>
        {step === 2 && <div className="hl-pop inline-flex gap-1 rounded-2xl bg-neutral-200 px-3 py-2">{[0, 1, 2].map(i => <span key={i} className="hl-dot h-1.5 w-1.5 rounded-full bg-neutral-500" style={{ animationDelay: `${i * 0.18}s` }} />)}</div>}
        {step >= 3 && <div className="hl-pop max-w-[88%] rounded-2xl rounded-bl-sm px-3 py-2 text-white" style={{ background: 'linear-gradient(180deg,#7a4dff,#3797f0)' }}>Hey Meera! Here's the plan you asked for 💪</div>}
        {step >= 4 && <div className="hl-pop inline-block rounded-full border border-blue-400 px-3 py-1 font-semibold text-blue-600">Get the link →</div>}
      </div>
      {!compact && <div className="mt-2 flex items-center justify-between rounded-lg bg-neutral-900 px-3 py-1.5 text-[10px] text-white"><span>DMs sent</span><b className="tabular-nums">{count.toLocaleString()}</b></div>}
    </div>
  );
}
