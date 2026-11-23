import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, BarChart3, CopyCheck, FlaskConical, Gauge, MessageCircle, ShieldCheck, Users, Zap, Plus, Minus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { H_CARD } from '@/components/happilee/shared';
import { HAPPILEE_IG_KEYFRAMES, IG_GRADIENT, IgAutomationPhone } from '@/components/happilee/IgAutomationPreview';
import { useFeatureEnabled } from '@/hooks/useWhatsAppEnabled';

const SIGNUP = 'https://ig.happilee.io/signup';

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('hl-in'); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return ref;
}
function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useReveal<HTMLDivElement>();
  return <div ref={ref} className={`hl-reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io.disconnect();
      const t0 = performance.now(); const tick = (t: number) => { const p = Math.min((t - t0) / 1200, 1); setN(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    io.observe(el); return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}
const H2 = ({ eyebrow, children }: { eyebrow?: string; children: ReactNode }) => (
  <div className="mb-8 text-center">
    {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>}
    <h2 className="mx-auto max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">{children}</h2>
  </div>
);

/** Interactive keyword automation: change the settings, type a comment, see the DM that would go out. */
function Simulator() {
  const [mode, setMode] = useState<'keywords' | 'any'>('keywords');
  const [keywords, setKeywords] = useState('LINK, PRICE');
  const [dm, setDm] = useState("Hey {name}! Here's the link you asked for 🎉");
  const [btn, setBtn] = useState('Get the link');
  const [comment, setComment] = useState('Please send LINK 🙏');
  const kws = useMemo(() => keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean), [keywords]);
  const hit = mode === 'any' ? comment.trim().length > 0 : kws.find(k => comment.toLowerCase().includes(k));
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className={`${H_CARD} space-y-4 p-5`}>
        <p className="font-semibold">Configure your automation</p>
        <div className="flex gap-2">
          {(['keywords', 'any'] as const).map(m => <button key={m} onClick={() => setMode(m)} className={`rounded-full border px-3 py-1 text-xs font-medium transition ${mode === m ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>{m === 'keywords' ? 'Specific keywords' : 'Any comment'}</button>)}
        </div>
        {mode === 'keywords' && <div className="space-y-1.5"><Label>Keywords (comma separated, not case sensitive)</Label><Input value={keywords} onChange={e => setKeywords(e.target.value)} /></div>}
        <div className="space-y-1.5"><Label>Opening message</Label><Input value={dm} onChange={e => setDm(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Button text</Label><Input value={btn} onChange={e => setBtn(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Try a comment</Label><Input value={comment} onChange={e => setComment(e.target.value)} placeholder="Type what a follower might comment" /></div>
      </div>
      <div className={`${H_CARD} flex flex-col justify-center gap-3 p-5`}>
        <p className="font-semibold">What your follower sees</p>
        <div className="rounded-xl bg-muted p-3 text-sm"><b>follower</b> {comment || '…'}</div>
        {hit ? (
          <div key={comment + dm + btn} className="hl-pop space-y-2">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm text-white" style={{ background: 'linear-gradient(180deg,#7a4dff,#3797f0)' }}>{dm.replace('{name}', 'Meera')}</div>
            {btn && <span className="inline-block rounded-full border border-blue-400 px-4 py-1.5 text-sm font-semibold text-blue-600">{btn} →</span>}
            <p className="text-xs text-emerald-600">✓ Trigger matched{mode === 'keywords' ? ` on “${hit}”` : ''}. The DM is sent once per person.</p>
          </div>
        ) : <p className="text-sm text-muted-foreground">No keyword matched, so no DM would be sent.</p>}
        <p className="text-[11px] text-muted-foreground">This is a preview to help you plan. It does not send anything.</p>
      </div>
    </div>
  );
}

const USE_CASES = [
  { tab: 'Creators', kw: 'LINK', points: ['Send the link everyone asks for in the comments', 'Capture followers into your list automatically', 'Reply while you are offline'], dm: 'Here is the link to the full video 🎥' },
  { tab: 'Coaches', kw: 'MODULE', points: ['Deliver a free lesson or worksheet on comment', 'Follow up later with those who did not reply', 'Answer story mentions with a thank-you offer'], dm: 'Your free module is here — enjoy! 📘' },
  { tab: 'Fitness', kw: 'PLAN', points: ['Share a plan or class timetable instantly', 'Book trial sessions from the DM', 'Tag interested members for follow-up'], dm: 'Your 8-week plan is ready 💪' },
  { tab: 'E-commerce', kw: 'SHOP', points: ['Drop the product link and price on request', 'Send discount codes on story replies', 'Track which keywords bring clicks'], dm: 'Here is the product link + 10% code 🛍️' },
  { tab: 'Real estate', kw: 'TOUR', points: ['Send brochures and tour slots', 'Qualify with one quick question', 'Hand the hot ones to your team'], dm: 'Here are the details and tour times 🏡' },
];

const FEATURES = [
  [Zap, 'Instant comment-to-DM', 'The moment someone comments a keyword, they get your message. Works day and night.'],
  [MessageCircle, 'Different keywords, different messages', 'LINK, PRICE and FREE can each send something different, on one post or all posts.'],
  [Users, 'Story replies and mentions', 'Reply to story replies and mentions automatically, without needing a keyword.'],
  [CopyCheck, 'Once per contact', 'Nobody gets the same automation twice, and overlapping keywords never double-DM.'],
  [FlaskConical, 'Test before going live', 'Simulator, live test and comment preview so you know exactly what people will receive.'],
  [BarChart3, 'Comment-to-click analytics', 'See comments, DMs sent, link clicks and replies for each keyword and post.'],
] as const;

const FAQ = [
  ['Is it safe for my Instagram account?', 'It uses Instagram’s official API. You log in through Instagram and your password is never shared. Replies are rate-limited to stay inside Meta’s limits.'],
  ['What account type do I need?', 'A Business or Creator account. Personal accounts cannot be connected.'],
  ['What if a post goes viral?', 'Meta limits how many comment replies an account can send per hour. Extra comments are queued and answered in order.'],
  ['Will the DM always reach the follower?', 'Usually straight to their inbox. Depending on the follower’s settings, Instagram may place it in Message Requests.'],
  ['Does it work with any language?', 'Keywords in Latin script work. Some scripts (for example Hindi, Arabic and Malayalam) are not supported yet.'],
];

export default function HappileeInstagram() {
  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState<number | null>(0);
  const crmIg = useFeatureEnabled('instagram');
  const uc = USE_CASES[tab];
  return (
    <div className="min-h-full bg-background pb-12">
      <style>{HAPPILEE_IG_KEYFRAMES}</style>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-12 text-white sm:px-8 sm:py-16" style={{ background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 45%,#d62976 100%)' }}>
        <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-5" style={{ animation: 'hl-fade-up .7s both' }}>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur"><BadgeCheck className="h-3.5 w-3.5" />Uses Instagram’s official API</span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">Instagram DM &amp; Comment Automation</h1>
            <p className="max-w-xl text-base text-white/85 sm:text-lg">Every “LINK” comment answered in seconds. Every lead captured. Zero manual work.</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-violet-700 hover:bg-white/90"><a href={SIGNUP} target="_blank" rel="noreferrer">Start free <ArrowRight className="ml-1.5 h-4 w-4" /></a></Button>
              <Button asChild size="lg" variant="outline" className="border-white/50 bg-transparent text-white hover:bg-white/10 hover:text-white"><a href="#try">Try the simulator</a></Button>
            </div>
            <p className="text-xs text-white/70">Free to start · No credit card · Set up in minutes</p>
          </div>
          <IgAutomationPhone />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 pt-10 sm:px-6">
        {/* Stats */}
        <Reveal className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
          {[['Setup time (min)', 3, ''], ['Reply speed (sec)', 5, ''], ['Available', 24, '/7'], ['Keywords per automation', 10, '+']].map(([l, n, s]) => (
            <div key={String(l)} className={`${H_CARD} p-5`}><p className="text-3xl font-bold text-primary"><CountUp to={n as number} suffix={s as string} /></p><p className="mt-1 text-xs text-muted-foreground">{l}</p></div>
          ))}
        </Reveal>

        {/* Problem */}
        <Reveal><H2 eyebrow="Sound familiar?">Your comments are full of buyers. Most never hear back.</H2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[['Buyers don’t wait', 'A comment unanswered for an hour is usually a sale lost.'], ['Your phone owns your evenings', 'Replying one by one doesn’t scale past a few dozen comments.'], ['Leads go cold after the DM', 'Without a follow-up, interest fades by the next day.']].map(([t, d], i) => (
              <div key={t} className={`${H_CARD} p-5`} style={{ transitionDelay: `${i * 80}ms` }}><p className="font-semibold">{t}</p><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>
            ))}
          </div>
        </Reveal>

        {/* How it works */}
        <Reveal><H2 eyebrow="How it works">From comment to customer in three steps</H2>
          <div className="relative grid gap-4 sm:grid-cols-3">
            {[['1', 'Pick a keyword', 'Choose the word people comment, like LINK, PRICE or FREE, or reply to any comment.'], ['2', 'Write your message', 'Add your opening DM, a button, and an optional follow-up for people who don’t respond.'], ['3', 'Go live', 'Turn it on. It answers 24/7 and counts every DM and click for you.']].map(([n, t, d]) => (
              <div key={n} className={`${H_CARD} relative p-5`}>
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: IG_GRADIENT, animation: 'hl-pulse-ring 2s infinite' }}>{n}</span>
                <p className="font-semibold">{t}</p><p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Simulator */}
        <Reveal><div id="try" className="scroll-mt-24"><H2 eyebrow="Try it">Build an automation and see the DM</H2><Simulator /></div></Reveal>

        {/* Use cases */}
        <Reveal><H2 eyebrow="Use cases">Built for creators. Works for businesses.</H2>
          <div className={`${H_CARD} p-5`}>
            <div className="mb-5 flex flex-wrap gap-2">{USE_CASES.map((u, i) => <button key={u.tab} onClick={() => setTab(i)} className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${tab === i ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>{u.tab}</button>)}</div>
            <div key={tab} className="hl-pop grid items-center gap-6 sm:grid-cols-2">
              <ul className="space-y-2.5 text-sm">{uc.points.map(p => <li key={p} className="flex gap-2"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{p}</li>)}</ul>
              <div className="space-y-2 rounded-xl bg-muted p-4 text-sm">
                <p><b>follower</b> <span className="font-semibold text-pink-600">{uc.kw}</span></p>
                <div className="max-w-[90%] rounded-2xl rounded-bl-sm px-3.5 py-2 text-white" style={{ background: 'linear-gradient(180deg,#7a4dff,#3797f0)' }}>{uc.dm}</div>
              </div>
            </div>
          </div>
          <div className="mt-5 overflow-hidden"><div className="flex w-max gap-3" style={{ animation: 'hl-marquee 28s linear infinite' }}>{[...Array(2)].flatMap((_, k) => ['LINK', 'PRICE', 'FREE', 'GUIDE', 'PLAN', 'SHOP', 'TOUR', 'DEMO', 'OFFER', 'MODULE'].map(w => <span key={w + k} className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground">{w}</span>))}</div></div>
        </Reveal>

        {/* Features */}
        <Reveal><H2 eyebrow="Features">More than auto-replies</H2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([Icon, t, d], i) => (
              <div key={t} className={`${H_CARD} p-5 transition hover:-translate-y-1 hover:border-primary`} style={{ transitionDelay: `${i * 40}ms` }}>
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-primary"><Icon className="h-5 w-5" /></span>
                <p className="font-semibold">{t}</p><p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Safety */}
        <Reveal><H2 eyebrow="Security">Your account stays safe</H2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[[ShieldCheck, 'Official Instagram API', 'You log in through Instagram. Your password is never shared.'], [Gauge, 'Rate-limited by design', 'Replies are paced to stay inside Meta’s hourly limits.'], [BadgeCheck, 'Business & Creator accounts', 'Connect the account you already use to run your page.']].map(([Icon, t, d]: any) => (
              <div key={t} className={`${H_CARD} p-5`}><Icon className="mb-2 h-6 w-6 text-primary" /><p className="font-semibold">{t}</p><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>
            ))}
          </div>
        </Reveal>

        {/* FAQ */}
        <Reveal><H2 eyebrow="FAQ">Questions, answered</H2>
          <div className="mx-auto max-w-3xl space-y-2">
            {FAQ.map(([q, a], i) => (
              <div key={q} className={`${H_CARD}`}>
                <button className="flex w-full items-center justify-between gap-3 p-4 text-left font-medium" onClick={() => setOpen(open === i ? null : i)}>{q}{open === i ? <Minus className="h-4 w-4 shrink-0" /> : <Plus className="h-4 w-4 shrink-0" />}</button>
                <div className="grid transition-all duration-300" style={{ gridTemplateRows: open === i ? '1fr' : '0fr' }}><div className="overflow-hidden"><p className="px-4 pb-4 text-sm text-muted-foreground">{a}</p></div></div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* CTA */}
        <Reveal>
          <div className="relative overflow-hidden rounded-[var(--card-radius,14px)] p-8 text-center text-white sm:p-12" style={{ background: IG_GRADIENT, backgroundSize: '200% 200%', animation: 'hl-shimmer 8s linear infinite alternate' }}>
            <h2 className="text-2xl font-bold sm:text-3xl">Your next customer is commenting right now.</h2>
            <p className="mx-auto mt-2 max-w-lg text-white/90">Set up your first keyword automation in a few minutes.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-pink-600 hover:bg-white/90"><a href={SIGNUP} target="_blank" rel="noreferrer">Start free <ArrowRight className="ml-1.5 h-4 w-4" /></a></Button>
              {crmIg && <Button asChild size="lg" variant="outline" className="border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link to="/instagram/chatbots">Open CRM Instagram chatbots</Link></Button>}
            </div>
          </div>
        </Reveal>

        <p className="flex items-start gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Instagram automation is a separate Happilee product that you set up on Happilee’s own Instagram app. This page explains it and lets you preview an automation; it does not connect to your Instagram account from here.</p>
      </div>
    </div>
  );
}
