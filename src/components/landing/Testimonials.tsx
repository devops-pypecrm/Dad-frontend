import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { CheckCheck, Mic, MoreVertical, Phone, Plus, RotateCcw, Search, Smile, Users, Video } from "lucide-react";
import { WhatsAppLogo } from "@/components/icons/BrandLogos";

const GROUP_NAME = "Loved by growing teams 💙";

const members = {
  sarah: {
    name: "Sarah Chen",
    role: "VP of Sales, TechFlow",
    initials: "SC",
    nameColor: "text-[#06cf9c]",
    avatar: "bg-[#06cf9c]",
    content:
      "PYPE transformed how we manage leads. The AI scoring is a game-changer – we've seen a 40% increase in conversion rates in just 3 months.",
  },
  marcus: {
    name: "Marcus Rodriguez",
    role: "Marketing Director, GrowthWave",
    initials: "MR",
    nameColor: "text-[#fd8b2a]",
    avatar: "bg-[#fd8b2a]",
    content:
      "The WhatsApp integration is flawless. Being able to run campaigns and chat with customers from one dashboard has saved us countless hours.",
  },
  emily: {
    name: "Emily Watson",
    role: "CEO, Watson Real Estate",
    initials: "EW",
    nameColor: "text-[#a47ef0]",
    avatar: "bg-[#a47ef0]",
    content:
      "Finally, a CRM that my team actually enjoys using. The interface is intuitive, and the mobile app is perfect for our agents in the field.",
  },
  priya: {
    name: "Priya Nair",
    role: "Operations Head, EduBridge",
    initials: "PN",
    nameColor: "text-[#e5679a]",
    avatar: "bg-[#e5679a]",
    content:
      "We moved 6 branches onto PYPE in a single week. Lead assignment is automatic now and nothing slips through the cracks anymore.",
  },
  david: {
    name: "David Kim",
    role: "Founder, SwiftLogix",
    initials: "DK",
    nameColor: "text-[#53bdeb]",
    avatar: "bg-[#53bdeb]",
    content:
      "Follow-up reminders alone paid for the subscription. My reps never forget a callback, and I can see the whole pipeline on my phone.",
  },
  aisha: {
    name: "Aisha Khan",
    role: "Sales Manager, Skyline Realty",
    initials: "AK",
    nameColor: "text-[#ff6b6b]",
    avatar: "bg-[#ff6b6b]",
    content:
      "Site visits, calls and WhatsApp chats all land on the lead timeline. Onboarding new agents takes a day instead of two weeks.",
  },
  rahul: {
    name: "Rahul Mehta",
    role: "Director, Aptor Studies",
    initials: "RM",
    nameColor: "text-[#c9a227]",
    avatar: "bg-[#c9a227]",
    content:
      "Support is quick and the pricing is fair. We tried three other CRMs before this one – PYPE is the only one the whole team stuck with.",
  },
} as const;

type MemberKey = keyof typeof members;

type ChatItem =
  | { id: number; kind: "sys"; text: string }
  | { id: number; kind: "msg"; who: MemberKey; time: string }
  | { id: number; kind: "me"; text: string; time: string };

type Step =
  | { kind: "sys"; text: string; wait: number }
  | { kind: "typing"; who: MemberKey | "me"; wait: number }
  | { kind: "msg"; who: MemberKey; wait: number }
  | { kind: "me"; text: string; wait: number };

const steps: Step[] = [
  { kind: "sys", text: `🔒 Messages and calls are end-to-end encrypted.`, wait: 700 },
  { kind: "sys", text: `Pype CRM created group "Loved by growing teams"`, wait: 900 },
  { kind: "sys", text: "Pype CRM added you", wait: 1100 },
  ...(
    [
      ["sarah"],
      ["me", "Thanks Sarah! 🙌 So glad PYPE is working for you."],
      ["marcus"],
      ["priya"],
      ["me", "Thank you all for the support 💙 We'll keep improving!"],
      ["david"],
      ["aisha"],
      ["me", "Noted! Exciting updates are coming soon 🚀"],
      ["emily"],
      ["rahul"],
      ["me", "Thanks for being with us 🙏 More to come!"],
    ] as [string, string?][]
  ).flatMap<Step>(([k, text]) =>
    k === "me"
      ? [
          { kind: "typing", who: "me", wait: 1300 },
          { kind: "me", text: text!, wait: 1200 },
        ]
      : [
          { kind: "sys", text: `${members[k as MemberKey].name} joined using this group's invite link`, wait: 1000 },
          { kind: "typing", who: k as MemberKey, wait: 2200 },
          { kind: "msg", who: k as MemberKey, wait: 1300 },
        ],
  ),
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const nowTime = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500"
          animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  );
}

function BubbleTail() {
  return (
    <span
      aria-hidden
      className="absolute -left-[7px] top-0 h-3 w-2 bg-white dark:bg-[#202c33]"
      style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
    />
  );
}

export default function Testimonials() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.35 });
  const reduceMotion = useReducedMotion();

  const [phase, setPhase] = useState<"idle" | "notif" | "chat">("idle");
  const [items, setItems] = useState<ChatItem[]>([]);
  const [typing, setTyping] = useState<MemberKey | "me" | null>(null);
  const [done, setDone] = useState(false);
  const [run, setRun] = useState(0);
  const idRef = useRef(0);

  const play = useCallback(async (cancelled: () => boolean) => {
    const wait = async (ms: number) => {
      await sleep(reduceMotion ? 0 : ms);
      return !cancelled();
    };
    setItems([]);
    setTyping(null);
    setDone(false);
    setPhase(reduceMotion ? "chat" : "notif");
    if (!(await wait(2600))) return;
    setPhase("chat");
    if (!(await wait(900))) return;

    for (const step of steps) {
      if (step.kind === "typing") {
        setTyping(step.who);
      } else if (step.kind === "me") {
        setTyping(null);
        setItems((p) => [...p, { id: idRef.current++, kind: "me", text: step.text, time: nowTime() }]);
      } else if (step.kind === "msg") {
        setTyping(null);
        setItems((p) => [...p, { id: idRef.current++, kind: "msg", who: step.who, time: nowTime() }]);
      } else {
        setItems((p) => [...p, { id: idRef.current++, kind: "sys", text: step.text }]);
      }
      if (!(await wait(step.wait))) return;
    }
    setDone(true);
  }, [reduceMotion]);

  useEffect(() => {
    if (!inView) return;
    let stop = false;
    play(() => stop);
    return () => {
      stop = true;
    };
  }, [inView, run, play]);

  // keep the newest message in view without scrolling the page itself
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [items, typing]);

  const typingMember = typing && typing !== "me" ? members[typing] : null;
  const typingName = typing === "me" ? "Pype CRM" : typingMember?.name;

  return (
    <section className="py-24 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Loved by growing teams
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Don't just take our word for it. Here's what our customers have to say.
          </p>
        </div>

        <div ref={sectionRef} className="relative mx-auto max-w-3xl">
          {/* Push notification */}
          <AnimatePresence>
            {phase === "notif" && (
              <motion.div
                initial={{ opacity: 0, y: -24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="absolute left-1/2 top-6 z-20 w-[min(92%,420px)] -translate-x-1/2 rounded-2xl border border-gray-200 bg-white/95 p-3.5 shadow-2xl backdrop-blur dark:border-gray-700 dark:bg-[#202c33]/95"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25d366]">
                    <WhatsAppLogo className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-semibold uppercase tracking-wide">WhatsApp</span>
                      <span>now</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Loved by growing teams 💙</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Pype CRM added you to this group</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* WhatsApp window */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={phase === "chat" ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0.0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="overflow-hidden rounded-3xl border border-gray-200 bg-[#efeae2] shadow-[0_30px_70px_rgba(37,99,235,0.15)] dark:border-gray-800 dark:bg-[#0b141a]"
            style={{ pointerEvents: phase === "chat" ? "auto" : "none" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 bg-[#f0f2f5] px-4 py-2.5 dark:bg-[#202c33]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dfe5e7] text-[#8696a0] dark:bg-[#6b7c85] dark:text-[#cfd9de]">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-medium leading-tight text-[#111b21] dark:text-[#e9edef]">
                  {GROUP_NAME}
                </p>
                <p className="h-4 truncate text-[13px] leading-4 text-[#667781] dark:text-[#8696a0]">
                  {typingName ? (
                    <span className="font-medium text-[#00a884]">{typingName} is typing…</span>
                  ) : (
                    ["Pype CRM", ...items.flatMap((i) => (i.kind === "msg" ? [members[i.who].name.split(" ")[0]] : [])), "You"].join(", ")
                  )}
                </p>
              </div>
              <div className="flex items-center gap-5 text-[#54656f] dark:text-[#aebac1]">
                <Video className="hidden h-5 w-5 sm:block" />
                <Phone className="hidden h-[18px] w-[18px] sm:block" />
                <Search className="h-5 w-5" />
                <MoreVertical className="h-5 w-5" />
              </div>
            </div>

            {/* Chat */}
            <div
              ref={scrollRef}
              className="h-[520px] space-y-1.5 overflow-y-auto px-4 py-4 sm:px-8 sm:py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(11,20,26,0.06) 1.2px, transparent 1.2px)",
                backgroundSize: "22px 22px",
              }}
            >
              <div className="flex justify-center pb-2">
                <span className="rounded-lg bg-white px-3 py-1 text-xs font-medium uppercase text-[#54656f] shadow-sm dark:bg-[#182229] dark:text-[#8696a0]">
                  Today
                </span>
              </div>

              <AnimatePresence initial={false}>
                {items.map((item) =>
                  item.kind === "sys" ? (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex justify-center py-0.5"
                    >
                      <span className="max-w-[85%] rounded-lg bg-[#ffeecd] px-3 py-1 text-center text-[12.5px] text-[#54656f] shadow-sm dark:bg-[#182229] dark:text-[#8696a0]">
                        {item.text}
                      </span>
                    </motion.div>
                  ) : item.kind === "me" ? (
                    <OutgoingBubble key={item.id} text={item.text} time={item.time} />
                  ) : (
                    <MessageBubble key={item.id} who={item.who} time={item.time} />
                  ),
                )}

                {typing === "me" && (
                  <motion.div
                    key="typing-me"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-end pt-1"
                  >
                    <div className="relative rounded-lg rounded-tr-none bg-[#d9fdd3] px-4 py-3 shadow-sm dark:bg-[#005c4b]">
                      <TypingDots />
                    </div>
                  </motion.div>
                )}

                {typingMember && (
                  <motion.div
                    key={`typing-${typing}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-end gap-2 pt-1"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${typingMember.avatar}`}>
                      {typingMember.initials}
                    </div>
                    <div className="relative rounded-lg rounded-tl-none bg-white px-4 py-3 shadow-sm dark:bg-[#202c33]">
                      <BubbleTail />
                      <TypingDots />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input bar */}
            <div className="flex items-center gap-3 bg-[#f0f2f5] px-4 py-2.5 text-[#54656f] dark:bg-[#202c33] dark:text-[#aebac1]">
              <Smile className="h-6 w-6" />
              <Plus className="h-6 w-6" />
              <div className="flex-1 rounded-lg bg-white px-4 py-2.5 text-[15px] text-[#667781] dark:bg-[#2a3942] dark:text-[#8696a0]">
                Type a message
              </div>
              <Mic className="h-6 w-6" />
            </div>
          </motion.div>

          <div className="mt-5 h-6 text-center">
            {done && (
              <button
                onClick={() => setRun((r) => r + 1)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Replay
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MessageBubble({ who, time }: { who: MemberKey; time: string }) {
  const m = members[who];
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="flex items-end gap-2 pt-1"
      style={{ transformOrigin: "left bottom" }}
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${m.avatar}`}>
        {m.initials}
      </div>
      <div className="relative max-w-[85%] rounded-lg rounded-tl-none bg-white px-2.5 pb-1.5 pt-1.5 shadow-sm dark:bg-[#202c33] sm:max-w-[75%]">
        <BubbleTail />
        <p className="flex flex-wrap items-baseline gap-x-2 text-[13.5px] font-medium leading-snug">
          <span className={m.nameColor}>{m.name}</span>
          <span className="text-[11.5px] font-normal text-[#667781] dark:text-[#8696a0]">{m.role}</span>
        </p>
        <p className="mt-0.5 text-[14.5px] leading-[1.4] text-[#111b21] dark:text-[#e9edef]">
          {m.content}
          <span className="float-right ml-3 mt-2 text-[11px] leading-none text-[#667781] dark:text-[#8696a0]">{time}</span>
        </p>
      </div>
    </motion.div>
  );
}

function OutgoingBubble({ text, time }: { text: string; time: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="flex justify-end pt-1"
      style={{ transformOrigin: "right bottom" }}
    >
      <div className="relative max-w-[80%] rounded-lg rounded-tr-none bg-[#d9fdd3] px-2.5 pb-1.5 pt-1.5 shadow-sm dark:bg-[#005c4b] sm:max-w-[65%]">
        <span
          aria-hidden
          className="absolute -right-[7px] top-0 h-3 w-2 bg-[#d9fdd3] dark:bg-[#005c4b]"
          style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
        />
        <p className="text-[14.5px] leading-[1.4] text-[#111b21] dark:text-[#e9edef]">
          {text}
          <span className="float-right ml-3 mt-2 inline-flex items-center gap-1 text-[11px] leading-none text-[#667781] dark:text-[#8696a0]">
            {time}
            <CheckCheck className="h-4 w-4 text-[#53bdeb]" />
          </span>
        </p>
      </div>
    </motion.div>
  );
}
