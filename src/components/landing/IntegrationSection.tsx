import { useState } from "react";
import { motion } from "framer-motion";
import { SlackLogo, TwilioLogo } from "@/components/icons/BrandLogos";
import { cn } from "@/lib/utils";

// Simple Icons' CDN (cdn.simpleicons.org/<slug>) serves each brand's own
// official colored mark directly from a slug - no color param needed, it
// defaults to that brand's real hex. Switched to this from hotlinked
// Wikimedia file URLs, which had gone dead (likely a moved/renamed file on
// their end, not something we control) and were rendering as blank icons.
const integrations = [
  {
    name: "Meta Ads",
    logo: "https://cdn.simpleicons.org/meta",
    description: "Capture leads directly from your Meta Ads campaigns and sync them into your pipeline in real time.",
  },
  {
    name: "WhatsApp",
    logo: "https://cdn.simpleicons.org/whatsapp",
    description: "Chat with leads and customers, send updates, and manage conversations without leaving PYPE.",
  },
  {
    name: "Google Calendar",
    logo: "https://cdn.simpleicons.org/googlecalendar",
    description: "Sync meetings and follow-ups automatically so your team never misses a scheduled call.",
  },
  {
    name: "Gmail",
    logo: "https://cdn.simpleicons.org/gmail",
    description: "Send and track emails from your own Gmail account directly inside the CRM.",
  },
  {
    name: "Stripe",
    logo: "https://cdn.simpleicons.org/stripe",
    description: "Accept payments and track invoices tied directly to your deals and customers.",
  },
];

// Not live yet - shown to signal what's on the roadmap, matching the icon +
// name + description shape of the live integrations above rather than a
// separate list style, just tagged with a "Coming Soon" badge. Also switched
// to the CDN (from local monochrome/grayscale-filtered SVGs) so these show
// in full brand color instead of flat gray.
const comingSoon: {
  name: string;
  logo?: string;
  Icon?: typeof SlackLogo;
  description: string;
}[] = [
  {
    name: "Google Ads",
    logo: "https://cdn.simpleicons.org/googleads",
    description: "Capture leads from Google Ads campaigns straight into your pipeline, alongside Meta Ads.",
  },
  {
    name: "Slack",
    // cdn.simpleicons.org 404s specifically for this slug - the local
    // component already has Slack's real four-color mark hardcoded, so used
    // directly instead of chasing an alternate CDN.
    Icon: SlackLogo,
    description: "Get real-time deal and lead alerts pushed straight into your team's Slack channels.",
  },
  {
    name: "Zapier",
    logo: "https://cdn.simpleicons.org/zapier",
    description: "Connect PYPE to thousands of other apps with no-code Zaps for leads, deals, and tasks.",
  },
  {
    name: "Twilio",
    // Same 404 issue as Slack above.
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
                <img src={app.logo} alt={app.name} className="w-10 h-10 object-contain shrink-0" />
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
                {app.Icon ? (
                  <app.Icon className="w-10 h-10 shrink-0" />
                ) : (
                  <img src={app.logo} alt={app.name} className="w-10 h-10 object-contain shrink-0" />
                )}
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
