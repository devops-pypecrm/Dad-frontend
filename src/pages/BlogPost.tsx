import { Fragment, useMemo, useRef } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, useScroll } from "framer-motion";
import BlogHeader from "@/components/landing/BlogHeader";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/shared/SEO";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Calendar, Clock, Link2, Linkedin, Twitter } from "lucide-react";
import { getBlogPost, BLOG_POSTS } from "@/data/blogPosts";

const slugifyHeading = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;
  const articleRef = useRef<HTMLDivElement>(null);
  // Tracks scroll progress across just the article body (not the whole
  // page, which would include the header/footer and give a misleading
  // "100% read" the moment the footer scrolls into view).
  const { scrollYProgress } = useScroll({
    target: articleRef,
    offset: ["start start", "end end"],
  });

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const otherPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);
  const pageUrl = `https://pypecrm.com/blog/${post.slug}`;
  // Pull quote and mid-article CTA land roughly a third and two-thirds of
  // the way through the body, so they read as natural breaks rather than
  // being bolted on at a fixed paragraph count regardless of article length.
  const quoteAfter = Math.max(1, Math.floor(post.content.length / 3));
  const ctaAfter = Math.max(quoteAfter + 1, Math.floor((post.content.length * 2) / 3));

  const headings = useMemo(
    () => post.content.filter((b) => b.startsWith("## ")).map((b) => b.slice(3)),
    [post.content]
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pageUrl).then(
      () => toast.success("Link copied"),
      () => toast.error("Couldn't copy the link")
    );
  };

  const shareButtons = (
    <div className="flex items-center gap-2">
      <a
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(post.title)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/40 transition-colors"
      >
        <Twitter className="h-3.5 w-3.5" />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/40 transition-colors"
      >
        <Linkedin className="h-3.5 w-3.5" />
      </a>
      <button
        type="button"
        onClick={handleCopyLink}
        aria-label="Copy link"
        className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary/40 transition-colors"
      >
        <Link2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <SEO
        title={post.title}
        description={post.excerpt}
        canonical={pageUrl}
        ogTitle={post.title}
        ogDescription={post.excerpt}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          datePublished: post.date,
          author: { "@type": "Organization", name: "Pype CRM" },
        }}
      />
      <BlogHeader />
      <main className="pt-12 pb-20">
        <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28 max-w-6xl">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>

          <div className="grid lg:grid-cols-[1fr_260px] gap-12 items-start">
            <article ref={articleRef} className="min-w-0 max-w-3xl">
              <p className="text-sm font-semibold text-primary mb-3">{post.category}</p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4 leading-tight">
                {post.title}
              </h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                {post.subtitle}
              </p>

              {/* Meta + share bar - share also lives in the sticky rail on
                  desktop; kept here too since the rail is hidden on mobile. */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold">
                    <span className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-gray-500 shrink-0" />
                    <span>
                      {post.author}
                      <span className="block text-xs font-normal text-gray-400">{post.authorRole}</span>
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(post.date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readTime}
                  </span>
                </div>
                <div className="lg:hidden">{shareButtons}</div>
              </div>

              <img
                src={`https://picsum.photos/seed/${post.slug}/1200/600`}
                alt=""
                loading="lazy"
                className="w-full h-56 sm:h-80 object-cover rounded-2xl mb-10"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />

              <div className="space-y-5 text-gray-700 dark:text-gray-300 leading-relaxed text-[17px]">
                {post.content.map((block, i) => {
                  const isHeading = block.startsWith("## ");
                  const node = isHeading ? (
                    <h2
                      key={i}
                      id={slugifyHeading(block.slice(3))}
                      className="!mt-10 scroll-mt-24 text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-snug"
                    >
                      {block.slice(3)}
                    </h2>
                  ) : (
                    <p key={i}>{block}</p>
                  );

                  return (
                    <Fragment key={i}>
                      {node}
                      {i === quoteAfter && post.pullQuote && (
                        <blockquote
                          key={`quote-${i}`}
                          className="!my-10 border-l-4 border-primary pl-6 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white leading-snug"
                        >
                          "{post.pullQuote}"
                        </blockquote>
                      )}
                      {i === quoteAfter + (post.pullQuote ? 1 : 0) && post.stats && (
                        <div key={`stats-${i}`} className="!my-10 grid grid-cols-3 gap-4 rounded-2xl bg-gray-50 dark:bg-gray-900 p-6">
                          {post.stats.map((stat) => (
                            <div key={stat.label} className="text-center">
                              <p className="text-2xl sm:text-3xl font-bold text-primary mb-1">{stat.value}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">{stat.label}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {i === ctaAfter && (
                        <div key={`cta-${i}`} className="!my-10 flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 flex-wrap">
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white mb-0.5">See this in your own pipeline</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">14-day free trial. No credit card required.</p>
                          </div>
                          <Link to="/enquire">
                            <Button className="rounded-full gap-2">
                              Get Started <ArrowRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      )}
                    </Fragment>
                  );
                })}
              </div>

              {/* Closing CTA */}
              <div className="mt-16 rounded-2xl bg-gray-900 dark:bg-gray-800 text-white p-8 sm:p-10 text-center">
                <h3 className="text-2xl font-bold mb-2">Stop losing deals to process, not pitch.</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Pype CRM assigns, tracks, and follows up automatically — so nothing you've already paid to generate goes cold.
                </p>
                <Link to="/enquire">
                  <Button size="lg" variant="secondary" className="rounded-full gap-2">
                    Start Free Trial <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {otherPosts.length > 0 && (
                <div className="mt-16 pt-10 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-500 mb-4">Keep reading</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {otherPosts.map((p) => (
                      <Link
                        key={p.slug}
                        to={`/blog/${p.slug}`}
                        className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:border-primary/30 hover:shadow-md transition-all"
                      >
                        <p className="text-xs font-semibold text-primary mb-1.5">{p.category}</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{p.title}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Sticky right rail: reading progress, table of contents, share */}
            <aside className="hidden lg:block sticky top-24 self-start">
              <div className="flex items-stretch gap-3">
                <div className="relative w-0.5 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0 self-stretch">
                  <motion.div
                    className="absolute top-0 left-0 w-full rounded-full bg-primary origin-top"
                    style={{ scaleY: scrollYProgress, height: "100%" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {headings.length > 0 && (
                    <>
                      <p className="text-xs font-semibold tracking-[0.15em] text-gray-400 mb-3">ON THIS PAGE</p>
                      <nav className="space-y-2.5 mb-8">
                        {headings.map((h) => (
                          <a
                            key={h}
                            href={`#${slugifyHeading(h)}`}
                            className="block text-sm text-gray-500 dark:text-gray-400 hover:text-primary transition-colors leading-snug"
                          >
                            {h}
                          </a>
                        ))}
                      </nav>
                    </>
                  )}
                  <p className="text-xs font-semibold tracking-[0.15em] text-gray-400 mb-3">SHARE</p>
                  {shareButtons}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
