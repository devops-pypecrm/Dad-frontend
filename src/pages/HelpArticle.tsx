import { Link, useParams, Navigate } from "react-router-dom";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/shared/SEO";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Clock, Info } from "lucide-react";
import { HELP_ARTICLES, getHelpArticle, type HelpSection } from "@/data/helpArticles";
import { PageTransition } from "@/components/shared/MotionReveal";
import { cn } from "@/lib/utils";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const CALLOUT = {
  info: { icon: Info, cls: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100" },
  warning: { icon: AlertTriangle, cls: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100" },
  success: { icon: CheckCircle2, cls: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100" },
};

function Section({ s }: { s: HelpSection }) {
  const callout = s.callout && CALLOUT[s.callout.type];
  return (
    <section id={slugify(s.heading)} className="scroll-mt-28">
      <h2 className="mb-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{s.heading}</h2>
      <div className="space-y-4 text-[16.5px] leading-relaxed text-gray-700 dark:text-gray-300">
        {s.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
        {s.steps && <ol className="space-y-3">{s.steps.map((t, i) => (
          <li key={i} className="flex gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span><span>{t}</span></li>
        ))}</ol>}
        {s.bullets && <ul className="list-disc space-y-2 pl-5 marker:text-primary/60">{s.bullets.map((t, i) => <li key={i}>{t}</li>)}</ul>}
        {s.table && (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-left text-[15px]">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-900"><tr>{s.table.headers.map(h => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">{s.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={cn("px-4 py-3 align-top", j === 0 && "font-medium text-gray-900 dark:text-white")}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )}
        {s.callout && callout && <div className={cn("flex gap-3 rounded-xl border p-4 text-[15px]", callout.cls)}><callout.icon className="mt-0.5 h-5 w-5 shrink-0" /><p>{s.callout.text}</p></div>}
      </div>
    </section>
  );
}

export default function HelpArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getHelpArticle(slug) : undefined;

  if (!article) return <Navigate to="/docs" replace />;

  const siblings = HELP_ARTICLES.filter(a => a.category === article.category);
  const related = (article.related || []).map(getHelpArticle).filter((a): a is NonNullable<typeof a> => !!a);

  return (
    <div className="min-h-screen bg-white font-sans dark:bg-gray-950">
      <SEO title={article.title} description={article.summary} canonical={`https://pypecrm.com/docs/${article.slug}`} />
      <LandingNavbar />
      <PageTransition><main className="pb-20 pt-28">
        <div className="container mx-auto grid gap-10 px-6 sm:px-8 md:px-12 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_200px] lg:px-20 xl:px-28">
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-1">
              <Link to="/docs" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary"><ArrowLeft className="h-4 w-4" />All documentation</Link>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{article.category}</p>
              {siblings.map(a => <Link key={a.slug} to={`/docs/${a.slug}`} className={cn("block rounded-lg px-3 py-1.5 text-sm", a.slug === article.slug ? "bg-primary/10 font-semibold text-primary" : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900")}>{a.title}</Link>)}
            </div>
          </aside>

          <article className="min-w-0 max-w-3xl">
            <Link to="/docs" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary lg:hidden"><ArrowLeft className="h-4 w-4" />Back to Documentation</Link>
            <p className="mb-3 text-sm font-semibold text-primary">{article.category}</p>
            <h1 className="mb-3 text-3xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-4xl">{article.title}</h1>
            <p className="mb-2 text-lg text-gray-600 dark:text-gray-300">{article.summary}</p>
            {article.readTime && <p className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-400"><Clock className="h-4 w-4" />{article.readTime}</p>}

            {article.sections ? <div className="space-y-10 border-t border-gray-100 pt-8 dark:border-gray-800">{article.sections.map(s => <Section key={s.heading} s={s} />)}</div> : (
              <div className="space-y-5 text-[17px] leading-relaxed text-gray-700 dark:text-gray-300">{article.content.map((p, i) => <p key={i}>{p}</p>)}</div>
            )}

            {related.length > 0 && (
              <div className="mt-14 border-t border-gray-100 pt-8 dark:border-gray-800">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Related</h3>
                <div className="grid gap-3 sm:grid-cols-2">{related.map(a => (
                  <Link key={a.slug} to={`/docs/${a.slug}`} className="group flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-4 hover:border-primary/30 hover:shadow-md dark:border-gray-800"><span className="font-medium text-gray-900 dark:text-white">{a.title}</span><ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary" /></Link>
                ))}</div>
              </div>
            )}

            <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-8 dark:border-gray-800">
              <p className="text-sm text-gray-500">Still stuck on something?</p>
              <Link to="/enquire" className="text-sm font-semibold text-primary hover:underline">Talk to our team →</Link>
            </div>
          </article>

          {article.sections && (
            <aside className="hidden xl:block"><div className="sticky top-28">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">On this page</p>
              <ul className="space-y-2 border-l border-gray-200 text-sm dark:border-gray-800">{article.sections.map(s => <li key={s.heading}><a href={`#${slugify(s.heading)}`} className="-ml-px block border-l border-transparent pl-3 text-gray-500 hover:border-primary hover:text-primary">{s.heading}</a></li>)}</ul>
            </div></aside>
          )}
        </div>
      </main></PageTransition>
      <Footer />
    </div>
  );
}
