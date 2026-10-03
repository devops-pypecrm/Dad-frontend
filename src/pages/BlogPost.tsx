import { Link, useParams, Navigate } from "react-router-dom";
import BlogHeader from "@/components/landing/BlogHeader";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/shared/SEO";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { getBlogPost, BLOG_POSTS } from "@/data/blogPosts";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const otherPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans">
      <SEO
        title={post.title}
        description={post.excerpt}
        canonical={`https://pypecrm.com/blog/${post.slug}`}
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
        <article className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28 max-w-3xl">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>

          <p className="text-sm font-semibold text-primary mb-3">{post.category}</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 leading-tight">
            {post.title}
          </h1>

          <img
            src={`https://picsum.photos/seed/${post.slug}/1200/600`}
            alt=""
            loading="lazy"
            className="w-full h-56 sm:h-80 object-cover rounded-2xl mb-8"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />

          <div className="flex items-center gap-4 text-sm text-gray-400 mb-10">
            <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-medium">
              <span className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-gray-500" />
              {post.author}
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

          <div className="space-y-5 text-gray-700 dark:text-gray-300 leading-relaxed text-[17px]">
            {post.content.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
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
      </main>
      <Footer />
    </div>
  );
}
