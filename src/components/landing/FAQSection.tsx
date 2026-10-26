import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bot,
  HelpCircle,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";

interface FAQ {
  question: string;
  answer: string;
  /** Optional short step/point list rendered under the answer. */
  points?: { title: string; detail: string }[];
}

const staticFaqs: FAQ[] = [
  {
    question: "What is Pype CRM?",
    answer:
      "Pype is an intelligent sales automation platform designed to help businesses capture, track, and close leads faster using AI-driven insights and multi-channel communication including WhatsApp, SMS, and Email.",
  },
  {
    question: "How can I import my existing leads?",
    answer:
      "You can easily import leads via CSV or Excel files, with column mapping so your data lands in the right fields. We also support direct webhooks from Facebook Ads, Google Ads, and custom landing pages for real-time lead sync.",
    points: [
      { title: "Upload a file", detail: "CSV or Excel, mapped to your fields." },
      { title: "Connect a source", detail: "Facebook Ads, Google Ads and landing pages." },
      { title: "Real-time sync", detail: "New leads appear in your pipeline instantly." },
    ],
  },
  {
    question: "Does Pype support WhatsApp integration?",
    answer:
      "Yes! Pype features a unified WhatsApp Inbox that lets you chat with leads, send template messages, and automate follow-ups directly without switching apps. Every conversation is also saved on the lead's activity timeline.",
  },
  {
    question: "Is there a mobile app available?",
    answer:
      "Absolutely. We have a native Android application that syncs in real-time with the web platform, allowing your field force to manage leads, log and record calls, check in at visits and update statuses on the go.",
  },
  {
    question: "How secure is my data?",
    answer:
      "We use industry-standard AES-256 encryption and secure cloud infrastructure. Every customer is a separate organisation, so your data is isolated and protected. Audit logs record who changed what, and deleted records stay recoverable in Trash for 7 days.",
  },
  {
    question: "Can I automate my follow-ups?",
    answer:
      "Yes, our easy-to-use Workflow Builder allows you to create automated sequences—from immediate welcome messages to multi-day follow-up schedules. Build simple \"If this, then that\" rules, such as creating a task when a lead reaches a certain status.",
    points: [
      { title: "New lead captured", detail: "The trigger that starts a workflow." },
      { title: "Welcome message", detail: "Sent immediately to the lead." },
      { title: "Follow-up reminders", detail: "Scheduled over the following days." },
    ],
  },
  {
    question: "How are new leads assigned to my team?",
    answer:
      "Assignment Rules route brand-new leads the moment they arrive, for example round-robin across selected team members, so no lead waits for manual assignment. Pype handles the routing for you, and a separate Shuffler can redistribute older, stuck leads.",
  },
  {
    question: "Can I connect Facebook and Instagram lead ads?",
    answer:
      "Yes. Connect your Meta account, choose your pages and ad accounts, and pick exactly which campaigns are allowed to send leads into Pype. New leads arrive in near real-time, with a safety-net check in case a webhook is ever missed.",
  },
  {
    question: "Can I track and record my team's calls?",
    answer:
      "Calls made from the Android app are logged automatically and, if you enable it in Call Settings, recorded. The recording attaches to that lead's timeline so managers can review conversations.",
  },
  {
    question: "Can I manage deals, quotes and EMI payments?",
    answer:
      "Yes. Move deals through a configurable pipeline on a Kanban board, build quotes from your product catalog, and set up EMI schedules where each installment tracks paid, pending and overdue status on its own.",
  },
  {
    question: "What reports and analytics do I get?",
    answer:
      "Pype includes a dedicated report for each angle: sales book, expected revenue, call analytics, daily reports, lead and follow-up reports, lead distribution and field-force activity. Daily summaries can be sent to admins automatically via WhatsApp or email.",
  },
  {
    question: "Can I control who sees what?",
    answer:
      "Yes. Create roles with granular per-module permissions, and organise users in a reporting hierarchy. Managers see their own records plus their team's, while admins see the whole organisation.",
  },
  {
    question: "Can I customise fields and pipelines?",
    answer:
      "Yes. Add your own custom fields to leads, contacts, accounts and opportunities, and configure pipeline stages to match how you sell, all without a developer.",
  },
  {
    question: "Does Pype connect with other tools?",
    answer:
      "Pype integrates with Meta (Facebook and Instagram), WhatsApp, Gmail, Twilio and Slack. It also offers webhooks, a public API, Zapier and SSO, so it can fit into the tools your team already uses.",
  },
  {
    question: "How do I get started or talk to someone?",
    answer:
      "Use the Get Started button on this page to send us an enquiry, and our customer success team will take it from there. They're available 24/7 if you have questions along the way.",
  },
];

// ---- AI chat -------------------------------------------------------------

interface ChatMessage {
  id: number;
  role: "assistant" | "user";
  text: string;
}

const suggestions = [
  "How does lead assignment work?",
  "What does the Android app do?",
  "Can it connect to Facebook Ads?",
];

// Tiny renderer for the subset of markdown the assistant is told to use.
function renderBold(line: string, key: string) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={`${key}-${i}`}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={`${key}-${i}`}>{part}</span>
    )
  );
}

function AssistantText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => {
        const t = line.trim();
        const ordered = t.match(/^(\d+)\.\s+(.*)/);
        const bullet = t.match(/^[-*]\s+(.*)/);
        if (ordered)
          return (
            <div key={i} className="flex gap-1.5">
              <span className="shrink-0 text-neutral-400">{ordered[1]}.</span>
              <span>{renderBold(ordered[2], `l${i}`)}</span>
            </div>
          );
        if (bullet)
          return (
            <div key={i} className="flex gap-1.5">
              <span className="shrink-0 text-neutral-400">•</span>
              <span>{renderBold(bullet[1], `l${i}`)}</span>
            </div>
          );
        if (!t) return <div key={i} className="h-1.5" />;
        return <div key={i}>{renderBold(line, `l${i}`)}</div>;
      })}
    </>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-1.5 w-1.5 rounded-full bg-neutral-400"
          animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

function AskAI({ className }: { className?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      role: "assistant",
      text: "Hi! 👋 I'm Pype's AI assistant. Ask me anything about the product, integrations, the mobile app or security.",
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || typing) return;
    const history = messages.slice(1).map((m) => ({ role: m.role, text: m.text }));
    setMessages((p) => [...p, { id: Date.now(), role: "user", text }]);
    setInput("");
    setTyping(true);
    try {
      const res = await api.post("/public/faq-chat", { message: text, history });
      const reply = res.data?.reply || "Sorry, I didn't get a response — please try again.";
      setMessages((p) => [...p, { id: Date.now() + 1, role: "assistant", text: reply }]);
    } catch (err: any) {
      const msg =
        err?.response?.status === 429
          ? "You've asked a lot of questions — please try again later or contact our customer success team."
          : "I couldn't reach the assistant right now — please try again in a moment.";
      setMessages((p) => [...p, { id: Date.now() + 1, role: "assistant", text: msg }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-b from-blue-50 to-white dark:border-blue-900/40 dark:from-blue-950/40 dark:to-neutral-900",
        className
      )}
    >
      <div className="flex items-center gap-3 px-5 pt-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30">
          <Bot className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Not here? Ask our AI
          </p>
          <p className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Instant answers · 24/7
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="mt-4 flex-1 space-y-2.5 overflow-y-auto px-5 pb-3 [scrollbar-width:thin]">
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                m.role === "user"
                  ? "rounded-br-md bg-blue-600 text-white"
                  : "rounded-bl-md border border-neutral-200 bg-white text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              )}
            >
              {m.role === "assistant" ? <AssistantText text={m.text} /> : m.text}
            </div>
          </motion.div>
        ))}
        {typing && (
          <div className="flex">
            <div className="rounded-2xl rounded-bl-md border border-neutral-200 bg-white px-3.5 py-2 dark:border-neutral-700 dark:bg-neutral-800">
              <TypingDots />
            </div>
          </div>
        )}
        {messages.length === 1 && !typing && (
          <div className="flex flex-wrap gap-2 pt-1">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50 dark:border-blue-800 dark:bg-neutral-800 dark:text-blue-300"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="m-4 mt-1 flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-1.5 pl-4 dark:border-neutral-700 dark:bg-neutral-800"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder="Ask anything about Pype…"
          className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white"
        />
        <button
          type="submit"
          disabled={!input.trim() || typing}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-all hover:bg-blue-700 disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

// ---- Section -------------------------------------------------------------

export default function FAQSection() {
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState("");

  const { data: dynamicFaqs } = useQuery<{ question: string; answer: string }[]>({
    queryKey: ["public-faqs"],
    queryFn: async () => {
      const res = await api.get("/public/faqs");
      return res.data.faqs;
    },
  });

  // Curated list first; any extra FAQs a super admin added are appended.
  const faqs = useMemo<FAQ[]>(() => {
    const known = new Set(staticFaqs.map((f) => f.question.toLowerCase()));
    const extra = (dynamicFaqs || []).filter((f) => f?.question && !known.has(f.question.toLowerCase()));
    return [...staticFaqs, ...extra];
  }, [dynamicFaqs]);

  const visible = faqs
    .map((f, index) => ({ f, index }))
    .filter(({ f }) => !query.trim() || `${f.question} ${f.answer}`.toLowerCase().includes(query.trim().toLowerCase()));

  const current = faqs[active] ?? faqs[0];
  const related = faqs.filter((_, i) => i !== active).slice(0, 3);

  return (
    <section id="faq" className="overflow-hidden bg-gray-50 py-24 dark:bg-neutral-900/30">
      <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            <HelpCircle className="h-4 w-4" />
            Common Questions
          </div>
          <h2 className="mb-6 text-4xl font-black tracking-tight text-neutral-900 dark:text-white md:text-5xl">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">know.</span>
          </h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Can't find the answer you're looking for? Ask our AI, or reach out to our customer success team 24/7.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)_340px]">
          {/* Questions */}
          <div className="flex max-h-[300px] flex-col rounded-[28px] border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900 lg:max-h-[580px]">
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions…"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-3 text-sm text-neutral-900 outline-none focus:border-blue-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>
            <div className="-mr-1 flex-1 space-y-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
              {visible.length === 0 && (
                <p className="p-4 text-sm text-neutral-500">No match — try asking our AI instead →</p>
              )}
              {visible.map(({ f, index }) => (
                <button
                  key={f.question}
                  onClick={() => setActive(index)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-3 text-left text-[14px] font-semibold transition-all",
                    active === index
                      ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                      : "border-transparent text-neutral-600 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:bg-neutral-800"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                      active === index ? "bg-blue-600 text-white" : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
                    )}
                  >
                    {index + 1}
                  </span>
                  {f.question}
                </button>
              ))}
            </div>
          </div>

          {/* Answer */}
          <div className="rounded-[28px] border border-neutral-200 bg-white p-7 dark:border-neutral-800 dark:bg-neutral-900 md:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={current?.question}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="text-2xl font-extrabold leading-tight tracking-tight text-neutral-900 dark:text-white md:text-3xl">
                  {current?.question}
                </h3>
                <p className="mt-4 text-[17px] leading-relaxed text-neutral-600 dark:text-neutral-400">{current?.answer}</p>

                {current?.points && (
                  <div className="mt-6 space-y-3">
                    {current.points.map((p, i) => (
                      <div
                        key={p.title}
                        className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-extrabold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-[15px] font-bold text-neutral-900 dark:text-white">{p.title}</p>
                          <p className="text-[13px] text-neutral-500 dark:text-neutral-400">{p.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 border-t border-neutral-100 pt-6 dark:border-neutral-800">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neutral-400">Related questions</p>
              <div className="space-y-1">
                {related.map((r) => (
                  <button
                    key={r.question}
                    onClick={() => setActive(faqs.indexOf(r))}
                    className="group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    {r.question}
                    <ArrowRight className="h-4 w-4 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI assistant */}
          <AskAI className="h-[520px] lg:h-[580px]" />
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
          <Sparkles className="h-4 w-4 text-blue-500" />
          Prefer a human? Our customer success team is online 24/7.
        </p>
      </div>
    </section>
  );
}
