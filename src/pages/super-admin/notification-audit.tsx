import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { format, formatDistanceToNow } from "date-fns"
import {
  ArrowLeft, BellRing, ShieldCheck, RefreshCw, Smartphone, Send, ShieldQuestion, Trash2,
  CheckCircle2, XCircle, MinusCircle, Search, AlertTriangle, Radio,
} from "lucide-react"
import {
  Bar, BarChart, CartesianGrid, Legend, Line, ComposedChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getUserInfo, isSuperAdmin as checkIsSuperAdmin, cn } from "@/lib/utils"
import {
  deleteAuditDevice, getAuditDevices, getAuditLogs, getAuditNotifications, getAuditOrganisations,
  getAuditSummary, getAuditUserDetail, getAuditUsers, lookupAuditUsers, testUserPush,
  type AuditScope, type Health, type PushLogRow, type TestPushResult,
} from "@/services/notificationAuditService"

const LIVE_INTERVAL_MS = 5_000

const HEALTH: Record<Health, { label: string; cls: string; hint: string }> = {
  healthy: { label: "Healthy", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300", hint: "Device registered and the last push was accepted by FCM." },
  untested: { label: "No pushes yet", cls: "bg-sky-500/15 text-sky-700 dark:text-sky-300", hint: "Device registered, but no push has been attempted since logging started." },
  failing: { label: "Failing", cls: "bg-destructive/15 text-destructive", hint: "The most recent push attempt failed - open the user for the error code." },
  no_device: { label: "No device", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300", hint: "No phone has registered for push - the user has never opened the mobile app, or signed out." },
  stale_device: { label: "App not opened", cls: "bg-orange-500/15 text-orange-700 dark:text-orange-300", hint: "The registered phone has not opened the app for a week or more." },
  push_disabled: { label: "Push off", cls: "bg-slate-500/15 text-slate-700 dark:text-slate-300", hint: "The user turned push notifications off in their notification preferences." },
  inactive: { label: "Inactive user", cls: "bg-muted text-muted-foreground", hint: "The account is deactivated." },
}

const STATUS_ICON = {
  sent: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
  failed: <XCircle className="h-4 w-4 text-destructive" />,
  skipped: <MinusCircle className="h-4 w-4 text-amber-600" />,
} as const

const ERROR_HELP: Record<string, string> = {
  "messaging/registration-token-not-registered": "Phone uninstalled / cleared the app - token is dead (auto-removed).",
  "messaging/invalid-registration-token": "Token is malformed - auto-removed.",
  no_device: "User has no registered phone.",
  push_disabled: "User disabled push in preferences.",
  fcm_not_configured: "Firebase credentials missing on the server.",
  "messaging/third-party-auth-error": "Firebase / APNs credentials problem.",
  "messaging/quota-exceeded": "FCM rate limit hit.",
  "messaging/server-unavailable": "FCM temporarily unavailable.",
  "messaging/internal-error": "FCM internal error.",
}

const ago = (d?: string | null) => (d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : "-")
const stamp = (d?: string | null) => (d ? format(new Date(d), "dd MMM, HH:mm:ss") : "-")
const toIso = (v: string) => (v ? new Date(v).toISOString() : "")

function HealthBadge({ health }: { health: Health }) {
  const h = HEALTH[health]
  return <Badge title={h.hint} className={cn("font-medium border-0 whitespace-nowrap", h.cls)}>{h.label}</Badge>
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium capitalize">
      {STATUS_ICON[status as keyof typeof STATUS_ICON]}{status}
    </span>
  )
}

function Pager({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between pt-3 text-sm text-muted-foreground">
      <span>{total.toLocaleString()} record{total === 1 ? "" : "s"}</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
        <span>Page {page} / {pages}</span>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</Button>
      </div>
    </div>
  )
}

function Kpi({ label, value, sub, tone }: { label: string; value: number | string; sub?: string; tone?: "bad" | "warn" | "good" }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={cn("text-2xl font-bold mt-1", tone === "bad" && "text-destructive", tone === "warn" && "text-amber-600", tone === "good" && "text-emerald-600")}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  )
}

function DateRange({ from, to, onFrom, onTo }: { from: string; to: string; onFrom: (v: string) => void; onTo: (v: string) => void }) {
  return (
    <>
      <Input type="datetime-local" value={from} onChange={(e) => onFrom(e.target.value)} className="h-9 w-48 rounded-full" title="From" />
      <Input type="datetime-local" value={to} onChange={(e) => onTo(e.target.value)} className="h-9 w-48 rounded-full" title="To" />
    </>
  )
}

/** Debounced search box + result list used to scope every tab to one user. */
function UserPicker({ organisationId, value, onChange }: {
  organisationId?: string
  value: { id: string; name: string } | null
  onChange: (u: { id: string; name: string } | null) => void
}) {
  const [q, setQ] = useState("")
  const [dq, setDq] = useState("")
  const [open, setOpen] = useState(false)
  useEffect(() => { const t = setTimeout(() => setDq(q), 250); return () => clearTimeout(t) }, [q])
  const { data = [] } = useQuery({
    queryKey: ["notif-audit", "user-lookup", organisationId, dq],
    queryFn: () => lookupAuditUsers(organisationId, dq),
    enabled: open,
  })
  if (value) {
    return (
      <Badge variant="secondary" className="h-9 pl-3 pr-1 gap-2 rounded-full">
        {value.name}
        <button className="rounded-full hover:bg-background px-2" onClick={() => onChange(null)} aria-label="Clear user">x</button>
      </Badge>
    )
  }
  return (
    <div className="relative">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        value={q} placeholder="Filter by user..." className="h-9 w-56 rounded-full pl-9"
        onChange={(e) => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <div className="absolute z-50 mt-1 w-80 max-h-72 overflow-auto rounded-lg border bg-popover shadow-lg">
          {data.length === 0 && <div className="p-3 text-sm text-muted-foreground">No users</div>}
          {data.map((u) => (
            <button key={u.id} className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
              onMouseDown={() => { onChange({ id: u.id, name: u.name }); setQ("") }}>
              <div className="font-medium">{u.name}</div>
              <div className="text-xs text-muted-foreground">{u.email}{u.organisationName ? ` · ${u.organisationName}` : ""}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function NotificationAuditPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [me] = useState(() => getUserInfo())
  const hasAccess = checkIsSuperAdmin(me)

  const [org, setOrg] = useState("all")
  const [pickedUser, setPickedUser] = useState<{ id: string; name: string } | null>(null)
  const [live, setLive] = useState(true)
  const [tab, setTab] = useState("overview")
  const [detailId, setDetailId] = useState<string | null>(null)

  const scope: AuditScope = { organisationId: org === "all" ? undefined : org, userId: pickedUser?.id }
  const refetchInterval = live ? LIVE_INTERVAL_MS : false

  const { data: orgs = [] } = useQuery({ queryKey: ["notif-audit", "orgs"], queryFn: getAuditOrganisations, enabled: hasAccess })

  // Clear a picked user when the organisation changes - they may not belong to it.
  useEffect(() => { setPickedUser(null) }, [org])

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-screen p-6">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <ShieldCheck className="h-14 w-14 text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-sm text-muted-foreground text-center">Only the platform super admin can audit notifications.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/super-admin")}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <BellRing className="h-6 w-6 sm:h-7 sm:w-7 text-primary" /> Notification Audit
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Live view of notifications, registered phones and push delivery - by organisation and by user.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <Radio className={cn("h-4 w-4", live ? "text-emerald-600 animate-pulse" : "text-muted-foreground")} />
            Live
            <Switch checked={live} onCheckedChange={setLive} />
          </label>
          <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ["notif-audit"] })}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={org} onValueChange={setOrg}>
          <SelectTrigger className="w-64 h-9 rounded-full bg-background"><SelectValue placeholder="Organisation" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All organisations</SelectItem>
            {orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <UserPicker organisationId={scope.organisationId} value={pickedUser} onChange={setPickedUser} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="logs">Push delivery log</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab scope={scope} refetchInterval={refetchInterval} goto={setTab} /></TabsContent>
        <TabsContent value="users"><UsersTab scope={scope} refetchInterval={refetchInterval} onOpen={setDetailId} /></TabsContent>
        <TabsContent value="notifications"><NotificationsTab scope={scope} refetchInterval={refetchInterval} /></TabsContent>
        <TabsContent value="logs"><LogsTab scope={scope} refetchInterval={refetchInterval} /></TabsContent>
        <TabsContent value="devices"><DevicesTab scope={scope} refetchInterval={refetchInterval} /></TabsContent>
      </Tabs>

      <UserDetailDialog userId={detailId} onClose={() => setDetailId(null)} />
    </div>
  )
}

/* ------------------------------------------------------------------ Overview */

function OverviewTab({ scope, refetchInterval, goto }: { scope: AuditScope; refetchInterval: number | false; goto: (t: string) => void }) {
  const [hours, setHours] = useState("24")
  const { data: s, isLoading } = useQuery({
    queryKey: ["notif-audit", "summary", scope.organisationId, hours],
    queryFn: () => getAuditSummary(scope, Number(hours)),
    refetchInterval,
  })

  const findings = useMemo(() => {
    if (!s) return []
    const out: { tone: "bad" | "warn"; text: string }[] = []
    if (!s.fcmConfigured) out.push({ tone: "bad", text: "Firebase credentials are NOT configured on the server - no push can be sent at all." })
    if (s.push.failed > 0) out.push({ tone: "bad", text: `${s.push.failed} push attempt(s) failed in this window - see "Top delivery errors" and the Push delivery log.` })
    if (s.users.withoutDevice > 0) out.push({ tone: "warn", text: `${s.users.withoutDevice} active user(s) have no registered phone - they can never receive push.` })
    if (s.devices.stale > 0) out.push({ tone: "warn", text: `${s.devices.stale} registered phone(s) have not opened the app in ${s.devices.staleAfterDays}+ days.` })
    if (s.users.pushDisabled > 0) out.push({ tone: "warn", text: `${s.users.pushDisabled} user(s) turned push off in their preferences.` })
    return out
  }, [s])

  if (isLoading || !s) return <div className="py-12 text-center text-muted-foreground">Loading...</div>

  const chart = s.timeline.map((p) => ({
    ...p, label: format(new Date(p.t), s.bucket === "hour" ? "dd MMM HH:mm" : "dd MMM"),
  }))

  return (
    <div className="space-y-4 pt-3">
      <div className="flex items-center gap-2">
        <Badge className={cn("border-0", s.fcmConfigured ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-destructive/15 text-destructive")}>
          {s.fcmConfigured ? "Firebase configured" : "Firebase NOT configured"}
        </Badge>
        <div className="flex-1" />
        <Select value={hours} onValueChange={setHours}>
          <SelectTrigger className="w-40 h-9 rounded-full bg-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last hour</SelectItem>
            <SelectItem value="6">Last 6 hours</SelectItem>
            <SelectItem value="24">Last 24 hours</SelectItem>
            <SelectItem value="168">Last 7 days</SelectItem>
            <SelectItem value="720">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {findings.length > 0 && (
        <Card className="border-amber-500/40">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" />Findings</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {findings.map((f, i) => <div key={i} className={f.tone === "bad" ? "text-destructive" : ""}>• {f.text}</div>)}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Active users" value={s.users.active} />
        <Kpi label="With a phone registered" value={s.users.withDevice} tone="good" />
        <Kpi label="No phone registered" value={s.users.withoutDevice} tone={s.users.withoutDevice ? "warn" : undefined} />
        <Kpi label="Push turned off by user" value={s.users.pushDisabled} />
        <Kpi label="Registered phones" value={s.devices.total} sub={`${s.devices.stale} unopened ${s.devices.staleAfterDays}d+`} tone={s.devices.stale ? "warn" : undefined} />
        <Kpi label={`Notifications (${hours}h)`} value={s.notifications.inWindow} sub={`${s.notifications.unreadTotal.toLocaleString()} unread overall`} />
        <Kpi label="Push accepted by FCM" value={s.push.sent} tone="good" />
        <Kpi label="Push failed / skipped" value={`${s.push.failed} / ${s.push.skipped}`} tone={s.push.failed ? "bad" : undefined} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Notifications vs push outcomes</CardTitle>
          <CardDescription>Push logging started when this panel was deployed - earlier history only exists for notifications.</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" fontSize={11} />
              <YAxis fontSize={11} />
              <RTooltip />
              <Legend />
              <Bar dataKey="sent" stackId="p" fill="#10b981" name="Push sent" />
              <Bar dataKey="failed" stackId="p" fill="#ef4444" name="Push failed" />
              <Bar dataKey="skipped" stackId="p" fill="#f59e0b" name="Push skipped" />
              <Line dataKey="notifications" stroke="#6366f1" strokeWidth={2} dot={false} name="Notifications created" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Top delivery errors / skip reasons</CardTitle></CardHeader>
        <CardContent>
          {s.topErrors.length === 0 ? <div className="text-sm text-muted-foreground">None in this window.</div> : (
            <div className="space-y-2">
              {s.topErrors.map((e) => (
                <div key={`${e.errorCode}-${e.status}`} className="flex items-center gap-3 text-sm">
                  <StatusBadge status={e.status} />
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{e.errorCode}</code>
                  <span className="text-muted-foreground flex-1">{ERROR_HELP[e.errorCode] ?? ""}</span>
                  <span className="font-semibold">{e.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
          <div className="pt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => goto("users")}>Review users</Button>
            <Button variant="outline" size="sm" onClick={() => goto("logs")}>Open delivery log</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/* --------------------------------------------------------------------- Users */

function UsersTab({ scope, refetchInterval, onOpen }: { scope: AuditScope; refetchInterval: number | false; onOpen: (id: string) => void }) {
  const [state, setState] = useState("all")
  const [search, setSearch] = useState("")
  const [includeInactive, setIncludeInactive] = useState(false)
  const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [scope.organisationId, scope.userId, state, search, includeInactive])

  const { data, isLoading } = useQuery({
    queryKey: ["notif-audit", "users", scope, state, search, includeInactive, page],
    queryFn: () => getAuditUsers({ organisationId: scope.organisationId, userId: scope.userId, search: search || undefined, state, includeInactive, page, limit: 50 }),
    refetchInterval,
  })
  const rows = data?.users ?? []

  return (
    <div className="pt-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email..." className="h-9 w-64 rounded-full" />
        <Select value={state} onValueChange={setState}>
          <SelectTrigger className="w-52 h-9 rounded-full bg-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            <SelectItem value="no_device">No phone registered</SelectItem>
            <SelectItem value="has_device">Has a phone</SelectItem>
            <SelectItem value="stale">App not opened 7d+</SelectItem>
            <SelectItem value="failing">Push failing (24h)</SelectItem>
            <SelectItem value="push_disabled">Push turned off</SelectItem>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-2 text-sm"><Switch checked={includeInactive} onCheckedChange={setIncludeInactive} /> Include inactive</label>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>User</TableHead><TableHead>Organisation</TableHead><TableHead>Health</TableHead>
            <TableHead className="text-right">Phones</TableHead><TableHead>App last opened</TableHead>
            <TableHead className="text-right">Notifs 24h</TableHead><TableHead className="text-right">Unread</TableHead>
            <TableHead>Push 24h (ok/fail/skip)</TableHead><TableHead>Last push</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
            {!isLoading && rows.length === 0 && <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No users match.</TableCell></TableRow>}
            {rows.map((u) => (
              <TableRow key={u.id} className="cursor-pointer" onClick={() => onOpen(u.id)}>
                <TableCell><div className="font-medium">{u.name}</div><div className="text-xs text-muted-foreground">{u.email}</div></TableCell>
                <TableCell className="text-sm">{u.organisationName ?? "-"}</TableCell>
                <TableCell><HealthBadge health={u.health} /></TableCell>
                <TableCell className="text-right">{u.deviceCount}</TableCell>
                <TableCell className="text-sm whitespace-nowrap">{ago(u.lastDeviceSeen)}</TableCell>
                <TableCell className="text-right">{u.notifications24h.toLocaleString()}</TableCell>
                <TableCell className="text-right">{u.unread.toLocaleString()}</TableCell>
                <TableCell className="text-sm whitespace-nowrap">{u.push24h.sent} / <span className={u.push24h.failed ? "text-destructive font-semibold" : ""}>{u.push24h.failed}</span> / {u.push24h.skipped}</TableCell>
                <TableCell className="text-sm">{u.lastPush ? <span className="inline-flex items-center gap-1"><StatusBadge status={u.lastPush.status} /><span className="text-xs text-muted-foreground">{ago(u.lastPush.at)}</span></span> : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
      {data && <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} />}
    </div>
  )
}

/* ------------------------------------------------------------- Notifications */

function NotificationsTab({ scope, refetchInterval }: { scope: AuditScope; refetchInterval: number | false }) {
  const [type, setType] = useState("all")
  const [isRead, setIsRead] = useState("all")
  const [search, setSearch] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [scope.organisationId, scope.userId, type, isRead, search, from, to])

  const { data, isLoading } = useQuery({
    queryKey: ["notif-audit", "notifications", scope, type, isRead, search, from, to, page],
    queryFn: () => getAuditNotifications({ ...scope, type, isRead, search: search || undefined, from: toIso(from), to: toIso(to), page, limit: 50 }),
    refetchInterval,
  })

  return (
    <div className="pt-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or message..." className="h-9 w-64 rounded-full" />
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40 h-9 rounded-full bg-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {["info", "success", "warning", "error", "reminder", "alert", "high_priority", "popup"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={isRead} onValueChange={setIsRead}>
          <SelectTrigger className="w-36 h-9 rounded-full bg-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Read + unread</SelectItem><SelectItem value="false">Unread</SelectItem><SelectItem value="true">Read</SelectItem>
          </SelectContent>
        </Select>
        <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Time</TableHead><TableHead>Recipient</TableHead><TableHead>Organisation</TableHead>
            <TableHead>Notification</TableHead><TableHead>Type</TableHead><TableHead>Read</TableHead><TableHead>Push</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
            {!isLoading && data?.notifications.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nothing matches.</TableCell></TableRow>}
            {data?.notifications.map((n) => (
              <TableRow key={n.id}>
                <TableCell className="text-sm whitespace-nowrap">{stamp(n.createdAt)}</TableCell>
                <TableCell><div className="font-medium text-sm">{n.recipient?.name ?? "-"}</div><div className="text-xs text-muted-foreground">{n.recipient?.email}</div></TableCell>
                <TableCell className="text-sm">{n.recipient?.organisationName ?? "-"}</TableCell>
                <TableCell className="max-w-md"><div className="font-medium text-sm">{n.title}</div><div className="text-xs text-muted-foreground line-clamp-2">{n.message}</div></TableCell>
                <TableCell><Badge variant="outline">{n.type}</Badge></TableCell>
                <TableCell>{n.isRead ? "Read" : <span className="font-semibold">Unread</span>}</TableCell>
                <TableCell className="text-xs">
                  {n.push
                    ? <span className="inline-flex items-center gap-1">
                        {n.push.sent > 0 && <span className="text-emerald-600">{n.push.sent} sent</span>}
                        {n.push.failed > 0 && <span className="text-destructive" title={n.push.errorCode ?? ""}>{n.push.failed} failed</span>}
                        {n.push.skipped > 0 && <span className="text-amber-600" title={n.push.errorCode ?? ""}>skipped{n.push.errorCode ? `: ${n.push.errorCode}` : ""}</span>}
                      </span>
                    : <span className="text-muted-foreground">not logged</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
      {data && <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} />}
    </div>
  )
}

/* ---------------------------------------------------------------------- Logs */

function LogsTable({ logs, compact = false }: { logs: PushLogRow[]; compact?: boolean }) {
  return (
    <Table>
      <TableHeader><TableRow>
        <TableHead>Time</TableHead>{!compact && <TableHead>User</TableHead>}<TableHead>Title</TableHead><TableHead>Source</TableHead>
        <TableHead>Phone</TableHead><TableHead>Result</TableHead><TableHead>Detail</TableHead><TableHead className="text-right">ms</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {logs.length === 0 && <TableRow><TableCell colSpan={compact ? 7 : 8} className="text-center py-8 text-muted-foreground">No push attempts recorded.</TableCell></TableRow>}
        {logs.map((l) => (
          <TableRow key={l.id}>
            <TableCell className="text-sm whitespace-nowrap">{stamp(l.createdAt)}</TableCell>
            {!compact && <TableCell className="text-sm">{l.user ? <><div className="font-medium">{l.user.name}</div><div className="text-xs text-muted-foreground">{l.user.organisationName}</div></> : l.userId.slice(0, 8)}</TableCell>}
            <TableCell className="text-sm max-w-xs truncate" title={l.title}>{l.title}</TableCell>
            <TableCell><Badge variant="outline">{l.source}</Badge></TableCell>
            <TableCell className="text-xs font-mono">{l.tokenSuffix ? `…${l.tokenSuffix}` : "-"}{l.platform ? ` · ${l.platform}` : ""}</TableCell>
            <TableCell><StatusBadge status={l.status} /></TableCell>
            <TableCell className="text-xs max-w-sm">
              {l.errorCode && <code className="bg-muted px-1.5 py-0.5 rounded">{l.errorCode}</code>}
              {l.errorCode && ERROR_HELP[l.errorCode] && <div className="text-muted-foreground mt-0.5">{ERROR_HELP[l.errorCode]}</div>}
              {!l.errorCode && l.messageId && <span className="text-muted-foreground font-mono">…{l.messageId.slice(-12)}</span>}
            </TableCell>
            <TableCell className="text-right text-xs">{l.latencyMs ?? "-"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function LogsTab({ scope, refetchInterval }: { scope: AuditScope; refetchInterval: number | false }) {
  const [status, setStatus] = useState("all")
  const [source, setSource] = useState("all")
  const [errorCode, setErrorCode] = useState("")
  const [search, setSearch] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [scope.organisationId, scope.userId, status, source, errorCode, search, from, to])

  const { data, isLoading } = useQuery({
    queryKey: ["notif-audit", "logs", scope, status, source, errorCode, search, from, to, page],
    queryFn: () => getAuditLogs({ ...scope, status, source, errorCode: errorCode || undefined, search: search || undefined, from: toIso(from), to: toIso(to), page, limit: 50 }),
    refetchInterval,
  })

  return (
    <div className="pt-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title..." className="h-9 w-52 rounded-full" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36 h-9 rounded-full bg-background"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All results</SelectItem><SelectItem value="sent">Sent</SelectItem><SelectItem value="failed">Failed</SelectItem><SelectItem value="skipped">Skipped</SelectItem></SelectContent>
        </Select>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-40 h-9 rounded-full bg-background"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All sources</SelectItem><SelectItem value="notification">Notifications</SelectItem><SelectItem value="test">Test pushes</SelectItem><SelectItem value="validate">Validations</SelectItem></SelectContent>
        </Select>
        <Input value={errorCode} onChange={(e) => setErrorCode(e.target.value)} placeholder="Exact error code..." className="h-9 w-56 rounded-full" />
        <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">{isLoading ? <div className="py-8 text-center text-muted-foreground">Loading...</div> : <LogsTable logs={data?.logs ?? []} />}</CardContent></Card>
      {data && <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} />}
    </div>
  )
}

/* ------------------------------------------------------------------- Devices */

function DevicesTab({ scope, refetchInterval }: { scope: AuditScope; refetchInterval: number | false }) {
  const qc = useQueryClient()
  const [platform, setPlatform] = useState("all")
  const [state, setState] = useState("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [scope.organisationId, scope.userId, platform, state, search])

  const { data, isLoading } = useQuery({
    queryKey: ["notif-audit", "devices", scope, platform, state, search, page],
    queryFn: () => getAuditDevices({ ...scope, platform, state, search: search || undefined, page, limit: 50 }),
    refetchInterval,
  })
  const remove = useMutation({
    mutationFn: deleteAuditDevice,
    onSuccess: () => { toast.success("Device removed"); qc.invalidateQueries({ queryKey: ["notif-audit"] }) },
    onError: () => toast.error("Could not remove device"),
  })

  return (
    <div className="pt-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user..." className="h-9 w-56 rounded-full" />
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-40 h-9 rounded-full bg-background"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All platforms</SelectItem><SelectItem value="android">Android</SelectItem><SelectItem value="ios">iOS</SelectItem><SelectItem value="unknown">Unknown (older app)</SelectItem></SelectContent>
        </Select>
        <Select value={state} onValueChange={setState}>
          <SelectTrigger className="w-44 h-9 rounded-full bg-background"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="fresh">Opened recently</SelectItem><SelectItem value="stale">Not opened {data?.staleAfterDays ?? 7}d+</SelectItem></SelectContent>
        </Select>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>User</TableHead><TableHead>Organisation</TableHead><TableHead>Phone</TableHead><TableHead>Platform</TableHead>
            <TableHead>First registered</TableHead><TableHead>App last opened</TableHead><TableHead />
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
            {!isLoading && data?.devices.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No devices.</TableCell></TableRow>}
            {data?.devices.map((d) => (
              <TableRow key={d.id}>
                <TableCell><div className="font-medium text-sm">{d.user.name}</div><div className="text-xs text-muted-foreground">{d.user.email}{!d.user.isActive ? " · inactive" : ""}</div></TableCell>
                <TableCell className="text-sm">{d.user.organisationName ?? "-"}</TableCell>
                <TableCell className="text-xs font-mono">…{d.tokenSuffix}</TableCell>
                <TableCell className="text-sm">{d.platform ?? <span className="text-muted-foreground">unknown</span>}</TableCell>
                <TableCell className="text-sm whitespace-nowrap">{stamp(d.createdAt)}</TableCell>
                <TableCell className={cn("text-sm whitespace-nowrap", d.stale && "text-orange-600 font-medium")}>{ago(d.lastSeenAt)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" title="Remove this phone registration (it re-registers on next app launch)"
                    onClick={() => { if (confirm(`Remove ${d.user.name}'s phone …${d.tokenSuffix}?`)) remove.mutate(d.id) }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
      {data && <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} />}
    </div>
  )
}

/* -------------------------------------------------------------- User dialog */

function UserDetailDialog({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const qc = useQueryClient()
  const [results, setResults] = useState<{ dryRun: boolean; list: TestPushResult[]; message?: string } | null>(null)
  useEffect(() => setResults(null), [userId])

  const { data, isLoading } = useQuery({
    queryKey: ["notif-audit", "user-detail", userId],
    queryFn: () => getAuditUserDetail(userId!),
    enabled: !!userId,
    refetchInterval: 5000,
  })
  const test = useMutation({
    mutationFn: (dryRun: boolean) => testUserPush(userId!, dryRun),
    onSuccess: (r) => { setResults({ dryRun: r.dryRun, list: r.results, message: r.message }); qc.invalidateQueries({ queryKey: ["notif-audit"] }) },
    onError: () => toast.error("Test failed to run"),
  })

  return (
    <Dialog open={!!userId} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>{data?.user?.name ?? "User"}</DialogTitle>
          <DialogDescription>
            {data?.user ? `${data.user.email} · ${data.user.organisationName ?? "-"} · ${data.user.role}` : "Loading..."}
          </DialogDescription>
        </DialogHeader>
        {isLoading || !data ? <div className="py-8 text-center text-muted-foreground">Loading...</div> : (
          <div className="space-y-5 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">{data.counts.notifications.toLocaleString()} notifications</Badge>
              <Badge variant="outline">{data.counts.unread.toLocaleString()} unread</Badge>
              {data.user.pushDisabled && <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-300 border-0">Push turned off by user</Badge>}
              {!data.user.isActive && <Badge variant="destructive">Inactive</Badge>}
              <div className="flex flex-wrap gap-2 sm:ml-auto">
              <Button variant="outline" size="sm" disabled={test.isPending} onClick={() => test.mutate(true)}>
                <ShieldQuestion className="h-4 w-4 mr-1" /> Validate phones (no delivery)
              </Button>
              <Button size="sm" disabled={test.isPending} onClick={() => { if (confirm("This sends a real notification to every phone this user is signed in on. Continue?")) test.mutate(false) }}>
                <Send className="h-4 w-4 mr-1" /> Send test push
              </Button>
              </div>
            </div>

            {results && (
              <Card className="border-primary/40"><CardContent className="p-3 space-y-1.5 text-sm">
                <div className="font-semibold">{results.dryRun ? "Validation result (nothing was delivered)" : "Test push result"}</div>
                {results.message && <div className="text-muted-foreground">{results.message}</div>}
                {results.list.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {r.ok ? STATUS_ICON.sent : STATUS_ICON.failed}
                    <span className="font-mono text-xs">…{r.tokenSuffix}</span>
                    <span>{r.ok ? (results.dryRun ? "token accepted by FCM" : "accepted by FCM for delivery") : r.errorCode}</span>
                    {r.deadToken && <span className="text-destructive text-xs">dead token - user must reopen the app</span>}
                    <span className="text-xs text-muted-foreground ml-auto">{r.latencyMs} ms</span>
                  </div>
                ))}
              </CardContent></Card>
            )}

            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><Smartphone className="h-4 w-4" />Registered phones</h3>
              {data.devices.length === 0 ? <div className="text-sm text-muted-foreground">None - this user cannot receive push.</div> : (
                <div className="space-y-1">
                  {data.devices.map((d: any, i: number) => (
                    <div key={i} className="text-sm flex flex-wrap gap-x-4">
                      <span className="font-mono text-xs">…{d.tokenSuffix}</span>
                      <span>{d.platform ?? "unknown platform"}{d.legacy ? " (legacy token)" : ""}</span>
                      <span className="text-muted-foreground">registered {stamp(d.createdAt)}</span>
                      <span className="text-muted-foreground">app opened {ago(d.lastSeenAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2">Recent push attempts</h3>
              <div className="rounded-lg border overflow-x-auto max-w-full">
                <LogsTable compact logs={data.logs} />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2">Latest notifications</h3>
              <div className="space-y-1.5">
                {data.notifications.map((n: any) => (
                  <div key={n.id} className="text-sm flex gap-3">
                    <span className="text-muted-foreground whitespace-nowrap w-36">{stamp(n.createdAt)}</span>
                    <span className="flex-1"><span className="font-medium">{n.title}</span> <span className="text-muted-foreground">{n.message}</span></span>
                    <span>{n.isRead ? "" : "●"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
