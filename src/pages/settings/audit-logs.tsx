import { Fragment, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { api } from '@/services/api';
import { getUsers, getBranches } from '@/services/settingsService';
import { formatIST } from '@/lib/dateUtils';
import { getUserInfo, isOrgAdmin } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2, Shield, Filter, Download, ChevronRight, Search, X,
  Globe, Monitor, FilePlus, FilePen, FileX, LogIn,
} from "lucide-react";
import { DateRangeDropdown, getDefaultDateRange, type DateRangeValue } from "@/components/dashboard-v2/DateRangeDropdown";
import { FILTER_CARD_CLASS, FILTER_ICON_CLASS, FILTER_LABEL_CLASS, FILTER_TRIGGER_CLASS } from "@/pages/leads/filterStyles";

// Common entity values logAudit() is actually called with across the backend
// (controllers for each of these call logAudit({ entity: '<Name>', ... })) -
// not an exhaustive enum, just the ones worth a dedicated filter.
const ENTITIES = [
  'Lead', 'Contact', 'Account', 'Opportunity', 'Task', 'FollowUp',
  'Quote', 'Product', 'User', 'Organisation', 'Document', 'Workflow',
];

interface AuditLog {
  id: string;
  createdAt: string;
  actor?: { id: string; firstName: string; lastName: string; email?: string; role?: string; branch?: { name: string } };
  action: string;
  entity: string;
  entityId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

function dayLabel(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

const formatAuditDetail = (l: AuditLog) => {
  if (!l.details) return "No additional details";
  const d = l.details;
  const action = (l.action || "").toUpperCase();
  const entityLabel = (l.entity || "").toLowerCase();
  const name = d.name || d.title || d.email || d.firstName || l.entityId || "item";

  if (action === "LEAD_STATUS_CHANGE") {
    const oldStatus = d.oldStatus || d.oldStage || "unknown";
    const newStatus = d.newStatus || d.newStage || d.status || "unknown";
    return `Changed status of "${name}" from ${oldStatus} to ${newStatus}`;
  }
  if (action === "LOG_QUICK_INTERACTION") return `Logged a quick ${d.type || "activity"} for "${name}"`;
  if (action === "CONVERT_LEAD") return `Converted lead "${name}" to Account, Contact, and Opportunity`;
  if (action === "OPPORTUNITY_STAGE_CHANGE") return `Changed stage of opportunity "${name}" from ${d.oldStage || "unknown"} to ${d.newStage || "unknown"}`;
  if (action === "REGISTER_ORGANISATION") return `Registered new organisation: "${d.companyName || name}"`;
  if (action === "AUTH_FORGOT_PASSWORD_REQUESTED") return `Requested password reset link for user: "${d.email || name}"`;
  if (action === "AUTH_PASSWORD_RESET_SUCCESS") return `Successfully reset password for user: "${d.email || name}"`;
  if (action.includes("CREATED") || action === "CREATE" || action.includes("CREATE_")) return `Created new ${entityLabel}: "${name}"`;
  if (action.includes("DELETED") || action === "DELETE" || action.includes("DELETE_")) return `Deleted ${entityLabel} "${name}"`;
  if (action.includes("UPDATED") || action === "UPDATE" || action.includes("UPDATE_")) {
    if (d.updatedFields && Array.isArray(d.updatedFields)) return `Updated ${entityLabel} "${name}": changed ${d.updatedFields.join(", ")}`;
    if ((d.oldStage || d.oldStatus) && (d.newStage || d.newStatus)) return `Moved ${entityLabel} "${name}" from ${d.oldStage || d.oldStatus} to ${d.newStage || d.newStatus}`;
    if (d.status) return `Changed ${entityLabel} "${name}" status to ${d.status}`;
    return `Modified ${entityLabel} details for "${name}"`;
  }
  if (action === "LOGIN") return "User logged in";
  if (action === "LOGOUT") return "User logged out";
  if (action.includes("INVITE")) return `Invited user: ${d.email || name}`;
  if (action.includes("DEACTIVATE")) return `Deactivated user: ${d.email || name}`;
  if (action.includes("ACTIVATE") && !action.includes("DEACTIVATE")) return `Re-activated user: ${d.email || name}`;

  const parts: string[] = [];
  if (d.name) parts.push(`Name: ${d.name}`);
  if (d.email) parts.push(`Email: ${d.email}`);
  if (d.status) parts.push(`Status: ${d.status}`);
  return parts.length > 0 ? parts.join(", ") : JSON.stringify(d);
};

const getReadableAction = (act: string) => {
  if (!act) return "-";
  return act.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
};

const actionBadgeClass = (action: string) =>
  action.includes('DELETE') ? 'bg-red-100 text-red-800'
    : action.includes('CREATE') ? 'bg-green-100 text-green-800'
      : action.includes('UPDATE') ? 'bg-blue-100 text-blue-800'
        : action === 'LOGIN' || action === 'LOGOUT' ? 'bg-purple-100 text-purple-800'
          : 'bg-gray-100 text-gray-800';

export default function AuditLogsPage() {
  const user = getUserInfo();
  const canSeeOrgWide = isOrgAdmin(user);

  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actorFilter, setActorFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [range, setRange] = useState<DateRangeValue>({ period: 'allTime' });
  const [pageSearch, setPageSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const hasActiveFilters = actionFilter !== 'all' || entityFilter !== 'all' || actorFilter !== 'all' || branchFilter !== 'all' || range.period !== 'allTime';
  const clearFilters = () => {
    setActionFilter('all'); setEntityFilter('all'); setActorFilter('all'); setBranchFilter('all');
    setRange({ period: 'allTime' }); setPage(1);
  };

  const filterParams = useMemo(() => {
    const params: Record<string, string | number> = { page, limit: 20 };
    if (actionFilter !== 'all') params.action = actionFilter;
    if (entityFilter !== 'all') params.entity = entityFilter;
    if (actorFilter !== 'all') params.userId = actorFilter;
    if (branchFilter !== 'all') params.branchId = branchFilter;
    if (range.period !== 'allTime' && range.startDate) params.startDate = range.startDate;
    if (range.period !== 'allTime' && range.endDate) params.endDate = range.endDate;
    return params;
  }, [page, actionFilter, entityFilter, actorFilter, branchFilter, range]);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', filterParams],
    queryFn: async () => {
      const res = await api.get('/audit-logs', { params: filterParams });
      return res.data;
    }
  });

  const { data: orgUsers = [] } = useQuery({
    queryKey: ['users', 'list'], queryFn: getUsers, enabled: canSeeOrgWide, staleTime: 5 * 60 * 1000,
  });
  const { data: branches = [] } = useQuery({
    queryKey: ['branches', 'list'], queryFn: getBranches, enabled: canSeeOrgWide, staleTime: 5 * 60 * 1000,
  });

  const logs: AuditLog[] = data?.logs || [];
  const pagination = data?.pagination;
  const summary = data?.summary;

  const visibleLogs = useMemo(() => {
    if (!pageSearch.trim()) return logs;
    const q = pageSearch.trim().toLowerCase();
    return logs.filter(l =>
      getReadableAction(l.action).toLowerCase().includes(q) ||
      (l.entity || '').toLowerCase().includes(q) ||
      formatAuditDetail(l).toLowerCase().includes(q) ||
      (l.actor ? `${l.actor.firstName} ${l.actor.lastName}` : '').toLowerCase().includes(q)
    );
  }, [logs, pageSearch]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await api.get('/audit-logs', { params: { ...filterParams, page: 1, limit: 2000 } });
      const rows: AuditLog[] = res.data?.logs || [];
      const sheet = rows.map(l => ({
        'Date & Time': formatIST(l.createdAt, 'MMM d, yyyy HH:mm:ss'),
        'Actor': l.actor ? `${l.actor.firstName} ${l.actor.lastName}` : 'System',
        'Action': getReadableAction(l.action),
        'Entity': l.entity,
        'Entity ID': l.entityId || '',
        'Details': formatAuditDetail(l),
        'IP Address': l.ipAddress || '',
        'User Agent': l.userAgent || '',
      }));
      const worksheet = XLSX.utils.json_to_sheet(sheet);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs');
      XLSX.writeFile(workbook, `audit_logs_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } finally {
      setIsExporting(false);
    }
  };

  const statTiles = summary ? [
    { label: 'Total Events', value: summary.total, icon: Shield, accent: 'bg-[hsl(var(--chart-5))]' },
    { label: 'Created', value: summary.creates, icon: FilePlus, accent: 'bg-emerald-500' },
    { label: 'Updated', value: summary.updates, icon: FilePen, accent: 'bg-blue-500' },
    { label: 'Deleted', value: summary.deletes, icon: FileX, accent: 'bg-destructive' },
    { label: 'Logins', value: summary.logins, icon: LogIn, accent: 'bg-purple-500' },
  ] : [];

  // Group the current page's rows by day for section dividers in the table.
  let lastGroup = '';

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-12 w-12 rounded-[10px] bg-[hsl(var(--chart-5))]/10 flex items-center justify-center text-[hsl(var(--chart-5))] shrink-0">
            <Shield className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-foreground tracking-tight">
              Audit Logs
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Track system activity and data changes across your organisation</p>
          </div>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting}
          variant="outline"
          className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-medium"
        >
          {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>

      {/* Stats row - matches QuickStatsBar's single divided card pattern */}
      {statTiles.length > 0 && (
        <div className="rounded-[10px] bg-card border border-border overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-border">
            {statTiles.map((tile) => (
              <div key={tile.label} className="relative flex flex-col items-center justify-center gap-1 px-3 py-4 overflow-hidden">
                <span className={`absolute top-0 left-0 right-0 h-0.5 ${tile.accent} opacity-70`} />
                <tile.icon className="h-4 w-4 text-muted-foreground mb-0.5" />
                <span className="text-lg sm:text-xl font-medium font-poppins text-foreground">{tile.value}</span>
                <span className="text-xs font-poppins text-muted-foreground">{tile.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={pageSearch}
            onChange={(e) => setPageSearch(e.target.value)}
            placeholder="Search this page..."
            className="h-9 pl-8 rounded-[10px] text-xs"
          />
        </div>

        <div className={FILTER_CARD_CLASS}>
          <Filter className={FILTER_ICON_CLASS} />
          <div>
            <span className={FILTER_LABEL_CLASS}>Action</span>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
              <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={FILTER_CARD_CLASS}>
          <Shield className={FILTER_ICON_CLASS} />
          <div>
            <span className={FILTER_LABEL_CLASS}>Entity</span>
            <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
              <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                {ENTITIES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {canSeeOrgWide && (
          <>
            <div className={FILTER_CARD_CLASS}>
              <Globe className={FILTER_ICON_CLASS} />
              <div>
                <span className={FILTER_LABEL_CLASS}>Actor</span>
                <Select value={actorFilter} onValueChange={(v) => { setActorFilter(v); setPage(1); }}>
                  <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue placeholder="Anyone" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Anyone</SelectItem>
                    {orgUsers.map((u: { id: string; firstName: string; lastName: string }) => (
                      <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {branches.length > 0 && (
              <div className={FILTER_CARD_CLASS}>
                <Monitor className={FILTER_ICON_CLASS} />
                <div>
                  <span className={FILTER_LABEL_CLASS}>Branch</span>
                  <Select value={branchFilter} onValueChange={(v) => { setBranchFilter(v); setPage(1); }}>
                    <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue placeholder="All Branches" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches.map((b: { id: string; name: string }) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </>
        )}

        <DateRangeDropdown
          value={range}
          onChange={(v) => { setRange(v); setPage(1); }}
          variant="accent"
          presets={['allTime', 'today', 'yesterday', 'week', 'thisMonth', 'lastMonth', 'custom']}
        />

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 rounded-[10px] gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" /> Clear Filters
          </Button>
        )}
      </div>

      <Card className="rounded-[10px] md:rounded-[20px]">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--chart-5))]" />
            </div>
          ) : (
            <>
              <div className="rounded-[10px] overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8" />
                      <TableHead>Date &amp; Time</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>IP Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          No logs found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleLogs.map((log) => {
                        const group = dayLabel(log.createdAt);
                        const showDivider = group !== lastGroup;
                        lastGroup = group;
                        const isExpanded = expandedId === log.id;

                        return (
                          <Fragment key={log.id}>
                            {showDivider && (
                              <TableRow key={`divider-${group}`} className="hover:bg-transparent">
                                <TableCell colSpan={7} className="bg-muted/30 py-1.5 text-xs font-semibold font-poppins text-muted-foreground">
                                  {group}
                                </TableCell>
                              </TableRow>
                            )}
                            <TableRow
                              key={log.id}
                              className="cursor-pointer"
                              onClick={() => setExpandedId(isExpanded ? null : log.id)}
                            >
                              <TableCell>
                                <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {formatIST(log.createdAt, 'MMM d, yyyy HH:mm:ss')}
                              </TableCell>
                              <TableCell>
                                {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'System'}
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${actionBadgeClass(log.action)}`}>
                                  {getReadableAction(log.action)}
                                </span>
                              </TableCell>
                              <TableCell>
                                {log.entity} <span className="text-xs text-muted-foreground">({log.entityId?.substring(0, 8)}...)</span>
                              </TableCell>
                              <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">
                                {formatAuditDetail(log)}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {log.ipAddress || '-'}
                              </TableCell>
                            </TableRow>
                            {isExpanded && (
                              <TableRow key={`${log.id}-detail`} className="hover:bg-transparent">
                                <TableCell colSpan={7} className="bg-muted/20">
                                  <div className="p-3 space-y-2 text-xs">
                                    <div className="flex items-start gap-2">
                                      <span className="font-semibold text-foreground shrink-0 w-24">Raw Details</span>
                                      <pre className="whitespace-pre-wrap break-all text-muted-foreground font-mono text-[11px] flex-1">
                                        {JSON.stringify(log.details || {}, null, 2)}
                                      </pre>
                                    </div>
                                    {log.actor?.email && (
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-foreground shrink-0 w-24">Actor Email</span>
                                        <span className="text-muted-foreground">{log.actor.email}{log.actor.branch?.name ? ` · ${log.actor.branch.name} branch` : ''}</span>
                                      </div>
                                    )}
                                    {log.userAgent && (
                                      <div className="flex items-center gap-2">
                                        <Monitor className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="text-muted-foreground truncate">{log.userAgent}</span>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {pagination?.total ? `${pagination.total.toLocaleString()} total events` : ''}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-[8px]" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {pagination?.pages || 1}
                  </div>
                  <Button variant="outline" size="sm" className="rounded-[8px]" onClick={() => setPage(p => p + 1)} disabled={page >= (pagination?.pages || 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
