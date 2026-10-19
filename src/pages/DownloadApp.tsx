import { useEffect, useState } from "react";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/shared/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  Wrench,
  Download,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Settings2,
} from "lucide-react";
import { getLatestRelease, getDownloadUrl, type AppRelease, type AppReleasePlatform } from "@/services/appReleaseService";
import { formatIST } from "@/lib/dateUtils";

interface AppEntry {
  platform: AppReleasePlatform;
  title: string;
  tagline: string;
  description: string;
  icon: typeof Smartphone;
  accent: string; // tailwind color token, e.g. "blue" | "violet"
  features: string[];
}

const APPS: AppEntry[] = [
  {
    platform: "mobile",
    title: "PypeCRM",
    tagline: "The main app for your sales team",
    description: "Manage leads, follow-ups, and reports from anywhere.",
    icon: Smartphone,
    accent: "blue",
    features: [
      "Lead capture, follow-ups & pipeline on the go",
      "Real-time reports & performance dashboards",
      "Push notifications for new & auto-assigned leads",
      "Works offline-first for field sales reps",
    ],
  },
  {
    platform: "helper",
    title: "PypeCRM Helper",
    tagline: "Companion app for your main device",
    description: "Keeps call recordings and WhatsApp replies in sync with the CRM.",
    icon: Wrench,
    accent: "violet",
    features: [
      "Automatic call recording capture & upload",
      "Syncs WhatsApp replies back into lead timelines",
      "Runs quietly in the background",
      "Pairs with your existing PypeCRM account",
    ],
  },
];

const ACCENT_CLASSES: Record<string, { chip: string; icon: string; ring: string; badge: string }> = {
  blue: {
    chip: "bg-blue-100 dark:bg-blue-900/30",
    icon: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500/10",
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  violet: {
    chip: "bg-violet-100 dark:bg-violet-900/30",
    icon: "text-violet-600 dark:text-violet-400",
    ring: "ring-violet-500/10",
    badge: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  },
};

export default function DownloadApp() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans">
      <SEO
        title="Download the App | Pype CRM"
        description="Download the PypeCRM mobile app and PypeCRM Helper companion app for Android."
        canonical="https://pypecrm.com/download"
      />
      <LandingNavbar />
      <main>
        {/* Hero */}
        <section className="py-20 border-b border-gray-100 dark:border-gray-900">
          <div className="container mx-auto px-4 max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-900 px-4 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 mb-6">
              <Download className="h-3.5 w-3.5" />
              Android &middot; Direct APK Download
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              Download PypeCRM for Android
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              Get the official builds straight from us — always the latest version, no Play Store needed.
            </p>
          </div>
        </section>

        {/* App cards */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto">
              {APPS.map((app) => (
                <AppDownloadCard key={app.platform} app={app} />
              ))}
            </div>
          </div>
        </section>

        {/* Install instructions */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-900">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Installing for the first time?
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                These apps are installed directly from an APK file, not the Play Store — it only takes a minute.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Settings2,
                  title: "Allow this source",
                  body: "When prompted, tap “Settings” and enable “Allow from this source” for your browser or file manager.",
                },
                {
                  icon: Download,
                  title: "Open the downloaded file",
                  body: "Open the .apk from your notifications or Downloads folder and tap Install.",
                },
                {
                  icon: ShieldCheck,
                  title: "Safe & official",
                  body: "Every build is published directly by the PypeCRM team — not a third-party mirror.",
                },
                {
                  icon: CheckCircle2,
                  title: "Always up to date",
                  body: "The app checks for new versions on launch, so you're never stuck on an old build.",
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="flex items-start gap-3 rounded-2xl bg-white dark:bg-gray-900 p-4 shadow-sm"
                >
                  <div className="shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    <step.icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm mb-0.5">{step.title}</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function AppDownloadCard({ app }: { app: AppEntry }) {
  const [release, setRelease] = useState<AppRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const Icon = app.icon;
  const accent = ACCENT_CLASSES[app.accent] ?? ACCENT_CLASSES.blue;

  useEffect(() => {
    let cancelled = false;
    getLatestRelease(app.platform).then((data) => {
      if (!cancelled) {
        setRelease(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [app.platform]);

  return (
    <Card className={`rounded-3xl border-none shadow-sm bg-gray-50 dark:bg-gray-900 ring-1 ${accent.ring} flex flex-col`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className={`inline-flex items-center justify-center p-3 ${accent.chip} rounded-2xl ${accent.icon} mb-4 w-fit`}>
            <Icon className="h-7 w-7" />
          </div>
          {!loading && release && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${accent.badge}`}>
              v{release.versionName}
            </span>
          )}
        </div>
        <CardTitle className="text-2xl">{app.title}</CardTitle>
        <p className={`text-sm font-medium ${accent.icon}`}>{app.tagline}</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{app.description}</p>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        <ul className="space-y-2.5 mb-6">
          {app.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle2 className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${accent.icon}`} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-4 border-t border-gray-200/70 dark:border-gray-800">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking latest version…
            </div>
          ) : release ? (
            <>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                <span>Updated {formatIST(release.releasedAt, "MMM d, yyyy")}</span>
              </div>
              {release.releaseNotes && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">{release.releaseNotes}</p>
              )}
              <a href={getDownloadUrl(app.platform)} className="block">
                <Button className="w-full gap-2 rounded-xl">
                  <Download className="h-4 w-4" />
                  Download APK
                </Button>
              </a>
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">No release published yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
