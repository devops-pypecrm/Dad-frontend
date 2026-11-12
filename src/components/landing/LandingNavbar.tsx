import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, ChevronDown, LayoutDashboard, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn, getUserInfo } from "@/lib/utils";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import { CUSTOMER_STORIES, LEARN_COLUMNS } from "@/data/learnContent";
import Logo from "../shared/Logo";

const navLinks = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
];

const featuredStory = CUSTOMER_STORIES[0];

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const openLearn = () => {
    clearTimeout(closeTimer.current);
    setLearnOpen(true);
  };
  // Small delay so the pointer can cross the gap between trigger and panel.
  const closeLearn = () => {
    closeTimer.current = setTimeout(() => setLearnOpen(false), 120);
  };
  const { scrollY } = useScroll();
  const { pathname } = useLocation();
  const useLightNav = pathname === "/partners" && !isScrolled && !learnOpen;

  useEffect(() => setLearnOpen(false), [pathname]);
  // Read once per mount rather than via a state/effect pair - this only
  // needs to reflect whatever was true when the landing page loaded (a
  // login/logout elsewhere triggers a full navigation back here anyway).
  const isLoggedIn = !!getUserInfo()?.token;

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  const renderLink = (link: (typeof navLinks)[number], className: string, onClick?: () => void) =>
    <Link key={link.label} to={link.href} className={className} onClick={onClick}>
      {link.label}
    </Link>;

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
            <Logo size="lg" variant={useLightNav ? "onColor" : "auto"} />
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) =>
              renderLink(
                link,
                cn(
                  "text-sm font-semibold transition-colors",
                  useLightNav
                    ? "text-white/75 hover:text-white"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                )
              )
            )}
            <div className="relative" onMouseEnter={openLearn} onMouseLeave={closeLearn}>
              <button
                type="button"
                aria-expanded={learnOpen}
                aria-haspopup="true"
                onClick={() => setLearnOpen((v) => !v)}
                onFocus={openLearn}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-3 py-1.5 -mx-3 text-sm font-semibold transition-colors",
                  learnOpen && "bg-gray-100 dark:bg-gray-800",
                  useLightNav
                    ? "text-white/75 hover:text-white"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                )}
              >
                Learn
                <ChevronDown className={cn("h-4 w-4 transition-transform", learnOpen && "rotate-180")} />
              </button>
            </div>
            <Link
              to="/partners"
              className={cn(
                "relative inline-flex items-center text-sm font-bold leading-normal",
                useLightNav
                  ? "text-white"
                  : "text-brand-800 dark:text-brand-200"
              )}
            >
              <motion.span
                className={cn("absolute -top-3 left-0 whitespace-nowrap text-[9px] font-extrabold uppercase leading-none tracking-wide", useLightNav ? "text-brand-300" : "text-brand-600 dark:text-brand-300")}
                animate={{ opacity: [0, 1, 1, 0], y: [4, 0, 0, -4] }}
                transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.18, 0.82, 1], ease: "easeInOut" }}
              >
                30% recurring
              </motion.span>
              <span className="relative">
                <motion.span
                  className="inline-block bg-clip-text text-transparent"
                  style={{
                    backgroundImage: useLightNav
                      ? "linear-gradient(90deg, #ffffff, #9ee56f, #d9b8ea, #ffffff)"
                      : "linear-gradient(90deg, #2f7d32, #8a47a0, #66b83e, #2f7d32)",
                    backgroundSize: "250% 100%",
                  }}
                  animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                >
                  Partner With Us
                </motion.span>
                <motion.span
                  className="absolute -bottom-1 left-0 h-0.5 rounded-full bg-gradient-to-r from-brand-500 to-plum-500"
                  animate={{ left: ["0%", "72%", "0%"], width: ["28%", "28%", "28%"], opacity: [0.45, 1, 0.45] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </span>
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-3 md:gap-6 shrink-0">
            {isLoggedIn ? (
              <Link to="/dashboard">
                  <Button size="sm" className={cn("gap-2 px-4 md:h-10 md:px-5", useLightNav && "bg-white text-gray-950 hover:bg-gray-100")}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button size="sm" className={cn("border-none shadow-none px-4 md:h-10 md:px-5", useLightNav ? "!bg-white/90 !text-gray-950 hover:!bg-white" : "!bg-gray-200 !text-black")}>
                    Login
                  </Button>
                </Link>
                <Link to="/enquire">
                  <Button size="sm" className={cn("px-4 md:h-10 md:px-5", useLightNav && "bg-brand-500 text-white hover:bg-brand-400")}>
                    Enquire
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className={cn(
              "lg:hidden h-10 w-10 flex items-center justify-center rounded-full transition-colors",
              useLightNav
                ? "text-white hover:bg-white/10"
                : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
            )}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {learnOpen && (
          <motion.div
            key="learn-panel"
            className="absolute left-0 right-0 top-full hidden border-t border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950 lg:block"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            onMouseEnter={openLearn}
            onMouseLeave={closeLearn}
          >
            <div className="container mx-auto grid grid-cols-[1fr_1fr_1fr_1.6fr] gap-10 px-6 py-10 sm:px-8 md:px-12 lg:px-20 xl:px-28">
              {LEARN_COLUMNS.map((col) => (
                <div key={col.title}>
                  <p className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.2em] text-gray-400">{col.title}</p>
                  <ul className="space-y-4">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        <Link to={l.href} className="text-base font-semibold text-gray-900 transition-colors hover:text-brand-600 dark:text-gray-100">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div>
                <p className="mb-5 font-mono text-xs font-medium uppercase tracking-[0.2em] text-gray-400">Customer stories</p>
                <Link to={`/customers/${featuredStory.slug}`} className="block rounded-2xl bg-gray-50 p-6 transition-colors hover:bg-brand-50 dark:bg-gray-900 dark:hover:bg-gray-800">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-plum-500 text-sm font-bold text-white">{featuredStory.initials}</span>
                  <p className="mt-4 text-lg font-semibold leading-snug text-gray-900 dark:text-white">“{featuredStory.headline}”</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-gray-900 dark:text-white">
                    Read the story <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="right" className="w-72">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="flex flex-col h-full pt-10">
            <div className="flex flex-col gap-1">
              <Link
                to="/partners"
                onClick={() => setIsMobileOpen(false)}
                className="mb-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-brand-900 dark:border-brand-800 dark:bg-brand-950/40 dark:text-brand-100"
              >
                <span className="block text-base font-bold">Partner With Us</span>
                <span className="mt-1 block text-xs font-semibold text-brand-600 dark:text-brand-300">Earn 30% recurring commission</span>
              </Link>
              {LEARN_COLUMNS.flatMap((c) => c.links).map((link) =>
                renderLink(
                  link,
                  "px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
                  () => setIsMobileOpen(false)
                )
              )}
              <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
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
