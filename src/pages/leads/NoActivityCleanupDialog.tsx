import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, RefreshCw, Trash2, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { getUsers } from "@/services/userService"
import {
  executeNoActivityCleanup,
  getNoActivityStatuses,
  previewNoActivityCleanup,
  type NoActivityCleanupFilters,
  type NoActivityCleanupPreview,
} from "@/services/leadService"
import { formatIST } from "@/lib/dateUtils"

const CATEGORY_STYLE: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700",
  closed: "bg-slate-500/10 text-slate-600",
  invalid: "bg-red-500/10 text-red-600",
}

export function NoActivityCleanupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient()
  const [statuses, setStatuses] = useState<string[]>([])
  const [inactiveDays, setInactiveDays] = useState("30")
  const [createdBefore, setCreatedBefore] = useState("")
  const [createdAfter, setCreatedAfter] = useState("")
  const [ownerIds, setOwnerIds] = useState<string[]>([])
  const [includeUnassigned, setIncludeUnassigned] = useState(false)
  const [neverContacted, setNeverContacted] = useState(false)
  const [preview, setPreview] = useState<NoActivityCleanupPreview | null>(null)
  const [confirmText, setConfirmText] = useState("")

  const { data: statusList = [], isFetching: loadingStatuses, refetch: refetchStatuses } = useQuery({
    queryKey: ["no-activity-statuses"],
    queryFn: () => getNoActivityStatuses(false),
    enabled: open,
  })
  const { data: users = [] } = useQuery({ queryKey: ["users", "list"], queryFn: () => getUsers(), enabled: open })

  const filters: NoActivityCleanupFilters = useMemo(() => ({
    statuses,
    inactiveDays: Math.max(30, Number(inactiveDays) || 30),
    createdBefore: createdBefore ? new Date(`${createdBefore}T00:00:00+05:30`).toISOString() : undefined,
    createdAfter: createdAfter ? new Date(`${createdAfter}T00:00:00+05:30`).toISOString() : undefined,
    ownerIds,
    includeUnassigned,
    neverContacted,
  }), [statuses, inactiveDays, createdBefore, createdAfter, ownerIds, includeUnassigned, neverContacted])

  // Any filter change invalidates the previewed list, so what gets deleted is always what was shown.
  const touch = <T,>(setter: (v: T) => void) => (v: T) => { setter(v); setPreview(null); setConfirmText("") }
  const toggle = (list: string[], id: string) => list.includes(id) ? list.filter(x => x !== id) : [...list, id]

  const previewMutation = useMutation({
    mutationFn: () => previewNoActivityCleanup(filters),
    onSuccess: (data) => { setPreview(data); setConfirmText("") },
    onError: (e: any) => toast.error(e.response?.data?.message || "Could not build the preview"),
  })

  const deleteMutation = useMutation({
    mutationFn: () => executeNoActivityCleanup(filters, preview!.total),
    onSuccess: (r) => {
      toast.success(`${r.deleted.toLocaleString()} leads moved to Trash`)
      queryClient.invalidateQueries({ queryKey: ["no-activity-leads"] })
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      queryClient.invalidateQueries({ queryKey: ["lead-health"] })
      setPreview(null); setConfirmText(""); onOpenChange(false)
    },
    onError: (e: any) => { toast.error(e.response?.data?.message || "Delete failed"); setPreview(null) },
  })

  const labelOf = (id: string) => statusList.find(s => s.id === id)?.label || id
  const pick = (cat: string) => touch(setStatuses)(statusList.filter(s => s.category === cat).map(s => s.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-red-600" /> Clean up no-activity leads</DialogTitle>
          <DialogDescription>
            Pick filters, check how many leads match, then delete. Deleted leads go to Trash and are permanently removed after 7 days.
            Leads that became an opportunity, contact or account, or had any activity in the period, are never included.
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">1. Lead statuses</h3>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => pick("invalid")}>Select invalid</Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => pick("closed")}>Select closed</Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" disabled={loadingStatuses}
                onClick={async () => { await getNoActivityStatuses(true); refetchStatuses() }}>
                <RefreshCw className={`h-3 w-3 ${loadingStatuses ? "animate-spin" : ""}`} /> Re-check with AI
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {statusList.map(s => (
              <label key={s.id} className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm cursor-pointer hover:bg-muted/50">
                <Checkbox checked={statuses.includes(s.id)} onCheckedChange={() => touch(setStatuses)(toggle(statuses, s.id))} />
                <span className="flex-1 truncate">{s.label}</span>
                <span className="text-[10px] text-muted-foreground">{(s.leadCount ?? 0).toLocaleString()}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 ${CATEGORY_STYLE[s.category]}`}>
                  {s.source === "ai" && <Sparkles className="h-2.5 w-2.5" />}{s.category}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">2. Filters</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">No activity for at least (days)</label>
              <Input type="number" min={30} value={inactiveDays} onChange={e => touch(setInactiveDays)(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Created before</label>
              <Input type="date" value={createdBefore} onChange={e => touch(setCreatedBefore)(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Created after</label>
              <Input type="date" value={createdAfter} onChange={e => touch(setCreatedAfter)(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={neverContacted} onCheckedChange={v => touch(setNeverContacted)(!!v)} />
            Only leads that were never contacted (no call, WhatsApp, email, meeting or note ever logged)
          </label>
          <div>
            <label className="text-xs text-muted-foreground">Owner (leave all unticked for every owner)</label>
            <div className="max-h-32 overflow-y-auto rounded-lg border p-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={includeUnassigned} onCheckedChange={v => touch(setIncludeUnassigned)(!!v)} /> Unassigned
              </label>
              {(Array.isArray(users) ? users : users.users || []).map((u: any) => (
                <label key={u.id} className="flex items-center gap-2 text-sm truncate">
                  <Checkbox checked={ownerIds.includes(u.id)} onCheckedChange={() => touch(setOwnerIds)(toggle(ownerIds, u.id))} />
                  {u.firstName} {u.lastName || ""}
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">3. Check the list</h3>
            <Button size="sm" disabled={!statuses.length || previewMutation.isPending} onClick={() => previewMutation.mutate()}>
              {previewMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />} Check matching leads
            </Button>
          </div>
          {!statuses.length && <p className="text-xs text-muted-foreground">Select at least one status.</p>}

          {preview && (
            <div className="rounded-lg border p-3 space-y-2">
              <p className="text-sm">
                <b className="text-lg">{preview.total.toLocaleString()}</b> leads match (no activity for {preview.inactiveDays}+ days)
              </p>
              {preview.total > 0 && (
                <>
                  <p className="text-xs text-muted-foreground">
                    {preview.byStatus.map(r => `${labelOf(r.status)}: ${r.count.toLocaleString()}`).join(" · ")}
                    {preview.oldestCreated && ` · created ${formatIST(preview.oldestCreated, "dd MMM yyyy")} – ${formatIST(preview.newestCreated!, "dd MMM yyyy")}`}
                  </p>
                  <div className="text-xs rounded border divide-y max-h-40 overflow-y-auto">
                    {preview.sample.map(l => (
                      <div key={l.id} className="flex justify-between px-2 py-1">
                        <span className="truncate">{l.firstName} {l.lastName || ""} · {l.phone}</span>
                        <span className="text-muted-foreground shrink-0 ml-2">{labelOf(l.status)}</span>
                      </div>
                    ))}
                    {preview.total > preview.sample.length && (
                      <div className="px-2 py-1 text-muted-foreground">…and {(preview.total - preview.sample.length).toLocaleString()} more</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Input className="h-9" placeholder='Type DELETE to confirm' value={confirmText} onChange={e => setConfirmText(e.target.value)} />
                    <Button variant="destructive" disabled={confirmText !== "DELETE" || deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
                      {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                      Delete {preview.total.toLocaleString()}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </DialogContent>
    </Dialog>
  )
}
