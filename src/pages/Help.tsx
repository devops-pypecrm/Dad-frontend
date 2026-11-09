import { useState } from "react";
import { Link } from "react-router-dom";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/shared/SEO";
import { ArrowRight, LifeBuoy, Search } from "lucide-react";
import { HELP_CATEGORIES, HELP_ARTICLES } from "@/data/helpArticles";
import { PageTransition, Reveal } from "@/components/shared/MotionReveal";

export default function Help() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const matches = (a: (typeof HELP_ARTICLES)[number]) => !q || `${a.title} ${a.summary} ${a.category}`.toLowerCase().includes(q);
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans">
      <SEO
        title="Documentation"
        description="Product documentation for Pype CRM: setup, lead assignment, imports, and the WhatsApp and Instagram modules, explained plainly."
        canonical="https://pypecrm.com/docs"
        keywords="pype crm help, crm documentation, crm setup guide"
      />
      <LandingNavbar />
      <PageTransition><main className="pt-28 pb-20">
        <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28">
          <div className="max-w-2xl mb-16">
            <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold mb-3">
              <LifeBuoy className="h-4 w-4" /> DOCUMENTATION
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
              Guides to get the most out of Pype CRM
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Straight answers on setup, assignment rules, imports, and integrations — written by the team that builds it.
            </p>
            <div className="relative mt-6 max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the documentation" className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-primary dark:border-gray-800 dark:bg-gray-900 dark:text-white" />
            </div>
          </div>

          {HELP_CATEGORIES.map((category) => {
            const articles = HELP_ARTICLES.filter((a) => a.category === category && matches(a));
            if (articles.length === 0) return null;
            return (
              <Reveal key={category}><div className="mb-12">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{category}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {articles.map((article) => (
                    <Link
                      key={article.slug}
                      to={`/docs/${article.slug}`}
                      className="group flex items-center justify-between gap-4 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:border-primary/30 hover:shadow-md transition-all"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white mb-1">{article.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{article.summary}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  ))}
                </div>
              </div></Reveal>
            );
          })}
        </div>
      </main></PageTransition>
      <Footer />
    </div>
  );
}
