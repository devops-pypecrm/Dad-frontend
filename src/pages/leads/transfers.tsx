import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowLeftRight,
  AlertCircle,
  CheckCircle2,
  Search,
  MessageSquare,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Send,
  Building2,
  Calendar
} from "lucide-react";
import { api } from "@/services/api";
import { formatIST } from "@/lib/dateUtils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { isSuperAdmin } from "@/lib/utils";

interface ViolationLead {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  status: string;
  violationTime: string;
  userExplanation?: string | null;
  managerExplanation?: string | null;
  previousOwner?: { id: string; firstName: string; lastName: string; email?: string } | null;
  assignedTo?: { id: string; firstName: string; lastName: string; email?: string } | null;
}

interface ViolationResponse {
  violations: ViolationLead[];
  page: number;
  pages: number;
  total: number;
  stats?: {
    total: number;
    pending: number;
    resolved: number;
  };
}

export default function LeadTransfersPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "explained">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [selectedLead, setSelectedLead] = useState<ViolationLead | null>(null);
  const [explanationText, setExplanationText] = useState("");
  const [explanationRole, setExplanationRole] = useState<"user" | "manager">("user");

  const userInfoStr = localStorage.getItem("userInfo");
  let currentUser: any = null;
  try {
    if (userInfoStr) currentUser = JSON.parse(userInfoStr);
  } catch {
    /* ignore */
  }

  // Fetch violations data
  const { data, isLoading, isFetching } = useQuery<ViolationResponse>({
    queryKey: ["lead-transfers", activeTab, searchQuery, page],
    queryFn: async () => {
      const params: any = {
        page,
        pageSize,
        status: activeTab,
      };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const res = await api.get("/leads/violations", { params });
      return res.data;
    },
    enabled: !isSuperAdmin(currentUser),
  });

  const violations = data?.violations || [];
  const totalPages = data?.pages || 1;
  const stats = data?.stats || { total: 0, pending: 0, resolved: 0 };

  // Submit explanation mutation
  const explanationMutation = useMutation({
    mutationFn: async ({ leadId, explanation, type }: { leadId: string; explanation: string; type: "user" | "manager" }) => {
      const response = await api.post("/leads/explanation", { leadId, explanation, type });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["violations"] });
      toast.success("Explanation submitted successfully");
      setSelectedLead(null);
      setExplanationText("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to submit explanation");
    },
  });

  const openExplanationModal = (lead: ViolationLead, defaultRole?: "user" | "manager") => {
    setSelectedLead(lead);
    setExplanationText("");

    if (defaultRole) {
      setExplanationRole(defaultRole);
    } else {
      // Auto-detect role
      if (!lead.userExplanation && lead.previousOwner?.id === currentUser?.id) {
        setExplanationRole("user");
      } else if (!lead.managerExplanation) {
        setExplanationRole("manager");
      } else {
        setExplanationRole("user");
      }
    }
  };

  const handleSubmitExplanation = () => {
    if (!selectedLead || !explanationText.trim()) return;
    explanationMutation.mutate({
      leadId: selectedLead.id,
      explanation: explanationText.trim(),
      type: explanationRole,
    });
  };

  if (isSuperAdmin(currentUser)) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center space-y-4 font-poppins">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Super Admin Access</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Lead SLA transfers and assignment violations are specific to individual tenant organisations. Please log in as an organisation member to review team lead transfers.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen p-4 sm:p-8 space-y-6 animate-in fade-in duration-300 font-poppins">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-[10px] bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Lead Transfers &amp; SLA Violations
            </h1>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 ml-11">
            Track leads reassigned automatically due to SLA inactivity and manage required explanations.
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

      {/* KPI Stats Cards - matching Dashboard V2 aesthetic */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Transfers */}
        <div className="rounded-[14px] border border-border/60 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Rotated Leads
            </span>
            <div className="h-8 w-8 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {stats.total.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Total reassignments due to inactivity SLA
          </p>
        </div>

        {/* Needs Explanation */}
        <div className="rounded-[14px] border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5 shadow-xs transition-all hover:border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Pending Explanations
            </span>
            <div className="h-8 w-8 rounded-[10px] bg-amber-500/15 text-amber-600 flex items-center justify-center">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-700 dark:text-amber-400">
              {stats.pending.toLocaleString()}
            </span>
            {stats.pending > 0 && (
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-500/30">
                Action required
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-amber-600/80 mt-1">
            Leads awaiting rep or manager explanation
          </p>
        </div>

        {/* Resolved */}
        <div className="rounded-[14px] border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 shadow-xs transition-all hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Fully Explained
            </span>
            <div className="h-8 w-8 rounded-[10px] bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
              {stats.resolved.toLocaleString()}
            </span>
            {stats.total > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                ({Math.round((stats.resolved / (stats.total || 1)) * 100)}%)
              </span>
            )}
          </div>
          <p className="text-[11px] text-emerald-600/80 mt-1">
            Both rep and manager provided explanations
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Status Tabs */}
        <div className="inline-flex items-center p-1 bg-muted/60 rounded-[10px] border border-border/50 self-start">
          <button
            onClick={() => { setActiveTab("all"); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === "all"
                ? "bg-white text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Transfers ({stats.total})
          </button>
          <button
            onClick={() => { setActiveTab("pending"); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === "pending"
                ? "bg-white text-amber-700 shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pending Action ({stats.pending})
          </button>
          <button
            onClick={() => { setActiveTab("explained"); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === "explained"
                ? "bg-white text-emerald-700 shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Explained ({stats.resolved})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search lead, company, owner..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-9 text-xs rounded-[10px] bg-background border-border/60 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Main Content Table / List */}
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
        ) : violations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No SLA transfers found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? "No lead transfers matched your search criteria. Try a different search keyword."
                : activeTab === "pending"
                ? "All lead transfers currently have complete explanations! Great job keeping on top of SLA violations."
                : "No leads in this organisation have been automatically rotated yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/60 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Lead</th>
                  <th className="py-3.5 px-4">Previous Owner (Inactive)</th>
                  <th className="py-3.5 px-4">New Owner (Rotated To)</th>
                  <th className="py-3.5 px-4">Rotation Date</th>
                  <th className="py-3.5 px-4">Rep Explanation</th>
                  <th className="py-3.5 px-4">Manager Explanation</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {violations.map((lead) => {
                  const leadName = `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Unnamed Lead";
                  const prevOwnerName = lead.previousOwner
                    ? `${lead.previousOwner.firstName || ""} ${lead.previousOwner.lastName || ""}`.trim()
                    : "Unknown";
                  const newOwnerName = lead.assignedTo
                    ? `${lead.assignedTo.firstName || ""} ${lead.assignedTo.lastName || ""}`.trim()
                    : "Unassigned";

                  const hasUserExplanation = Boolean(lead.userExplanation && lead.userExplanation.trim());
                  const hasManagerExplanation = Boolean(lead.managerExplanation && lead.managerExplanation.trim());
                  const isFullyResolved = hasUserExplanation && hasManagerExplanation;

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      {/* Lead Name & Details */}
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          <span className="font-semibold text-[13px]">{leadName}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                        </Link>
                        {lead.company && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                            <Building2 className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[160px]">{lead.company}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="text-[11px] text-muted-foreground/80 mt-0.5">
                            {lead.phone}
                          </div>
                        )}
                      </td>

                      {/* Previous Owner */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center font-bold text-[10px] shrink-0">
                            {prevOwnerName.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-xs">{prevOwnerName}</p>
                            <span className="text-[10px] text-muted-foreground">Inactivity SLA missed</span>
                          </div>
                        </div>
                      </td>

                      {/* New Owner */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {newOwnerName.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-xs">{newOwnerName}</p>
                            <span className="text-[10px] text-muted-foreground">Current assignee</span>
                          </div>
                        </div>
                      </td>

                      {/* Rotation Date */}
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {lead.violationTime ? formatIST(lead.violationTime, "MMM d, yyyy") : "—"}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 pl-5">
                          {lead.violationTime ? formatIST(lead.violationTime, "h:mm a") : ""}
                        </div>
                      </td>

                      {/* User Explanation */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        {hasUserExplanation ? (
                          <div className="group/exp cursor-pointer" onClick={() => openExplanationModal(lead, "user")}>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] mb-1">
                              Provided
                            </Badge>
                            <p className="text-[11px] text-muted-foreground truncate line-clamp-1 italic">
                              "{lead.userExplanation}"
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px]">
                              Pending
                            </Badge>
                            <button
                              onClick={() => openExplanationModal(lead, "user")}
                              className="text-[11px] text-primary hover:underline font-medium"
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Manager Explanation */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        {hasManagerExplanation ? (
                          <div className="group/exp cursor-pointer" onClick={() => openExplanationModal(lead, "manager")}>
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] mb-1">
                              Provided
                            </Badge>
                            <p className="text-[11px] text-muted-foreground truncate line-clamp-1 italic">
                              "{lead.managerExplanation}"
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px]">
                              Pending
                            </Badge>
                            <button
                              onClick={() => openExplanationModal(lead, "manager")}
                              className="text-[11px] text-primary hover:underline font-medium"
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant={isFullyResolved ? "outline" : "default"}
                          size="sm"
                          onClick={() => openExplanationModal(lead)}
                          className={
                            isFullyResolved
                              ? "h-8 text-xs rounded-[8px] border-border/70"
                              : "h-8 text-xs rounded-[8px] bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
                          }
                        >
                          <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                          {isFullyResolved ? "View Details" : "Explain"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
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

      {/* Explanation Dialog / Modal */}
      <Dialog open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-lg rounded-[14px] font-poppins">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2 text-foreground font-poppins">
              <ArrowLeftRight className="h-5 w-5 text-amber-600" />
              Lead Transfer Explanation
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Lead <strong>{selectedLead?.firstName} {selectedLead?.lastName}</strong> was rotated due to inactivity SLA.
            </DialogDescription>
          </DialogHeader>

          {/* Lead SLA Summary */}
          {selectedLead && (
            <div className="rounded-[10px] bg-muted/40 p-3 border border-border/50 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lead:</span>
                <span className="font-semibold text-foreground">
                  {selectedLead.firstName} {selectedLead.lastName || ""} {selectedLead.company ? `(${selectedLead.company})` : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Previous Owner:</span>
                <span className="font-medium text-foreground">
                  {selectedLead.previousOwner?.firstName} {selectedLead.previousOwner?.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rotated To:</span>
                <span className="font-medium text-foreground">
                  {selectedLead.assignedTo?.firstName} {selectedLead.assignedTo?.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rotation Time:</span>
                <span className="font-medium text-foreground">
                  {selectedLead.violationTime ? formatIST(selectedLead.violationTime, "PPpp") : "—"}
                </span>
              </div>
            </div>
          )}

          {/* Existing Explanations view */}
          <div className="space-y-3 pt-1">
            {selectedLead?.userExplanation && (
              <div className="rounded-[10px] bg-emerald-500/5 border border-emerald-500/20 p-3 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                  <span>Rep Explanation (Previous Owner):</span>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs text-foreground italic bg-background/60 p-2 rounded-md">
                  "{selectedLead.userExplanation}"
                </p>
              </div>
            )}

            {selectedLead?.managerExplanation && (
              <div className="rounded-[10px] bg-emerald-500/5 border border-emerald-500/20 p-3 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                  <span>Manager Explanation:</span>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <p className="text-xs text-foreground italic bg-background/60 p-2 rounded-md">
                  "{selectedLead.managerExplanation}"
                </p>
              </div>
            )}
          </div>

          {/* Form to submit / edit explanation */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Provide Explanation as:
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setExplanationRole("user")}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition-all ${
                    explanationRole === "user"
                      ? "bg-primary text-primary-foreground border-primary font-medium"
                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  Rep (Previous Owner)
                </button>
                <button
                  type="button"
                  onClick={() => setExplanationRole("manager")}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition-all ${
                    explanationRole === "manager"
                      ? "bg-primary text-primary-foreground border-primary font-medium"
                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  Manager / Admin
                </button>
              </div>
            </div>

            <Textarea
              placeholder={`Enter ${explanationRole === "user" ? "rep" : "manager"} explanation for why the lead was not contacted in time...`}
              value={explanationText}
              onChange={(e) => setExplanationText(e.target.value)}
              className="min-h-[100px] text-xs rounded-[10px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedLead(null)}
              className="rounded-[8px]"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitExplanation}
              disabled={!explanationText.trim() || explanationMutation.isPending}
              className="rounded-[8px] bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              {explanationMutation.isPending ? "Submitting..." : "Submit Explanation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
