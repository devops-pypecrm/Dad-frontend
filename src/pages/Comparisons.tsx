import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Minus, X, ExternalLink } from "lucide-react";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/shared/SEO";
import { Button } from "@/components/ui/button";

type V = "yes" | "partial" | "no";
interface Cell { v: V; note?: string }
interface Row { feature: string; detail: string; pype: Cell; zoho: Cell; lsq: Cell; hubspot: Cell; fresh: Cell; pipedrive: Cell }

const PRODUCTS = [
  { key: "pype", name: "Pype CRM" },
  { key: "zoho", name: "Zoho CRM" },
  { key: "lsq", name: "LeadSquared" },
  { key: "hubspot", name: "HubSpot" },
  { key: "fresh", name: "Freshsales" },
  { key: "pipedrive", name: "Pipedrive" },
] as const;

const y = (note?: string): Cell => ({ v: "yes", note });
const p = (note: string): Cell => ({ v: "partial", note });
const n = (note?: string): Cell => ({ v: "no", note });

// Competitor values come only from each vendor's official documentation (see SOURCES), checked November 2026.
const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: "WhatsApp & Instagram",
    rows: [
      { feature: "WhatsApp Business inbox inside the CRM", detail: "Official WhatsApp Business API, conversations next to the lead.",
        pype: y(), zoho: y(), lsq: p("Through a third-party WhatsApp provider connector"), hubspot: y(), fresh: y(), pipedrive: p("Beta, Growth plan and above") },
      { feature: "Instagram DMs in the CRM inbox", detail: "Answer Instagram direct messages from the same place you manage leads.",
        pype: y(), zoho: p("Separate Zoho product (Desk / Social)"), lsq: n(), hubspot: y(), fresh: y("Via Freshchat in Freshsales Suite"), pipedrive: p("Marketplace app") },
      { feature: "Instagram comment-to-DM keyword automation", detail: "Someone comments a keyword, they instantly get a DM.",
        pype: y(), zoho: p("Separate product (Zoho Social)"), lsq: n(), hubspot: n(), fresh: p("Via Freshchat / Freshdesk Omni bots"), pipedrive: n() },
      { feature: "Ask-To-Follow comment bots", detail: "Send the link only after the commenter follows your account.",
        pype: y(), zoho: n(), lsq: n(), hubspot: n(), fresh: n(), pipedrive: n() },
    ],
  },
  {
    title: "Lead capture & distribution",
    rows: [
      { feature: "Facebook & Instagram lead ads, captured automatically", detail: "Leads from Meta lead forms arrive in the CRM by themselves.",
        pype: y(), zoho: p("Via the LeadChain extension / Zoho Social"), lsq: p("Paid connector"), hubspot: y(), fresh: p("Via an integration or Zapier"), pipedrive: p("Via Zapier or a marketplace app") },
      { feature: "Round-robin automatic lead assignment", detail: "New leads are shared among the team by rules.",
        pype: y(), zoho: y(), lsq: y(), hubspot: y(), fresh: y(), pipedrive: y() },
    ],
  },
  {
    title: "Field & mobile",
    rows: [
      { feature: "Records calls from the rep's own phone (Android)", detail: "Calls made from the salesperson's own SIM are recorded and attached to the lead.",
        pype: y(), zoho: n(), lsq: y("Android only"), hubspot: n("Carrier calls can't be recorded"), fresh: n("Records calls on Freshworks numbers only"), pipedrive: n("Recording on the web caller only") },
      { feature: "Field visit check-in with GPS", detail: "Reps check in at a customer's location from the mobile app.",
        pype: y(), zoho: y(), lsq: y(), hubspot: n(), fresh: y(), pipedrive: n() },
    ],
  },
  {
    title: "AI",
    rows: [
      { feature: "AI assistant on your own CRM data", detail: "Ask questions about your leads and pipeline in plain language.",
        pype: y(), zoho: y("Zia"), lsq: y("Lumen Assist"), hubspot: y("Breeze"), fresh: y("Freddy AI"), pipedrive: y() },
    ],
  },
];

const SOURCES: { name: string; links: [string, string][] }[] = [
  { name: "Zoho CRM", links: [["WhatsApp Business integration", "https://help.zoho.com/portal/en/kb/crm/connect-with-customers/business-messaging/articles/business-messaging-using-whatsapp-for-business-integration-with-zoho-crm"], ["Instagram and CRM (community)", "https://help.zoho.com/portal/en/community/topic/instagram-messenger-and-crm-integration"], ["Facebook Lead Ads FAQ", "https://help.zoho.com/portal/en/kb/social/faqs/integrations/articles/facebook-lead-ads-frequently-asked-questions"], ["Android check-in", "https://help.zoho.com/portal/en/kb/crm/crm-mobile/android/collaboration-and-communication/articles/working-with-meetings-in-zoho-crm-android-app"]] },
  { name: "LeadSquared", links: [["WhatsApp connector", "https://help.leadsquared.com/whatsapp-business-messaging-connector/"], ["Facebook/Instagram Lead Ads connector", "https://help.leadsquared.com/facebook-lead-ads-connector/"], ["Call & SMS Tracker app", "https://help.leadsquared.com/call-sms-app/"], ["Check-in on mobile", "https://help.leadsquared.com/lead-level-check-in-and-check-out/"], ["Lumen Assist", "https://help.leadsquared.com/leadsquared-lumen/"]] },
  { name: "HubSpot", links: [["WhatsApp in the inbox", "https://knowledge.hubspot.com/inbox/connect-whatsapp-to-the-conversations-inbox"], ["Social inbox", "https://knowledge.hubspot.com/social/use-inbox-streams"], ["Calls from the mobile app", "https://knowledge.hubspot.com/calling/make-calls-from-the-hubspot-mobile-app"]] },
  { name: "Freshsales", links: [["Instagram in Freshchat", "https://crmsupport.freshworks.com/en/support/solutions/articles/50000004435-instagram-integration-for-freshchat"], ["WhatsApp Business", "https://crmsupport.freshworks.com/support/solutions/articles/50000004438-overview-of-whatsapp-business-integration"], ["Auto-assignment", "https://crmsupport.freshworks.com/support/solutions/articles/50000002703-how-to-configure-assignment-rules-to-auto-assign-records-to-your-sales-teams-"], ["Mobile check-in", "https://crmsupport.freshworks.com/support/solutions/articles/50000002952-how-to-check-in-and-check-out-on-the-mobile-app-"], ["Call recording", "https://crmsupport.freshworks.com/support/solutions/articles/50000002676-if-i-am-available-on-mobile-will-the-calls-be-recorded-"]] },
  { name: "Pipedrive", links: [["WhatsApp integration", "https://support.pipedrive.com/en/article/whatsapp-integration"], ["Automatic assignment", "https://support.pipedrive.com/en/article/automatic-assignment"], ["Calling", "https://support.pipedrive.com/en/article/how-can-i-make-calls-in-pipedrive"]] },
];

function Mark({ c, us }: { c: Cell; us?: boolean }) {
  const icon = c.v === "yes"
    ? <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${us ? "bg-violet-600 text-white" : "bg-emerald-100 text-emerald-700"}`}><Check className="h-4 w-4" strokeWidth={3} /></span>
    : c.v === "partial"
      ? <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Minus className="h-4 w-4" strokeWidth={3} /></span>
      : <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-400"><X className="h-4 w-4" strokeWidth={3} /></span>;
  return (
    <div className="flex flex-col items-center gap-1">
      {icon}
      {c.note && <span className="max-w-[9rem] text-center text-[11px] leading-tight text-gray-500">{c.note}</span>}
    </div>
  );
}

export default function Comparisons() {
  const [showSources, setShowSources] = useState(false);
  return (
    <div className="min-h-screen bg-white font-jakarta text-gray-900">
      <SEO title="Pype CRM vs Zoho CRM, LeadSquared, HubSpot, Freshsales & Pipedrive" description="Feature-by-feature comparison of Pype CRM with Zoho CRM, LeadSquared, HubSpot, Freshsales and Pipedrive: WhatsApp, Instagram automation, lead capture, field sales and AI." canonical="https://pypecrm.com/comparisons" keywords="pype crm vs zoho, leadsquared alternative, hubspot alternative india, crm comparison, whatsapp crm, instagram automation crm" />
      <LandingNavbar />

      <section className="px-6 pb-10 pt-32 text-center sm:px-8 md:pt-40">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-violet-600">Compare</p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">Pype CRM vs the rest</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600">WhatsApp, Instagram automation, lead capture and field sales, built into one CRM. See how we compare, feature by feature.</p>
      </section>

      <section className="px-4 pb-6 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 flex flex-wrap items-center justify-center gap-5 text-sm text-gray-600">
            <span className="flex items-center gap-2"><Mark c={{ v: "yes" }} />Built in</span>
            <span className="flex items-center gap-2"><Mark c={{ v: "partial" }} />Add-on, separate product, beta or paid connector</span>
            <span className="flex items-center gap-2"><Mark c={{ v: "no" }} />Not offered natively</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full min-w-[920px] border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="sticky left-0 z-10 w-[30%] bg-gray-50 p-4 text-left font-semibold">Feature</th>
                  {PRODUCTS.map(pr => (
                    <th key={pr.key} className={`p-4 text-center font-semibold ${pr.key === "pype" ? "bg-violet-600 text-white" : ""}`}>{pr.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GROUPS.map(g => (
                  <Fragment key={g.title}>
                    <tr><td colSpan={7} className="bg-violet-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-violet-700">{g.title}</td></tr>
                    {g.rows.map(r => (
                      <tr key={r.feature} className="border-t border-gray-100">
                        <td className="sticky left-0 z-10 bg-white p-4 align-top"><p className="font-semibold">{r.feature}</p><p className="mt-0.5 text-xs text-gray-500">{r.detail}</p></td>
                        {PRODUCTS.map(pr => (
                          <td key={pr.key} className={`p-3 align-top ${pr.key === "pype" ? "bg-violet-50/60" : ""}`}><Mark c={(r as any)[pr.key]} us={pr.key === "pype"} /></td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-center text-xs text-gray-500">
            Competitor details are based on each vendor's public documentation, checked November 2026. Features and plans change; please confirm with the vendor. All trademarks belong to their owners.{" "}
            <button className="font-medium text-violet-600 underline" onClick={() => setShowSources(s => !s)}>{showSources ? "Hide sources" : "View sources"}</button>
          </p>
          {showSources && (
            <div className="mx-auto mt-4 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SOURCES.map(s => (
                <div key={s.name} className="rounded-xl border border-gray-200 p-4 text-left">
                  <p className="mb-2 font-semibold">{s.name}</p>
                  <ul className="space-y-1">{s.links.map(([t, u]) => <li key={u}><a href={u} target="_blank" rel="noreferrer nofollow" className="inline-flex items-center gap-1 text-xs text-violet-700 hover:underline">{t}<ExternalLink className="h-3 w-3" /></a></li>)}</ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-16 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          {[["All in one place", "Leads, follow-ups, WhatsApp and Instagram in one system. No stitching tools together."], ["Easy on day one", "Three daily steps for your team: open follow-ups, call, update the status."], ["We set it up with you", "We import your data, add your team and connect your ads and WhatsApp."]].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><p className="text-lg font-semibold">{t}</p><p className="mt-1 text-sm text-gray-600">{d}</p></div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-violet-600 text-white hover:bg-violet-700"><Link to="/enquire">Start free trial <ArrowRight className="ml-1.5 h-4 w-4" /></Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/instagram-automation">See Instagram automation</Link></Button>
        </div>
      </section>
      <Footer />
    </div>
  );
}
