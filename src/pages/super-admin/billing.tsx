import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Receipt, Plus, CalendarClock, Printer, Trash2, CheckCircle2, Clock, Building2, Ban, Users, IndianRupee, RotateCcw, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { billingApi, type BillingInvoice, type BillingOrg } from '@/services/superAdminBillingService'
import { InvoiceView } from './InvoiceView'

/** Prints only the invoice, from an isolated iframe (printing the page itself clipped everything below the header inside the dialog). */
function printInvoice(title?: string) {
  const el = document.getElementById('invoice-print')
  if (!el) return
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument!
  const clone = el.cloneNode(true) as HTMLElement
  clone.querySelectorAll('style').forEach((n) => n.remove())
  clone.style.maxWidth = 'none'
  clone.style.padding = '0'
  doc.open()
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title || 'Invoice'}</title><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet"><style>*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}html,body{margin:0;background:#fff}@page{size:A4;margin:12mm}</style></head><body>${clone.outerHTML}</body></html>`)
  doc.close()
  const go = () => { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); setTimeout(() => iframe.remove(), 2000) }
  setTimeout(go, 600)
}

const inr = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`
const fmtDate = (v: string) => new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
const periodLabel = (i: BillingInvoice) => (i.months === 1 ? i.lines[0]?.label : `${i.lines[0]?.label} – ${i.lines[i.lines.length - 1]?.label}`)
const ymNow = () => new Date().toISOString().slice(0, 7)
const errMsg = (e: any) => e?.response?.data?.message || e?.message || 'Something went wrong'

function StatusBadge({ status }: { status: string }) {
  return status === 'paid'
    ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1"><CheckCircle2 className="h-3 w-3" />Paid</Badge>
    : <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 gap-1"><Clock className="h-3 w-3" />Pending</Badge>
}

export default function SuperAdminBillingPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'invoices' | 'organisations'>('invoices')
  const [status, setStatus] = useState('all')
  const [orgFilter, setOrgFilter] = useState('all')
  const [month, setMonth] = useState('')
  const [search, setSearch] = useState('')
  const [genOpen, setGenOpen] = useState(false)
  const [viewId, setViewId] = useState<string | null>(null)
  const [orgOpen, setOrgOpen] = useState<BillingOrg | null>(null)
  const [deleting, setDeleting] = useState<BillingInvoice | null>(null)

  const overview = useQuery({ queryKey: ['billing-overview'], queryFn: billingApi.overview })
  const invoices = useQuery({
    queryKey: ['billing-invoices', status, orgFilter, month],
    queryFn: () => billingApi.invoices({ status: status === 'all' ? undefined : status, organisationId: orgFilter === 'all' ? undefined : orgFilter, month: month || undefined }),
  })
  const refresh = () => { qc.invalidateQueries({ queryKey: ['billing-overview'] }); qc.invalidateQueries({ queryKey: ['billing-invoices'] }); qc.invalidateQueries({ queryKey: ['billing-invoice'] }) }

  const toggleStatus = useMutation({
    mutationFn: ({ id, to }: { id: string; to: 'paid' | 'pending' }) => billingApi.update(id, { status: to }),
    onSuccess: () => { toast.success('Payment status updated'); refresh() }, onError: (e) => toast.error(errMsg(e)),
  })
  const del = useMutation({
    mutationFn: (id: string) => billingApi.remove(id),
    onSuccess: () => { toast.success('Invoice deleted'); setDeleting(null); refresh() }, onError: (e) => toast.error(errMsg(e)),
  })
  const quickPrev = useMutation({
    mutationFn: () => billingApi.generate({ organisationIds: 'all', mode: 'previous' }),
    onSuccess: (r) => { toast.success(`${r.created} invoice(s) created, ${r.skipped.length} skipped (already exist / no active users)`); refresh() }, onError: (e) => toast.error(errMsg(e)),
  })

  const t = overview.data?.totals
  const rows = useMemo(() => (invoices.data || []).filter((i) => !search || (i.organisation?.name || '').toLowerCase().includes(search.toLowerCase()) || i.invoiceNumber.toLowerCase().includes(search.toLowerCase())), [invoices.data, search])
  const orgs = overview.data?.organisations || []

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2"><Receipt className="h-6 w-6" />Billing</h1>
          <p className="text-sm text-muted-foreground">Monthly invoices for client organisations. The previous month is invoiced automatically on the 1st. Nothing is suspended automatically.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-[10px] gap-2" onClick={() => quickPrev.mutate()} disabled={quickPrev.isPending}>
            {quickPrev.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />} Generate last month
          </Button>
          <Button className="rounded-[10px] gap-2" onClick={() => setGenOpen(true)}><Plus className="h-4 w-4" />Custom invoices</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { k: 'Pending amount', v: t ? inr(t.pendingAmount) : '—', icon: Clock, tone: 'text-amber-600 bg-amber-50' },
          { k: 'Pending invoices', v: t?.pendingInvoices ?? '—', icon: Receipt, tone: 'text-blue-600 bg-blue-50' },
          { k: 'Collected', v: t ? inr(t.paidAmount) : '—', icon: CheckCircle2, tone: 'text-green-600 bg-green-50' },
          { k: 'Suspended orgs', v: t?.suspended ?? '—', icon: Ban, tone: 'text-red-600 bg-red-50' },
        ].map((s) => (
          <Card key={s.k} className="finance-card"><CardContent className="p-5 flex items-center gap-4">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${s.tone}`}><s.icon className="h-5 w-5" /></div>
            <div><div className="text-2xl font-semibold">{s.v}</div><div className="text-xs text-muted-foreground">{s.k}</div></div>
          </CardContent></Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList><TabsTrigger value="invoices">Invoices</TabsTrigger><TabsTrigger value="organisations">Organisations</TabsTrigger></TabsList>
      </Tabs>

      {tab === 'invoices' && (
        <Card className="finance-card"><CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search organisation / invoice no." className="pl-9 w-64 rounded-[10px]" /></div>
            <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-36 rounded-[10px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All status</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="paid">Paid</SelectItem></SelectContent></Select>
            <Select value={orgFilter} onValueChange={setOrgFilter}><SelectTrigger className="w-52 rounded-[10px]"><SelectValue placeholder="Organisation" /></SelectTrigger><SelectContent><SelectItem value="all">All organisations</SelectItem>{orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent></Select>
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-44 rounded-[10px]" />
            {(status !== 'all' || orgFilter !== 'all' || month) && <Button variant="ghost" onClick={() => { setStatus('all'); setOrgFilter('all'); setMonth('') }}>Clear</Button>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground border-b">{['Invoice', 'Organisation', 'Period', 'Users', 'Amount', 'Status', ''].map((h) => <th key={h} className="py-2 pr-4 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {invoices.isLoading && <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Loading…</td></tr>}
                {!invoices.isLoading && rows.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">No invoices yet. Use “Generate last month” or “Custom invoices”.</td></tr>}
                {rows.map((i) => (
                  <tr key={i.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="py-3 pr-4"><button className="font-medium text-primary hover:underline" onClick={() => setViewId(i.id)}>{i.invoiceNumber}</button><div className="text-[11px] text-muted-foreground">{i.autoGenerated ? 'Auto' : 'Manual'} · {fmtDate(i.issueDate)}</div></td>
                    <td className="py-3 pr-4">{i.organisation?.name || '—'}</td>
                    <td className="py-3 pr-4">{periodLabel(i)}</td>
                    <td className="py-3 pr-4">{Math.max(...i.lines.map((l) => l.users), 0)}</td>
                    <td className="py-3 pr-4 font-medium">{inr(i.total)}</td>
                    <td className="py-3 pr-4"><StatusBadge status={i.status} />{i.paidAt && <div className="text-[11px] text-muted-foreground">{fmtDate(i.paidAt)}</div>}</td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <Button size="sm" variant="outline" className="rounded-[8px] mr-2" onClick={() => toggleStatus.mutate({ id: i.id, to: i.status === 'paid' ? 'pending' : 'paid' })}>{i.status === 'paid' ? <><RotateCcw className="h-3.5 w-3.5 mr-1" />Mark pending</> : <><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Mark paid</>}</Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleting(i)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      )}

      {tab === 'organisations' && (
        <Card className="finance-card"><CardContent className="p-4">
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-muted-foreground border-b">{['Organisation', 'Status', 'Users', 'Rate / user', 'Pending', 'Paid', 'Auto-bill', ''].map((h) => <th key={h} className="py-2 pr-4 font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o.id} className="border-b last:border-0 hover:bg-muted/40 cursor-pointer" onClick={() => setOrgOpen(o)}>
                  <td className="py-3 pr-4 font-medium flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" />{o.name}</td>
                  <td className="py-3 pr-4">{o.status === 'suspended' ? <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Suspended</Badge> : <Badge variant="outline">Active</Badge>}</td>
                  <td className="py-3 pr-4">{o.seats}</td>
                  <td className="py-3 pr-4">₹{o.rate}</td>
                  <td className="py-3 pr-4">{o.pendingAmount ? <span className="text-amber-600 font-medium">{inr(o.pendingAmount)}</span> : '—'}</td>
                  <td className="py-3 pr-4">{o.paidAmount ? inr(o.paidAmount) : '—'}</td>
                  <td className="py-3 pr-4">{o.billingEnabled ? 'On' : 'Off'}</td>
                  <td className="py-3 text-right text-xs text-primary">Open →</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </CardContent></Card>
      )}

      <GenerateDialog open={genOpen} onOpenChange={setGenOpen} orgs={orgs} onDone={refresh} />
      <InvoiceDialog id={viewId} onClose={() => setViewId(null)} onChanged={refresh} />
      <OrgDialog org={orgOpen} onClose={() => setOrgOpen(null)} onChanged={refresh} onOpenInvoice={(id) => { setOrgOpen(null); setViewId(id) }} />
      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Delete invoice?</DialogTitle><DialogDescription>{deleting?.invoiceNumber} ({deleting?.organisation?.name}) will be removed permanently. You can generate it again afterwards.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><Button variant="destructive" disabled={del.isPending} onClick={() => deleting && del.mutate(deleting.id)}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GenerateDialog({ open, onOpenChange, orgs, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; orgs: BillingOrg[]; onDone: () => void }) {
  const [from, setFrom] = useState(''); const [to, setTo] = useState('')
  const [combine, setCombine] = useState(true); const [all, setAll] = useState(true); const [picked, setPicked] = useState<string[]>([]); const [rate, setRate] = useState('')
  const m = useMutation({
    mutationFn: () => billingApi.generate({ organisationIds: all ? 'all' : picked, mode: 'custom', from, to: to || from, combine, rate: rate ? Number(rate) : undefined }),
    onSuccess: (r) => { toast.success(`${r.created} invoice(s) created${r.skipped.length ? `, ${r.skipped.length} skipped (exists / no active users)` : ''}`); onDone(); onOpenChange(false) },
    onError: (e) => toast.error(errMsg(e)),
  })
  const ok = from && (to || from) >= from && (all || picked.length > 0)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Create invoices</DialogTitle><DialogDescription>Pick any month range — e.g. the past two months together on a single invoice. Existing invoices for the same period are skipped.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-3"><div><Label>From month</Label><Input type="month" value={from} max={ymNow()} onChange={(e) => { setFrom(e.target.value); if (!to) setTo(e.target.value) }} /></div><div><Label>To month</Label><Input type="month" value={to} max={ymNow()} onChange={(e) => setTo(e.target.value)} /></div></div>
        <div className="flex items-center justify-between rounded-lg border p-3"><div><div className="text-sm font-medium">Combine into one invoice</div><div className="text-xs text-muted-foreground">Off = one invoice per month</div></div><Switch checked={combine} onCheckedChange={setCombine} /></div>
        <div><Label>Rate per user / month (optional override)</Label><Input type="number" placeholder="Organisation's own rate (default ₹299)" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
        <div className="space-y-2">
          <div className="flex items-center gap-2"><Checkbox checked={all} onCheckedChange={(v) => setAll(!!v)} id="all-orgs" /><Label htmlFor="all-orgs">All organisations (skips those with no active users)</Label></div>
          {!all && <div className="max-h-44 overflow-y-auto rounded-lg border p-2 space-y-1">{orgs.map((o) => <label key={o.id} className="flex items-center gap-2 text-sm px-1 py-0.5 cursor-pointer"><Checkbox checked={picked.includes(o.id)} onCheckedChange={(v) => setPicked((p) => (v ? [...p, o.id] : p.filter((x) => x !== o.id)))} />{o.name}</label>)}</div>}
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={!ok || m.isPending} onClick={() => m.mutate()}>{m.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Create</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InvoiceDialog({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const q = useQuery({ queryKey: ['billing-invoice', id], queryFn: () => billingApi.invoice(id!), enabled: !!id })
  const m = useMutation({ mutationFn: (to: 'paid' | 'pending') => billingApi.update(id!, { status: to }), onSuccess: () => { toast.success('Payment status updated'); onChanged() }, onError: (e) => toast.error(errMsg(e)) })
  const inv = q.data
  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[860px] max-h-[92vh] overflow-y-auto p-0">
        <div className="flex items-center justify-between gap-2 border-b px-5 py-3 sticky top-0 bg-background z-10">
          <DialogTitle className="text-base">{inv?.invoiceNumber || 'Invoice'}</DialogTitle>
          <div className="flex gap-2 mr-8">
            {inv && <Button size="sm" variant="outline" onClick={() => m.mutate(inv.status === 'paid' ? 'pending' : 'paid')}>{inv.status === 'paid' ? 'Mark pending' : 'Mark paid'}</Button>}
            <Button size="sm" onClick={() => printInvoice(inv?.invoiceNumber)}><Printer className="h-4 w-4 mr-1" />Print / PDF</Button>
          </div>
        </div>
        {inv ? <InvoiceView invoice={inv} /> : <div className="p-10 text-center text-muted-foreground">Loading…</div>}
      </DialogContent>
    </Dialog>
  )
}

function OrgDialog({ org, onClose, onChanged, onOpenInvoice }: { org: BillingOrg | null; onClose: () => void; onChanged: () => void; onOpenInvoice: (id: string) => void }) {
  const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [rate, setRate] = useState<string | null>(null)
  const [confirmSuspend, setConfirmSuspend] = useState(false)
  const invs = useQuery({ queryKey: ['billing-invoices', 'org', org?.id], queryFn: () => billingApi.invoices({ organisationId: org!.id }), enabled: !!org })
  const prev = useQuery({ queryKey: ['billing-preview', org?.id, from, to], queryFn: () => billingApi.preview(org!.id, from, to || from), enabled: !!org && !!from })
  const save = useMutation({ mutationFn: (b: { billingRate?: number | null; billingEnabled?: boolean }) => billingApi.setOrg(org!.id, b), onSuccess: () => { toast.success('Saved'); onChanged() }, onError: (e) => toast.error(errMsg(e)) })
  const susp = useMutation({ mutationFn: (s: boolean) => billingApi.setSuspended(org!.id, s), onSuccess: (_d, s) => { toast.success(s ? 'Organisation suspended' : 'Organisation activated'); setConfirmSuspend(false); onChanged(); onClose() }, onError: (e) => toast.error(errMsg(e)) })
  const gen = useMutation({ mutationFn: () => billingApi.generate({ organisationIds: [org!.id], mode: 'custom', from, to: to || from, combine: true }), onSuccess: (r) => { toast.success(r.created ? 'Invoice created' : 'Invoice for this period already exists'); onChanged(); invs.refetch() }, onError: (e) => toast.error(errMsg(e)) })
  if (!org) return null
  const suspended = org.status === 'suspended'
  return (
    <Dialog open={!!org} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />{org.name}</DialogTitle><DialogDescription>Billing details, active users per month and invoices.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-muted/50 p-3"><div className="text-xl font-semibold">{org.seats}</div><div className="text-[11px] text-muted-foreground">Current users</div></div>
          <div className="rounded-xl bg-amber-50 p-3"><div className="text-xl font-semibold text-amber-700">{inr(org.pendingAmount)}</div><div className="text-[11px] text-muted-foreground">Pending</div></div>
          <div className="rounded-xl bg-green-50 p-3"><div className="text-xl font-semibold text-green-700">{inr(org.paidAmount)}</div><div className="text-[11px] text-muted-foreground">Paid</div></div>
        </div>
        <div className="grid grid-cols-2 gap-3 items-end">
          <div><Label>Rate per user / month (₹)</Label><div className="flex gap-2"><Input type="number" value={rate ?? String(org.rate)} onChange={(e) => setRate(e.target.value)} /><Button variant="outline" disabled={rate === null || save.isPending} onClick={() => save.mutate({ billingRate: Number(rate) })}>Save</Button></div></div>
          <div className="flex items-center justify-between rounded-lg border p-2.5"><span className="text-sm">Auto-generate monthly</span><Switch checked={org.billingEnabled} onCheckedChange={(v) => save.mutate({ billingEnabled: v })} /></div>
        </div>

        <div className="rounded-xl border p-3 space-y-3">
          <div className="text-sm font-medium flex items-center gap-2"><Users className="h-4 w-4" />Active users by month</div>
          <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">From</Label><Input type="month" value={from} max={ymNow()} onChange={(e) => { setFrom(e.target.value); if (!to) setTo(e.target.value) }} /></div><div><Label className="text-xs">To</Label><Input type="month" value={to} max={ymNow()} onChange={(e) => setTo(e.target.value)} /></div></div>
          {from && prev.isLoading && <div className="text-sm text-muted-foreground">Calculating…</div>}
          {prev.data && <>
            {prev.data.lines.map((l) => (
              <details key={l.month} className="rounded-lg bg-muted/40 px-3 py-2">
                <summary className="cursor-pointer text-sm flex justify-between"><span>{l.label} — <b>{l.users}</b> active users</span><span className="font-medium">{inr(l.amount)}</span></summary>
                <ul className="mt-2 space-y-0.5 text-xs max-h-40 overflow-y-auto">{l.userList.map((u) => <li key={u.id} className="flex justify-between"><span>{u.name} <span className="text-muted-foreground">({u.email})</span></span>{!u.active && <span className="text-muted-foreground">inactive now</span>}</li>)}</ul>
              </details>
            ))}
            <div className="flex items-center justify-between"><div className="text-sm">Total at ₹{prev.data.rate}/user: <b>{inr(prev.data.total)}</b></div><Button size="sm" disabled={gen.isPending || prev.data.total === 0} onClick={() => gen.mutate()}><IndianRupee className="h-3.5 w-3.5 mr-1" />Create invoice</Button></div>
          </>}
        </div>

        <div>
          <div className="text-sm font-medium mb-2">Invoices</div>
          {(invs.data || []).length === 0 && <div className="text-sm text-muted-foreground">No invoices yet.</div>}
          <div className="space-y-2">{(invs.data || []).map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
              <button className="text-left" onClick={() => onOpenInvoice(i.id)}><div className="font-medium text-primary hover:underline">{i.invoiceNumber}</div><div className="text-xs text-muted-foreground">{periodLabel(i)} · {inr(i.total)}</div></button>
              <div className="flex items-center gap-2"><StatusBadge status={i.status} /></div>
            </div>
          ))}</div>
        </div>

        <div className="rounded-xl border border-red-200 p-3 flex items-center justify-between gap-3">
          <div className="text-sm"><div className="font-medium">{suspended ? 'This organisation is suspended' : 'Suspend organisation'}</div><div className="text-xs text-muted-foreground">Manual only — unpaid bills never suspend an account automatically.</div></div>
          {confirmSuspend
            ? <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setConfirmSuspend(false)}>Cancel</Button><Button size="sm" variant={suspended ? 'default' : 'destructive'} disabled={susp.isPending} onClick={() => susp.mutate(!suspended)}>Confirm</Button></div>
            : <Button size="sm" variant={suspended ? 'default' : 'destructive'} className="gap-1" onClick={() => setConfirmSuspend(true)}><Ban className="h-3.5 w-3.5" />{suspended ? 'Activate' : 'Suspend'}</Button>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
