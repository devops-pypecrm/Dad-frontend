import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDailyReport } from '@/services/analyticsService';
import { getBranches } from '@/services/settingsService';
import { getUsers } from '@/services/userService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  FileDown,
  RefreshCw,
  Printer,
  Building,
  Calendar,
  BarChart3 as BarChart3Icon,
  Phone,
  Clock,
  Search,
  ChevronDown,
  Users as UsersIcon,
} from 'lucide-react';
import { PageLoader } from '@/components/ui/page-loader';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, isAdmin as checkIsAdmin } from "@/lib/utils";
import { subDays, format } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { CHART_COLORS } from '@/components/dashboard-v2/chartColors';

export default function DailyReportPage() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userFilterOpen, setUserFilterOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [period, setPeriod] = useState<string>("today");
  const [user] = useState<{ role: string } | null>(() => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  });

  const isAdmin = checkIsAdmin(user);

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
    enabled: !!isAdmin
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
  });
  const allUsers = usersData?.users || [];

  const userFilterUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((u: any) => `${u.firstName} ${u.lastName || ''}`.toLowerCase().includes(q));
  }, [allUsers, userSearch]);

  const toggleUserFilter = (id: string) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getDateRange = (selectedPeriod: string) => {
    const today = new Date();
    switch (selectedPeriod) {
      case 'today':
        return { startDate: format(today, 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
      case 'yesterday': {
        const yesterday = subDays(today, 1);
        return { startDate: format(yesterday, 'yyyy-MM-dd'), endDate: format(yesterday, 'yyyy-MM-dd') };
      }
      case 'today-yesterday': {
        const yesterday = subDays(today, 1);
        return { startDate: format(yesterday, 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
      }
      case 'last-7-days': {
        const start = subDays(today, 6);
        return { startDate: format(start, 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
      }
      case 'last-14-days': {
        const start = subDays(today, 13);
        return { startDate: format(start, 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
      }
      case 'last-28-days': {
        const start = subDays(today, 27);
        return { startDate: format(start, 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
      }
      case 'last-30-days': {
        const start = subDays(today, 29);
        return { startDate: format(start, 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
      }
      default:
        return { startDate: format(today, 'yyyy-MM-dd'), endDate: format(today, 'yyyy-MM-dd') };
    }
  };

  const { data: reportData, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['dailyReport', selectedBranchId, period, selectedUserIds],
    queryFn: () => {
      const { startDate, endDate } = getDateRange(period);
      return getDailyReport({
        branchId: selectedBranchId === "all" ? undefined : selectedBranchId,
        userIds: selectedUserIds.length > 0 ? selectedUserIds.join(',') : undefined,
        startDate,
        endDate
      });
    },
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 mins
    retry: 2,              // Retry up to 2x on failure (handles cold-start 401 on mobile)
    retryDelay: 1500,      // Wait 1.5s between retries (gives auth token time to load)
  });

  const tableData = reportData?.table || [];
  const summary = reportData?.summary || null;

  const hasActiveFilters = selectedBranchId !== "all" || period !== "today" || selectedUserIds.length > 0;

  const topCallersChartData = useMemo(
    () => [...tableData]
      .sort((a: any, b: any) => b.totalCalls - a.totalCalls)
      .slice(0, 8)
      .map((row: any) => ({ name: row.userName, value: row.totalCalls })),
    [tableData]
  );

  const outcomeChartData = useMemo(() => [
      { name: 'Connected', value: tableData.reduce((s: number, r: any) => s + r.totalConnected, 0) },
      { name: 'Unconnected', value: tableData.reduce((s: number, r: any) => s + r.totalUnconnected, 0) },
      { name: 'Converted', value: tableData.reduce((s: number, r: any) => s + r.totalConverted, 0) },
      { name: 'Lost', value: tableData.reduce((s: number, r: any) => s + r.totalLost, 0) },
    ].filter(d => d.value > 0),
    [tableData]
  );

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    try {
      toast.loading('Preparing Report...', { id: 'pdf-export' });

      const element = reportRef.current;

      const dataUrl = await toPng(element, {
        backgroundColor: '#fff',
        cacheBust: true,
        pixelRatio: 2,
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: {
          overflow: 'visible',
          width: element.scrollWidth + 'px',
          height: element.scrollHeight + 'px',
          margin: '0',
          padding: '20px'
        }
      });

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const pxWidth = img.width;
      const pxPageHeight = (pxWidth * pageHeight) / pageWidth;

      let totalHeightLeft = img.height;
      let startY = 0;
      let firstPage = true;

      while (totalHeightLeft > 0) {
        if (!firstPage) pdf.addPage();

        const canvas = document.createElement('canvas');
        const sliceHeight = Math.min(pxPageHeight, totalHeightLeft);

        canvas.width = pxWidth;
        canvas.height = sliceHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, startY, pxWidth, sliceHeight, 0, 0, pxWidth, sliceHeight);
          const sliceDataUrl = canvas.toDataURL('image/png', 1.0);

          const displayHeight = (sliceHeight * pageWidth) / pxWidth;
          pdf.addImage(sliceDataUrl, 'PNG', 0, 0, pageWidth, displayHeight);
        }

        startY += sliceHeight;
        totalHeightLeft -= sliceHeight;
        firstPage = false;
      }

      pdf.save(`Daily_Report_${getPeriodLabel().replace(/[\s,]+/g, '_')}.pdf`);
      toast.success('Report saved successfully', { id: 'pdf-export' });
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to generate PDF', { id: 'pdf-export' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || error) return <PageLoader text="Preparing your report..." />;

  const getPeriodLabel = () => {
    const { startDate, endDate } = getDateRange(period);
    const parseLocalDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    if (startDate === endDate) {
      return format(parseLocalDate(startDate), 'MMMM d, yyyy');
    }
    return `${format(parseLocalDate(startDate), 'MMM d, yyyy')} - ${format(parseLocalDate(endDate), 'MMM d, yyyy')}`;
  };

  const dateLabel = getPeriodLabel();

  return (
    <div className="bg-white min-h-screen p-4 sm:p-8 space-y-6 animate-in fade-in duration-300 font-poppins">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border/40 no-print">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-[10px] bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <BarChart3Icon className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Daily Performance Report</h1>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 ml-11 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Performance metrics for {dateLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="gap-1.5 border-border/60 hover:bg-muted/50 h-9 px-3 rounded-[10px] text-xs"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
          <Button
            onClick={handleDownloadPDF}
            size="sm"
            className="gap-1.5 bg-primary hover:bg-primary/90 h-9 px-3 rounded-[10px] text-xs"
          >
            <FileDown className="h-3.5 w-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-[14px] border border-border/60 bg-card shadow-xs p-4 no-print">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
          <div className="w-full sm:w-[160px]">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="bg-background border-border/60 h-9 text-xs rounded-[10px] w-full">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Select period" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="today-yesterday">Today & Yesterday</SelectItem>
                <SelectItem value="last-7-days">Last 7 days</SelectItem>
                <SelectItem value="last-14-days">Last 14 days</SelectItem>
                <SelectItem value="last-28-days">Last 28 days</SelectItem>
                <SelectItem value="last-30-days">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isAdmin && branches && branches.length > 0 && (
            <div className="w-full sm:w-[160px]">
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger className="bg-background border-border/60 h-9 text-xs rounded-[10px] w-full">
                  <div className="flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="All Branches" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Multi-select searchable user filter */}
          <Popover open={userFilterOpen} onOpenChange={(o) => { setUserFilterOpen(o); if (!o) setUserSearch(""); }}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex h-9 w-full sm:w-[200px] items-center justify-between rounded-[10px] border border-border/60 bg-background px-3 text-xs hover:bg-muted/40 transition-colors"
              >
                <span className="flex items-center gap-2 truncate">
                  <UsersIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {selectedUserIds.length === 0
                    ? 'All Users'
                    : selectedUserIds.length === 1
                      ? (() => {
                          const u = allUsers.find((x: any) => x.id === selectedUserIds[0]);
                          return u ? `${u.firstName} ${u.lastName || ''}` : '1 user';
                        })()
                      : `${selectedUserIds.length} users selected`}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0 rounded-xl shadow-2xl border-border/50" align="start">
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    autoFocus
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users..."
                    className="pl-8 h-8 text-sm"
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto p-1">
                {userFilterUsers.length === 0 ? (
                  <p className="px-2 py-4 text-xs text-muted-foreground text-center">No users found.</p>
                ) : (
                  userFilterUsers.map((u: any) => {
                    const checked = selectedUserIds.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className={cn(
                          "w-full flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted/60 text-left cursor-pointer",
                          checked && "bg-muted"
                        )}
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggleUserFilter(u.id)} />
                        <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                          {u.firstName?.[0]}{u.lastName?.[0] || ''}
                        </span>
                        <span className="truncate">{u.firstName} {u.lastName || ''}</span>
                      </label>
                    );
                  })
                )}
              </div>
              {selectedUserIds.length > 0 && (
                <div className="p-2 border-t border-border flex gap-1.5">
                  <Button size="sm" variant="outline" className="h-8 flex-1 rounded-lg text-xs" onClick={() => setSelectedUserIds([])}>
                    Clear
                  </Button>
                  <Button size="sm" className="h-8 flex-1 rounded-lg text-xs" onClick={() => setUserFilterOpen(false)}>
                    Done ({selectedUserIds.length})
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button
              onClick={() => {
                setSelectedBranchId("all");
                setPeriod("today");
                setSelectedUserIds([]);
              }}
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 px-3 border border-destructive/30 rounded-[10px] text-xs"
            >
              Clear Filters
            </Button>
          )}

          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isFetching}
            className="gap-1.5 border-border/60 hover:bg-muted/50 h-9 px-3 rounded-[10px] text-xs sm:ml-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Report Content Area (Captured in PDF) */}
      <div ref={reportRef} className="space-y-6">
        {/* KPI Stats */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Total Phone Calls" value={summary.totalCalls} icon={Phone} accent="primary" />
            <SummaryCard title="Total Call Duration" value={formatDuration(summary.totalDuration)} icon={Clock} accent="emerald" isText />
            <SummaryCard title="Incoming Calls" value={summary.incoming} subValue={formatDuration(summary.incomingDuration)} icon={Phone} accent="primary" />
            <SummaryCard title="Outgoing Calls" value={summary.outgoing} subValue={formatDuration(summary.outgoingDuration)} icon={Phone} accent="primary" />
            <SummaryCard title="Missed Calls" value={summary.missed} icon={Phone} accent="destructive" />
            <SummaryCard title="Rejected Calls" value={summary.rejected} icon={Phone} accent="amber" />
            <SummaryCard title="Never Attended Calls" value={summary.neverAttended} icon={Phone} accent="muted" />
            <SummaryCard title="Not Pickup by Client" value={summary.notPickedUp} icon={Phone} accent="amber" />
            <SummaryCard title="Unique Numbers Called" value={summary.unique} icon={Phone} accent="emerald" />
          </div>
        )}

        {/* Charts */}
        {tableData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-[14px] border border-border/60 bg-card shadow-xs p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Top Callers</h3>
              <ResponsiveContainer width="100%" height={Math.max(220, topCallersChartData.length * 36)}>
                <BarChart data={topCallersChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fontFamily: 'Poppins, sans-serif', fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fontFamily: 'Poppins, sans-serif', fill: 'hsl(var(--foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontFamily: 'Poppins, sans-serif' }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={18}>
                    {topCallersChartData.map((_, index) => <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-[14px] border border-border/60 bg-card shadow-xs p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Call Outcomes</h3>
              {outcomeChartData.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={outcomeChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name">
                      {outcomeChartData.map((_, index) => <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontFamily: 'Poppins, sans-serif' }}
                      formatter={(value?: number, name?: string) => [`${value ?? 0} calls`, name ?? '']}
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12, fontFamily: 'Poppins, sans-serif' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Table Card */}
        <div className="rounded-[14px] border border-border/70 bg-card overflow-hidden shadow-xs">
          <div className="px-4 py-3.5 border-b border-border/60 bg-muted/40">
            <span className="text-sm font-semibold text-foreground">User-wise Breakdown</span>
            <p className="text-xs text-muted-foreground mt-0.5">{dateLabel}</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/60">
                  <TableHead className="text-[11px] uppercase tracking-wider">User Name</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-center">Branch</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-center">Calls</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-center">Connected</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-center">Unconnected</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-center">Duration</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-center">Converted</TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider text-center">Lost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.length > 0 ? (
                  tableData.map((row: any) => (
                    <TableRow key={row.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium text-foreground text-xs">
                        {row.userName}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-[10px] font-semibold uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                          {row.branch || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-medium text-muted-foreground tabular-nums">
                        {row.totalCalls}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`
                          inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-full text-xs font-semibold
                          ${row.totalConnected > 0 ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground'}
                        `}>
                          {row.totalConnected}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-medium text-muted-foreground tabular-nums">
                        {row.totalUnconnected}
                      </TableCell>
                      <TableCell className="text-center font-medium text-muted-foreground tabular-nums">
                        {formatDuration(row.totalDuration || 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`
                          inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-full text-xs font-semibold
                          ${row.totalConverted > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                        `}>
                          {row.totalConverted}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`
                          inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-full text-xs font-semibold
                          ${row.totalLost > 0 ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}
                        `}>
                          {row.totalLost}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center text-muted-foreground italic">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p className="text-base font-medium opacity-60">No activity recorded for this period yet.</p>
                        <p className="text-sm opacity-40">Data will appear here as users make calls and update leads.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          table tr { page-break-inside: avoid !important; break-inside: avoid !important; }
          @page { size: auto; margin: 10mm; }
        }
      `}</style>
    </div>
  );
}

const SUMMARY_ACCENTS: Record<string, { bar: string; text: string; icon: string }> = {
  primary: { bar: "bg-primary", text: "group-hover:text-primary", icon: "bg-primary/10 text-primary" },
  emerald: { bar: "bg-emerald-500", text: "group-hover:text-emerald-600", icon: "bg-emerald-500/10 text-emerald-600" },
  amber: { bar: "bg-amber-500", text: "group-hover:text-amber-600", icon: "bg-amber-500/10 text-amber-600" },
  destructive: { bar: "bg-destructive", text: "group-hover:text-destructive", icon: "bg-destructive/10 text-destructive" },
  muted: { bar: "bg-muted-foreground/40", text: "", icon: "bg-muted text-muted-foreground" },
};

function SummaryCard({
  title,
  value,
  subValue,
  accent,
  icon: Icon,
  isText = false,
}: {
  title: string;
  value: number | string;
  subValue?: string;
  accent: keyof typeof SUMMARY_ACCENTS;
  icon: typeof Phone;
  isText?: boolean;
}) {
  const classes = SUMMARY_ACCENTS[accent];
  return (
    <div className="rounded-[14px] border border-border/60 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-border group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
        <div className={`h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0 ${classes.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className={cn("font-bold text-foreground tabular-nums transition-colors", isText ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl", classes.text)}>
          {value}
        </span>
      </div>
      {subValue && (
        <p className="text-[11px] text-muted-foreground mt-1">{subValue}</p>
      )}
    </div>
  );
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}
