import { useEffect, useState } from 'react';

/** Re-renders every `ms` so countdowns stay live. */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function windowLeft(lastInboundAt: string | null, now: number) {
  if (!lastInboundAt) return { open: false, label: 'Window closed', msLeft: 0 };
  const msLeft = new Date(lastInboundAt).getTime() + 24 * 60 * 60 * 1000 - now;
  if (msLeft <= 0) return { open: false, label: 'Window closed', msLeft: 0 };
  const h = Math.floor(msLeft / 3_600_000);
  const m = Math.floor((msLeft % 3_600_000) / 60_000);
  return { open: true, label: h > 0 ? `${h}h ${m}m left` : `${m}m left`, msLeft };
}
