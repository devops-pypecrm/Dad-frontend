import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserPerformanceDetails } from "@/services/analyticsService";
import { getBranches } from "@/services/settingsService";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import {
  Activity,
  Phone,
  AlertCircle,
  Download,
  Calendar,
  Users,
  Building,
  RefreshCw,
  Award,
  Target,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear } from "date-fns";
import { toISTDateString, getISTNow } from "@/lib/dateUtils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  ComposedChart,
  Line
} from "recharts";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";
import { FILTER_CARD_CLASS, FILTER_ICON_CLASS, FILTER_LABEL_CLASS, FILTER_TRIGGER_CLASS } from "@/pages/leads/filterStyles";

export default function UserPerformanceReport() {
  const { formatCurrency } = useCurrency();
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Filter States
  const [startDate, setStartDate] = useState<string>(toISTDateString());
  const [endDate, setEndDate] = useState<string>(toISTDateString());
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [activePeriod, setActivePeriod] = useState<string>("today");
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>({ key: 'metrics.performanceIndex', direction: 'desc' });

  // Export scope - separate from the on-screen "Representative" filter above, so picking a
  // custom export selection doesn't disturb what's currently shown on the page.
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportScope, setExportScope] = useState<'all' | 'custom'>('all');
  const [exportUserIds, setExportUserIds] = useState<string[]>([]);
  // Non-null only while a custom-scoped PDF capture is actually running - temporarily narrows
  // filteredPerformanceData to just the chosen users so the snapshot reflects the selection,
  // then gets cleared back to null so the live page view is unaffected afterward.
  const [exportOverrideUserIds, setExportOverrideUserIds] = useState<string[] | null>(null);

  // Fetch Base Data
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches
  });

  const { data: performanceData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['userPerformanceDetails', startDate, endDate, selectedBranchId],
    queryFn: () => getUserPerformanceDetails({
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      branchId: selectedBranchId === "all" ? undefined : selectedBranchId
    })
  });

  // Derived Data for Filters and Display
  const filteredPerformanceData = useMemo(() => {
    if (!performanceData) return [];
    let data = [...performanceData];

    // Filter by User
    if (selectedUserId !== "all") {
      data = data.filter((u: any) => u.userId === selectedUserId);
    }

    // Export-time override - only active during a custom-scoped PDF capture (see downloadPDF)
    if (exportOverrideUserIds) {
      data = data.filter((u: any) => exportOverrideUserIds.includes(u.userId));
    }

    // Apply Sorting
    if (sortConfig) {
      data.sort((a, b) => {
        const getValue = (obj: any, path: string) => {
          return path.split('.').reduce((acc, part) => acc && acc[part], obj);
        };

        const aValue = getValue(a, sortConfig.key);
        const bValue = getValue(b, sortConfig.key);

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [performanceData, selectedUserId, sortConfig, exportOverrideUserIds]);

  const userOptions = useMemo(() => {
    if (!performanceData) return [];
    return performanceData.map((u: any) => ({ id: u.userId, name: u.name }));
  }, [performanceData]);

  // Summary Metrics
  const summary = useMemo(() => {
    if (!filteredPerformanceData || filteredPerformanceData.length === 0) return null;

    const data = filteredPerformanceData;
    const total = data.length;
    const totalLeads = data.reduce((acc: number, u: any) => acc + u.metrics.totalLeads, 0);
    const totalCalls = data.reduce((acc: number, u: any) => acc + u.metrics.callsMade, 0);
    const totalConversions = data.reduce((acc: number, u: any) => acc + u.metrics.wonDeals, 0);
    const totalUnattended = data.reduce((acc: number, u: any) => acc + u.metrics.unattendedLeads, 0);
    const totalRevenue = data.reduce((acc: number, u: any) => acc + u.metrics.revenue, 0);
    const avgIndex = data.reduce((acc: number, u: any) => acc + u.metrics.performanceIndex, 0) / total;

    return {
      totalUsers: total,
      totalLeads,
      totalCalls,
      totalConversions,
      totalUnattended,
      totalRevenue,
      avgPerformanceIndex: avgIndex.toFixed(1),
      overallConversion: ((totalConversions / (totalLeads || 1)) * 100).toFixed(1)
    };
  }, [filteredPerformanceData]);

  // Period handlers
  const setPeriod = (period: string) => {
    setActivePeriod(period);
    // Anchor on the IST calendar day so "today"/"week"/etc. match the IST day boundaries the
    // backend actually filters on, not the viewer's local day.
    const now = getISTNow();
    let start, end;

    switch (period) {
      case 'today':
        start = now;
        end = now;
        break;
      case 'week':
        start = startOfWeek(now);
        end = endOfWeek(now);
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      default:
        return;
    }

    setStartDate(format(start, "yyyy-MM-dd"));
    setEndDate(format(end, "yyyy-MM-dd"));
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (!sortConfig || sortConfig.key !== columnKey) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="ml-1 h-3 w-3 text-[hsl(var(--chart-5))]" /> : <ChevronDown className="ml-1 h-3 w-3 text-[hsl(var(--chart-5))]" />;
  };

  const UserPerformanceCard = ({ user }: { user: any }) => (
    <Card className="border border-border overflow-hidden mb-3 rounded-[10px]">
      <div className="p-4 border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border shadow-sm">
              <AvatarImage src={user.profileImage} />
              <AvatarFallback className="bg-[hsl(var(--chart-5)/0.1)] text-[hsl(var(--chart-5))] text-xs font-semibold">
                {user.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-sm font-poppins">{user.name}</span>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">{user.branch}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={cn(
              "text-xl font-bold leading-none font-poppins",
              user.metrics.performanceIndex > 80 ? "text-[hsl(var(--chart-5))]" : user.metrics.performanceIndex > 50 ? "text-blue-500" : "text-orange-500"
            )}>
              {user.metrics.performanceIndex}
            </span>
            <span className="text-[9px] font-semibold text-muted-foreground tracking-wide uppercase">Index Score</span>
          </div>
        </div>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">Revenue</p>
          <p className="text-sm font-bold text-foreground">{formatCurrency(user.metrics.revenue)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">Leads</p>
          <p className="text-sm font-bold text-foreground">{user.metrics.totalLeads}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">Calls</p>
          <div className="flex items-baseline gap-1">
            <p className="text-sm font-bold text-blue-600">{user.metrics.callsMade}</p>
            <span className="text-[10px] text-muted-foreground">interactions</span>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wide">Target Match</p>
          <div className="flex items-baseline gap-1">
            <p className="text-sm font-bold text-green-600">{user.metrics.wonDeals}</p>
            <span className="text-[10px] text-muted-foreground">({user.metrics.conversionRate}%)</span>
          </div>
        </div>
      </div>
      <div className="h-1 w-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-500",
            user.metrics.performanceIndex > 80 ? "bg-[hsl(var(--chart-5))]" : user.metrics.performanceIndex > 50 ? "bg-blue-500" : "bg-orange-500"
          )}
          style={{ width: `${user.metrics.performanceIndex}%` }}
        />
      </div>
    </Card>
  );

  const downloadPDF = async (scope: 'all' | 'custom', userIds: string[] = []) => {
    if (!reportRef.current) return;
    if (scope === 'custom' && userIds.length === 0) {
      toast.error("Select at least one user to export");
      return;
    }

    setIsExporting(true);
    toast.info("Preparing PDF report...");

    if (scope === 'custom') {
      setExportOverrideUserIds(userIds);
    }

    try {
      // Give time for layout to re-render with the export override applied (and the
      // dialog's own closing animation to finish) before snapshotting the DOM.
      await new Promise(r => setTimeout(r, 500));

      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        style: {
          padding: '20px'
        }
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const margin = 10;
      const contentWidth = pageWidth - (2 * margin);
      const contentHeight = pageHeight - (2 * margin);

      const pxWidth = img.width;
      const pxPageHeight = (img.width * contentHeight) / contentWidth;

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
          const sliceDataUrl = canvas.toDataURL('image/png');
          const displayHeight = (sliceHeight * contentWidth) / pxWidth;
          pdf.addImage(sliceDataUrl, 'PNG', margin, margin, contentWidth, displayHeight);
        }

        startY += sliceHeight;
        totalHeightLeft -= sliceHeight;
        firstPage = false;
      }

      pdf.save(`User_Total_Report_${scope === 'custom' ? 'Custom_' : ''}${toISTDateString()}.pdf`);
      toast.success("PDF report downloaded successfully!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsExporting(false);
      setExportOverrideUserIds(null);
    }
  };

  const openExportDialog = () => {
    setExportScope('all');
    setExportUserIds([]);
    setExportDialogOpen(true);
  };

  const toggleExportUser = (userId: string) => {
    setExportUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleExportConfirm = () => {
    setExportDialogOpen(false);
    downloadPDF(exportScope, exportUserIds);
  };

  if (isLoading) {
    return (
      <div className="p-5 space-y-5 max-w-[1600px] mx-auto">
        <Skeleton className="h-12 w-1/3 rounded-[10px]" />
        <Skeleton className="h-20 w-full rounded-[10px]" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-[10px]" />)}
        </div>
        <Skeleton className="h-[400px] w-full rounded-[10px]" />
      </div>
    );
  }

  const statTiles = summary ? [
    { label: 'Performance Index', value: `${summary.avgPerformanceIndex}%`, icon: Award },
    { label: 'Total Interactions', value: summary.totalCalls, icon: Phone },
    { label: 'Overall Conversion', value: `${summary.overallConversion}%`, icon: Target },
    { label: 'Unattended Leads', value: summary.totalUnattended, icon: AlertCircle },
  ] : [];

  return (
    <div className="flex flex-col gap-5 p-5 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-12 w-12 rounded-[10px] bg-[hsl(var(--chart-5))]/10 flex items-center justify-center text-[hsl(var(--chart-5))] shrink-0">
            <Award className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-foreground tracking-tight">
              User Total Report
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Individual-wise performance metrics, activity logs, and conversion analysis.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-medium"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            onClick={openExportDialog}
            disabled={isExporting}
            className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-medium bg-[hsl(var(--chart-5))] hover:bg-[hsl(var(--chart-5)/0.9)] text-white"
          >
            {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {isExporting ? "Generating..." : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Stats row - single divided card, matching QuickStatsBar's pattern */}
      {statTiles.length > 0 && (
        <div className="rounded-[10px] bg-card border border-border overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border">
            {statTiles.map((tile) => (
              <div key={tile.label} className="relative flex flex-col items-center justify-center gap-1 px-3 py-4 overflow-hidden">
                <span className="absolute top-0 left-0 right-0 h-0.5 bg-[hsl(var(--chart-5))] opacity-70" />
                <tile.icon className="h-4 w-4 text-muted-foreground mb-0.5" />
                <span className="text-lg sm:text-xl font-medium font-poppins text-foreground">{tile.value}</span>
                <span className="text-xs font-poppins text-muted-foreground text-center">{tile.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className={FILTER_CARD_CLASS}>
          <Building className={FILTER_ICON_CLASS} />
          <div>
            <span className={FILTER_LABEL_CLASS}>Location</span>
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue placeholder="All Branches" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {(branches || []).map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={FILTER_CARD_CLASS}>
          <Users className={FILTER_ICON_CLASS} />
          <div>
            <span className={FILTER_LABEL_CLASS}>Representative</span>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue placeholder="All Users" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Representatives</SelectItem>
                {(userOptions || []).map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex bg-card rounded-[10px] border border-border h-[52px] overflow-x-auto">
          {['today', 'week', 'month', 'year'].map((period) => (
            <Button
              key={period}
              variant="ghost"
              size="sm"
              onClick={() => setPeriod(period)}
              className={cn(
                "min-w-16 flex-1 capitalize text-xs h-full rounded-none px-3 font-medium",
                activePeriod === period ? "bg-[hsl(var(--chart-5))] text-white" : "text-muted-foreground hover:bg-muted"
              )}
            >
              {period}
            </Button>
          ))}
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {setStartDate(e.target.value); setActivePeriod('custom');}}
            className="h-[52px] pl-10 w-[150px] bg-card border-border rounded-[10px]"
          />
        </div>
        <span className="text-muted-foreground font-medium text-sm">to</span>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {setEndDate(e.target.value); setActivePeriod('custom');}}
            className="h-[52px] pl-10 w-[150px] bg-card border-border rounded-[10px]"
          />
        </div>
      </div>

      {/* Visual Analytics Container */}
      <div ref={reportRef} className="space-y-5 bg-background rounded-[20px]">
        {/* Charts Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Activity Comparison Chart */}
          <Card className="border border-border rounded-[10px] md:rounded-[20px] overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold font-poppins flex items-center gap-2">
                <Activity className="h-4 w-4 text-[hsl(var(--chart-5))]" /> Activity vs Conversion Metrics
              </h3>
            </div>
            <CardContent className="p-5 min-h-0 min-w-0">
              <div className="h-[300px] sm:h-[380px] w-full min-h-0 min-w-0">
                <ResponsiveContainer minWidth={1} minHeight={1} width="100%" height="100%" debounce={100}>
                  <ComposedChart data={filteredPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 600}} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                    <Tooltip
                      contentStyle={{borderRadius: '10px', border: 'none'}}
                      formatter={(value: any, name: string | any) => [name === 'revenue' ? formatCurrency(value) : value, (name || '').toUpperCase()]}
                    />
                    <Legend verticalAlign="top" height={36}/>
                    <Bar yAxisId="left" dataKey="metrics.callsMade" name="calls" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar yAxisId="left" dataKey="metrics.totalLeads" name="leads" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} barSize={20} />
                    <Line yAxisId="right" type="monotone" dataKey="metrics.revenue" name="revenue" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b'}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Performance Ranking */}
          <Card className="border border-border rounded-[10px] md:rounded-[20px] overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold font-poppins flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-500" /> Leaderboard Ranking
              </h3>
            </div>
            <CardContent className="p-5 min-h-0 min-w-0">
              <div className="h-[300px] sm:h-[380px] w-full min-h-0 min-w-0">
                <ResponsiveContainer minWidth={1} minHeight={1} width="100%" height="100%" debounce={100}>
                  <BarChart data={filteredPerformanceData} layout="vertical" margin={{ left: 40, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} width={100} />
                    <Tooltip
                      cursor={{fill: 'transparent'}}
                      contentStyle={{borderRadius: '10px', border: 'none'}}
                      formatter={(v) => [`${v}%`, 'Performance Index']}
                    />
                    <Bar dataKey="metrics.performanceIndex" radius={[0, 10, 10, 0]} barSize={25}>
                      {filteredPerformanceData?.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#cd7f32' : 'hsl(var(--chart-5))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick-link cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Link to="/communications" className="block">
            <Card className="border border-border rounded-[10px] hover:bg-muted/30 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-[10px] bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground font-poppins">View Communications</p>
                  <p className="text-sm font-semibold text-foreground">{summary?.totalCalls} calls logged</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/reports/sales-book" className="block">
            <Card className="border border-border rounded-[10px] hover:bg-muted/30 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-[10px] bg-[hsl(var(--chart-5)/0.1)] flex items-center justify-center text-[hsl(var(--chart-5))] shrink-0">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground font-poppins">View Sales Book</p>
                  <p className="text-sm font-semibold text-foreground">{summary?.overallConversion}% conversion</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to="/leads?view=status-new" className="block">
            <Card className="border border-border rounded-[10px] hover:bg-muted/30 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-[10px] bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground font-poppins">Unattended Leads</p>
                  <p className="text-sm font-semibold text-foreground">{summary?.totalUnattended} need action</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Detailed Data Table */}
        <Card className="border border-border rounded-[10px] md:rounded-[20px] overflow-hidden">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold font-poppins">Individual Performance Breakdown</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Detailed data for all {filteredPerformanceData?.length} sales identifiers.</p>
          </div>
          <CardContent className="p-0">
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-b-border">
                    <TableHead onClick={() => handleSort('name')} className="cursor-pointer group font-semibold text-[10px] uppercase tracking-wide">
                      <div className="flex items-center">Representative <SortIcon columnKey="name" /></div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('branch')} className="cursor-pointer group font-semibold text-[10px] uppercase tracking-wide text-center">
                      <div className="flex items-center justify-center">Branch <SortIcon columnKey="branch" /></div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('metrics.totalLeads')} className="cursor-pointer group font-semibold text-[10px] uppercase tracking-wide text-center">
                      <div className="flex items-center justify-center">Owned Leads <SortIcon columnKey="metrics.totalLeads" /></div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('metrics.callsMade')} className="cursor-pointer group font-semibold text-[10px] uppercase tracking-wide text-center">
                      <div className="flex items-center justify-center">Calls <SortIcon columnKey="metrics.callsMade" /></div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('metrics.totalTalkTimeSeconds')} className="cursor-pointer group font-semibold text-[10px] uppercase tracking-wide text-center">
                      <div className="flex items-center justify-center">Talk Time <SortIcon columnKey="metrics.totalTalkTimeSeconds" /></div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('metrics.statusChanges')} className="cursor-pointer group font-semibold text-[10px] uppercase tracking-wide text-center">
                      <div className="flex items-center justify-center">Status Updates <SortIcon columnKey="metrics.statusChanges" /></div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('metrics.unattendedLeads')} className="cursor-pointer group font-semibold text-[10px] uppercase tracking-wide text-center">
                      <div className="flex items-center justify-center">Unattended <SortIcon columnKey="metrics.unattendedLeads" /></div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('metrics.wonDeals')} className="cursor-pointer group font-semibold text-[10px] uppercase tracking-wide text-center">
                      <div className="flex items-center justify-center">Conversions <SortIcon columnKey="metrics.wonDeals" /></div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('metrics.revenue')} className="cursor-pointer group font-semibold text-[10px] uppercase tracking-wide text-right">
                      <div className="flex items-center justify-end">Revenue <SortIcon columnKey="metrics.revenue" /></div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('metrics.performanceIndex')} className="cursor-pointer group font-semibold text-[10px] uppercase tracking-wide text-right">
                      <div className="flex items-center justify-end">Index Score <SortIcon columnKey="metrics.performanceIndex" /></div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPerformanceData?.map((user: any) => (
                    <TableRow key={user.userId} className="hover:bg-muted/30 transition-colors border-b-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-border shadow-sm">
                            <AvatarImage src={user.profileImage} />
                            <AvatarFallback className="bg-[hsl(var(--chart-5)/0.1)] text-[hsl(var(--chart-5))] text-[10px] font-semibold">
                              {user.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm font-poppins">{user.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-medium">{user.role}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-[10px] font-semibold uppercase tracking-tight bg-muted/50 px-2 py-0.5 rounded border border-border inline-block">
                          {user.branch}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono text-sm font-semibold">{user.metrics.totalLeads}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-sm text-blue-600">{user.metrics.callsMade}</span>
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Calls</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-sm text-[hsl(var(--chart-5))]">{Math.floor(user.metrics.totalTalkTimeSeconds / 60)}m {user.metrics.totalTalkTimeSeconds % 60}s</span>
                          <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wide">Talk Time</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-xs font-medium px-2 py-0.5 bg-muted rounded-full">
                          {user.metrics.statusChanges}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white",
                            user.metrics.unattendedLeads > 5 ? "bg-destructive" : user.metrics.unattendedLeads > 0 ? "bg-orange-500" : "bg-[hsl(var(--chart-5))]"
                          )}
                        >
                          {user.metrics.unattendedLeads}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-sm text-green-600">{user.metrics.wonDeals}</span>
                          <span className="text-[9px] text-muted-foreground font-semibold">{user.metrics.conversionRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-sm">{formatCurrency(user.metrics.revenue)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex flex-col items-end">
                          <span className={cn(
                            "text-base font-bold font-poppins",
                            user.metrics.performanceIndex > 80 ? "text-[hsl(var(--chart-5))]" : user.metrics.performanceIndex > 50 ? "text-blue-500" : "text-orange-500"
                          )}>
                            {user.metrics.performanceIndex}
                          </span>
                          <div className="w-16 h-1 bg-muted rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-[hsl(var(--chart-5))]" style={{ width: `${user.metrics.performanceIndex}%` }} />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="block sm:hidden p-4 space-y-3">
              {filteredPerformanceData?.map((user: any) => (
                <UserPerformanceCard key={user.userId} user={user} />
              ))}
            </div>

            {/* Empty State */}
            {filteredPerformanceData?.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-4 opacity-20" />
                <div className="font-medium">No performance data found for the selected criteria.</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Export scope dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-md rounded-[20px]">
          <DialogHeader>
            <DialogTitle className="font-poppins">Export User Total Report</DialogTitle>
            <DialogDescription>
              Choose whether to export every representative currently shown, or just a specific selection.
            </DialogDescription>
          </DialogHeader>

          <RadioGroup value={exportScope} onValueChange={(v) => setExportScope(v as 'all' | 'custom')} className="gap-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="export-all" />
              <Label htmlFor="export-all" className="font-normal">All users ({filteredPerformanceData?.length || 0})</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="export-custom" />
              <Label htmlFor="export-custom" className="font-normal">Custom selection</Label>
            </div>
          </RadioGroup>

          {exportScope === 'custom' && (
            <div className="border border-border rounded-[10px] max-h-64 overflow-y-auto divide-y divide-border">
              {userOptions.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">No users available.</p>
              ) : (
                userOptions.map((u: any) => (
                  <label
                    key={u.id}
                    htmlFor={`export-user-${u.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`export-user-${u.id}`}
                      checked={exportUserIds.includes(u.id)}
                      onCheckedChange={() => toggleExportUser(u.id)}
                    />
                    <span className="text-sm font-medium">{u.name}</span>
                  </label>
                ))
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)} className="rounded-[10px]">Cancel</Button>
            <Button
              onClick={handleExportConfirm}
              disabled={exportScope === 'custom' && exportUserIds.length === 0}
              className="rounded-[10px] bg-[hsl(var(--chart-5))] hover:bg-[hsl(var(--chart-5)/0.9)] text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
