import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getAllBroadcasts,
  getBroadcastStats,
  sendBroadcast,
  type Broadcast,
  type BroadcastSeverity,
  type BroadcastAudience,
} from "@/services/broadcastService"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Megaphone,
  ShieldCheck,
  Send,
  CheckCircle2,
  Clock,
  Building2,
  ChevronDown,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { getUserInfo, isSuperAdmin as checkIsSuperAdmin } from "@/lib/utils"

const SEVERITY_STYLES: Record<BroadcastSeverity, string> = {
  info: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  critical: "bg-red-500/15 text-red-700 dark:text-red-300",
  update: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
}

const AUDIENCE_LABEL: Record<BroadcastAudience, string> = {
  all: "Every active user",
  admins: "Organisation admins",
  self: "Just me (test)",
}

export default function SuperAdminBroadcastsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [user] = useState(() => getUserInfo())
  const hasAccess = checkIsSuperAdmin(user)

  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [severity, setSeverity] = useState<BroadcastSeverity>("info")
  const [audience, setAudience] = useState<BroadcastAudience>("admins")
  const [confirmingSend, setConfirmingSend] = useState(false)
  const [statsFor, setStatsFor] = useState<Broadcast | null>(null)

  const { data: broadcasts = [], isLoading } = useQuery({
    queryKey: ["broadcasts", "admin", "all"],
    queryFn: getAllBroadcasts,
    enabled: hasAccess,
  })

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["broadcasts", "stats", statsFor?.id],
    queryFn: () => getBroadcastStats(statsFor!.id),
    enabled: !!statsFor,
  })

  const sendMutation = useMutation({
    mutationFn: () => sendBroadcast({ title: title.trim(), message: message.trim(), severity, audience }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["broadcasts", "admin", "all"] })
      toast.success(res.message)
      setTitle("")
      setMessage("")
      setSeverity("info")
      setAudience("admins")
      setConfirmingSend(false)
    },
    onError: (err: unknown) => {
      const parsed = err as { response?: { data?: { message?: string } } }
      toast.error(parsed.response?.data?.message || "Failed to send broadcast")
    },
  })

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-screen p-6">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <ShieldCheck className="h-14 w-14 text-destructive mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-sm text-muted-foreground text-center">
              Only the platform super admin can send broadcasts.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canSubmit = title.trim().length > 0 && message.trim().length > 0 && !sendMutation.isPending

  const handleSendClick = () => {
    if (!canSubmit) return
    // "all" reaches every active user on the platform - confirm before firing,
    // same caution as any other irreversible, broad-reach action.
    if (audience === "all") {
      setConfirmingSend(true)
    } else {
      sendMutation.mutate()
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/super-admin')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            Broadcasts
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Send a platform-wide popup announcement and track who's acknowledged it, org by org.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2 h-fit">
          <CardHeader>
            <CardTitle className="text-base">Compose Broadcast</CardTitle>
            <CardDescription className="text-xs">
              Shows as a large popup the next time each recipient's app loads.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Meta integration update" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What do you want everyone to know?"
                rows={5}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Severity</Label>
                <Select value={severity} onValueChange={(v) => setSeverity(v as BroadcastSeverity)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Audience</Label>
                <Select value={audience} onValueChange={(v) => setAudience(v as BroadcastAudience)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admins">Org admins only</SelectItem>
                    <SelectItem value="all">Every active user</SelectItem>
                    <SelectItem value="self">Just me (test)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSendClick} disabled={!canSubmit} className="w-full gap-2">
              {sendMutation.isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Broadcast
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">History</CardTitle>
            <CardDescription className="text-xs">Click any broadcast to see acknowledgement by organisation.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-12">
                <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              </div>
            ) : broadcasts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p className="font-medium">No broadcasts sent yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {broadcasts.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setStatsFor(b)}
                    className="w-full text-left flex items-center justify-between gap-3 p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-foreground truncate">{b.title}</p>
                        <Badge className={SEVERITY_STYLES[b.severity]}>{b.severity}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                        <span>{AUDIENCE_LABEL[b.audience]}</span>
                        <span>{formatDistanceToNow(new Date(b.createdAt), { addSuffix: true })}</span>
                        {b.createdBy && <span>by {b.createdBy}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {b.readCount}
                      </span>
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        {b.pendingCount} pending
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground -rotate-90" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirm sending to everyone */}
      <Dialog open={confirmingSend} onOpenChange={setConfirmingSend}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send to every active user?</DialogTitle>
            <DialogDescription>
              This will show a popup to every active user across every organisation on the platform. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmingSend(false)}>Cancel</Button>
            <Button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}>
              {sendMutation.isPending ? "Sending..." : "Yes, send to everyone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Org-by-org acknowledgement breakdown */}
      <Dialog open={!!statsFor} onOpenChange={(open) => !open && setStatsFor(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{statsFor?.title}</DialogTitle>
            <DialogDescription>{statsFor?.message}</DialogDescription>
          </DialogHeader>

          {statsLoading ? (
            <div className="flex justify-center p-8">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          ) : stats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{stats.totalRecipients}</p>
                  <p className="text-xs text-muted-foreground">Total recipients</p>
                </div>
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{stats.totalAcknowledged}</p>
                  <p className="text-xs text-muted-foreground">Acknowledged</p>
                </div>
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{stats.fullyAcknowledgedOrgCount}/{stats.totalOrgCount}</p>
                  <p className="text-xs text-muted-foreground">Orgs fully acknowledged</p>
                </div>
              </div>

              <div className="space-y-2">
                {stats.organisations.map((org) => (
                  <details key={org.organisationId} className="rounded-xl border border-border group">
                    <summary className="flex items-center justify-between gap-3 p-3 cursor-pointer list-none">
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm truncate">{org.organisationName}</span>
                        {org.fullyAcknowledged ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px]">All acknowledged</Badge>
                        ) : (
                          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px]">
                            {org.total - org.acknowledged} pending
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{org.acknowledged}/{org.total}</span>
                    </summary>
                    {org.pendingUsers.length > 0 && (
                      <div className="px-3 pb-3 pt-1 space-y-1 border-t border-border/50 mt-1">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide pt-2">Pending</p>
                        {org.pendingUsers.map((u) => (
                          <div key={u.id} className="flex items-center justify-between text-xs py-1">
                            <span>{u.name}</span>
                            <span className="text-muted-foreground">{u.email}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </details>
                ))}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
