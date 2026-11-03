import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { Repeat2, Megaphone, Phone, Mail, User, ExternalLink, MessageSquare, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getReEnquiryHistory, type Lead } from "@/services/leadService"

const SOURCE_LABELS: Record<string, string> = {
  meta_ads: "Meta Ads", meta_leadgen: "Facebook Lead", google_ads: "Google Ads", lead_squared: "LeadSquared",
  website: "Website", whatsapp: "WhatsApp", referral: "Referral", import: "Import", manual: "Manual", api: "API",
  social_media: "Social Media", social: "Social Media", paid_ad: "Paid Ad", cold_call: "Cold Call", email_campaign: "Email Campaign", other: "Other",
}
export function sourceLabel(source?: string | null, details?: Record<string, any> | null) {
  if (!source) return "Unknown source"
  if (source === "api" && details?.originalSource) return String(details.originalSource)
  return SOURCE_LABELS[source] || source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

// Fields we know how to label; anything else short & printable is shown generically below.
const KNOWN: [string, string][] = [
  ["campaignName", "Campaign"], ["metaCampaignName", "Campaign"], ["adsetName", "Ad set"], ["adName", "Ad"], ["formName", "Form"],
  ["pageName", "Page"], ["originalSource", "Original source"], ["utm_source", "UTM source"], ["utm_medium", "UTM medium"], ["utm_campaign", "UTM campaign"],
]
const HIDDEN = new Set(["message", "rawPayload", "reEnquiries", "firstName", "lastName", "email", "phone", ...KNOWN.map(([k]) => k)])

function detailRows(details?: Record<string, any> | null): [string, string][] {
  if (!details) return []
  const rows: [string, string][] = []
  const seen = new Set<string>()
  for (const [k, label] of KNOWN) {
    const v = details[k]
    if (v && typeof v === "string" && !seen.has(label + v)) { rows.push([label, v]); seen.add(label + v) }
  }
  for (const [k, v] of Object.entries(details)) {
    if (HIDDEN.has(k) || v === null || v === undefined || typeof v === "object" || String(v).length > 120) continue
    rows.push([k.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()), String(v)])
  }
  return rows
}

export function ReEnquiryDetailDialog({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useQuery({
    queryKey: ["re-enquiry-history", lead?.id],
    queryFn: () => getReEnquiryHistory(lead!.id),
    enabled: !!lead,
  })
  return (
    <Dialog open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Repeat2 className="h-5 w-5 text-[hsl(var(--chart-5))]" />Re-enquiry details</DialogTitle>
          <DialogDescription>
            {lead ? `${lead.firstName || ""} ${lead.lastName || ""}`.trim() : ""} · {data?.reEnquiryCount ?? lead?.reEnquiryCount ?? 0} re-enquir{(data?.reEnquiryCount ?? lead?.reEnquiryCount ?? 0) === 1 ? "y" : "ies"} — each one shows where it came from and what it said.
          </DialogDescription>
        </DialogHeader>

        {isLoading && <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
        {isError && <p className="text-sm text-destructive py-6 text-center">Couldn't load the re-enquiry history.</p>}
        {data && data.events.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">No re-enquiry records found for this lead.</p>}

        <div className="space-y-3">
          {data?.events.map((ev, i) => {
            const message = ev.details?.message as string | undefined
            const rows = detailRows(ev.details)
            const number = data.events.length - i
            return (
              <div key={ev.eventIndex} className="rounded-[12px] border border-border p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))] text-xs font-bold flex items-center justify-center">{number}</span>
                    <span className="text-sm font-semibold">{format(new Date(ev.date), "dd MMM yyyy, h:mm a")}</span>
                    {i === 0 && <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full">Latest</span>}
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
                    <Megaphone className="h-3 w-3" />{sourceLabel(ev.source, ev.details)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                  {ev.name && <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{ev.name}</span>}
                  {ev.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{ev.phone}</span>}
                  {ev.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{ev.email}</span>}
                </div>

                {rows.length > 0 && (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 rounded-lg bg-muted/40 p-3 text-xs">
                    {rows.map(([k, v]) => (<div key={k + v} className="flex gap-2"><dt className="text-muted-foreground shrink-0">{k}:</dt><dd className="font-medium break-words">{v}</dd></div>))}
                  </dl>
                )}
                {message && (
                  <div className="flex gap-2 rounded-lg border border-dashed p-3 text-sm"><MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" /><p className="whitespace-pre-wrap break-words">{message}</p></div>
                )}
                {!ev.source && rows.length === 0 && !message && <p className="text-xs text-muted-foreground">Older re-enquiry — the source wasn't recorded at the time.</p>}
              </div>
            )
          })}
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="outline" className="rounded-[10px] gap-2" onClick={() => lead && navigate(`/leads/${lead.id}`)}><ExternalLink className="h-4 w-4" />Open lead</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
