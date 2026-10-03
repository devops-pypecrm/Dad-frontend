import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Footer from "@/components/landing/Footer";
import BlogHeader from "@/components/landing/BlogHeader";
import SEO from "@/components/shared/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { BLOG_POSTS } from "@/data/blogPosts";

// No product photography in the asset pipeline yet - each post gets a
// real, stable stock image from Lorem Picsum (seeded by slug, so a given
// post always shows the same image), with the old gradient as a fallback
// if the image ever fails to load rather than a broken <img>.
const CATEGORY_GRADIENTS: Record<string, string> = {
  "Sales Process": "from-indigo-500 to-blue-500",
  "Leads & Assignment": "from-amber-500 to-orange-500",
  Channels: "from-emerald-500 to-teal-500",
  Product: "from-rose-500 to-pink-500",
};

function Thumbnail({ slug, category, className }: { slug: string; category: string; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br", CATEGORY_GRADIENTS[category] || "from-gray-500 to-gray-700", className)}>
      <img
        src={`https://picsum.photos/seed/${slug}/800/450`}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    </div>
  );
}

export default function Blog() {
  const [sort, setSort] = useState<"recent" | "popular">("recent");
  const [email, setEmail] = useState("");

  const [featured, ...rest] = BLOG_POSTS;
  const articles = useMemo(
    () => (sort === "recent" ? rest : [...rest].reverse()),
    [sort, rest]
  );

  // No newsletter/signup backend exists yet - this is intentionally honest
  // about that instead of silently pretending to subscribe the visitor.
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success("Thanks for your interest! Newsletter signup is coming soon.");
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SEO
        title="Blog"
        description="Practical guidance on sales process, lead response time, and running a modern sales team — from the team building Pype CRM."
        canonical="https://pypecrm.com/blog"
        keywords="sales crm blog, lead management, sales process, crm tips"
      />
      <BlogHeader />
      <main className="pb-20">
        {/* Hero */}
        <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28 pt-12 pb-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-4 leading-[1.05]">
                Sales process tips &amp; trends, delivered.
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                Join sales leaders from around the world who read the Pype CRM blog for practical, no-fluff process advice.
              </p>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-11"
                />
                <Button type="submit" className="h-11 px-6 shrink-0">Subscribe</Button>
              </form>
            </div>

            <Link
              to={`/blog/${featured.slug}`}
              className="group block rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-xl transition-shadow"
            >
              <Thumbnail slug={featured.slug} category={featured.category} className="h-48 sm:h-56" />
              <div className="p-5">
                <p className="text-xs font-semibold text-primary mb-2">{featured.category.toUpperCase()}</p>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-snug group-hover:text-primary transition-colors">
                  {featured.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{featured.author}</span>
                  <span>·</span>
                  <span>{featured.readTime}</span>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Articles */}
        <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28">
          <div className="flex items-center justify-between mb-6">
            <p className="text-xs font-semibold tracking-[0.2em] text-gray-400">ARTICLES</p>
            <div className="inline-flex rounded-full border border-gray-200 dark:border-gray-800 p-1">
              {(["recent", "popular"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSort(key)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors",
                    sort === key ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "text-gray-500"
                  )}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((post, i) => (
              <div key={post.slug} className="contents">
                <Link
                  to={`/blog/${post.slug}`}
                  className="group flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all"
                >
                  <Thumbnail slug={post.slug} category={post.category} className="h-36" />
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-xs font-semibold text-primary mb-2">{post.category.toUpperCase()}</span>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 leading-snug group-hover:text-primary transition-colors flex-1">
                      {post.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(post.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {post.readTime}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Embedded subscribe card, matching the reference's in-grid CTA placement */}
                {i === 2 && (
                  <div className="rounded-2xl bg-gray-900 dark:bg-gray-800 text-white p-6 flex flex-col justify-center">
                    <h3 className="text-lg font-bold mb-1.5">Subscribe to our blog</h3>
                    <p className="text-sm text-gray-400 mb-4">Get the latest posts in your inbox.</p>
                    <form onSubmit={handleSubscribe} className="space-y-2">
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="h-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      />
                      <Button type="submit" variant="secondary" className="w-full h-10">Subscribe</Button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter banner */}
        <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28 mt-16">
          <div className="rounded-2xl bg-gray-50 dark:bg-gray-900 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Never miss a process tip.
              </h3>
              <p className="text-gray-500 dark:text-gray-400">Get new posts delivered straight to your inbox.</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex gap-3 w-full sm:w-auto">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="h-11 sm:w-64"
              />
              <Button type="submit" className="h-11 px-6 shrink-0">Subscribe</Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
