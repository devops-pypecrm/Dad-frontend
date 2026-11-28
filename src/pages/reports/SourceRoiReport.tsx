import { Fragment, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { differenceInCalendarDays, endOfMonth, format, startOfMonth, startOfWeek, subDays, subMonths } from 'date-fns';
import {
    AlertTriangle, ArrowLeft, Building, ChevronDown, ChevronRight, Code2, Download, Facebook, Globe, HelpCircle,
    Loader2, Mail, MessageCircle, MousePointerClick, PenLine, PhoneCall, Search, Share2, Target, TrendingDown,
    TrendingUp, Upload, Users, X, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getBranches } from '@/services/settingsService';
import { getSourceRoiReport, type RoiCampaign, type RoiMetrics, type RoiSource, type RoiUser } from '@/services/sourceRoiService';
import { isAdmin as checkIsAdmin, cn } from '@/lib/utils';

// ---------- date presets ----------

const PRESETS = [
    ['today', 'Today'], ['yesterday', 'Yesterday'], ['thisWeek', 'This Week'], ['last7', 'Last 7 Days'],
    ['thisMonth', 'This Month'], ['lastMonth', 'Last Month'], ['last30', 'Last 30 Days'], ['last90', 'Last 90 Days'],
    ['custom', 'Custom'],
] as const;
type Preset = (typeof PRESETS)[number][0];

const ymd = (d: Date) => format(d, 'yyyy-MM-dd');
function presetRange(p: Preset): [string, string] {
    const t = new Date();
    switch (p) {
        case 'today': return [ymd(t), ymd(t)];
        case 'yesterday': return [ymd(subDays(t, 1)), ymd(subDays(t, 1))];
        case 'thisWeek': return [ymd(startOfWeek(t, { weekStartsOn: 1 })), ymd(t)];
        case 'last7': return [ymd(subDays(t, 6)), ymd(t)];
        case 'thisMonth': return [ymd(startOfMonth(t)), ymd(t)];
        case 'lastMonth': { const m = subMonths(t, 1); return [ymd(startOfMonth(m)), ymd(endOfMonth(m))]; }
        case 'last90': return [ymd(subDays(t, 89)), ymd(t)];
        default: return [ymd(subDays(t, 29)), ymd(t)];
    }
}

// ---------- per-source look ----------

const SOURCE_STYLE: Record<string, { icon: typeof Facebook; color: string; bg: string }> = {
    meta_leadgen: { icon: Facebook, color: 'text-blue-600', bg: 'from-blue-500/15 to-blue-500/5 border-blue-500/30' },
    meta_ads: { icon: Facebook, color: 'text-indigo-600', bg: 'from-indigo-500/15 to-indigo-500/5 border-indigo-500/30' },
    facebook_payload: { icon: Facebook, color: 'text-sky-600', bg: 'from-sky-500/15 to-sky-500/5 border-sky-500/30' },
    paid_ad: { icon: Target, color: 'text-violet-600', bg: 'from-violet-500/15 to-violet-500/5 border-violet-500/30' },
    google_ads: { icon: Search, color: 'text-red-600', bg: 'from-red-500/15 to-red-500/5 border-red-500/30' },
    website: { icon: Globe, color: 'text-teal-600', bg: 'from-teal-500/15 to-teal-500/5 border-teal-500/30' },
    api: { icon: Code2, color: 'text-slate-600', bg: 'from-slate-500/15 to-slate-500/5 border-slate-500/30' },
    import: { icon: Upload, color: 'text-amber-600', bg: 'from-amber-500/15 to-amber-500/5 border-amber-500/30' },
    manual: { icon: PenLine, color: 'text-zinc-600', bg: 'from-zinc-500/15 to-zinc-500/5 border-zinc-500/30' },
    referral: { icon: Users, color: 'text-emerald-600', bg: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/30' },
    cold_call: { icon: PhoneCall, color: 'text-orange-600', bg: 'from-orange-500/15 to-orange-500/5 border-orange-500/30' },
    social_media: { icon: Share2, color: 'text-pink-600', bg: 'from-pink-500/15 to-pink-500/5 border-pink-500/30' },
    social: { icon: Share2, color: 'text-pink-600', bg: 'from-pink-500/15 to-pink-500/5 border-pink-500/30' },
    whatsapp: { icon: MessageCircle, color: 'text-green-600', bg: 'from-green-500/15 to-green-500/5 border-green-500/30' },
    email_campaign: { icon: Mail, color: 'text-cyan-600', bg: 'from-cyan-500/15 to-cyan-500/5 border-cyan-500/30' },
    zapier: { icon: Zap, color: 'text-orange-600', bg: 'from-orange-500/15 to-orange-500/5 border-orange-500/30' },
};
const styleOf = (s: string) => SOURCE_STYLE[s] || { icon: HelpCircle, color: 'text-gray-600', bg: 'from-gray-500/15 to-gray-500/5 border-gray-500/30' };
const META_SOURCES = ['meta_leadgen', 'meta_ads', 'facebook_payload', 'paid_ad'];

const fmtDate = (s: string | null) => (s ? format(new Date(s), 'd MMM yyyy') : '—');

function campaignDuration(c: RoiCampaign) {
    const start = c.startTime || c.firstLeadAt;
    if (!start) return null;
    const ended = c.stopTime && new Date(c.stopTime) < new Date();
    const end = ended ? c.stopTime! : c.metaStatus === 'ACTIVE' || !c.lastLeadAt ? new Date().toISOString() : c.lastLeadAt;
    const days = Math.max(1, differenceInCalendarDays(new Date(end), new Date(start)) + 1);
    return { start, end: ended ? c.stopTime : null, days, running: c.metaStatus === 'ACTIVE' };
}

const LOST_KEY = 'sourceRoi.lostStatuses';

// ---------- page ----------

export default function SourceRoiReportPage() {
    const navigate = useNavigate();
    const { formatCurrency, formatCurrencyCompact } = useCurrency();
    const isAdmin = useMemo(() => {
        try { return checkIsAdmin(JSON.parse(localStorage.getItem('userInfo') || '{}')?.role); } catch { return false; }
    }, []);

    const [preset, setPreset] = useState<Preset>('thisMonth');
    const [custom, setCustom] = useState<[string, string]>(presetRange('last30'));
    const [branchId, setBranchId] = useState('all');
    const [source, setSource] = useState<string | null>(null);
    const [campaign, setCampaign] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [tab, setTab] = useState('sources');
    const [lostStatuses, setLostStatuses] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem(LOST_KEY) || 'null') || ['lost']; } catch { return ['lost']; }
    });

    const [startDate, endDate] = preset === 'custom' ? custom : presetRange(preset);

    const { data: branches = [] } = useQuery({ queryKey: ['branches', 'list'], queryFn: getBranches, enabled: isAdmin });

    const { data, isLoading, isFetching, error } = useQuery({
        queryKey: ['source-roi', startDate, endDate, branchId, source, campaign, lostStatuses],
        queryFn: () => getSourceRoiReport({
            startDate, endDate, branchId: branchId === 'all' ? undefined : branchId,
            source: source || undefined, campaign: campaign || undefined, lostStatuses,
        }),
        placeholderData: (prev) => prev,
        staleTime: 5 * 60 * 1000,
    });

    const updateLost = (v: string[]) => {
        setLostStatuses(v);
        localStorage.setItem(LOST_KEY, JSON.stringify(v));
    };
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
        <div className="space-y-5 pb-10">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate('/reports')}><ArrowLeft className="h-5 w-5" /></Button>
                <div className="flex-1 min-w-[200px]">
                    <h1 className="text-2xl font-bold tracking-tight">Source & ROI Report</h1>
                    <p className="text-sm text-muted-foreground">Leads, conversions, ad spend and profit by source, campaign, form and user.</p>
                </div>
                {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <Button variant="outline" size="sm" onClick={exportCsv} disabled={!data}><Download className="h-4 w-4 mr-1.5" />Export CSV</Button>
            </div>

            {/* Filters */}
            <div className="finance-card p-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                    {PRESETS.map(([k, l]) => (
                        <button key={k} onClick={() => setPreset(k)}
                            className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition',
                                preset === k ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-border')}>
                            {l}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {preset === 'custom' ? (
                        <div className="flex items-center gap-2">
                            <Input type="date" value={custom[0]} max={custom[1]} onChange={(e) => setCustom([e.target.value, custom[1]])} className="h-9 w-[150px]" />
                            <span className="text-muted-foreground text-sm">to</span>
                            <Input type="date" value={custom[1]} min={custom[0]} max={ymd(new Date())} onChange={(e) => setCustom([custom[0], e.target.value])} className="h-9 w-[150px]" />
                        </div>
                    ) : (
                        <span className="text-sm font-medium text-primary">{fmtDate(startDate)} – {fmtDate(endDate)}</span>
                    )}
                    {isAdmin && branches.length > 0 && (
                        <Select value={branchId} onValueChange={setBranchId}>
                            <SelectTrigger className="h-9 w-[190px]"><Building className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Branches</SelectItem>
                                {branches.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9">
                                <TrendingDown className="h-4 w-4 mr-1.5 text-red-500" />
                                Count as lost: {lostStatuses.length ? lostStatuses.map(label).slice(0, 2).join(', ') + (lostStatuses.length > 2 ? ` +${lostStatuses.length - 2}` : '') : 'none'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 max-h-80 overflow-auto" align="start">
                            <p className="text-xs text-muted-foreground mb-2">Lead statuses that mean the lead is lost:</p>
                            {allStatuses.map((s) => (
                                <label key={s} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                                    <Checkbox checked={lostStatuses.includes(s)}
                                        onCheckedChange={(v) => updateLost(v ? [...lostStatuses, s] : lostStatuses.filter((x) => x !== s))} />
                                    {label(s)}
                                </label>
                            ))}
                        </PopoverContent>
                    </Popover>
                    {(source || campaign) && (
                        <div className="flex flex-wrap gap-2">
                            {source && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => selectSource(null)}>Source: {sourceLabel}<X className="h-3 w-3" /></Badge>}
                            {selectedCampaign && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setCampaign(null)}>Campaign: {selectedCampaign.name}<X className="h-3 w-3" /></Badge>}
                        </div>
                    )}
                </div>
            </div>

            {error && <div className="finance-card p-6 text-center text-destructive">Could not load the report. Please try again.</div>}
            {isLoading && <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}

            {data && (
                <>
                    {isMetaScope && (!data.meta.connected || data.meta.errors.length > 0) && (
                        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                {!data.meta.connected
                                    ? 'Meta ad account is not connected (or the connection has expired), so ad spend, clicks and cost per lead are shown as 0. Reconnect Facebook in Settings → Integrations.'
                                    : `Spend could not be loaded for some ad accounts: ${data.meta.errors.join('; ')}`}
                            </div>
                        </div>
                    )}
                    {data.adCurrencies.length > 0 && data.orgCurrency && data.adCurrencies.some((c) => c !== data.orgCurrency) && (
                        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                            Ad account currency ({data.adCurrencies.join(', ')}) differs from your CRM currency ({data.orgCurrency}); spend is shown unconverted.
                        </div>
                    )}

                    <SummaryRow m={data.summary} fc={formatCurrency} fcc={formatCurrencyCompact}
                        title={selectedCampaign ? selectedCampaign.name : sourceLabel || 'All sources'} />

                    <Tabs value={tab} onValueChange={setTab}>
                        <TabsList className="h-11">
                            <TabsTrigger value="sources" className="px-5">Source & Campaign</TabsTrigger>
                            <TabsTrigger value="users" className="px-5">User-wise</TabsTrigger>
                        </TabsList>

                        {/* ---------- Tab 1 ---------- */}
                        <TabsContent value="sources" className="space-y-5 mt-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-base font-semibold">Sources</h2>
                                    {source && <button className="text-xs text-primary font-semibold" onClick={() => selectSource(null)}>Show all sources</button>}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                                    {data.sources.map((s) => (
                                        <SourceCard key={s.source} s={s} active={source === s.source} dimmed={!!source && source !== s.source}
                                            onClick={() => selectSource(source === s.source ? null : s.source)} fcc={formatCurrencyCompact} />
                                    ))}
                                    {data.sources.length === 0 && <p className="text-sm text-muted-foreground col-span-full py-6 text-center">No leads in this period.</p>}
                                </div>
                            </div>

                            {selectedCampaign && <CampaignDetail c={selectedCampaign} fc={formatCurrency} label={label} />}

                            <div className="finance-card p-0 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                    <h2 className="text-base font-semibold">
                                        Campaigns {sourceLabel ? `· ${sourceLabel}` : ''}
                                        <span className="ml-2 text-xs font-normal text-muted-foreground">click a row for forms · "Focus" to filter the whole report</span>
                                    </h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="min-w-[240px]">Campaign</TableHead>
                                                <TableHead>Duration</TableHead>
                                                <TableHead className="text-right">Leads</TableHead>
                                                <TableHead className="text-right">Converted</TableHead>
                                                <TableHead className="text-right">Lost</TableHead>
                                                <TableHead className="text-right">Revenue</TableHead>
                                                <TableHead className="text-right">Spend</TableHead>
                                                <TableHead className="text-right">Clicks</TableHead>
                                                <TableHead className="text-right">CPC</TableHead>
                                                <TableHead className="text-right">Cost / Lead</TableHead>
                                                <TableHead className="text-right">Profit</TableHead>
                                                <TableHead className="text-right">ROI</TableHead>
                                                <TableHead />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.campaigns.map((c) => {
                                                const d = campaignDuration(c);
                                                const open = expanded === c.key;
                                                return (
                                                    <Fragment key={c.key}>
                                                        <TableRow className={cn('cursor-pointer', campaign === c.key && 'bg-primary/5')} onClick={() => setExpanded(open ? null : c.key)}>
                                                            <TableCell>
                                                                <div className="flex items-start gap-2">
                                                                    {c.forms.length > 0 ? (open ? <ChevronDown className="h-4 w-4 mt-0.5 shrink-0" /> : <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />) : <span className="w-4" />}
                                                                    <div>
                                                                        <p className="font-semibold leading-tight">{c.name}</p>
                                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                                            {c.metaStatus && <Badge variant="outline" className={cn('text-[10px] py-0', c.metaStatus === 'ACTIVE' ? 'border-emerald-500 text-emerald-600' : '')}>{c.metaStatus.toLowerCase()}</Badge>}
                                                                            {c.sources.map((s) => <Badge key={s} variant="secondary" className="text-[10px] py-0">{data.sources.find((x) => x.source === s)?.label || s}</Badge>)}
                                                                            {c.forms.length > 0 && <span className="text-[10px] text-muted-foreground">{c.forms.length} form{c.forms.length > 1 ? 's' : ''}</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-xs whitespace-nowrap">
                                                                {d ? <>{fmtDate(d.start)} – {d.end ? fmtDate(d.end) : d.running ? 'running' : fmtDate(c.lastLeadAt)}<br /><span className="text-muted-foreground">{d.days} days</span></> : '—'}
                                                            </TableCell>
                                                            <TableCell className="text-right font-semibold">{c.leads}</TableCell>
                                                            <TableCell className="text-right text-emerald-600 font-semibold">{c.converted}<span className="text-[10px] text-muted-foreground ml-1">{c.conversionRate}%</span></TableCell>
                                                            <TableCell className="text-right text-red-500">{c.lost}</TableCell>
                                                            <TableCell className="text-right">{formatCurrency(c.revenue)}</TableCell>
                                                            <TableCell className="text-right">{c.matchedToMeta ? formatCurrency(c.spend) : <span className="text-muted-foreground text-xs">no ad data</span>}</TableCell>
                                                            <TableCell className="text-right">{c.matchedToMeta ? c.clicks.toLocaleString() : '—'}</TableCell>
                                                            <TableCell className="text-right">{c.costPerClick ? formatCurrency(c.costPerClick) : '—'}</TableCell>
                                                            <TableCell className="text-right">{c.costPerLead ? formatCurrency(c.costPerLead) : '—'}</TableCell>
                                                            <TableCell className="text-right"><Profit v={c.profit} fc={formatCurrency} /></TableCell>
                                                            <TableCell className="text-right text-xs font-semibold">{c.roi === null ? '—' : `${c.roi}%`}</TableCell>
                                                            <TableCell>
                                                                <Button size="sm" variant={campaign === c.key ? 'default' : 'outline'} className="h-7 text-xs"
                                                                    onClick={(e) => { e.stopPropagation(); setCampaign(campaign === c.key ? null : c.key); }}>
                                                                    {campaign === c.key ? 'Focused' : 'Focus'}
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                        {open && c.forms.map((f) => (
                                                            <TableRow key={f.key} className="bg-muted/40 text-sm">
                                                                <TableCell className="pl-12"><span className="text-muted-foreground mr-1">Form:</span>{f.name}</TableCell>
                                                                <TableCell className="text-xs">{fmtDate(f.firstLeadAt)} – {fmtDate(f.lastLeadAt)}</TableCell>
                                                                <TableCell className="text-right">{f.leads}</TableCell>
                                                                <TableCell className="text-right text-emerald-600">{f.converted}<span className="text-[10px] text-muted-foreground ml-1">{f.conversionRate}%</span></TableCell>
                                                                <TableCell className="text-right text-red-500">{f.lost}</TableCell>
                                                                <TableCell className="text-right">{formatCurrency(f.revenue)}</TableCell>
                                                                <TableCell className="text-right text-xs text-muted-foreground">{f.spend ? `≈ ${formatCurrency(f.spend)}` : '—'}</TableCell>
                                                                <TableCell /><TableCell />
                                                                <TableCell className="text-right">{f.costPerLead ? formatCurrency(f.costPerLead) : '—'}</TableCell>
                                                                <TableCell className="text-right"><Profit v={f.profit} fc={formatCurrency} /></TableCell>
                                                                <TableCell /><TableCell />
                                                            </TableRow>
                                                        ))}
                                                    </Fragment>
                                                );
                                            })}
                                            {data.campaigns.length === 0 && (
                                                <TableRow><TableCell colSpan={13} className="text-center text-muted-foreground py-8">No campaigns for this selection.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Leads = leads created in the selected period. Converted = status Won or a won deal; revenue = value of won deals on those leads.
                                Spend, clicks and CPC come live from your Meta ad accounts for the same period; form spend is estimated from the campaign's cost per lead.
                            </p>
                        </TabsContent>

                        {/* ---------- Tab 2 ---------- */}
                        <TabsContent value="users" className="mt-4">
                            <UsersTable users={data.users} fc={formatCurrency} scope={selectedCampaign?.name || sourceLabel} />
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
}

// ---------- pieces ----------

type Fc = (n: number) => string;

function Profit({ v, fc }: { v: number; fc: Fc }) {
    if (!v) return <span className="text-muted-foreground">{fc(0)}</span>;
    return <span className={cn('font-semibold', v > 0 ? 'text-emerald-600' : 'text-red-500')}>{v > 0 ? '+' : ''}{fc(v)}</span>;
}

function SummaryRow({ m, fc, fcc, title }: { m: RoiMetrics; fc: Fc; fcc: Fc; title: string }) {
    const tiles: [string, string, string?, string?][] = [
        ['Leads', m.leads.toLocaleString(), `${m.open.toLocaleString()} still open`],
        ['Converted', m.converted.toLocaleString(), `${m.conversionRate}% conversion`, 'text-emerald-600'],
        ['Lost', m.lost.toLocaleString(), m.leads ? `${Math.round((m.lost / m.leads) * 100)}% of leads` : undefined, 'text-red-500'],
        ['Revenue', fcc(m.revenue), 'won deal value', 'text-emerald-600'],
        ['Ad Spend', fcc(m.spend), m.costPerLead ? `${fc(m.costPerLead)} per lead` : undefined],
        ['Cost / Conversion', m.costPerConversion ? fc(m.costPerConversion) : '—'],
    ];
    const profitable = m.profit >= 0;
    return (
        <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Showing: <span className="font-semibold text-foreground">{title}</span></p>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                {tiles.map(([l, v, sub, color]) => (
                    <div key={l} className="finance-card p-4">
                        <p className="text-xs text-muted-foreground font-medium">{l}</p>
                        <p className={cn('text-xl font-bold mt-1', color)}>{v}</p>
                        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
                    </div>
                ))}
                <div className={cn('col-span-2 rounded-[1.5rem] p-4 text-white', profitable ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' : 'bg-gradient-to-br from-red-500 to-rose-700')}>
                    <div className="flex items-center gap-2 text-xs font-medium opacity-90">
                        {profitable ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {profitable ? 'Net Profit' : 'Net Loss'}
                    </div>
                    <p className="text-2xl font-extrabold mt-1">{fc(Math.abs(m.profit))}</p>
                    <p className="text-[11px] opacity-90">Revenue − ad spend{m.roi !== null ? ` · ROI ${m.roi}%` : ''}</p>
                </div>
            </div>
        </div>
    );
}

function SourceCard({ s, active, dimmed, onClick, fcc }: { s: RoiSource; active: boolean; dimmed: boolean; onClick: () => void; fcc: Fc }) {
    const st = styleOf(s.source);
    const Icon = st.icon;
    return (
        <button onClick={onClick}
            className={cn('text-left rounded-[1.25rem] border bg-gradient-to-br p-4 transition hover:shadow-md', st.bg,
                active && 'ring-2 ring-primary shadow-md', dimmed && 'opacity-50')}>
            <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-background/80 flex items-center justify-center"><Icon className={cn('h-5 w-5', st.color)} /></div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{s.label}</p>
                    <p className="text-[11px] text-muted-foreground">{s.campaignCount ? `${s.campaignCount} campaign${s.campaignCount > 1 ? 's' : ''}` : 'no campaigns'}</p>
                </div>
                <p className="text-2xl font-extrabold">{s.leads}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div><p className="text-sm font-bold text-emerald-600">{s.converted}</p><p className="text-[10px] text-muted-foreground">converted</p></div>
                <div><p className="text-sm font-bold text-red-500">{s.lost}</p><p className="text-[10px] text-muted-foreground">lost</p></div>
                <div><p className="text-sm font-bold">{s.conversionRate}%</p><p className="text-[10px] text-muted-foreground">conv. rate</p></div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60 text-xs">
                <span>Revenue <b>{fcc(s.revenue)}</b></span>
                {s.spend > 0 && <span>Spend <b>{fcc(s.spend)}</b></span>}
                <span className={cn('font-bold', s.profit >= 0 ? 'text-emerald-600' : 'text-red-500')}>{s.profit >= 0 ? '+' : '−'}{fcc(Math.abs(s.profit))}</span>
            </div>
        </button>
    );
}

function CampaignDetail({ c, fc, label }: { c: RoiCampaign; fc: Fc; label: (s: string) => string }) {
    const d = campaignDuration(c);
    const statuses = Object.entries(c.statuses).sort((a, b) => b[1] - a[1]);
    const max = statuses[0]?.[1] || 1;
    return (
        <div className="finance-card p-5 grid gap-5 lg:grid-cols-3">
            <div className="space-y-3">
                <div className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /><h3 className="font-bold text-lg leading-tight">{c.name}</h3></div>
                {c.adAccountName && <p className="text-xs text-muted-foreground">Ad account: {c.adAccountName}</p>}
                {d && (
                    <div className="rounded-xl bg-muted/50 p-3 text-sm">
                        <p className="text-xs text-muted-foreground">Campaign duration</p>
                        <p className="font-semibold">{fmtDate(d.start)} → {d.end ? fmtDate(d.end) : d.running ? 'still running' : fmtDate(c.lastLeadAt)}</p>
                        <p className="text-xs text-muted-foreground">{d.days} days{c.startTime ? '' : ' (from first to last lead)'}</p>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <Stat l="Impressions" v={c.impressions.toLocaleString()} />
                    <Stat l="Reach" v={c.reach.toLocaleString()} />
                    <Stat l="Clicks" v={c.clicks.toLocaleString()} icon={<MousePointerClick className="h-3.5 w-3.5" />} />
                    <Stat l="Cost per click" v={c.costPerClick ? fc(c.costPerClick) : '—'} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 content-start text-sm">
                <Stat l="Leads from campaign" v={c.leads.toLocaleString()} />
                <Stat l="Converted" v={`${c.converted} (${c.conversionRate}%)`} cls="text-emerald-600" />
                <Stat l="Lost" v={c.lost.toLocaleString()} cls="text-red-500" />
                <Stat l="Still open" v={c.open.toLocaleString()} />
                <Stat l="Ad spend" v={fc(c.spend)} />
                <Stat l="Cost per lead" v={c.costPerLead ? fc(c.costPerLead) : '—'} />
                <Stat l="Revenue" v={fc(c.revenue)} cls="text-emerald-600" />
                <Stat l="Cost per conversion" v={c.costPerConversion ? fc(c.costPerConversion) : '—'} />
                <div className={cn('col-span-2 rounded-xl p-3 text-white', c.profit >= 0 ? 'bg-emerald-600' : 'bg-red-500')}>
                    <p className="text-xs opacity-90">{c.profit >= 0 ? 'Profit' : 'Loss'} from this campaign</p>
                    <p className="text-xl font-extrabold">{fc(Math.abs(c.profit))}{c.roi !== null && <span className="text-xs font-semibold ml-2">ROI {c.roi}%</span>}</p>
                </div>
            </div>
            <div>
                <p className="text-sm font-semibold mb-2">Lead status breakdown</p>
                <div className="space-y-1.5 max-h-64 overflow-auto pr-1">
                    {statuses.map(([s, n]) => (
                        <div key={s} className="text-xs">
                            <div className="flex justify-between"><span className="capitalize">{label(s)}</span><span className="font-semibold">{n}</span></div>
                            <div className="h-1.5 rounded bg-muted"><div className="h-1.5 rounded bg-primary" style={{ width: `${(n / max) * 100}%` }} /></div>
                        </div>
                    ))}
                    {statuses.length === 0 && <p className="text-xs text-muted-foreground">No leads in this period.</p>}
                </div>
            </div>
        </div>
    );
}

function Stat({ l, v, cls, icon }: { l: string; v: string; cls?: string; icon?: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-border p-2.5">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">{icon}{l}</p>
            <p className={cn('font-bold', cls)}>{v}</p>
        </div>
    );
}

function UsersTable({ users, fc, scope }: { users: RoiUser[]; fc: Fc; scope: string | null | undefined }) {
    const [sort, setSort] = useState<'profit' | 'revenue' | 'leads' | 'conversionRate'>('profit');
    const sorted = [...users].sort((a, b) => (b[sort] as number) - (a[sort] as number));
    const total = users.reduce((t, u) => ({ leads: t.leads + u.leads, converted: t.converted + u.converted, lost: t.lost + u.lost, revenue: t.revenue + u.revenue, spend: t.spend + u.spend }), { leads: 0, converted: 0, lost: 0, revenue: 0, spend: 0 });
    const profitable = users.filter((u) => u.profit > 0).length;
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted-foreground flex-1">
                    Each user's leads{scope ? ` from ${scope}` : ''}, what they converted, and the ad cost of the leads they were given
                    (each lead costs its campaign's cost per lead). <b className="text-emerald-600">{profitable}</b> of {users.length} users are in profit.
                </p>
                <Select value={sort} onValueChange={(v) => setSort(v as any)}>
                    <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="profit">Sort: Profit</SelectItem>
                        <SelectItem value="revenue">Sort: Revenue</SelectItem>
                        <SelectItem value="leads">Sort: Leads</SelectItem>
                        <SelectItem value="conversionRate">Sort: Conversion %</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="finance-card p-0 overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[180px]">User</TableHead>
                            <TableHead className="text-right">Leads</TableHead>
                            <TableHead className="text-right">Converted</TableHead>
                            <TableHead className="text-right">Lost</TableHead>
                            <TableHead className="text-right">Open</TableHead>
                            <TableHead className="text-right">Revenue</TableHead>
                            <TableHead className="text-right">Ad cost of leads</TableHead>
                            <TableHead className="text-right">Cost / Conversion</TableHead>
                            <TableHead className="text-right">Profit / Loss</TableHead>
                            <TableHead className="text-right">ROI</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sorted.map((u) => (
                            <TableRow key={u.userId || 'unassigned'}>
                                <TableCell>
                                    <p className="font-semibold">{u.name}{!u.isActive && <span className="text-[10px] text-muted-foreground ml-1">(inactive)</span>}</p>
                                    {u.branch && <p className="text-xs text-muted-foreground">{u.branch}</p>}
                                </TableCell>
                                <TableCell className="text-right font-semibold">{u.leads}</TableCell>
                                <TableCell className="text-right text-emerald-600 font-semibold">{u.converted}<span className="text-[10px] text-muted-foreground ml-1">{u.conversionRate}%</span></TableCell>
                                <TableCell className="text-right text-red-500">{u.lost}</TableCell>
                                <TableCell className="text-right">{u.open}</TableCell>
                                <TableCell className="text-right">{fc(u.revenue)}</TableCell>
                                <TableCell className="text-right">{u.spend ? fc(u.spend) : '—'}</TableCell>
                                <TableCell className="text-right">{u.costPerConversion ? fc(u.costPerConversion) : '—'}</TableCell>
                                <TableCell className="text-right">
                                    <Badge className={cn('font-semibold', u.profit > 0 ? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15' : u.profit < 0 ? 'bg-red-500/15 text-red-600 hover:bg-red-500/15' : 'bg-muted text-muted-foreground hover:bg-muted')}>
                                        {u.profit > 0 ? 'Profit ' : u.profit < 0 ? 'Loss ' : ''}{fc(Math.abs(u.profit))}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right text-xs font-semibold">{u.roi === null ? '—' : `${u.roi}%`}</TableCell>
                            </TableRow>
                        ))}
                        {users.length > 0 && (
                            <TableRow className="bg-muted/50 font-bold">
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
                        {users.length === 0 && <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No leads for this selection.</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
