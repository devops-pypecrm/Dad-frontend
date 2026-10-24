import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { getExpectedRevenueReport, type ExpectedRevenueDeal } from "@/services/analyticsService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, DollarSign } from "lucide-react";
import { formatIST, toISTDateString } from "@/lib/dateUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBranches } from "@/services/settingsService";
import { isAdmin as checkIsAdmin } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";

const STATUS_STYLES: Record<ExpectedRevenueDeal["status"], { label: string; className: string }> = {
  current: { label: "This Period", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  carried_forward: { label: "Carried Forward", className: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  upcoming: { label: "Upcoming", className: "bg-primary/10 text-primary border-primary/20" },
  no_date: { label: "No Close Date", className: "bg-muted text-muted-foreground border-border/60" },
};

const STAT_ACCENTS = [
  { border: "border-border/60", bg: "bg-card", icon: "bg-primary/10 text-primary" },
  { border: "border-emerald-500/20", bg: "bg-emerald-500/5", icon: "bg-emerald-500/15 text-emerald-600" },
  { border: "border-amber-500/20", bg: "bg-amber-500/5", icon: "bg-amber-500/15 text-amber-600" },
  { border: "border-primary/20", bg: "bg-primary/5", icon: "bg-primary/15 text-primary" },
];

function StatCard({ label, value, sub, accent = 0 }: { label: string; value: string; sub?: string; accent?: number }) {
  const c = STAT_ACCENTS[accent];
  return (
    <div className={`rounded-[14px] border ${c.border} ${c.bg} p-4 sm:p-5 shadow-xs transition-all hover:-translate-y-0.5`}>
      <div className={`h-8 w-8 rounded-[10px] flex items-center justify-center mb-2 ${c.icon}`}>
        <DollarSign className="h-4 w-4" />
      </div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export default function ExpectedRevenuePage() {
  const { formatCurrency } = useCurrency();
  const [user] = useState<{ role: string } | null>(() => {
    const userInfo = localStorage.getItem("userInfo");
    return userInfo ? JSON.parse(userInfo) : null;
  });
  const isAdmin = checkIsAdmin(user);

  // Carried over from the Dashboard's branch/date filters (see
  // dashboard-v2/dashboardLinks.ts) so opening this report from the "Exp. Revenue"
  // tile shows the same slice of data instead of resetting to no filter.
  const [searchParams] = useSearchParams();

  const [startDate, setStartDate] = useState<string>(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState<string>(searchParams.get("endDate") || "");
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(searchParams.get("branchId"));

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: getBranches,
    enabled: !!isAdmin,
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ["expected-revenue-report", startDate, endDate, selectedBranchId],
    queryFn: () =>
      getExpectedRevenueReport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        branchId: selectedBranchId || undefined,
      }),
  });

  const deals = report?.deals ?? [];
  const summary = report?.summary;

  const handleExport = () => {
    if (deals.length === 0) return;

    const excelData = deals.map((d) => ({
      Opportunity: d.name,
      Customer: d.customerName,
      Owner: d.ownerName,
      Branch: d.branchName,
      Stage: d.stage?.replace(/_/g, " ") || "",
      "Expected Close Date": d.closeDate ? formatIST(d.closeDate, "yyyy-MM-dd") : "",
      Status: STATUS_STYLES[d.status].label,
      Amount: d.amount,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expected Revenue");
    XLSX.writeFile(workbook, `expected_revenue_${toISTDateString()}.xlsx`);
  };

  return (
    <div className="bg-white min-h-screen p-4 sm:p-8 space-y-6 animate-in fade-in duration-300 font-poppins">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-[10px] bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Expected Revenue Report</h1>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 ml-11">
            {report ? `Open deals as of ${report.periodLabel}` : "Open deals and their expected close status"}
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={deals.length === 0} className="h-9 rounded-[10px] text-xs">
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Download Excel
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center rounded-[14px] border border-border/60 bg-card p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-auto h-9 text-xs rounded-[10px] border-border/60" />
          <span className="text-xs text-muted-foreground">to</span>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-auto h-9 text-xs rounded-[10px] border-border/60" />
        </div>

        {isAdmin && branches && branches.length > 0 && (
          <div className="w-[200px]">
            <Select value={selectedBranchId || "all"} onValueChange={(val) => setSelectedBranchId(val === "all" ? null : val)}>
              <SelectTrigger className="h-9 text-xs rounded-[10px] border-border/60">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b: { id: string; name: string }) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Expected Revenue"
          value={formatCurrency(summary?.totalExpectedRevenue || 0, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          sub={`${deals.length} open deals`}
          accent={0}
        />
        <StatCard
          label="This Period"
          value={formatCurrency(summary?.currentPeriodAmount || 0, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          sub={`${summary?.currentPeriodCount || 0} deals`}
          accent={1}
        />
        <StatCard
          label="Carried Forward"
          value={formatCurrency(summary?.carriedForwardAmount || 0, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          sub={`${summary?.carriedForwardCount || 0} deals overdue from earlier`}
          accent={2}
        />
        <StatCard
          label="Upcoming"
          value={formatCurrency(summary?.upcomingAmount || 0, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          sub={`${summary?.upcomingCount || 0} deals`}
          accent={3}
        />
      </div>

      {/* Data Table */}
      <div className="rounded-[14px] border border-border/70 bg-card overflow-hidden shadow-xs">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/60 bg-muted/40">
          <span className="text-sm font-semibold text-foreground">Deals</span>
          <span className="text-xs text-muted-foreground">{report ? `${deals.length} records found` : "Loading..."}</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Opportunity</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Expected Close Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24">Loading...</TableCell>
              </TableRow>
            ) : deals.length > 0 ? (
              deals.map((d) => (
                <TableRow key={d.id} className="hover:bg-muted/20">
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>{d.customerName}</TableCell>
                  <TableCell>{d.ownerName}</TableCell>
                  <TableCell>{d.branchName}</TableCell>
                  <TableCell className="capitalize">{d.stage?.replace(/_/g, " ")}</TableCell>
                  <TableCell>{d.closeDate ? formatIST(d.closeDate, "MMM dd, yyyy") : "-"}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${STATUS_STYLES[d.status].className}`} variant="outline">
                      {STATUS_STYLES[d.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(d.amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                  No open deals found for the selected criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
