import { Link, useParams, Navigate } from "react-router-dom";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/shared/SEO";
import { ArrowLeft } from "lucide-react";
import { getHelpArticle } from "@/data/helpArticles";

export default function HelpArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getHelpArticle(slug) : undefined;

  if (!article) {
    return <Navigate to="/help" replace />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans">
      <SEO
        title={article.title}
        description={article.summary}
        canonical={`https://pypecrm.com/help/${article.slug}`}
      />
      <LandingNavbar />
      <main className="pt-28 pb-20">
        <article className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28 max-w-3xl">
          <Link to="/help" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Help Center
          </Link>

          <p className="text-sm font-semibold text-primary mb-3">{article.category}</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-8 leading-tight">
            {article.title}
          </h1>

          <div className="space-y-5 text-gray-700 dark:text-gray-300 leading-relaxed text-[17px]">
            {article.content.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-16 pt-10 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-4">
            <p className="text-sm text-gray-500">Still stuck on something?</p>
            <Link to="/enquire" className="text-sm font-semibold text-primary hover:underline">
              Talk to our team →
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
