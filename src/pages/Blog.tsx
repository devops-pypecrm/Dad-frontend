import { Link } from "react-router-dom";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/shared/SEO";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { BLOG_POSTS } from "@/data/blogPosts";

export default function Blog() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans">
      <SEO
        title="Blog"
        description="Practical guidance on sales process, lead response time, and running a modern sales team — from the team building Pype CRM."
        canonical="https://pypecrm.com/blog"
        keywords="sales crm blog, lead management, sales process, crm tips"
      />
      <LandingNavbar />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28">
          <div className="max-w-2xl mb-16">
            <p className="text-sm font-semibold tracking-[0.2em] text-primary mb-3">BLOG</p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
              Ideas for running a sharper sales team
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Practical, no-fluff notes on process, response time, and the channels your prospects actually use.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BLOG_POSTS.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg hover:border-primary/30 transition-all"
              >
                <span className="text-xs font-semibold text-primary mb-3">{post.category}</span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-snug group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed flex-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(post.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readTime}
                  </span>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Read more <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
