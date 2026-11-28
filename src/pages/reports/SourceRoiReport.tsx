import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { differenceInCalendarDays, format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
    AlertTriangle, ArrowLeft, BarChart3, ChevronDown, ChevronRight, Code2, Download, Facebook, Globe, HelpCircle,
    Layers, Loader2, Mail, Megaphone, MessageCircle, MousePointerClick, PenLine, PhoneCall, Search, Share2, SlidersHorizontal,
    Target, TrendingDown, TrendingUp, Upload, UserRound, Users, X, Zap,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SectionHeading } from '@/components/dashboard-v2/SectionHeading';
import { DateRangeDropdown, getDateRangeLabel, getDefaultDateRange, type DateRangeValue } from '@/components/dashboard-v2/DateRangeDropdown';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getBranches } from '@/services/settingsService';
import { getSourceRoiReport, type RoiCampaign, type RoiMetrics, type RoiSource, type RoiUser } from '@/services/sourceRoiService';
import { isOrgAdmin, cn } from '@/lib/utils';

// ---------- look & helpers (DashboardV2 design language) ----------

const POPPINS = 'Poppins, sans-serif';
const axisTick = { fontFamily: POPPINS, fontSize: 11, fill: 'hsl(var(--muted-foreground))' };
const tooltipStyle = { backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontFamily: POPPINS, fontSize: 12 };

const SOURCE_STYLE: Record<string, { icon: typeof Facebook; color: string }> = {
    meta_leadgen: { icon: Facebook, color: 'hsl(var(--chart-2))' },
    meta_ads: { icon: Facebook, color: '#4f46e5' },
    facebook_payload: { icon: Facebook, color: '#0284c7' },
    paid_ad: { icon: Target, color: '#7c3aed' },
    google_ads: { icon: Search, color: '#dc2626' },
    website: { icon: Globe, color: 'hsl(var(--chart-4))' },
    api: { icon: Code2, color: '#475569' },
    import: { icon: Upload, color: 'hsl(var(--chart-5))' },
    manual: { icon: PenLine, color: 'hsl(var(--chart-1))' },
    referral: { icon: Users, color: '#059669' },
    cold_call: { icon: PhoneCall, color: 'hsl(var(--chart-3))' },
    social_media: { icon: Share2, color: '#db2777' },
    social: { icon: Share2, color: '#db2777' },
    whatsapp: { icon: MessageCircle, color: '#16a34a' },
    email_campaign: { icon: Mail, color: '#0891b2' },
    zapier: { icon: Zap, color: '#ea580c' },
};
const styleOf = (s: string) => SOURCE_STYLE[s] || { icon: HelpCircle, color: 'hsl(var(--muted-foreground))' };
const META_SOURCES = ['meta_leadgen', 'meta_ads', 'facebook_payload', 'paid_ad'];
const fmtDate = (s: string | null | undefined) => (s ? format(new Date(s), 'd MMM yyyy') : '—');
const short = (s: string, n = 22) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function campaignDuration(c: RoiCampaign) {
    const start = c.startTime || c.firstLeadAt;
    if (!start) return null;
    const ended = !!c.stopTime && new Date(c.stopTime) < new Date();
    const end = ended ? c.stopTime! : c.metaStatus === 'ACTIVE' || !c.lastLeadAt ? new Date().toISOString() : c.lastLeadAt;
    const days = Math.max(1, differenceInCalendarDays(new Date(end), new Date(start)) + 1);
    return { start, end: ended ? c.stopTime : null, days, running: c.metaStatus === 'ACTIVE' };
}

const LOST_KEY = 'sourceRoi.lostStatuses';
type Fc = (n: number) => string;

// ---------- page ----------

export default function SourceRoiReportPage() {
    const navigate = useNavigate();
    const { formatCurrency, formatCurrencyCompact } = useCurrency();
    const isAdmin = useMemo(() => {
        try { return isOrgAdmin(JSON.parse(localStorage.getItem('userInfo') || '{}')); } catch { return false; }
    }, []);

    const [range, setRange] = useState<DateRangeValue>(getDefaultDateRange());
    const [branchId, setBranchId] = useState('all');
    const [source, setSource] = useState<string | null>(null);
    const [campaign, setCampaign] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [tab, setTab] = useState<'sources' | 'users'>('sources');
    const [lostStatuses, setLostStatuses] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem(LOST_KEY) || 'null') || ['lost']; } catch { return ['lost']; }
    });

    const today = format(new Date(), 'yyyy-MM-dd');
    const startDate = range.startDate || today;
    const endDate = range.endDate || today;

    const { data: branches = [] } = useQuery({ queryKey: ['branches', 'list'], queryFn: getBranches, enabled: isAdmin, staleTime: 5 * 60 * 1000 });

    const { data, isLoading, isFetching, error } = useQuery({
        queryKey: ['source-roi', startDate, endDate, branchId, source, campaign, lostStatuses],
        queryFn: () => getSourceRoiReport({
            startDate, endDate, branchId: branchId === 'all' ? undefined : branchId,
            source: source || undefined, campaign: campaign || undefined, lostStatuses,
        }),
        placeholderData: (prev) => prev,
        staleTime: 5 * 60 * 1000,
    });

    const updateLost = (v: string[]) => { setLostStatuses(v); localStorage.setItem(LOST_KEY, JSON.stringify(v)); };
    const label = (s: string) => data?.statusLabels[s] || s.replace(/_/g, ' ');
    const allStatuses = useMemo(() => {
        const set = new Set<string>(Object.keys(data?.statusLabels || {}));
        data?.sources.forEach((s) => Object.keys(s.statuses).forEach((k) => set.add(k)));
        return [...set];
    }, [data]);

    const selectSource = (s: string | null) => { setSource(s); setCampaign(null); setExpanded(null); };
    const selectedCampaign = campaign ? data?.campaigns.find((c) => c.key === campaign) : undefined;
    const sourceLabel = source ? data?.sources.find((s) => s.source === source)?.label || source : null;
    const isMetaScope = !source || META_SOURCES.includes(source);

    const exportCsv = () => {
        if (!data) return;
        const cols = ['leads', 'converted', 'lost', 'open', 'conversionRate', 'revenue', 'spend', 'costPerLead', 'costPerConversion', 'profit', 'roi'] as const;
        let header: string[]; let rows: (string | number | null)[][];
        if (tab === 'users') {
            header = ['User', 'Branch', ...cols];
            rows = data.users.map((u) => [u.name, u.branch || '', ...cols.map((c) => u[c])]);
        } else {
            header = ['Campaign', 'Sources', 'Start', 'End', 'Clicks', 'CPC', ...cols];
            rows = data.campaigns.map((c) => [c.name, c.sources.join(' / '), c.startTime || '', c.stopTime || '', c.clicks, c.costPerClick, ...cols.map((k) => c[k])]);
        }
        const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = `source-roi-${tab}-${startDate}_to_${endDate}.csv`;
        a.click();
    };

    return (
        <div className="bg-white min-h-screen space-y-6 sm:space-y-8 animate-in fade-in duration-500 p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                    <button onClick={() => navigate('/reports')} className="mt-1 h-8 w-8 rounded-[10px] border border-border flex items-center justify-center hover:bg-[hsl(var(--chart-5))]/5 hover:text-[hsl(var(--chart-5))] transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-3xl font-medium font-poppins tracking-tight text-foreground flex items-center gap-2">
                            Source &amp; ROI Report
                            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--chart-5))]" />}
                        </h1>
                        <p className="text-gray-600 tracking-tight font-poppins mt-0.5 text-[12px] sm:text-[14px] opacity-80">
                            Where your leads come from, what they cost and what they earn.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {isAdmin && branches.length > 0 && (
                        <Select value={branchId} onValueChange={setBranchId}>
                            <SelectTrigger className="h-9 w-[150px] rounded-[10px] text-xs border-[hsl(var(--chart-5))]/20 bg-[hsl(var(--chart-5))]/5 text-[hsl(var(--chart-5))] focus:ring-0 focus:ring-offset-0">
                                <SelectValue placeholder="Branch" />
                            </SelectTrigger>
                            <SelectContent className="rounded-[10px]">
                                <SelectItem value="all" className="rounded-[10px]">All Branches</SelectItem>
                                {(branches as { id: string; name: string }[]).map((b) => <SelectItem key={b.id} value={b.id} className="rounded-[10px]">{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                    <DateRangeDropdown value={range} onChange={setRange} variant="accent"
                        presets={['today', 'yesterday', 'week', 'thisMonth', 'lastMonth', 'custom']} />
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="h-9 px-3 rounded-[10px] border border-border text-xs font-poppins flex items-center gap-1.5 hover:bg-muted/40">
                                <SlidersHorizontal className="h-3.5 w-3.5 text-red-500" />
                                Lost = {lostStatuses.length ? short(lostStatuses.map(label).join(', '), 24) : 'none'}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 max-h-80 overflow-auto rounded-[10px]" align="end">
                            <p className="text-xs font-poppins text-muted-foreground mb-2">Lead statuses that count as <b>lost</b>:</p>
                            {allStatuses.map((s) => (
                                <label key={s} className="flex items-center gap-2 py-1 text-sm font-poppins cursor-pointer capitalize">
                                    <Checkbox checked={lostStatuses.includes(s)}
                                        onCheckedChange={(v) => updateLost(v ? [...lostStatuses, s] : lostStatuses.filter((x) => x !== s))} />
                                    {label(s)}
                                </label>
                            ))}
                        </PopoverContent>
                    </Popover>
                    <button onClick={exportCsv} disabled={!data}
                        className="h-9 px-3 rounded-[10px] border border-border text-xs font-poppins flex items-center gap-1.5 hover:bg-muted/40 disabled:opacity-50">
                        <Download className="h-3.5 w-3.5" /> Export
                    </button>
                </div>
            </div>

            {/* Active filter chips */}
            {(source || campaign) && (
                <div className="flex flex-wrap items-center gap-2 -mt-2">
                    <span className="text-xs font-poppins text-muted-foreground">Filtered by</span>
                    {source && <FilterChip onClear={() => selectSource(null)}>Source: {sourceLabel}</FilterChip>}
                    {selectedCampaign && <FilterChip onClear={() => setCampaign(null)}>Campaign: {short(selectedCampaign.name, 40)}</FilterChip>}
                </div>
            )}

            {error && <div className="rounded-[10px] border border-destructive/30 bg-destructive/5 p-6 text-center text-sm font-poppins text-red-500">Could not load the report. Please try again.</div>}

            {isLoading && (
                <div className="space-y-4">
                    <Skeleton className="h-24 w-full rounded-[10px]" />
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-[10px]" />)}</div>
                    <Skeleton className="h-72 w-full rounded-[20px]" />
                </div>
            )}

            {data && (
                <>
                    {isMetaScope && (!data.meta.connected || data.meta.errors.length > 0) && (
                        <Notice>
                            {!data.meta.connected
                                ? 'Meta ad account is not connected (or the connection has expired), so ad spend, clicks and cost per lead show as 0. Reconnect Facebook in Settings → Integrations.'
                                : `Spend could not be loaded for some ad accounts: ${data.meta.errors.join('; ')}`}
                        </Notice>
                    )}
                    {data.adCurrencies.length > 0 && data.orgCurrency && data.adCurrencies.some((c) => c !== data.orgCurrency) && (
                        <Notice>Ad account currency ({data.adCurrencies.join(', ')}) differs from your CRM currency ({data.orgCurrency}); spend is shown unconverted.</Notice>
                    )}

                    <KpiStrip m={data.summary} fc={formatCurrency} fcc={formatCurrencyCompact}
                        scope={selectedCampaign?.name || sourceLabel || 'All sources'} rangeLabel={getDateRangeLabel(range)} />

                    {/* Tabs */}
                    <div className="flex items-center gap-1 p-1 rounded-[12px] bg-muted/50 w-fit">
                        {([['sources', 'Source & Campaign', Layers], ['users', 'User-wise', UserRound]] as const).map(([k, l, Icon]) => (
                            <button key={k} onClick={() => setTab(k)}
                                className={cn('flex items-center gap-2 px-3 sm:px-4 py-2 rounded-[10px] text-xs sm:text-sm font-poppins whitespace-nowrap transition-all',
                                    tab === k ? 'bg-white shadow-sm text-[hsl(var(--chart-5))] font-medium' : 'text-muted-foreground hover:text-foreground')}>
                                <Icon className="h-4 w-4" />{l}
                            </button>
                        ))}
                    </div>

                    {tab === 'sources' ? (
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <SectionHeading icon={<Layers strokeWidth={1.25} className="h-5 w-5 text-[hsl(var(--chart-5))]" />}>
                                    Sources
                                    {source && <button className="ml-2 text-xs font-poppins text-[hsl(var(--chart-5))] hover:underline" onClick={() => selectSource(null)}>Show all</button>}
                                </SectionHeading>
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    {data.sources.map((s) => (
                                        <SourceCard key={s.source} s={s} active={source === s.source} dimmed={!!source && source !== s.source}
                                            onClick={() => selectSource(source === s.source ? null : s.source)} fcc={formatCurrencyCompact} />
                                    ))}
                                    {data.sources.length === 0 && <p className="text-sm font-poppins text-muted-foreground col-span-full py-10 text-center">No leads in this period.</p>}
                                </div>
                            </div>

                            {selectedCampaign && <CampaignDetail c={selectedCampaign} fc={formatCurrency} label={label} />}

                            <div className="space-y-3">
                                <SectionHeading icon={<Megaphone strokeWidth={1.25} className="h-5 w-5 text-[hsl(var(--chart-5))]" />}>
                                    Campaigns{sourceLabel ? ` · ${sourceLabel}` : ''}
                                </SectionHeading>
                                <CampaignChart campaigns={data.campaigns} fcc={formatCurrencyCompact} fc={formatCurrency} />
                                <CampaignTable data={data.campaigns} sources={data.sources} campaign={campaign} expanded={expanded}
                                    onExpand={setExpanded} onFocus={setCampaign} fc={formatCurrency} />
                                <p className="text-[11px] font-poppins text-muted-foreground">
                                    Leads = leads created in the selected period. Converted = status Won or a won deal; revenue = value of won deals on those leads.
                                    Spend, clicks and cost per click come live from your Meta ad accounts for the same period; form spend is estimated from the campaign's cost per lead.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <UsersSection users={data.users} fc={formatCurrency} fcc={formatCurrencyCompact} scope={selectedCampaign?.name || sourceLabel} />
                    )}
                </>
            )}
        </div>
    );
}

// ---------- pieces ----------

function FilterChip({ children, onClear }: { children: ReactNode; onClear: () => void }) {
    return (
        <button onClick={onClear} className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-poppins border border-[hsl(var(--chart-5))]/25 bg-[hsl(var(--chart-5))]/5 text-[hsl(var(--chart-5))] hover:bg-[hsl(var(--chart-5))]/10">
            {children}<X className="h-3 w-3" />
        </button>
    );
}

function Notice({ children }: { children: ReactNode }) {
    return (
        <div className="flex items-start gap-3 rounded-[10px] border border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm font-poppins text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>{children}</div>
        </div>
    );
}

function Profit({ v, fc }: { v: number; fc: Fc }) {
    if (!v) return <span className="text-muted-foreground">{fc(0)}</span>;
    return <span className={cn('font-medium', v > 0 ? 'text-emerald-600' : 'text-red-500')}>{v > 0 ? '+' : '−'}{fc(Math.abs(v))}</span>;
}

function KpiStrip({ m, fc, fcc, scope, rangeLabel }: { m: RoiMetrics; fc: Fc; fcc: Fc; scope: string; rangeLabel: string }) {
    const tiles: { label: string; value: string; sub?: string; accent: string; color?: string }[] = [
        { label: 'Leads', value: m.leads.toLocaleString(), sub: `${m.open.toLocaleString()} open`, accent: 'bg-[hsl(var(--chart-4))]' },
        { label: 'Converted', value: m.converted.toLocaleString(), sub: `${m.conversionRate}% rate`, accent: 'bg-emerald-500', color: 'text-emerald-600' },
        { label: 'Lost', value: m.lost.toLocaleString(), sub: m.leads ? `${Math.round((m.lost / m.leads) * 100)}% of leads` : undefined, accent: 'bg-destructive', color: 'text-red-500' },
        { label: 'Revenue', value: fcc(m.revenue), sub: 'won deals', accent: 'bg-[hsl(var(--chart-1))]' },
        { label: 'Ad Spend', value: fcc(m.spend), sub: 'from Meta', accent: 'bg-[hsl(var(--chart-2))]' },
        { label: 'Cost / Lead', value: m.costPerLead ? fc(m.costPerLead) : '—', accent: 'bg-[hsl(var(--chart-3))]' },
        { label: 'Cost / Conversion', value: m.costPerConversion ? fcc(m.costPerConversion) : '—', accent: 'bg-[hsl(var(--chart-5))]' },
    ];
    const profitable = m.profit >= 0;
    return (
        <div className="rounded-[10px] bg-card border border-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20">
                <span className="text-xs font-poppins text-muted-foreground">Showing <b className="text-foreground font-medium">{scope}</b></span>
                <span className="text-xs font-poppins text-muted-foreground">{rangeLabel}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 divide-x divide-y lg:divide-y-0 divide-border">
                {tiles.map((t) => (
                    <div key={t.label} className="relative flex flex-col items-center justify-center gap-0.5 px-3 py-4 text-center">
                        <span className={`absolute top-0 left-0 right-0 h-0.5 ${t.accent} opacity-70`} />
                        <span className="text-xs font-poppins text-muted-foreground">{t.label}</span>
                        <span className={cn('text-xl sm:text-2xl font-medium font-poppins text-foreground', t.color)}>{t.value}</span>
                        {t.sub && <span className="text-[11px] font-poppins text-muted-foreground">{t.sub}</span>}
                    </div>
                ))}
                <div className={cn('relative flex flex-col items-center justify-center gap-0.5 px-3 py-4 text-center', profitable ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-red-50 dark:bg-red-500/10')}>
                    <span className={cn('absolute top-0 left-0 right-0 h-0.5', profitable ? 'bg-emerald-500' : 'bg-destructive')} />
                    <span className={cn('text-xs font-poppins flex items-center gap-1', profitable ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-500')}>
                        {profitable ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}{profitable ? 'Net Profit' : 'Net Loss'}
                    </span>
                    <span className={cn('text-xl sm:text-2xl font-medium font-poppins', profitable ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-500')}>{fcc(Math.abs(m.profit))}</span>
                    <span className="text-[11px] font-poppins text-muted-foreground">{m.roi !== null ? `ROI ${m.roi}%` : 'revenue − spend'}</span>
                </div>
            </div>
            {m.leads > 0 && (
                <div className="flex items-center gap-3 px-4 py-2.5 border-t border-border bg-muted/20">
                    <span className="text-[11px] font-poppins text-muted-foreground shrink-0">Lead outcome</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden flex">
                        <div className="h-full bg-emerald-500" style={{ width: `${(m.converted / m.leads) * 100}%` }} />
                        <div className="h-full bg-destructive" style={{ width: `${(m.lost / m.leads) * 100}%` }} />
                    </div>
                    <span className="text-[11px] font-poppins text-muted-foreground shrink-0">
                        <span className="text-emerald-600">● converted</span> <span className="text-red-500 ml-2">● lost</span> <span className="ml-2">● open</span>
                    </span>
                </div>
            )}
        </div>
    );
}

function SourceCard({ s, active, dimmed, onClick, fcc }: { s: RoiSource; active: boolean; dimmed: boolean; onClick: () => void; fcc: Fc }) {
    const st = styleOf(s.source);
    const Icon = st.icon;
    return (
        <button onClick={onClick}
            className={cn('group relative text-left rounded-[10px] bg-card border overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5',
                active ? 'border-[hsl(var(--chart-5))] ring-1 ring-[hsl(var(--chart-5))]' : 'border-border', dimmed && 'opacity-50 hover:opacity-100')}>
            <span className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: st.color }} />
            <div className="p-4 pt-5">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `color-mix(in srgb, ${st.color} 12%, transparent)`, color: st.color }}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-poppins font-medium text-foreground truncate">{s.label}</p>
                        <p className="text-[11px] font-poppins text-muted-foreground">{s.campaignCount ? `${s.campaignCount} campaign${s.campaignCount > 1 ? 's' : ''}` : 'no campaigns'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-medium font-poppins text-foreground leading-none">{s.leads.toLocaleString()}</p>
                        <p className="text-[10px] font-poppins text-muted-foreground">leads</p>
                    </div>
                </div>
                <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden flex">
                    <div className="h-full bg-emerald-500" style={{ width: `${s.leads ? (s.converted / s.leads) * 100 : 0}%` }} />
                    <div className="h-full bg-destructive" style={{ width: `${s.leads ? (s.lost / s.leads) * 100 : 0}%` }} />
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-center font-poppins">
                    <div><p className="text-sm font-medium text-emerald-600">{s.converted}</p><p className="text-[10px] text-muted-foreground">converted</p></div>
                    <div><p className="text-sm font-medium text-red-500">{s.lost}</p><p className="text-[10px] text-muted-foreground">lost</p></div>
                    <div><p className="text-sm font-medium text-foreground">{s.conversionRate}%</p><p className="text-[10px] text-muted-foreground">conv. rate</p></div>
                </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-muted/20 text-center font-poppins">
                <div className="py-2"><p className="text-[10px] text-muted-foreground">Revenue</p><p className="text-xs font-medium text-foreground">{fcc(s.revenue)}</p></div>
                <div className="py-2"><p className="text-[10px] text-muted-foreground">Spend</p><p className="text-xs font-medium text-foreground">{s.spend ? fcc(s.spend) : '—'}</p></div>
                <div className="py-2"><p className="text-[10px] text-muted-foreground">{s.profit >= 0 ? 'Profit' : 'Loss'}</p>
                    <p className={cn('text-xs font-medium', s.profit >= 0 ? 'text-emerald-600' : 'text-red-500')}>{fcc(Math.abs(s.profit))}</p></div>
            </div>
        </button>
    );
}

function ChartCard({ title, icon, children, right }: { title: string; icon: ReactNode; children: ReactNode; right?: ReactNode }) {
    return (
        <div className="rounded-[10px] md:rounded-[20px] bg-card border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <h3 className="text-base sm:text-lg font-medium font-poppins text-foreground flex items-center gap-2">{icon}{title}</h3>
                {right}
            </div>
            <div className="px-3 pb-4">{children}</div>
        </div>
    );
}

function CampaignChart({ campaigns, fcc, fc }: { campaigns: RoiCampaign[]; fcc: Fc; fc: Fc }) {
    const rows = campaigns.filter((c) => c.key !== 'none' && (c.spend > 0 || c.revenue > 0)).slice(0, 10)
        .map((c) => ({ name: short(c.name, 18), full: c.name, Spend: Math.round(c.spend), Revenue: c.revenue, leads: c.leads }));
    if (!rows.length) return null;
    return (
        <ChartCard title="Spend vs Revenue by Campaign" icon={<BarChart3 className="h-5 w-5 text-[hsl(var(--chart-5))]" />}
            right={<span className="text-[11px] font-poppins text-muted-foreground">top {rows.length} by spend</span>}>
            <ResponsiveContainer width="100%" height={300} minWidth={1} minHeight={1}>
                <BarChart data={rows} margin={{ top: 16, right: 12, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                    <XAxis dataKey="name" tick={axisTick} tickLine={false} axisLine={false} interval={0} angle={rows.length > 3 ? -25 : 0} textAnchor={rows.length > 3 ? 'end' : 'middle'} height={rows.length > 3 ? 70 : 30} />
                    <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={(v) => fcc(v)} width={64} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => fc(Number(v))} labelFormatter={(_, p) => (p?.[0]?.payload?.full ? `${p[0].payload.full} · ${p[0].payload.leads} leads` : '')} />
                    <Legend wrapperStyle={{ fontSize: 12, fontFamily: POPPINS }} />
                    <Bar dataKey="Spend" fill="#f59e0b" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}

function CampaignTable({ data, sources, campaign, expanded, onExpand, onFocus, fc }: {
    data: RoiCampaign[]; sources: RoiSource[]; campaign: string | null; expanded: string | null;
    onExpand: (k: string | null) => void; onFocus: (k: string | null) => void; fc: Fc;
}) {
    const th = 'text-[11px] font-poppins font-medium text-muted-foreground whitespace-nowrap';
    return (
        <div className="rounded-[10px] bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
                <Table className="[&_td]:px-2.5 [&_th]:px-2.5 [&_td:first-child]:pl-4 [&_th:first-child]:pl-4">
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className={cn(th, 'min-w-[220px]')}>Campaign</TableHead>
                            <TableHead className={th}>Duration</TableHead>
                            <TableHead className={cn(th, 'text-right')}>Leads</TableHead>
                            <TableHead className={cn(th, 'text-right')}>Converted</TableHead>
                            <TableHead className={cn(th, 'text-right')}>Lost</TableHead>
                            <TableHead className={cn(th, 'text-right')}>Revenue</TableHead>
                            <TableHead className={cn(th, 'text-right')}>Spend</TableHead>
                            <TableHead className={cn(th, 'text-right')}>Clicks</TableHead>
                            <TableHead className={cn(th, 'text-right')}>CPC</TableHead>
                            <TableHead className={cn(th, 'text-right')}>Cost / Lead</TableHead>
                            <TableHead className={cn(th, 'text-right')}>Profit</TableHead>
                            <TableHead className={cn(th, 'text-right')}>ROI</TableHead>
                            <TableHead />
                        </TableRow>
                    </TableHeader>
                    <TableBody className="font-poppins text-[13px]">
                        {data.map((c) => {
                            const d = campaignDuration(c);
                            const open = expanded === c.key;
                            const focused = campaign === c.key;
                            return (
                                <Fragment key={c.key}>
                                    <TableRow className={cn('cursor-pointer hover:bg-[hsl(var(--chart-5))]/5', focused && 'bg-[hsl(var(--chart-5))]/5')} onClick={() => onExpand(open ? null : c.key)}>
                                        <TableCell>
                                            <div className="flex items-start gap-2">
                                                {c.forms.length > 0
                                                    ? (open ? <ChevronDown className="h-4 w-4 mt-0.5 shrink-0 text-[hsl(var(--chart-5))]" /> : <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />)
                                                    : <span className="w-4 shrink-0" />}
                                                <div className="min-w-0">
                                                    <p className="font-medium text-foreground leading-tight">{c.name}</p>
                                                    <div className="flex flex-wrap items-center gap-1 mt-1">
                                                        {c.metaStatus && (
                                                            <span className={cn('text-[10px] px-1.5 py-px rounded-full border capitalize',
                                                                c.metaStatus === 'ACTIVE' ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'border-border text-muted-foreground')}>
                                                                {c.metaStatus.toLowerCase().replace(/_/g, ' ')}
                                                            </span>
                                                        )}
                                                        {c.sources.map((s) => (
                                                            <span key={s} className="text-[10px] px-1.5 py-px rounded-full bg-muted text-muted-foreground">{sources.find((x) => x.source === s)?.label || s}</span>
                                                        ))}
                                                        {c.forms.length > 0 && <span className="text-[10px] text-muted-foreground">{c.forms.length} form{c.forms.length > 1 ? 's' : ''}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs whitespace-nowrap">
                                            {d ? <>{fmtDate(d.start)} – {d.end ? fmtDate(d.end) : d.running ? <span className="text-emerald-600">running</span> : fmtDate(c.lastLeadAt)}
                                                <br /><span className="text-muted-foreground">{d.days} days</span></> : '—'}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-foreground">{c.leads}</TableCell>
                                        <TableCell className="text-right text-emerald-600 font-medium">{c.converted}<span className="text-[10px] text-muted-foreground ml-1">{c.conversionRate}%</span></TableCell>
                                        <TableCell className="text-right text-red-500">{c.lost}</TableCell>
                                        <TableCell className="text-right">{fc(c.revenue)}</TableCell>
                                        <TableCell className="text-right">{c.matchedToMeta ? fc(c.spend) : <span className="text-muted-foreground text-[11px]">no ad data</span>}</TableCell>
                                        <TableCell className="text-right">{c.matchedToMeta ? c.clicks.toLocaleString() : '—'}</TableCell>
                                        <TableCell className="text-right">{c.costPerClick ? fc(c.costPerClick) : '—'}</TableCell>
                                        <TableCell className="text-right">{c.costPerLead ? fc(c.costPerLead) : '—'}</TableCell>
                                        <TableCell className="text-right"><Profit v={c.profit} fc={fc} /></TableCell>
                                        <TableCell className="text-right text-xs">{c.roi === null ? '—' : <span className={c.roi >= 0 ? 'text-emerald-600' : 'text-red-500'}>{c.roi}%</span>}</TableCell>
                                        <TableCell>
                                            <button onClick={(e) => { e.stopPropagation(); onFocus(focused ? null : c.key); }}
                                                className={cn('h-7 px-3 rounded-[8px] text-xs border transition-colors',
                                                    focused ? 'bg-[hsl(var(--chart-5))] text-white border-[hsl(var(--chart-5))]' : 'border-[hsl(var(--chart-5))]/30 text-[hsl(var(--chart-5))] hover:bg-[hsl(var(--chart-5))]/10')}>
                                                {focused ? 'Focused' : 'Focus'}
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                    {open && c.forms.map((f) => (
                                        <TableRow key={f.key} className="bg-muted/30 hover:bg-muted/40 text-xs">
                                            <TableCell className="pl-12"><span className="text-muted-foreground mr-1">Form ·</span><span className="text-foreground">{f.name}</span></TableCell>
                                            <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(f.firstLeadAt)} – {fmtDate(f.lastLeadAt)}</TableCell>
                                            <TableCell className="text-right">{f.leads}</TableCell>
                                            <TableCell className="text-right text-emerald-600">{f.converted}<span className="text-[10px] text-muted-foreground ml-1">{f.conversionRate}%</span></TableCell>
                                            <TableCell className="text-right text-red-500">{f.lost}</TableCell>
                                            <TableCell className="text-right">{fc(f.revenue)}</TableCell>
                                            <TableCell className="text-right text-muted-foreground">{f.spend ? `≈ ${fc(f.spend)}` : '—'}</TableCell>
                                            <TableCell /><TableCell />
                                            <TableCell className="text-right">{f.costPerLead ? fc(f.costPerLead) : '—'}</TableCell>
                                            <TableCell className="text-right"><Profit v={f.profit} fc={fc} /></TableCell>
                                            <TableCell /><TableCell />
                                        </TableRow>
                                    ))}
                                </Fragment>
                            );
                        })}
                        {data.length === 0 && (
                            <TableRow><TableCell colSpan={13} className="text-center text-muted-foreground py-10">No campaigns for this selection.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function CampaignDetail({ c, fc, label }: { c: RoiCampaign; fc: Fc; label: (s: string) => string }) {
    const d = campaignDuration(c);
    const statuses = Object.entries(c.statuses).sort((a, b) => b[1] - a[1]);
    const max = statuses[0]?.[1] || 1;
    const profitable = c.profit >= 0;
    return (
        <div className="rounded-[10px] md:rounded-[20px] bg-card border border-[hsl(var(--chart-5))]/30 overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-border bg-[hsl(var(--chart-5))]/5">
                <div className="h-10 w-10 rounded-xl bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))] flex items-center justify-center"><Target className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium font-poppins text-foreground leading-tight">{c.name}</h3>
                    <p className="text-xs font-poppins text-muted-foreground">
                        {c.adAccountName ? `Ad account: ${c.adAccountName}` : 'Campaign'}{c.metaStatus ? ` · ${c.metaStatus.toLowerCase()}` : ''}
                    </p>
                </div>
                {d && (
                    <div className="text-right font-poppins">
                        <p className="text-[11px] text-muted-foreground">Duration</p>
                        <p className="text-sm font-medium text-foreground">{fmtDate(d.start)} → {d.end ? fmtDate(d.end) : d.running ? 'running' : fmtDate(c.lastLeadAt)}</p>
                        <p className="text-[11px] text-muted-foreground">{d.days} days{c.startTime ? '' : ' (first to last lead)'}</p>
                    </div>
                )}
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1fr_0.9fr]">
                <div className="grid grid-cols-2 gap-2 content-start">
                    <Stat l="Impressions" v={c.impressions.toLocaleString()} />
                    <Stat l="Reach" v={c.reach.toLocaleString()} />
                    <Stat l="Clicks" v={c.clicks.toLocaleString()} icon={<MousePointerClick className="h-3 w-3" />} />
                    <Stat l="Cost per click" v={c.costPerClick ? fc(c.costPerClick) : '—'} />
                    <Stat l="Ad spend" v={fc(c.spend)} />
                    <Stat l="Cost per lead" v={c.costPerLead ? fc(c.costPerLead) : '—'} />
                </div>
                <div className="grid grid-cols-2 gap-2 content-start">
                    <Stat l="Leads from campaign" v={c.leads.toLocaleString()} />
                    <Stat l="Converted" v={`${c.converted} (${c.conversionRate}%)`} cls="text-emerald-600" />
                    <Stat l="Lost" v={c.lost.toLocaleString()} cls="text-red-500" />
                    <Stat l="Still open" v={c.open.toLocaleString()} />
                    <Stat l="Revenue" v={fc(c.revenue)} cls="text-emerald-600" />
                    <Stat l="Cost per conversion" v={c.costPerConversion ? fc(c.costPerConversion) : '—'} />
                    <div className={cn('col-span-2 rounded-[10px] px-4 py-3 border', profitable ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30' : 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30')}>
                        <p className={cn('text-[11px] font-poppins flex items-center gap-1', profitable ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-500')}>
                            {profitable ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {profitable ? 'Profit' : 'Loss'} from this campaign
                        </p>
                        <p className={cn('text-2xl font-medium font-poppins', profitable ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-500')}>
                            {fc(Math.abs(c.profit))}{c.roi !== null && <span className="text-xs ml-2">ROI {c.roi}%</span>}
                        </p>
                    </div>
                </div>
                <div>
                    <p className="text-sm font-medium font-poppins text-foreground mb-2">Lead status breakdown</p>
                    <div className="space-y-2 max-h-72 overflow-auto pr-1">
                        {statuses.map(([s, n]) => (
                            <div key={s} className="text-xs font-poppins">
                                <div className="flex justify-between mb-0.5"><span className="capitalize text-muted-foreground">{label(s)}</span><span className="font-medium text-foreground">{n}</span></div>
                                <div className="h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-[hsl(var(--chart-5))]" style={{ width: `${(n / max) * 100}%` }} /></div>
                            </div>
                        ))}
                        {statuses.length === 0 && <p className="text-xs font-poppins text-muted-foreground">No leads in this period.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Stat({ l, v, cls, icon }: { l: string; v: string; cls?: string; icon?: ReactNode }) {
    return (
        <div className="rounded-[10px] border border-border px-3 py-2.5 font-poppins">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">{icon}{l}</p>
            <p className={cn('text-sm font-medium text-foreground', cls)}>{v}</p>
        </div>
    );
}

function UsersSection({ users, fc, fcc, scope }: { users: RoiUser[]; fc: Fc; fcc: Fc; scope: string | null | undefined }) {
    const [sort, setSort] = useState<'profit' | 'revenue' | 'leads' | 'conversionRate'>('profit');
    const sorted = [...users].sort((a, b) => (b[sort] as number) - (a[sort] as number));
    const total = users.reduce((t, u) => ({ leads: t.leads + u.leads, converted: t.converted + u.converted, lost: t.lost + u.lost, revenue: t.revenue + u.revenue, spend: t.spend + u.spend }),
        { leads: 0, converted: 0, lost: 0, revenue: 0, spend: 0 });
    const inProfit = users.filter((u) => u.profit > 0).length;
    const inLoss = users.filter((u) => u.profit < 0).length;
    const chartRows = [...users].filter((u) => u.userId).sort((a, b) => b.profit - a.profit).slice(0, 12)
        .map((u) => ({ name: short(u.name, 14), full: u.name, profit: u.profit, revenue: u.revenue, cost: u.spend }));
    const th = 'text-[11px] font-poppins font-medium text-muted-foreground whitespace-nowrap';
    const narrow = typeof window !== 'undefined' && window.innerWidth < 640;

    return (
        <div className="space-y-6">
            <div className="grid gap-2 sm:gap-4 grid-cols-3">
                <MiniStat icon={<Users className="h-5 w-5" />} label="Users with leads" value={users.filter((u) => u.userId).length.toString()} tone="neutral" />
                <MiniStat icon={<TrendingUp className="h-5 w-5" />} label="In profit" value={inProfit.toString()} tone="good" />
                <MiniStat icon={<TrendingDown className="h-5 w-5" />} label="In loss" value={inLoss.toString()} tone="bad" />
            </div>

            {chartRows.length > 0 && (
                <ChartCard title="Profit / Loss by User" icon={<BarChart3 className="h-5 w-5 text-[hsl(var(--chart-5))]" />}
                    right={<span className="text-[11px] font-poppins text-muted-foreground">revenue − ad cost of their leads</span>}>
                    <ResponsiveContainer width="100%" height={280} minWidth={1} minHeight={1}>
                        <BarChart data={chartRows} margin={{ top: 16, right: 12, left: 4, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                            <XAxis dataKey="name" tick={narrow && chartRows.length > 5 ? false : axisTick} tickLine={false} axisLine={false} interval={0} angle={chartRows.length > 3 ? -25 : 0} textAnchor={chartRows.length > 3 ? 'end' : 'middle'} height={narrow && chartRows.length > 5 ? 8 : chartRows.length > 3 ? 70 : 30} />
                            <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={(v) => fcc(v)} width={64} />
                            <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [fc(Number(v)), n === 'profit' ? 'Profit / loss' : String(n)]}
                                labelFormatter={(_, p) => p?.[0]?.payload?.full || ''} />
                            <Bar dataKey="profit" radius={[4, 4, 4, 4]} isAnimationActive={false}>
                                {chartRows.map((r) => <Cell key={r.full} fill={r.profit >= 0 ? '#10b981' : '#ef4444'} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            )}

            <div className="space-y-3">
                <SectionHeading icon={<UserRound strokeWidth={1.25} className="h-5 w-5 text-[hsl(var(--chart-5))]" />}>
                    User Performance{scope ? ` · ${short(scope, 30)}` : ''}
                </SectionHeading>
                <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xs font-poppins text-muted-foreground flex-1 min-w-[240px]">
                        Each user's leads, conversions and revenue, minus the ad cost of the leads they were given (each lead costs its campaign's cost per lead).
                    </p>
                    <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
                        <SelectTrigger className="h-9 w-[170px] rounded-[10px] text-xs border-[hsl(var(--chart-5))]/20 bg-[hsl(var(--chart-5))]/5 text-[hsl(var(--chart-5))] focus:ring-0 focus:ring-offset-0"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-[10px]">
                            <SelectItem value="profit">Sort: Profit</SelectItem>
                            <SelectItem value="revenue">Sort: Revenue</SelectItem>
                            <SelectItem value="leads">Sort: Leads</SelectItem>
                            <SelectItem value="conversionRate">Sort: Conversion %</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="rounded-[10px] bg-card border border-border overflow-x-auto">
                    <Table className="[&_td]:px-2.5 [&_th]:px-2.5 [&_td:first-child]:pl-4 [&_th:first-child]:pl-4">
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className={cn(th, 'min-w-[200px]')}>User</TableHead>
                                <TableHead className={cn(th, 'text-right')}>Leads</TableHead>
                                <TableHead className={cn(th, 'text-right')}>Converted</TableHead>
                                <TableHead className={cn(th, 'text-right')}>Lost</TableHead>
                                <TableHead className={cn(th, 'text-right')}>Open</TableHead>
                                <TableHead className={cn(th, 'text-right')}>Revenue</TableHead>
                                <TableHead className={cn(th, 'text-right')}>Ad cost of leads</TableHead>
                                <TableHead className={cn(th, 'text-right')}>Cost / Conversion</TableHead>
                                <TableHead className={cn(th, 'text-right')}>Profit / Loss</TableHead>
                                <TableHead className={cn(th, 'text-right')}>ROI</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="font-poppins text-[13px]">
                            {sorted.map((u) => {
                                const initials = u.name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
                                return (
                                    <TableRow key={u.userId || 'unassigned'} className="hover:bg-[hsl(var(--chart-5))]/5">
                                        <TableCell>
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-8 w-8 rounded-full bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))] text-xs font-medium flex items-center justify-center shrink-0">{initials}</div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-foreground truncate">{u.name}{!u.isActive && <span className="text-[10px] text-muted-foreground ml-1">(inactive)</span>}</p>
                                                    {u.branch && <p className="text-[11px] text-muted-foreground">{u.branch}</p>}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-foreground">{u.leads}</TableCell>
                                        <TableCell className="text-right text-emerald-600 font-medium">{u.converted}<span className="text-[10px] text-muted-foreground ml-1">{u.conversionRate}%</span></TableCell>
                                        <TableCell className="text-right text-red-500">{u.lost}</TableCell>
                                        <TableCell className="text-right">{u.open}</TableCell>
                                        <TableCell className="text-right">{fc(u.revenue)}</TableCell>
                                        <TableCell className="text-right">{u.spend ? fc(u.spend) : '—'}</TableCell>
                                        <TableCell className="text-right">{u.costPerConversion ? fc(u.costPerConversion) : '—'}</TableCell>
                                        <TableCell className="text-right">
                                            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                                                u.profit > 0 ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : u.profit < 0 ? 'bg-red-50 text-red-500 dark:bg-red-500/15' : 'bg-muted text-muted-foreground')}>
                                                {u.profit > 0 ? <TrendingUp className="h-3 w-3" /> : u.profit < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                                                {fc(Math.abs(u.profit))}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right text-xs">{u.roi === null ? '—' : <span className={u.roi >= 0 ? 'text-emerald-600' : 'text-red-500'}>{u.roi}%</span>}</TableCell>
                                    </TableRow>
                                );
                            })}
                            {users.length > 0 && (
                                <TableRow className="bg-muted/30 hover:bg-muted/30 font-medium text-foreground">
                                    <TableCell>Total</TableCell>
                                    <TableCell className="text-right">{total.leads}</TableCell>
                                    <TableCell className="text-right text-emerald-600">{total.converted}</TableCell>
                                    <TableCell className="text-right text-red-500">{total.lost}</TableCell>
                                    <TableCell className="text-right">{total.leads - total.converted - total.lost}</TableCell>
                                    <TableCell className="text-right">{fc(total.revenue)}</TableCell>
                                    <TableCell className="text-right">{fc(total.spend)}</TableCell>
                                    <TableCell />
                                    <TableCell className="text-right"><Profit v={Math.round(total.revenue - total.spend)} fc={fc} /></TableCell>
                                    <TableCell />
                                </TableRow>
                            )}
                            {users.length === 0 && <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-10">No leads for this selection.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

function MiniStat({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: 'good' | 'bad' | 'neutral' }) {
    const c = tone === 'good' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15' : tone === 'bad' ? 'bg-red-50 text-red-500 dark:bg-red-500/15' : 'bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))]';
    return (
        <div className="rounded-[10px] bg-card border border-border p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', c)}>{icon}</div>
            <div className="font-poppins">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-medium text-foreground leading-tight">{value}</p>
            </div>
        </div>
    );
}

