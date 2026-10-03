import { useState } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getUserInfo } from "@/lib/utils";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Logo from "../shared/Logo";

export default function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  // Read once per mount rather than via a state/effect pair - this only
  // needs to reflect whatever was true when the landing page loaded (a
  // login/logout elsewhere triggers a full navigation back here anyway).
  const isLoggedIn = !!getUserInfo()?.token;

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

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
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <Logo size="lg" />
          </Link>

          <div className="flex items-center gap-3 md:gap-6">
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
        </div>
      </div>
    </motion.nav>
  );
}
