import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgePercent,
  BarChart3,
  Building2,
  Check,
  CircleDollarSign,
  Globe2,
  Handshake,
  Megaphone,
  MousePointerClick,
  PenTool,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/shared/SEO";
import { Button } from "@/components/ui/button";
import { PageTransition, Reveal } from "@/components/shared/MotionReveal";

const audiences = [
  { icon: Building2, title: "Agencies & consultants", text: "Recommend a CRM you trust while helping clients build a stronger, more measurable sales process." },
  { icon: PenTool, title: "Creators & educators", text: "Turn practical CRM tutorials, comparisons, newsletters, and training content into recurring revenue." },
  { icon: Megaphone, title: "Growth marketers", text: "Connect growing teams with a platform that unifies lead capture, follow-up, automation, and reporting." },
  { icon: Users, title: "Communities & networks", text: "Bring meaningful CRM benefits to founders, sales teams, field teams, and business communities you serve." },
];

const steps = [
  { icon: MousePointerClick, number: "01", title: "Apply", text: "Tell us about your audience, services, and how you plan to introduce Pype CRM." },
  { icon: Rocket, number: "02", title: "Get enabled", text: "Receive your referral link, messaging guidance, product resources, and support from our team." },
  { icon: Handshake, number: "03", title: "Recommend Pype", text: "Share Pype through content, consulting, demos, communities, or one-to-one recommendations." },
  { icon: CircleDollarSign, number: "04", title: "Earn recurring rewards", text: "Track qualified referrals and earn commission when the customers you refer become paying accounts." },
];

const benefits = [
  "30% recurring commission for the lifetime of eligible subscriptions",
  "A clear referral dashboard and attribution visibility",
  "Ready-to-use campaign, product, and brand assets",
  "Partner support for qualified opportunities",
  "Early insight into product updates and launches",
  "No joining fee or inventory commitment",
];

export default function Partners() {
  return (
    <div className="min-h-screen bg-white font-jakarta dark:bg-gray-950">
      <SEO
        title="Partner Program"
        description="Join the Pype CRM Partner Program, help growing businesses sell smarter, and earn recurring commission on eligible referrals."
        canonical="https://pypecrm.com/partners"
        keywords="pype crm partner program, crm affiliate program, recurring commission, crm referral program"
      />
      <LandingNavbar />
      <PageTransition>
        <main>
          <section className="relative isolate overflow-hidden bg-gray-950 px-6 pb-24 pt-36 text-white sm:px-8 md:pb-28 md:pt-44">
            <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_82%_18%,rgba(105,166,58,0.42),transparent_34%),radial-gradient(circle_at_10%_82%,rgba(138,71,160,0.32),transparent_38%)]" />
            <div className="absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:48px_48px]" />
            <div className="container mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-400/25 bg-brand-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-200">
                  <Sparkles className="h-4 w-4" /> Pype Partner Program
                </div>
                <h1 className="max-w-3xl text-4xl font-bold leading-[1.04] tracking-tight sm:text-5xl md:text-6xl">
                  Grow businesses.<br /><span className="text-brand-400">Earn as they grow.</span>
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-300">
                  Introduce sales teams to a CRM built for faster follow-up and clearer pipelines, and earn 30% recurring commission for the lifetime of every eligible customer you refer.
                </p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="h-12 rounded-full px-7 font-bold">
                    <Link to="/enquire?interest=partner-program">Apply to partner <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/25 bg-white/5 px-7 text-white hover:bg-white/10 hover:text-white">
                    <a href="#how-it-works">See how it works</a>
                  </Button>
                </div>
                <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-400">
                  {["Free to join", "Recurring rewards", "Partner enablement"].map((item) => <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-400" />{item}</span>)}
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-xl">
                <div className="absolute -inset-8 rounded-full bg-brand-500/15 blur-3xl" />
                <div className="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
                  <div className="flex items-center justify-between border-b border-white/10 pb-5">
                    <div><p className="text-xs text-gray-400">Partner overview</p><p className="mt-1 font-bold">Your referral performance</p></div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white"><BarChart3 className="h-5 w-5" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 py-5">
                    <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-gray-400">Lifetime recurring rate</p><p className="mt-2 text-3xl font-bold">30%</p></div>
                    <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-gray-400">Attribution</p><p className="mt-2 text-3xl font-bold">Tracked</p></div>
                  </div>
                  <div className="rounded-2xl bg-white p-5 text-gray-950">
                    <div className="flex items-center justify-between"><p className="text-sm font-bold">Qualified referrals</p><span className="rounded-full bg-brand-50 px-2 py-1 text-[10px] font-bold text-brand-700">This month</span></div>
                    <div className="mt-5 flex h-24 items-end gap-2">
                      {[36, 48, 42, 66, 58, 82, 92].map((height, index) => <div key={index} className="flex-1 rounded-t-md bg-brand-500/20" style={{ height: `${height}%` }}><div className="h-full rounded-t-md bg-brand-500" style={{ opacity: .45 + index * .08 }} /></div>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Reveal><section className="border-b border-gray-100 bg-white py-8 dark:border-gray-800 dark:bg-gray-950">
            <div className="container mx-auto grid gap-6 px-6 text-center sm:grid-cols-3 sm:px-8 md:px-12 lg:px-20 xl:px-28">
              {[["30%", "lifetime recurring commission"], ["1st–5th", "monthly payout window"], ["No minimum", "required before payout"]].map(([value, label]) => <div key={label}><p className="text-2xl font-bold text-gray-950 dark:text-white">{value}</p><p className="mt-1 text-sm text-gray-500">{label}</p></div>)}
            </div>
          </section></Reveal>

          <Reveal><section className="bg-white py-24 dark:bg-gray-950">
            <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">Simple, transparent rewards</p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 dark:text-white md:text-5xl">Know exactly how and when you earn</h2>
                <p className="mt-5 text-lg leading-relaxed text-gray-500 dark:text-gray-400">The Pype Partner Program is designed around predictable recurring income, clear validation, and payouts without an artificial minimum balance.</p>
              </div>
              <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { value: "30%", title: "Lifetime recurring commission", text: "Earn 30% of every eligible subscription payment for as long as your referred customer remains active with Pype CRM." },
                  { value: "14 days", title: "Referral verification", text: "New paid referrals are reviewed and confirmed within two weeks so attribution and subscription eligibility stay accurate." },
                  { value: "1st–5th", title: "Monthly payout window", text: "Approved partner earnings are processed during the first five days of each month, giving you a consistent payout schedule." },
                  { value: "48 hours", title: "Fast processing, no minimum", text: "Once processing begins, approved payouts are targeted within 48 hours—and you do not need to reach a minimum balance first." },
                ].map((item) => (
                  <article key={item.title} className="rounded-3xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/60">
                    <p className="text-3xl font-bold tracking-tight text-brand-600">{item.value}</p>
                    <h3 className="mt-5 font-bold text-gray-950 dark:text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{item.text}</p>
                  </article>
                ))}
              </div>
              <div className="mt-8 rounded-2xl border border-brand-200 bg-brand-50 p-5 text-sm leading-relaxed text-brand-900 dark:border-brand-900 dark:bg-brand-950/30 dark:text-brand-100">
                <strong>Example:</strong> If a customer you refer continues using Pype CRM, your eligible 30% commission continues with their subscription—not only on their first payment.
              </div>
            </div>
          </section></Reveal>

          <Reveal><section className="bg-gray-50 py-24 dark:bg-gray-900/40">
            <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28">
              <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">Who it is for</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 dark:text-white md:text-5xl">A strong fit for people who help businesses grow</h2></div>
              <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{audiences.map(({ icon: Icon, title, text }) => <article key={title} className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-950/50 dark:text-brand-300"><Icon className="h-5 w-5" /></div><h3 className="mt-6 font-bold text-gray-950 dark:text-white">{title}</h3><p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{text}</p></article>)}</div>
            </div>
          </section></Reveal>

          <Reveal><section id="how-it-works" className="bg-white py-24 dark:bg-gray-950">
            <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28">
              <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr]"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-brand-600">How it works</p><h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 dark:text-white md:text-5xl">From application to recurring rewards</h2><p className="mt-5 text-gray-500 dark:text-gray-400">A straightforward program designed to let you focus on trusted recommendations—not administration.</p></div><div className="grid gap-4 sm:grid-cols-2">{steps.map(({ icon: Icon, number, title, text }) => <article key={number} className="rounded-3xl border border-gray-200 p-6 dark:border-gray-800"><div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-950 text-white dark:bg-white dark:text-gray-950"><Icon className="h-5 w-5" /></div><span className="text-sm font-bold text-gray-300 dark:text-gray-700">{number}</span></div><h3 className="mt-6 text-lg font-bold text-gray-950 dark:text-white">{title}</h3><p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{text}</p></article>)}</div></div>
            </div>
          </section></Reveal>

          <Reveal><section className="bg-gray-950 py-24 text-white">
            <div className="container mx-auto grid items-center gap-12 px-6 sm:px-8 md:px-12 lg:grid-cols-2 lg:px-20 xl:px-28"><div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500"><BadgePercent className="h-6 w-6" /></div><h2 className="mt-6 text-3xl font-bold tracking-tight md:text-5xl">Built to help you recommend with confidence</h2><p className="mt-5 max-w-xl text-gray-400">We give partners the context and resources to explain where Pype fits, demonstrate real value, and support serious opportunities.</p></div><div className="grid gap-3 sm:grid-cols-2">{benefits.map((benefit) => <div key={benefit} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-gray-200"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />{benefit}</div>)}</div></div>
          </section></Reveal>

          <Reveal><section className="bg-white py-24 dark:bg-gray-950">
            <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28"><div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-brand-600 to-brand-800 px-7 py-14 text-center text-white shadow-2xl sm:px-12"><div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-white/10 blur-2xl" /><Globe2 className="relative mx-auto h-10 w-10" /><h2 className="relative mt-5 text-3xl font-bold tracking-tight md:text-5xl">Let’s grow better businesses together.</h2><p className="relative mx-auto mt-4 max-w-2xl text-brand-50">Apply to the Pype Partner Program and turn trusted recommendations into a recurring revenue stream.</p><Button asChild size="lg" className="relative mt-8 h-12 rounded-full bg-white px-7 font-bold text-brand-800 shadow-none hover:bg-gray-100"><Link to="/enquire?interest=partner-program">Apply now <ArrowRight className="ml-2 h-4 w-4" /></Link></Button></div></div>
          </section></Reveal>
        </main>
      </PageTransition>
      <Footer />
    </div>
  );
}
