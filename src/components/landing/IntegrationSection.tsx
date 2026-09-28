import { useState } from "react";
import { motion } from "framer-motion";
import { GoogleAdsLogo, SlackLogo, ZapierLogo, TwilioLogo } from "@/components/icons/BrandLogos";
import { cn } from "@/lib/utils";

const integrations = [
  {
    name: "Meta Ads",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/2560px-Meta_Platforms_Inc._logo.svg.png",
    description: "Capture leads directly from your Meta Ads campaigns and sync them into your pipeline in real time.",
  },
  {
    name: "WhatsApp",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/2044px-WhatsApp.svg.png",
    description: "Chat with leads and customers, send updates, and manage conversations without leaving PYPE.",
  },
  {
    name: "Google Calendar",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/1024px-Google_Calendar_icon_%282020%29.svg.png",
    description: "Sync meetings and follow-ups automatically so your team never misses a scheduled call.",
  },
  {
    name: "Gmail",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/2560px-Gmail_icon_%282020%29.svg.png",
    description: "Send and track emails from your own Gmail account directly inside the CRM.",
  },
  {
    name: "Stripe",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/2560px-Stripe_Logo%2C_revised_2016.svg.png",
    description: "Accept payments and track invoices tied directly to your deals and customers.",
  },
];

// Not live yet - shown to signal what's on the roadmap, matching the icon +
// name + description shape of the live integrations above rather than a
// separate list style, just tagged with a "Coming Soon" badge.
const comingSoon = [
  {
    name: "Google Ads",
    Icon: GoogleAdsLogo,
    description: "Capture leads from Google Ads campaigns straight into your pipeline, alongside Meta Ads.",
  },
  {
    name: "Slack",
    Icon: SlackLogo,
    description: "Get real-time deal and lead alerts pushed straight into your team's Slack channels.",
  },
  {
    name: "Zapier",
    Icon: ZapierLogo,
    description: "Connect PYPE to thousands of other apps with no-code Zaps for leads, deals, and tasks.",
  },
  {
    name: "Twilio",
    Icon: TwilioLogo,
    description: "Send SMS updates and reminders to leads and customers directly from the CRM.",
  },
];

const tabs = [
  { key: "live", label: "Live Integrations" },
  { key: "soon", label: "Coming Soon" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function IntegrationSection() {
  const [activeTab, setActiveTab] = useState<TabKey>("live");

  return (
    <section className="py-24 bg-white dark:bg-gray-950 overflow-hidden">
      <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28">
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 p-1 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm font-medium">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-4 py-1.5 rounded-full transition-colors",
                  activeTab === tab.key
                    ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
            Seamless Integrations
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Connects with your favorite tools - streamline your workflow by connecting PYPE with the apps you use every day.
          </p>
        </div>

        {activeTab === "live" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-12 max-w-5xl mx-auto">
            {integrations.map((app, index) => (
              <motion.div
                key={app.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="flex items-start gap-4 text-left"
              >
                <div className="w-11 h-11 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center shrink-0 p-2">
                  <img src={app.logo} alt={app.name} className="max-w-full max-h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{app.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{app.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-12 max-w-5xl mx-auto">
            {comingSoon.map((app, index) => (
              <motion.div
                key={app.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="flex items-start gap-4 text-left opacity-70"
              >
                <div className="w-11 h-11 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center shrink-0 p-2 grayscale">
                  <app.Icon className="w-full h-full" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{app.name}</h3>
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{app.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
