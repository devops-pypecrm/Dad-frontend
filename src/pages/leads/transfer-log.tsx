import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  History,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Building2,
  Calendar,
  User as UserIcon,
  Bot,
} from "lucide-react";
import { getLeadTransferLog } from "@/services/leadService";
import { formatIST } from "@/lib/dateUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface TransferRow {
  id: string;
  leadId: string;
  oldOwnerId: string | null;
  newOwnerId: string | null;
  reason: string | null;
  createdAt: string;
  lead?: { id: string; firstName: string; lastName?: string; company?: string; phone?: string } | null;
  oldOwner?: { id: string; firstName: string; lastName?: string } | null;
  newOwner?: { id: string; firstName: string; lastName?: string } | null;
  changedBy?: { id: string; firstName: string; lastName?: string } | null;
}

interface TransferLogResponse {
  history: TransferRow[];
  page: number;
  pages: number;
  total: number;
  stats: { total: number; manual: number; automatic: number; today: number };
}

export default function LeadTransferLogPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data, isLoading, isFetching } = useQuery<TransferLogResponse>({
    queryKey: ["lead-transfer-log", search, page],
    queryFn: () => getLeadTransferLog({ page, pageSize, search: search.trim() || undefined }),
  });

  const rows = data?.history || [];
  const totalPages = data?.pages || 1;
  const stats = data?.stats || { total: 0, manual: 0, automatic: 0, today: 0 };

  const fullName = (p?: { firstName: string; lastName?: string } | null) =>
    p ? `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Unknown" : "Unassigned";

  const isManual = (reason?: string | null) => !!reason && /\bby\s/i.test(reason);

  return (
    <div className="bg-white min-h-screen p-4 sm:p-8 space-y-6 animate-in fade-in duration-300 font-poppins">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <History className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Lead Transfer Log
            </h1>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 ml-11">
            Full audit trail of every lead ownership change across your organisation — manual, bulk, and system-generated.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/leads"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors"
          >
            All Leads <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-[14px] border border-border/60 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Transfers</span>
            <div className="h-8 w-8 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center">
              <History className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {stats.total.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">All recorded ownership changes</p>
        </div>

        <div className="rounded-[14px] border border-border/60 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Manual</span>
            <div className="h-8 w-8 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center">
              <UserIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {stats.manual.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Reassigned by a person</p>
        </div>

        <div className="rounded-[14px] border border-border/60 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Automatic</span>
            <div className="h-8 w-8 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {stats.automatic.toLocaleString()}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">System-generated (shuffler, rotation)</p>
        </div>

        <div className="rounded-[14px] border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 shadow-xs transition-all hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Today</span>
            <div className="h-8 w-8 rounded-[10px] bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
            {stats.today.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-600/80 mt-1">Transfers made today</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-end pt-2">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search lead, company, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9 text-xs rounded-[10px] bg-background border-border/60 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[14px] border border-border/70 bg-card overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
                <Skeleton className="h-8 w-28 rounded-lg" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground">
              <History className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No transfers found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {search ? "No transfers matched your search." : "No lead ownership changes have been recorded yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Lead</th>
                  <th className="py-3.5 px-4">Transfer</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {rows.map((row) => {
                  const leadName = row.lead
                    ? `${row.lead.firstName || ""} ${row.lead.lastName || ""}`.trim() || "Unnamed Lead"
                    : "Deleted Lead";
                  const manual = isManual(row.reason);

                  return (
                    <tr key={row.id} className="hover:bg-muted/20 transition-colors group">
                      <td className="py-3.5 px-4">
                        {row.lead ? (
                          <Link
                            to={`/leads/${row.lead.id}`}
                            className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                          >
                            <span className="font-semibold text-[13px]">{leadName}</span>
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                          </Link>
                        ) : (
                          <span className="font-medium text-muted-foreground text-[13px]">{leadName}</span>
                        )}
                        {row.lead?.company && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[160px]">{row.lead.company}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-medium text-foreground">{fullName(row.oldOwner)}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="font-medium text-foreground">{fullName(row.newOwner)}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            manual
                              ? "mt-1 text-[10px] bg-primary/10 text-primary border-primary/20"
                              : "mt-1 text-[10px] bg-muted text-muted-foreground border-border/60"
                          }
                        >
                          {manual ? "Manual" : "Automatic"}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 max-w-[320px]">
                        <span className="text-[11px] text-muted-foreground">{row.reason || "—"}</span>
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatIST(row.createdAt, "MMM d, yyyy")}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 pl-5">
                          {formatIST(row.createdAt, "h:mm a")}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-3.5 px-4 border-t border-border/50 flex items-center justify-between bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Showing page {page} of {totalPages} ({data?.total || 0} total)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1 || isFetching}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages || isFetching}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
