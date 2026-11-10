import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Copy, Flame, Lightbulb, Loader2, PenLine, RefreshCw, Search, Sparkles, TrendingUp, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/services/api'
import { useCurrency } from '@/contexts/CurrencyContext'
import { cn } from '@/lib/utils'

const ACCENT = 'hsl(var(--chart-5))'

export function PanelHeader({ icon: Icon, title, subtitle, onRefresh, busy }: { icon: any; title: string; subtitle: string; onRefresh?: () => void; busy?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))]"><Icon className="h-6 w-6" /></div>
        <div className="min-w-0">
          <h1 className="font-poppins text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
        </div>
      </div>
      {onRefresh && <Button variant="outline" className="h-9 gap-2 rounded-[10px] text-sm" onClick={onRefresh} disabled={busy}><RefreshCw className={cn('h-3.5 w-3.5', busy && 'animate-spin')} />Refresh</Button>}
    </div>
  )
}

const Loading = ({ text }: { text: string }) => (
  <div className="finance-card flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{text}</div>
)
const ErrorBox = ({ onRetry }: { onRetry: () => void }) => (
  <div className="finance-card flex flex-col items-center gap-3 py-12 text-sm text-muted-foreground">The AI service didn't respond.<Button size="sm" variant="outline" onClick={onRetry}>Try again</Button></div>
)
const List = ({ items, icon: Icon, tone }: { items: string[]; icon: any; tone: string }) => (
  <ul className="space-y-2.5">{items.map((t, i) => <li key={i} className="flex gap-2.5 text-sm leading-relaxed"><Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tone)} /><span>{t}</span></li>)}</ul>
)
const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className="finance-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold text-foreground">{value}</p></div>
)

/* ---------------------------------------------------------------- Briefing */
export function BriefingPanel() {
  const q = useQuery({ queryKey: ['ai-hub', 'briefing'], queryFn: async () => (await api.get('/ai/hub/briefing')).data, staleTime: 5 * 60_000 })
  const s = q.data?.snapshot, b = q.data?.briefing
  const { formatCurrency } = useCurrency()
  return (
    <div className="flex flex-col gap-5">
      <PanelHeader icon={Sparkles} title="Daily Briefing" subtitle="What changed, what's at risk and what to do today" onRefresh={() => q.refetch()} busy={q.isFetching} />
      {q.isLoading ? <Loading text="Reading your CRM…" /> : q.isError ? <ErrorBox onRetry={() => q.refetch()} /> : (
        <>
          {s && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="New leads this month" value={s.newLeadsThisMonth} />
              <Stat label="Won this month" value={`${s.wonThisMonth.count} · ${formatCurrency(s.wonThisMonth.totalAmount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} />
              <Stat label="Overdue follow-ups" value={s.overdueFollowUps} />
              <Stat label="Open tasks" value={s.openTasks} />
            </div>
          )}
          {b ? (
            <>
              <div className="finance-card p-5"><p className="text-base font-semibold leading-relaxed text-foreground">{b.headline}</p></div>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="finance-card p-5"><h3 className="mb-3 text-sm font-semibold">Highlights</h3><List items={b.highlights} icon={TrendingUp} tone="text-green-600" /></div>
                <div className="finance-card p-5"><h3 className="mb-3 text-sm font-semibold">Risks</h3><List items={b.risks} icon={AlertTriangle} tone="text-amber-500" /></div>
                <div className="finance-card p-5"><h3 className="mb-3 text-sm font-semibold">Do today</h3><List items={b.actions} icon={Lightbulb} tone="text-[hsl(var(--chart-5))]" /></div>
              </div>
            </>
          ) : <p className="text-sm text-muted-foreground">The summary couldn't be generated right now, but the numbers above are live.</p>}
        </>
      )}
    </div>
  )
}

/* --------------------------------------------------------------- Hot leads */
const URGENCY: Record<string, string> = { high: 'border-red-200 bg-red-50 text-red-700', medium: 'border-amber-200 bg-amber-50 text-amber-700', low: 'border-border bg-muted text-muted-foreground' }
export function HotLeadsPanel() {
  const q = useQuery({ queryKey: ['ai-hub', 'hot-leads'], queryFn: async () => (await api.get('/ai/hub/hot-leads')).data, staleTime: 5 * 60_000 })
  const leads: any[] = q.data?.leads ?? []
  return (
    <div className="flex flex-col gap-5">
      <PanelHeader icon={Flame} title="Hot Leads" subtitle="Who to contact first today, picked by AI from score, engagement and follow-up gaps" onRefresh={() => q.refetch()} busy={q.isFetching} />
      {q.isLoading ? <Loading text="Ranking your leads…" /> : q.isError ? <ErrorBox onRetry={() => q.refetch()} /> : leads.length === 0 ? <div className="finance-card py-12 text-center text-sm text-muted-foreground">No open leads to rank.</div> : (
        <div className="grid gap-3">
          {leads.map((l, i) => (
            <div key={l.id} className="finance-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--chart-5))]/10 text-sm font-bold text-[hsl(var(--chart-5))]">{i + 1}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/leads/${l.id}`} className="font-semibold text-foreground hover:underline">{l.name}</Link>
                  <Badge variant="outline" className={cn('text-xs capitalize', URGENCY[l.urgency])}>{l.urgency}</Badge>
                  <Badge variant="secondary" className="text-xs">{l.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{l.reason}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm"><ArrowRight className="h-3.5 w-3.5 text-[hsl(var(--chart-5))]" />{l.nextAction}</p>
                <p className="mt-1 text-xs text-muted-foreground">{[l.owner && `Owner: ${l.owner}`, l.lastContactDays != null && `Last contact ${l.lastContactDays}d ago`, l.source].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" className="rounded-[10px]" asChild><Link to={`/ai/compose?lead=${l.id}`}><PenLine className="mr-1.5 h-3.5 w-3.5" />Draft</Link></Button>
                <Button size="sm" variant="outline" className="rounded-[10px]" asChild><Link to={`/ai/compose?lead=${l.id}&summary=1`}>Summary</Link></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------- Compose */
export function ComposePanel({ initialLead, showSummary }: { initialLead?: string; showSummary?: boolean }) {
  const [search, setSearch] = useState('')
  const [lead, setLead] = useState<{ id: string; name: string } | null>(initialLead ? { id: initialLead, name: 'Selected lead' } : null)
  const [channel, setChannel] = useState('whatsapp'); const [tone, setTone] = useState('friendly and professional')
  const [goal, setGoal] = useState('Follow up and move the conversation forward'); const [language, setLanguage] = useState('English')
  const [copied, setCopied] = useState(false)

  const found = useQuery({ queryKey: ['ai-hub', 'lead-search', search], queryFn: async () => (await api.get('/ai/hub/leads/search', { params: { q: search } })).data.leads as any[], enabled: search.trim().length >= 2 })
  const draft = useMutation({ mutationFn: async () => (await api.post('/ai/hub/draft', { leadId: lead!.id, channel, tone, goal, language })).data })
  const summary = useQuery({ queryKey: ['ai-hub', 'summary', lead?.id], queryFn: async () => (await api.get(`/ai/hub/leads/${lead!.id}/summary`)).data, enabled: !!lead && !!showSummary })
  const text = draft.data ? `${draft.data.subject ? `Subject: ${draft.data.subject}\n\n` : ''}${draft.data.body}` : ''

  return (
    <div className="flex flex-col gap-5">
      <PanelHeader icon={PenLine} title="Smart Compose" subtitle="Draft a follow-up for any lead in your tone and language, and get an instant lead summary" />
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="finance-card space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Lead</label>
            {lead ? (
              <div className="flex items-center justify-between rounded-[10px] border border-border px-3 py-2 text-sm"><span className="truncate">{lead.name}</span><button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setLead(null)}>Change</button></div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone or company" className="h-10 w-full rounded-[10px] border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--chart-5))]/30" />
                {(found.data?.length ?? 0) > 0 && (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-[10px] border border-border bg-popover shadow-lg">
                    {found.data!.map((l) => <button key={l.id} onClick={() => { setLead({ id: l.id, name: l.name }); setSearch('') }} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"><span>{l.name}</span><span className="text-xs text-muted-foreground">{l.phone}</span></button>)}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Channel</label>
              <Select value={channel} onValueChange={setChannel}><SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="sms">SMS</SelectItem></SelectContent></Select></div>
            <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Language</label>
              <Select value={language} onValueChange={setLanguage}><SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger><SelectContent>{['English', 'Hindi', 'Malayalam', 'Tamil', 'Arabic'].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tone</label>
            <Select value={tone} onValueChange={setTone}><SelectTrigger className="rounded-[10px]"><SelectValue /></SelectTrigger><SelectContent>{['friendly and professional', 'formal', 'casual', 'urgent but polite', 'persuasive'].map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent></Select></div>
          <div><label className="mb-1.5 block text-xs font-medium text-muted-foreground">Goal</label>
            <textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={3} className="w-full rounded-[10px] border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--chart-5))]/30" /></div>
          <Button className="w-full rounded-[10px] bg-[hsl(var(--chart-5))] text-white hover:bg-[hsl(var(--chart-5))]/90" disabled={!lead || draft.isPending} onClick={() => draft.mutate()}>
            {draft.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Generate draft
          </Button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="finance-card min-h-[200px] p-5">
            <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">Draft</h3>
              {text && <Button size="sm" variant="outline" className="h-8 rounded-[10px]" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>{copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}{copied ? 'Copied' : 'Copy'}</Button>}</div>
            {draft.isError ? <p className="text-sm text-destructive">Couldn't generate a draft — try again.</p> : text ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p> : <p className="text-sm text-muted-foreground">Pick a lead and generate a message. You can edit it before sending.</p>}
          </div>
          {showSummary && lead && (
            <div className="finance-card p-5">
              <h3 className="mb-3 text-sm font-semibold">Lead summary</h3>
              {summary.isLoading ? <Loading text="Summarising…" /> : summary.data ? (
                <div className="space-y-3 text-sm">
                  <p className="leading-relaxed">{summary.data.summary}</p>
                  <Badge variant="secondary" className="capitalize">{summary.data.sentiment}</Badge>
                  <List items={summary.data.keyPoints || []} icon={Lightbulb} tone="text-[hsl(var(--chart-5))]" />
                  <p className="flex gap-1.5 font-medium"><ArrowRight className="mt-0.5 h-4 w-4 text-[hsl(var(--chart-5))]" />{summary.data.nextStep}</p>
                </div>
              ) : <p className="text-sm text-muted-foreground">No summary available.</p>}
            </div>
          )}
          {!showSummary && lead && <Button variant="ghost" size="sm" className="self-start" asChild><Link to={`/ai/compose?lead=${lead.id}&summary=1`}>Show lead summary</Link></Button>}
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- Forecast */
export function ForecastPanel() {
  const { formatCurrency } = useCurrency()
  const fmt = (n: number) => formatCurrency(n, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  const q = useQuery({ queryKey: ['ai-hub', 'forecast'], queryFn: async () => (await api.get('/ai/hub/forecast')).data, staleTime: 5 * 60_000 })
  const d = q.data, s = d?.stats
  const months: [string, { count: number; amount: number }][] = s ? Object.entries(s.wonByMonth).sort() as any : []
  const max = Math.max(1, ...months.map(([, v]) => v.amount))
  return (
    <div className="flex flex-col gap-5">
      <PanelHeader icon={TrendingUp} title="Forecast & Deal Risk" subtitle="Weighted pipeline forecast and the deals that need rescuing" onRefresh={() => q.refetch()} busy={q.isFetching} />
      {q.isLoading ? <Loading text="Crunching the pipeline…" /> : q.isError ? <ErrorBox onRetry={() => q.refetch()} /> : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Open pipeline" value={fmt(s.pipelineTotal)} /><Stat label="Weighted forecast" value={fmt(s.weightedForecast)} />
            <Stat label="Closing this month" value={`${s.closingThisMonth.count} · ${fmt(s.closingThisMonth.amount)}`} /><Stat label="Won this month" value={fmt(s.wonThisMonth)} />
          </div>
          {d.outlook && <div className="finance-card space-y-3 p-5"><p className="text-sm font-medium leading-relaxed">{d.outlook}</p>{d.advice?.length > 0 && <List items={d.advice} icon={Lightbulb} tone="text-[hsl(var(--chart-5))]" />}</div>}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="finance-card p-5">
              <h3 className="mb-4 text-sm font-semibold">Won revenue — last months</h3>
              {months.length === 0 ? <p className="text-sm text-muted-foreground">No closed-won deals yet.</p> : (
                <div className="flex h-40 items-end gap-3">
                  {months.map(([m, v]) => (
                    <div key={m} className="flex flex-1 flex-col items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">{v.count}</span>
                      <div className="w-full rounded-t-md" style={{ height: `${Math.max(6, (v.amount / max) * 100)}%`, background: ACCENT }} title={fmt(v.amount)} />
                      <span className="text-[10px] text-muted-foreground">{m.slice(5)}/{m.slice(2, 4)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="finance-card p-5">
              <h3 className="mb-4 text-sm font-semibold">Open pipeline by stage</h3>
              <div className="space-y-2.5">
                {Object.entries(s.byStage).map(([stage, v]: any) => (
                  <div key={stage} className="flex items-center justify-between text-sm"><span className="capitalize">{stage.replace(/_/g, ' ')}</span><span className="text-muted-foreground">{v.count} · {fmt(v.amount)}</span></div>
                ))}
              </div>
            </div>
          </div>
          <div className="finance-card p-5">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-amber-500" />Deals at risk</h3>
            {d.atRisk.length === 0 ? <p className="text-sm text-muted-foreground">No stalled or overdue deals. 🎉</p> : (
              <div className="divide-y divide-border">
                {d.atRisk.map((o: any) => (
                  <Link key={o.id} to={`/opportunities/${o.id}`} className="flex flex-col gap-1 py-3 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0"><p className="truncate text-sm font-medium">{o.name}</p><p className="text-xs text-muted-foreground">{[o.account, o.owner, o.stage.replace(/_/g, ' '), `idle ${o.idleDays}d`, o.overdueClose && 'past close date'].filter(Boolean).join(' · ')}</p></div>
                    <div className="text-sm sm:text-right"><p className="font-semibold">{fmt(o.amount)}</p><p className="text-xs text-[hsl(var(--chart-5))]">{o.action}</p></div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------- Coach */
export function CoachPanel() {
  const { formatCurrency } = useCurrency()
  const q = useQuery({ queryKey: ['ai-hub', 'coach'], queryFn: async () => (await api.get('/ai/hub/team-coach')).data, staleTime: 5 * 60_000 })
  return (
    <div className="flex flex-col gap-5">
      <PanelHeader icon={Lightbulb} title="Team Coach" subtitle="This month's activity per person, with a coaching note from AI" onRefresh={() => q.refetch()} busy={q.isFetching} />
      {q.isLoading ? <Loading text="Reviewing the team…" /> : q.isError ? <ErrorBox onRetry={() => q.refetch()} /> : (
        <>
          {q.data.summary && <div className="finance-card p-5 text-sm font-medium leading-relaxed">{q.data.summary}</div>}
          <div className="finance-card overflow-x-auto p-0">
            <table className="w-full min-w-[720px] text-sm">
              <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="p-3 font-medium">Member</th><th className="p-3 font-medium">New leads</th><th className="p-3 font-medium">Calls</th><th className="p-3 font-medium">Won</th><th className="p-3 font-medium">Overdue</th><th className="p-3 font-medium">Coaching note</th></tr></thead>
              <tbody>
                {q.data.members.map((m: any) => (
                  <tr key={m.id} className="border-b border-border last:border-0 align-top">
                    <td className="p-3 font-medium">{m.name}</td><td className="p-3">{m.newLeadsThisMonth}</td><td className="p-3">{m.callsThisMonth}</td>
                    <td className="p-3">{m.wonThisMonth}{m.wonAmount ? <span className="block text-xs text-muted-foreground">{formatCurrency(m.wonAmount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span> : null}</td>
                    <td className={cn('p-3', m.overdueFollowUps > 0 && 'font-semibold text-amber-600')}>{m.overdueFollowUps}</td>
                    <td className="p-3 text-muted-foreground">{m.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
