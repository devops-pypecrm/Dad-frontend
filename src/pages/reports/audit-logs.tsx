import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Calendar } from "lucide-react";
import { formatIST } from "@/lib/dateUtils";
import { api } from "@/services/api";
import { toast } from "sonner";

export default function AuditLogsReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [entity, setEntity] = useState("all");
  const [action, setAction] = useState("all");
  const [userId, setUserId] = useState("all");
  const [selectedBranchId, setSelectedBranchId] = useState("all");
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch users for the filter
  const { data: userData } = useQuery({
    queryKey: ["users-list"],
    queryFn: async () => {
      const response = await api.get("/users");
      return response.data.users;
    },
  });

  const [user] = useState<{ role: string } | null>(() => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  });

  const isAdmin = (user as any)?.role === 'admin' || (user as any)?.role === 'super_admin' || (user as any)?.role === 'organisation_admin';

  // Fetch Branches
  const { data: branches } = useQuery({
    queryKey: ["branches-list"],
    queryFn: async () => {
      const response = await api.get("/branches");
      return response.data;
    },
    enabled: isAdmin
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs-report", startDate, endDate, entity, action, userId, selectedBranchId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (entity && entity !== "all") params.append("entity", entity);
      if (action && action !== "all") params.append("action", action);
      if (userId && userId !== "all") params.append("userId", userId);
      if (selectedBranchId && selectedBranchId !== "all") params.append("branchId", selectedBranchId);
      params.append("limit", "1000");

      const response = await api.get(`/audit-logs?${params.toString()}`);
      return response.data;
    },
  });

  const formatAuditDetail = (log: any) => {
    if (!log.details) return "No additional details";
    const d = log.details;
    
    // Custom translations based on action and entity
    const action = (log.action || "").toUpperCase();
    const entityLabel = (log.entity || "").toLowerCase();
    
    // Try to find a name for the subject
    const name = d.name || d.title || d.email || d.firstName || log.entityId || "item";

    // Handle specific actions first
    if (action === "LEAD_STATUS_CHANGE") {
      const oldStatus = d.oldStatus || d.oldStage || "unknown";
      const newStatus = d.newStatus || d.newStage || d.status || "unknown";
      return `Changed status of "${name}" from ${oldStatus} to ${newStatus}`;
    }

    if (action === "LOG_QUICK_INTERACTION") {
      const type = d.type || "activity";
      return `Logged a quick ${type} for "${name}"`;
    }

    if (action === "CONVERT_LEAD") {
      return `Converted lead "${name}" to Account, Contact, and Opportunity`;
    }

    if (action === "OPPORTUNITY_STAGE_CHANGE") {
      return `Changed stage of opportunity "${name}" from ${d.oldStage || "unknown"} to ${d.newStage || "unknown"}`;
    }

    if (action === "REGISTER_ORGANISATION") {
      return `Registered new organisation: "${d.companyName || name}"`;
    }

    if (action === "AUTH_FORGOT_PASSWORD_REQUESTED") {
      return `Requested password reset link for user: "${d.email || name}"`;
    }

    if (action === "AUTH_PASSWORD_RESET_SUCCESS") {
      return `Successfully reset password for user: "${d.email || name}"`;
    }

    if (action.includes("CREATED") || action === "CREATE" || action.includes("CREATE_")) {
      return `Created new ${entityLabel}: "${name}"`;
    }
    if (action.includes("DELETED") || action === "DELETE" || action.includes("DELETE_")) {
      return `Deleted ${entityLabel} "${name}"`;
    }
    if (action.includes("UPDATED") || action === "UPDATE" || action.includes("UPDATE_")) {
      if (d.updatedFields && Array.isArray(d.updatedFields)) {
        return `Updated ${entityLabel} "${name}": changed ${d.updatedFields.join(", ")}`;
      }
      if ((d.oldStage || d.oldStatus) && (d.newStage || d.newStatus)) {
        return `Moved ${entityLabel} "${name}" from ${d.oldStage || d.oldStatus} to ${d.newStage || d.newStatus}`;
      }
      if (d.status) {
        return `Changed ${entityLabel} "${name}" status to ${d.status}`;
      }
      return `Modified ${entityLabel} details for "${name}"`;
    }
    if (action === "LOGIN") return "User logged in";
    if (action === "LOGOUT") return "User logged out";
    if (action.includes("INVITE")) return `Invited user: ${d.email || name}`;
    if (action.includes("DEACTIVATE")) return `Deactivated user: ${d.email || name}`;
    if (action.includes("ACTIVATE") && !action.includes("DEACTIVATE")) return `Re-activated user: ${d.email || name}`;

    // Fallback to parts list for other updates
    const parts: string[] = [];
    if (d.name) parts.push(`Name: ${d.name}`);
    if (d.company) parts.push(`Company: ${d.company}`);
    if (d.email) parts.push(`Email: ${d.email}`);
    if (d.phone) parts.push(`Phone: ${d.phone}`);
    if (d.status) parts.push(`Status: ${d.status}`);
    if (d.stage) parts.push(`Stage: ${d.stage}`);
    if (d.oldStage && d.newStage) parts.push(`Stage: ${d.oldStage} → ${d.newStage}`);
    if (d.amount) parts.push(`Amount: ${d.amount}`);
    if (d.title) parts.push(`Title: ${d.title}`);
    if (d.role) parts.push(`Role: ${d.role}`);
    
    return parts.length > 0 ? parts.join("; ") : JSON.stringify(d);
  };

  const getReadableAction = (action: string) => {
    if (!action) return "-";
    return action
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const downloadCSV = () => {
    if (!logs?.logs || logs.logs.length === 0) {
      toast.error("No data to download");
      return;
    }

    setIsDownloading(true);

    try {
      // CSV Headers
      const headers = ["Date & Time", "User", "Action", "Entity", "Entity ID", "Details"];
      
      // CSV Rows
      const rows = logs.logs.map((log: any) => {
        const date = formatIST(log.createdAt, "yyyy-MM-dd HH:mm:ss");
        const user = log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : "System";
        const actionLabel = getReadableAction(log.action);
        const entity = log.entity || "";
        const entityId = log.entityId || "";
        
        // Format details in a readable way
        const details = formatAuditDetail(log);

        return [date, user, actionLabel, entity, entityId, `"${details.replace(/"/g, '""')}"`];
      });

      // Combine headers and rows
      const csvContent = [
        headers.join(","),
        ...rows.map((row: string[]) => row.join(","))
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `audit-logs-${formatIST(new Date(), "yyyy-MM-dd-HHmmss")}.csv`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Audit logs downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download audit logs");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen p-4 sm:p-8 space-y-6 animate-in fade-in duration-300 font-poppins">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Audit Logs Report</h1>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 ml-11">View and download system activity logs.</p>
        </div>
        <Button onClick={downloadCSV} disabled={isDownloading || !logs?.logs?.length} className="h-9 rounded-[10px] text-xs">
          <Download className="mr-1.5 h-3.5 w-3.5" />
          {isDownloading ? "Downloading..." : "Download CSV"}
        </Button>
      </div>

      <div className="rounded-[14px] border border-border/60 bg-card shadow-xs p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="startDate" className="text-xs">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 text-xs rounded-[10px] border-border/60"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="endDate" className="text-xs">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 text-xs rounded-[10px] border-border/60"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="entity" className="text-xs">Entity Type</Label>
            <Select value={entity} onValueChange={setEntity}>
              <SelectTrigger id="entity" className="h-9 text-xs rounded-[10px] border-border/60">
                <SelectValue placeholder="All entities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entities</SelectItem>
                <SelectItem value="Lead">Lead</SelectItem>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="Opportunity">Opportunity</SelectItem>
                <SelectItem value="Quote">Quote</SelectItem>
                <SelectItem value="Task">Task</SelectItem>
                <SelectItem value="License">License</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="action" className="text-xs">Action</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger id="action" className="h-9 text-xs rounded-[10px] border-border/60">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="deleted">Deleted</SelectItem>
                <SelectItem value="logged in">Logged In</SelectItem>
                <SelectItem value="logged out">Logged Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user" className="text-xs">User</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger id="user" className="h-9 text-xs rounded-[10px] border-border/60">
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All users</SelectItem>
                {userData?.map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isAdmin && branches && (
            <div className="space-y-1.5">
              <Label htmlFor="branch" className="text-xs">Branch</Label>
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger id="branch" className="h-9 text-xs rounded-[10px] border-border/60">
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  {branches.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[14px] border border-border/70 bg-card overflow-hidden shadow-xs">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/60 bg-muted/40">
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            Recent Activity
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {logs?.logs?.length || 0} records
          </span>
        </div>
        {isLoading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Loading...</div>
        ) : !logs?.logs || logs.logs.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">No audit logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {logs.logs.map((log: any) => {
                  const detailsText = formatAuditDetail(log);

                  return (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-foreground">
                        {formatIST(log.createdAt, "MMM dd, yyyy HH:mm")}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : "System"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-semibold uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                          {log.actor?.branch?.name || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-foreground">{getReadableAction(log.action)}</td>
                      <td className="py-3 px-4 text-muted-foreground">{log.entity}</td>
                      <td className="py-3 px-4 text-muted-foreground max-w-md">
                        <div className="line-clamp-2" title={detailsText}>
                          {detailsText}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
