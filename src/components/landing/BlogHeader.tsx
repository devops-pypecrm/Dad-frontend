import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "../shared/Logo";

export default function BlogHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28 h-16 flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Logo size="md" />
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-semibold text-gray-600 dark:text-gray-300">
            <Link to="/blog" className="hover:text-gray-900 dark:hover:text-white transition-colors">Blog Home</Link>
            <Link to="/help" className="hover:text-gray-900 dark:hover:text-white transition-colors">Help Center</Link>
            <a href="/#features" className="hover:text-gray-900 dark:hover:text-white transition-colors">Explore Pype CRM</a>
          </nav>
        </div>
        <Link to="/enquire">
          <Button size="sm" className="px-4 md:h-10 md:px-5">Get Started</Button>
        </Link>
      </div>
    </header>
  );
}
