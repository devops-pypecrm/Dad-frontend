import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDailyReport } from '@/services/analyticsService';
import { getBranches, getOrganisation } from '@/services/settingsService';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileDown, RefreshCw, Printer, Building, Calendar, BarChart3 as BarChart3Icon } from 'lucide-react';
import { PageLoader } from '@/components/ui/page-loader';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isAdmin as checkIsAdmin } from "@/lib/utils";
import { subDays, format } from 'date-fns';

export default function DailyReportPage() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [period, setPeriod] = useState<string>("today");
  const [user] = useState<{ role: string } | null>(() => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  });

  const isAdmin = checkIsAdmin(user);

  // Fetch Organisation Info
  const { data: organisation } = useQuery({
    queryKey: ['organisation'],
    queryFn: getOrganisation
  });

  // Fetch Branches
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
    enabled: !!isAdmin
  });

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
    queryKey: ['dailyReport', selectedBranchId, period],
    queryFn: () => {
      const { startDate, endDate } = getDateRange(period);
      return getDailyReport({
        branchId: selectedBranchId === "all" ? undefined : selectedBranchId,
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

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;

    try {
      toast.loading('Preparing Report...', { id: 'pdf-export' });
      
      const element = reportRef.current;
      
      // Capture the entire element
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
      
      // Calculate content dimensions (Full width, no vertical margin to avoid gaps)
      const contentWidth = pageWidth;
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
          // Use 0,0 to fill the page entirely and avoid gaps between slices
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
    <div className="bg-white p-4 sm:p-8 space-y-6 max-w-7xl mx-auto min-h-screen animate-in fade-in duration-300 font-poppins">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40 no-print">
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
          {(selectedBranchId !== "all" || period !== "today") && (
            <Button
              onClick={() => {
                setSelectedBranchId("all");
                setPeriod("today");
              }}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground h-9 px-3 border border-border/60 hover:bg-muted/50 rounded-[10px] text-xs"
            >
              Clear Filters
            </Button>
          )}

          <div className="w-[160px]">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="bg-background border-border/60 h-9 text-xs rounded-[10px]">
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
            <div className="w-[180px]">
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger className="bg-background border-border/60 h-9 text-xs rounded-[10px]">
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
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isFetching}
            className="gap-1.5 border-border/60 hover:bg-muted/50 h-9 px-3 rounded-[10px] text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
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

      {/* Report Content Area (Captured in PDF) */}
      <div ref={reportRef} className="space-y-6 bg-card p-5 sm:p-6 rounded-[14px] border border-border/60">
        {/* Branding & Header Section */}
        <div className="flex flex-col gap-6 border-b border-border/50 pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="CRM Logo" className="h-12 w-12 object-contain" />
              <div>
                <h2 className="text-2xl font-black tracking-tighter text-primary">PYPE CRM</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Professional Management Suite</p>
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-xl font-bold text-foreground">Daily Performance Report</h1>
              <p className="text-sm font-medium text-muted-foreground">{dateLabel}</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border border-border/50">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Organisation</p>
              <p className="text-lg font-black text-foreground capitalize">{organisation?.name || 'Loading...'}</p>
            </div>
            {selectedBranchId !== "all" && branches && (
              <div className="text-right space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Branch Filter</p>
                <p className="text-lg font-black text-primary uppercase">
                  {branches.find((b: any) => b.id === selectedBranchId)?.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Table Card */}
        <Card className="border border-border/60 shadow-none overflow-hidden rounded-[14px] bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-primary hover:bg-primary transition-none border-none">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-primary-foreground font-bold py-4 px-4 text-[11px] uppercase tracking-wider border-r border-white/10 w-[220px]">User Name</TableHead>
                  <TableHead className="text-primary-foreground font-bold py-4 px-2 text-[11px] uppercase tracking-wider border-r border-white/10 text-center w-[100px]">Branch</TableHead>
                  <TableHead className="text-primary-foreground font-bold py-4 px-2 text-center text-[11px] uppercase tracking-wider border-r border-white/10">Calls</TableHead>
                  <TableHead className="text-primary-foreground font-bold py-4 px-2 text-center text-[11px] uppercase tracking-wider border-r border-white/10">Connected</TableHead>
                  <TableHead className="text-primary-foreground font-bold py-4 px-2 text-center text-[11px] uppercase tracking-wider border-r border-white/10">Unconnected</TableHead>
                  <TableHead className="text-primary-foreground font-bold py-4 px-2 text-center text-[11px] uppercase tracking-wider border-r border-white/10">Converted</TableHead>
                  <TableHead className="text-primary-foreground font-bold py-4 px-2 text-center text-[11px] uppercase tracking-wider">Lost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.length > 0 ? (
                  tableData.map((row: any, idx: number) => (
                    <TableRow
                      key={row.id}
                      className={`
                        border-b border-border/40 transition-colors
                        ${idx % 2 === 0 ? 'bg-card' : 'bg-muted/10'}
                        hover:bg-primary/5
                      `}
                    >
                      <TableCell className="py-5 px-4 font-bold text-foreground text-[12px] uppercase">
                        {row.userName}
                      </TableCell>
                      <TableCell className="text-center py-5">
                        <span className="text-[10px] font-bold uppercase tracking-tighter bg-muted/50 px-2 py-0.5 rounded border border-border/50">
                          {row.branch || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-5 font-medium text-muted-foreground tabular-nums">
                        {row.totalCalls}
                      </TableCell>
                      <TableCell className="text-center py-5">
                        <span className={`
                          inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-full text-xs font-semibold
                          ${row.totalConnected > 0 ? 'bg-emerald-500/10 text-emerald-700' : 'bg-muted text-muted-foreground'}
                        `}>
                          {row.totalConnected}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-5 font-medium text-muted-foreground tabular-nums">
                        {row.totalUnconnected}
                      </TableCell>
                      <TableCell className="text-center py-5">
                        <span className={`
                          inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-full text-xs font-semibold
                          ${row.totalConverted > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}
                        `}>
                          {row.totalConverted}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-5">
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
                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground italic">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p className="text-lg font-medium opacity-50">No activity recorded for today yet.</p>
                        <p className="text-sm opacity-30">Data will appear here as users make calls and update leads.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Summary Cards Section */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Total Phone Calls" value={summary.totalCalls} subValue={formatDuration(summary.totalDuration)} accent="primary" />
            <SummaryCard title="Incoming Calls" value={summary.incoming} subValue={formatDuration(summary.incomingDuration)} accent="emerald" />
            <SummaryCard title="Outgoing Calls" value={summary.outgoing} subValue={formatDuration(summary.outgoingDuration)} accent="primary" />
            <SummaryCard title="Missed Calls" value={summary.missed} accent="destructive" />
            <SummaryCard title="Rejected Calls" value={summary.rejected} accent="amber" />
            <SummaryCard title="Never Attended Calls" value={summary.neverAttended} accent="muted" />
            <SummaryCard title="Not Pickup by Client" value={summary.notPickedUp} accent="amber" />
            <SummaryCard title="Unique Calls" value={summary.unique} accent="emerald" />
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .Card, .card, table tr { page-break-inside: avoid !important; break-inside: avoid !important; }
          .Table { width: 100% !important; border-collapse: collapse !important; }
          @page { size: auto; margin: 10mm; }
        }
      `}</style>
    </div>
  );
}

const SUMMARY_ACCENTS: Record<string, { bar: string; text: string }> = {
  primary: { bar: "bg-primary", text: "group-hover:text-primary" },
  emerald: { bar: "bg-emerald-500", text: "group-hover:text-emerald-600" },
  amber: { bar: "bg-amber-500", text: "group-hover:text-amber-600" },
  destructive: { bar: "bg-destructive", text: "group-hover:text-destructive" },
  muted: { bar: "bg-muted-foreground/40", text: "" },
};

function SummaryCard({ title, value, subValue, accent }: { title: string; value: number; subValue?: string; accent: keyof typeof SUMMARY_ACCENTS }) {
  const classes = SUMMARY_ACCENTS[accent];
  return (
    <div className="rounded-[14px] border border-border/60 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-border group">
      <div className="flex items-center justify-between">
        <div className={`w-2 h-10 rounded-full ${classes.bar}`} />
        {subValue && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded-[8px]">
            {subValue}
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <p className={`text-2xl sm:text-3xl font-bold text-foreground tabular-nums transition-colors ${classes.text}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}
