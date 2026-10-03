import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Sparkles,
  Plus,
  LayoutDashboard,
  Users,
  Target,
  Package,
  FileText,
  Settings,
  Search,
  Bell,
  Zap,
} from "lucide-react";
import Logo from "../shared/Logo";

const clientLogos = [
  "Learnuz",
  "Study Miles",
  "IITS",
  "Skillage",
  "Acadox",
  "Edufolio",
  "World Passport",
  "Edumentora",
  "Emtees",
  "Aptor Studies",
  "WiseHub",
];

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Users, label: "Leads", active: true },
  { icon: Target, label: "Opportunities" },
  { icon: Package, label: "Products" },
  { icon: FileText, label: "Reports" },
  { icon: Settings, label: "Settings" },
];

const leadRows = [
  { name: "Priya Sharma", status: "Won", color: "bg-emerald-100 text-emerald-700", avatar: "bg-rose-200", value: "₹48,000" },
  { name: "Arjun Mehta", status: "Interested", color: "bg-blue-100 text-blue-700", avatar: "bg-sky-200", value: "₹22,500" },
  { name: "Kavya Nair", status: "Qualified", color: "bg-amber-100 text-amber-700", avatar: "bg-amber-200", value: "₹35,000" },
  { name: "Rohit Verma", status: "New", color: "bg-indigo-100 text-indigo-700", avatar: "bg-indigo-200", value: "₹12,000" },
  { name: "Sneha Iyer", status: "Contacted", color: "bg-sky-100 text-sky-700", avatar: "bg-emerald-200", value: "₹28,000" },
];

export default function Hero() {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-white dark:bg-gray-950 selection:bg-blue-100 dark:selection:bg-blue-900">

      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-100/40 dark:bg-blue-900/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob" />
        <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-indigo-100/40 dark:bg-indigo-900/10 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
      </div>

      <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 pl-4 pr-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm mb-7">
              The Best CRM has
              <span className="inline-flex items-center gap-1 text-primary">
                <Sparkles className="h-4 w-4" /> Pype AI
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>

            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight text-gray-900 dark:text-white mb-6 leading-[1.02]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              CRM to replace
              <br />
              every spreadsheet
            </h1>

            <p className="text-xl sm:text-2xl text-gray-500 dark:text-gray-400 mb-10 leading-snug">
              Track leads. Close deals. Infinite pipeline visibility.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
              <Link to="/enquire">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-none transition-transform hover:scale-[1.03]">
                  Get started. It&apos;s FREE! <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left leading-snug">
                Free forever.
                <br />
                No credit card.
              </div>
            </div>
          </motion.div>
        </div>

        {/* Interactive Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mx-0 sm:mx-4 md:mx-8 lg:mx-12"
        >
          <div
            className="relative z-10 rounded-2xl border border-border bg-background shadow-2xl overflow-hidden"
            style={{
              maskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
            }}
          >
            <div className="flex h-[420px] sm:h-[460px]">
              {/* Sidebar - same chrome as the real app's Sidebar.tsx */}
              <div className="hidden sm:flex flex-col w-52 shrink-0 bg-sidebar-bg text-sidebar-text border-r border-sidebar-border">
                <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
                  <Logo size="sm" />
                </div>
                <div className="flex-1 p-3 space-y-1">
                  {navItems.map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm font-semibold cursor-pointer transition-colors ${
                        item.active
                          ? "bg-sidebar-active text-white"
                          : "text-sidebar-text/80 hover:bg-sidebar-hover"
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 min-w-0 flex flex-col bg-background">
                {/* Header - mirrors the real app's Header.tsx */}
                <div className="flex items-center gap-3 px-4 md:px-5 h-14 border-b border-border shrink-0">
                  <div className="flex-1 max-w-xs">
                    <div className="flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1.5 text-sm text-muted-foreground">
                      <Search className="h-3.5 w-3.5 shrink-0" />
                      <span className="hidden sm:inline">Search leads, contacts...</span>
                    </div>
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="h-9 w-9 rounded-full bg-[hsl(var(--chart-5))] text-white flex items-center justify-center cursor-pointer">
                      <Zap className="h-4 w-4 fill-current" />
                    </div>
                    <Bell className="h-4.5 w-4.5 text-foreground/60 cursor-pointer hidden sm:block" />
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-gray-500 border border-border" />
                  </div>
                </div>

                {/* Leads list */}
                <div className="flex-1 min-w-0 overflow-hidden p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-poppins font-semibold text-foreground">Leads</h3>
                    <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-[hsl(var(--chart-5))] text-white text-xs font-semibold px-3 py-1.5 cursor-pointer">
                      <Plus className="h-3.5 w-3.5" /> Add Lead
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3 p-2.5 rounded-[10px] bg-[hsl(var(--chart-5))]/10 text-xs font-poppins text-foreground/80">
                    <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--chart-5))] shrink-0" />
                    Insight: Follow-ups are up 18% this week — 3 leads are close to closing.
                  </div>

                  <div className="rounded-[10px] border border-border bg-card overflow-hidden">
                    {leadRows.map((row) => (
                      <div
                        key={row.name}
                        className="flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-0 hover:bg-muted/40 transition-colors cursor-pointer"
                      >
                        <div className={`h-7 w-7 rounded-full shrink-0 ${row.avatar}`} />
                        <span className="text-sm text-foreground truncate flex-1 min-w-0">{row.name}</span>
                        <span className={`hidden sm:inline-flex text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${row.color}`}>
                          {row.status}
                        </span>
                        <span className="text-sm font-medium text-foreground shrink-0 w-20 text-right">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trusted by */}
        <div className="mt-16 md:mt-14 flex flex-col md:flex-row md:items-center gap-4 md:gap-10">
          <p className="shrink-0 text-[13.5px] font-semibold mt-1 tracking-[0.2em] text-gray-500 dark:text-gray-600">
            TRUSTED BY THE BEST
          </p>
          <div className="relative flex-1 min-w-0 overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 md:w-16 bg-linear-to-r from-white dark:from-gray-950 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 md:w-32 bg-linear-to-l from-white dark:from-gray-950 to-transparent" />
            <div className="flex w-max animate-marquee">
              {[...clientLogos, ...clientLogos].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="shrink-0 px-8 md:px-12 text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-600 grayscale opacity-70 transition-all duration-300 hover:grayscale-0 hover:opacity-100 hover:text-primary"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
