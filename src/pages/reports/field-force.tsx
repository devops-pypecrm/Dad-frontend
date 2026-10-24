import { useQuery } from "@tanstack/react-query";
import { getCheckIns, type CheckIn } from "@/services/checkInService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Building } from "lucide-react";
import { formatIST, toISTDateString } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useState } from "react";
import { isAdmin as checkIsAdmin } from "@/lib/utils";
import { getBranches } from "@/services/settingsService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FieldForceReportsPage() {
  const [selectedBranchId, setSelectedBranchId] = useState<string>("all");
  const [user] = useState<{ role: string } | null>(() => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  });

  const isAdmin = checkIsAdmin(user);

  // Fetch Branches
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: getBranches,
    enabled: !!isAdmin
  });

  const { data: checkIns, isLoading, isError } = useQuery<CheckIn[]>({
    queryKey: ['check-ins-report', selectedBranchId],
    queryFn: () => getCheckIns({ branchId: selectedBranchId === "all" ? undefined : selectedBranchId }), // Fetch all check-ins (no filters) for overview
  });

  if (isLoading) {
    return <div className="p-8 space-y-4">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>;
  }

  if (isError) {
    return <div className="p-8 text-destructive">Failed to load field force data.</div>;
  }

  const totalCheckIns = checkIns?.length || 0;
  // Count unique users who checked in
  const activeAgents = new Set(checkIns?.map(c => c.userId)).size;

  // Recent check-ins
  const recentActivity = [...(checkIns || [])].slice(0, 15);

  return (
    <div className="bg-white min-h-screen p-4 sm:p-8 space-y-6 animate-in fade-in duration-300 font-poppins">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Field Force Activity</h1>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 ml-11">Track agent visits, check-ins, and field operations.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
                  <SelectItem value="all">All Organizations</SelectItem>
                  {branches.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button variant="outline" className="h-9 rounded-[10px] text-xs" onClick={async () => {
          try {
            const response = await api.get(`/reports/export/check-ins`, {
              responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `field_force_report_${toISTDateString()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
          } catch (error) {
            toast.error("Failed to download report");
            console.error("Download error:", error);
          }
        }}>
          Download Excel
        </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-[14px] border border-border/60 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Check-Ins</span>
            <div className="h-8 w-8 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{totalCheckIns}</div>
        </div>
        <div className="rounded-[14px] border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 shadow-xs transition-all hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Active Agents</span>
            <div className="h-8 w-8 rounded-[10px] bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">{activeAgents}</div>
        </div>
        {/* Placeholder for future metrics like Distance Traveled or Avg Visits/Day */}
      </div>

      <div className="rounded-[14px] border border-border/70 bg-card overflow-hidden shadow-xs">
        <div className="px-4 py-3.5 border-b border-border/60 bg-muted/40">
          <span className="text-sm font-semibold text-foreground">Recent Activity</span>
          <p className="text-xs text-muted-foreground mt-0.5">Latest field operations and visits.</p>
        </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Agent</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location/Entity</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    No recent activity found.
                  </TableCell>
                </TableRow>
              ) : (
                recentActivity.map((checkIn) => (
                  <TableRow key={checkIn.id} className="hover:bg-muted/20">
                    <TableCell className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{checkIn.user?.firstName?.[0]}{checkIn.user?.lastName?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{checkIn.user?.firstName} {checkIn.user?.lastName}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-semibold uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                        {(checkIn as any).user?.branch?.name || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{checkIn.type.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {checkIn.lead && <span className="text-xs text-muted-foreground">Lead: {checkIn.lead.firstName} {checkIn.lead.lastName}</span>}
                        {checkIn.contact && <span className="text-xs text-muted-foreground">Contact: {checkIn.contact.firstName} {checkIn.contact.lastName}</span>}
                        {checkIn.account && <span className="text-xs text-muted-foreground">Account: {checkIn.account.name}</span>}
                        <span className="text-sm">{checkIn.address || 'Unknown Location'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatIST(checkIn.createdAt, 'MMM d, h:mm a')}</TableCell>
                    <TableCell className="max-w-xs truncate" title={checkIn.notes}>
                      {checkIn.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
      </div>
    </div>
  );
}
