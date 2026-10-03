import { Link } from "react-router-dom";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/shared/SEO";
import { ArrowRight, LifeBuoy } from "lucide-react";
import { HELP_CATEGORIES, HELP_ARTICLES } from "@/data/helpArticles";

export default function Help() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans">
      <SEO
        title="Help Center"
        description="Guides for setting up Pype CRM: assignment rules, bulk imports, integrations, and lead visibility — explained plainly."
        canonical="https://pypecrm.com/help"
        keywords="pype crm help, crm documentation, crm setup guide"
      />
      <LandingNavbar />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28">
          <div className="max-w-2xl mb-16">
            <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold mb-3">
              <LifeBuoy className="h-4 w-4" /> HELP CENTER
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
              Guides to get the most out of Pype CRM
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Straight answers on setup, assignment rules, imports, and integrations — written by the team that builds it.
            </p>
          </div>

          {HELP_CATEGORIES.map((category) => {
            const articles = HELP_ARTICLES.filter((a) => a.category === category);
            if (articles.length === 0) return null;
            return (
              <div key={category} className="mb-12">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{category}</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {articles.map((article) => (
                    <Link
                      key={article.slug}
                      to={`/help/${article.slug}`}
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
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
