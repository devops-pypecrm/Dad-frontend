import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Sparkles,
  Hash,
  KanbanSquare,
  ListTodo,
  Plus,
  Home,
  Users,
  MessageSquare,
  Search,
  Bell,
  Pencil,
  Calendar,
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

const railItems = [
  { icon: Home, label: "Home", active: true },
  { icon: Users, label: "Leads" },
  { icon: KanbanSquare, label: "Pipeline" },
  { icon: MessageSquare, label: "Chat" },
  { icon: Sparkles, label: "Pype AI" },
];

const columns = [
  {
    key: "new",
    label: "New",
    color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    dot: "bg-gray-400",
    cards: [
      { title: "Follow up with Priya Sharma", date: "Oct 12", avatar: "bg-rose-200" },
      { title: "Send proposal to Arjun Mehta", date: "Oct 14", avatar: "bg-sky-200" },
    ],
  },
  {
    key: "progress",
    label: "In Progress",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    dot: "bg-blue-500",
    cards: [
      { title: "Call Kavya Nair", sub: "Awaiting Reply", date: "Oct 11", avatar: "bg-amber-200", flag: "Rahul" },
      { title: "Demo for Rohit Verma", date: "Oct 15", avatar: "bg-emerald-200" },
      { title: "Negotiate pricing — Sneha Iyer", date: "Oct 16", avatar: "bg-indigo-200" },
      { title: "Renewal check-in: Karthik S.", date: "Oct 18", avatar: "bg-rose-200" },
    ],
  },
  {
    key: "won",
    label: "Won",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    dot: "bg-emerald-500",
    cards: [
      { title: "Close deal — Ananya Das", date: "Oct 2", avatar: "bg-sky-200" },
      { title: "Confirm payment — Vikram Rao", date: "Oct 5", avatar: "bg-amber-200" },
    ],
  },
];

const chatMessages = [
  { name: "Jake", time: "9:02 am", text: "Demo went well — sending the contract today." },
  { name: "Sarah", time: "9:08 am", text: "Finance approved the discount." },
  { name: "Priya", time: "9:14 am", text: "@Pype AI, what's our win rate this quarter?", mention: true },
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
            className="relative z-10 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
            style={{
              maskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 80%, transparent 100%)",
            }}
          >
            {/* Workspace top bar */}
            <div className="flex items-center gap-3 px-4 md:px-5 h-14 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 shrink-0">
                <Logo size="sm" showText={false} />
                <span className="hidden sm:inline text-sm font-semibold text-gray-800 dark:text-gray-200">Bright Path Academy</span>
              </div>
              <div className="flex-1 flex justify-center px-2">
                <div className="flex items-center gap-2 w-full max-w-xs rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-400">
                  <Search className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">Search</span>
                  <kbd className="hidden sm:inline ml-auto text-[10px] font-semibold text-gray-400 border border-gray-300 dark:border-gray-700 rounded px-1">⌘K</kbd>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-gray-400">
                <Pencil className="h-4 w-4 hidden sm:block cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 transition-colors" />
                <Bell className="h-4 w-4 hidden sm:block cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 transition-colors" />
                <div className="relative">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-indigo-400" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />
                </div>
              </div>
            </div>

            <div className="flex">
              {/* Icon rail */}
              <div className="hidden sm:flex flex-col items-center gap-1 w-16 shrink-0 bg-gray-950 dark:bg-black py-4">
                {railItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={`flex flex-col items-center gap-1 w-13 py-2 rounded-xl text-[10px] font-medium transition-colors cursor-pointer ${
                      item.active
                        ? "bg-white/10 text-white"
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Main board */}
              <div className="flex-1 min-w-0 flex flex-col lg:flex-row">
                <div className="flex-1 min-w-0 p-4 md:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Q4 Pipeline</span>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300 rotate-90" />
                  </div>
                  <div className="flex items-center gap-4 mb-4 text-xs text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">
                    <span className="flex items-center gap-1.5">
                      <ListTodo className="h-3.5 w-3.5" /> List
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white">
                      <KanbanSquare className="h-3.5 w-3.5" /> Board
                    </span>
                    <span className="hidden sm:flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5" /> View
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {columns.map((col) => (
                      <div key={col.key} className="min-w-0">
                        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold mb-2 ${col.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${col.dot}`} />
                          {col.label}
                          <span className="opacity-60">{col.cards.length}</span>
                        </div>
                        <div className="space-y-2">
                          {col.cards.map((card) => (
                            <div
                              key={card.title}
                              className="relative rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-2.5 text-xs shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
                            >
                              <p className="font-medium text-gray-800 dark:text-gray-200 leading-snug mb-2 truncate">{card.title}</p>
                              {card.sub && (
                                <span className="inline-block mb-2 px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-[10px] font-medium">
                                  {card.sub}
                                </span>
                              )}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1 text-gray-400">
                                  <Calendar className="h-3 w-3" />
                                  <span>{card.date}</span>
                                </div>
                                <div className={`h-5 w-5 rounded-full ${card.avatar} shrink-0`} />
                              </div>
                              {card.flag && (
                                <span className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md">
                                  {card.flag}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat panel */}
                <div className="hidden lg:flex flex-col w-64 shrink-0 border-l border-gray-100 dark:border-gray-800 p-4">
                  <div className="flex items-center gap-1.5 mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
                    <Hash className="h-4 w-4 text-gray-400" /> deal-updates
                  </div>
                  <div className="space-y-3 text-xs">
                    {chatMessages.map((m) => (
                      <div key={m.name + m.time}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{m.name}</span>
                          <span className="text-gray-400">{m.time}</span>
                        </div>
                        <p className={`pl-6.5 leading-snug ${m.mention ? "text-primary font-medium" : "text-gray-600 dark:text-gray-400"}`}>
                          {m.text}
                        </p>
                      </div>
                    ))}
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-primary to-indigo-400 flex items-center justify-center shrink-0">
                          <Sparkles className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">Pype AI</span>
                        <span className="text-gray-400">9:14 am</span>
                      </div>
                      <p className="pl-6.5 leading-snug font-semibold text-gray-900 dark:text-gray-100">
                        34% close rate, up 6% from last quarter.
                      </p>
                    </div>
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
