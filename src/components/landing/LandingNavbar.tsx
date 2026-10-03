import { useState } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn, getUserInfo } from "@/lib/utils";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Logo from "../shared/Logo";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Blog", href: "/blog" },
  { label: "Help Center", href: "/help" },
];

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { scrollY } = useScroll();
  // Read once per mount rather than via a state/effect pair - this only
  // needs to reflect whatever was true when the landing page loaded (a
  // login/logout elsewhere triggers a full navigation back here anyway).
  const isLoggedIn = !!getUserInfo()?.token;

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  // The homepage sections live at /#features and /#pricing - a plain <a>
  // (not react-router's Link) is used for those so the browser's native
  // hash-scroll handles navigating there from any other page, not just
  // from "/" itself.
  const renderLink = (link: (typeof navLinks)[number], className: string, onClick?: () => void) =>
    link.href.startsWith("/#") ? (
      <a key={link.label} href={link.href} className={className} onClick={onClick}>
        {link.label}
      </a>
    ) : (
      <Link key={link.label} to={link.href} className={className} onClick={onClick}>
        {link.label}
      </Link>
    );

  return (
    <motion.nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
        isScrolled
          ? "bg-white/80 dark:bg-gray-950/80 backdrop-blur-md dark:border-gray-800 py-3"
          : "bg-transparent py-5"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28">
        <div className="flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <Logo size="lg" />
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) =>
              renderLink(
                link,
                "text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              )
            )}
          </div>

          <div className="hidden lg:flex items-center gap-3 md:gap-6 shrink-0">
            {isLoggedIn ? (
              <Link to="/dashboard">
                <Button size="sm" className="gap-2 px-4 md:h-10 md:px-5">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button size="sm" className="border-none bg-gray-200! text-black! shadow-none px-4 md:h-10 md:px-5">
                    Login
                  </Button>
                </Link>
                <Link to="/enquire">
                  <Button size="sm" className="px-4 md:h-10 md:px-5">
                    Enquire
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden h-10 w-10 flex items-center justify-center rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="right" className="w-72">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="flex flex-col h-full pt-10">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) =>
                renderLink(
                  link,
                  "px-3 py-3 rounded-lg text-base font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                  () => setIsMobileOpen(false)
                )
              )}
            </div>
            <div className="mt-auto flex flex-col gap-2 pb-6">
              {isLoggedIn ? (
                <Link to="/dashboard" onClick={() => setIsMobileOpen(false)}>
                  <Button className="w-full gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMobileOpen(false)}>
                    <Button variant="outline" className="w-full">Login</Button>
                  </Link>
                  <Link to="/enquire" onClick={() => setIsMobileOpen(false)}>
                    <Button className="w-full">Enquire</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </motion.nav>
  );
}
