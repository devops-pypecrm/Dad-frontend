import type { ReactNode } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, BookOpen, Building2, Check, LifeBuoy, MapPin, PlayCircle, Quote, Users, Video } from "lucide-react";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";
import CTASection from "@/components/landing/CTASection";
import SEO from "@/components/shared/SEO";
import { PageTransition, Reveal } from "@/components/shared/MotionReveal";
import { Button } from "@/components/ui/button";
import {
  ACADEMY_COURSES,
  CUSTOMER_STORIES,
  DEMOS,
  GUIDES,
  SERVICES,
  SUPPORT_OPTIONS,
  TUTORIALS,
  WEBINARS,
  getCustomerStory,
  type ResourceItem,
} from "@/data/learnContent";

function PageShell({ title, description, path, children }: { title: string; description: string; path: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white font-jakarta dark:bg-gray-950">
      <SEO title={title} description={description} canonical={`https://pypecrm.com${path}`} />
      <LandingNavbar />
      <PageTransition>
        <main>{children}</main>
      </PageTransition>
      <Footer />
    </div>
  );
}

function PageHero({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <section className="px-6 pb-12 pt-32 text-center sm:px-8 md:pt-40">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-brand-600">{eyebrow}</p>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">{subtitle}</p>
      </div>
    </section>
  );
}

function ResourceGrid({ items, icon: Icon }: { items: ResourceItem[]; icon: typeof BookOpen }) {
  return (
    <section className="px-6 pb-20 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <Reveal key={item.id} delay={i * 0.04}>
            <div className="group flex h-full flex-col rounded-3xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-plum-50 px-2.5 py-1 text-xs font-bold text-plum-700 dark:bg-plum-950/40 dark:text-plum-300">{item.tag}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{item.description}</p>
              <p className="mt-4 text-xs font-semibold text-gray-500">{item.meta}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const hubPage = (cfg: { path: string; seo: string; eyebrow: string; title: string; subtitle: string; items: ResourceItem[]; icon: typeof BookOpen }) =>
  function HubPage() {
    return (
      <PageShell title={cfg.seo} description={cfg.subtitle} path={cfg.path}>
        <PageHero eyebrow={cfg.eyebrow} title={cfg.title} subtitle={cfg.subtitle} />
        <ResourceGrid items={cfg.items} icon={cfg.icon} />
        <CTASection />
      </PageShell>
    );
  };

export const Academy = hubPage({ path: "/academy", seo: "Pype Academy", eyebrow: "Academy", title: "Learn Pype CRM, one course at a time", subtitle: "Short, practical courses that take your team from first login to confident daily use.", items: ACADEMY_COURSES, icon: BookOpen });
export const Demos = hubPage({ path: "/demos", seo: "Product Demos", eyebrow: "Demos", title: "See Pype CRM in action", subtitle: "Quick walkthroughs of the workflows sales teams use every day.", items: DEMOS, icon: PlayCircle });
export const Tutorials = hubPage({ path: "/tutorials", seo: "Video Tutorials", eyebrow: "Video tutorials", title: "Step-by-step video tutorials", subtitle: "Short how-to videos for setup, lead capture, WhatsApp, automation and reports.", items: TUTORIALS, icon: Video });
export const Webinars = hubPage({ path: "/webinars", seo: "Webinars", eyebrow: "Webinars", title: "Learn live from the Pype team", subtitle: "Join a session or watch a recording to pick up proven sales and CRM practices.", items: WEBINARS, icon: Users });
export const Guides = hubPage({ path: "/guides", seo: "Sales & CRM Guides", eyebrow: "Guides", title: "Playbooks and guides for sales teams", subtitle: "Checklists, templates and playbooks you can put to work this week.", items: GUIDES, icon: BookOpen });

export function SupportCenter() {
  return (
    <PageShell title="Support" description="Get help with Pype CRM: documentation, team support and AI answers." path="/support-center">
      <PageHero eyebrow="Support" title="Help when you need it" subtitle="Find answers fast, or reach a real person who knows the product." />
      <section className="px-6 pb-12 sm:px-8">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          {SUPPORT_OPTIONS.map((o) => (
            <Reveal key={o.title}>
              <div className="flex h-full flex-col rounded-3xl border border-gray-200 p-6 dark:border-gray-800">
                <LifeBuoy className="mb-4 h-6 w-6 text-brand-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{o.title}</h3>
                <p className="mt-2 flex-1 text-sm text-gray-600 dark:text-gray-400">{o.body}</p>
                <Link to={o.href} className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline">
                  {o.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <section id="premium" className="px-6 pb-20 sm:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-br from-plum-600 to-plum-800 p-8 text-white md:p-12">
          <h2 className="text-2xl font-bold">Premium support</h2>
          <p className="mt-3 max-w-2xl text-plum-100">Faster response times and a named contact for teams that run their whole sales operation on Pype CRM.</p>
          <Link to="/enquire"><Button className="mt-6 bg-white text-plum-800 hover:bg-plum-50">Talk to us</Button></Link>
        </div>
      </section>
    </PageShell>
  );
}

export function Services() {
  return (
    <PageShell title="Onboarding & Services" description="Guided onboarding, data migration, training and custom automation for Pype CRM." path="/services">
      <PageHero eyebrow="Professional services" title="We help you go live faster" subtitle="Hands-on help from the people who built the product." />
      <section className="px-6 pb-20 sm:px-8">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
          {SERVICES.map((s) => (
            <Reveal key={s.title}>
              <div className="h-full rounded-3xl border border-gray-200 p-7 dark:border-gray-800">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{s.body}</p>
                <ul className="mt-4 space-y-2">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Check className="h-4 w-4 text-brand-600" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <CTASection />
    </PageShell>
  );
}

export function Customers() {
  return (
    <PageShell title="Customer Stories" description="See how sales teams use Pype CRM to respond faster and close more." path="/customers">
      <PageHero eyebrow="Customer stories" title="How teams grow with Pype CRM" subtitle="Real workflows, measurable results." />
      <section className="px-6 pb-20 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
          {CUSTOMER_STORIES.map((s) => (
            <Reveal key={s.slug}>
              <Link to={`/customers/${s.slug}`} className="group flex h-full flex-col rounded-3xl border border-gray-200 p-7 transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg dark:border-gray-800">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-plum-500 text-sm font-bold text-white">{s.initials}</span>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{s.company}</p>
                    <p className="text-xs text-gray-500">{s.industry}</p>
                  </div>
                </div>
                <h3 className="text-lg font-bold leading-snug text-gray-900 dark:text-white">{s.headline}</h3>
                <p className="mt-3 flex-1 text-sm text-gray-600 dark:text-gray-400">{s.summary}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-brand-700 group-hover:gap-2">
                  Read the story <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

export function CustomerStoryPage() {
  const { slug } = useParams();
  const story = slug ? getCustomerStory(slug) : undefined;
  if (!story) return <Navigate to="/customers" replace />;

  return (
    <PageShell title={story.headline} description={story.summary} path={`/customers/${story.slug}`}>
      <section className="px-6 pb-10 pt-32 sm:px-8 md:pt-40">
        <div className="mx-auto max-w-4xl">
          <Link to="/customers" className="text-sm font-semibold text-brand-700 hover:underline">← All customer stories</Link>
          <div className="mt-6 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-plum-500 font-bold text-white">{story.initials}</span>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{story.company}</p>
              <p className="flex items-center gap-3 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />{story.industry}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{story.location}</span>
                <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{story.teamSize}</span>
              </p>
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-5xl">{story.headline}</h1>
          <p className="mt-5 text-lg text-gray-600 dark:text-gray-300">{story.summary}</p>
        </div>
      </section>

      <section className="px-6 pb-10 sm:px-8">
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
          {story.stats.map((s) => (
            <div key={s.label} className="rounded-3xl bg-brand-50 p-6 dark:bg-brand-950/40">
              <p className="text-3xl font-extrabold text-brand-700 dark:text-brand-300">{s.value}</p>
              <p className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-16 sm:px-8">
        <article className="mx-auto max-w-3xl space-y-5 text-base leading-relaxed text-gray-700 dark:text-gray-300">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">The challenge</h2>
          {story.challenge.map((p) => <p key={p}>{p}</p>)}

          <h2 className="pt-4 text-2xl font-bold text-gray-900 dark:text-white">The solution</h2>
          <div className="space-y-4">
            {story.solution.map((s) => (
              <div key={s.title} className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white">{s.title}</h3>
                <p className="mt-1 text-sm">{s.body}</p>
              </div>
            ))}
          </div>

          <figure className="my-8 rounded-3xl bg-gradient-to-br from-plum-600 to-plum-800 p-8 text-white">
            <Quote className="mb-3 h-7 w-7 text-plum-200" />
            <blockquote className="text-xl font-semibold leading-snug">“{story.quote}”</blockquote>
            <figcaption className="mt-4 text-sm text-plum-100">{story.quoteBy}, {story.quoteRole} · {story.company}</figcaption>
          </figure>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">The results</h2>
          <ul className="space-y-3">
            {story.results.map((r) => (
              <li key={r} className="flex gap-3"><Check className="mt-1 h-4 w-4 shrink-0 text-brand-600" />{r}</li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-2 pt-4">
            {story.featuresUsed.map((f) => (
              <span key={f} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">{f}</span>
            ))}
          </div>
        </article>
      </section>
      <CTASection />
    </PageShell>
  );
}
