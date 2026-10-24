import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { FollowUpMobileCard } from "./FollowUpMobileCard";
import { getFollowUps } from "@/services/followUpService";
import { getBranches } from "@/services/settingsService";
import { getUsers } from "@/services/userService";
import { Calendar, Clock, X, Filter, Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isToday } from "date-fns";

export default function FollowUpsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get("filter"); // overdue, today, upcoming
  const sortBy = searchParams.get("sort") || "dueDate-asc";
  const statusFilter = searchParams.get("status") || "all";
  const branchFilter = searchParams.get("branch") || "all";
  const userFilter = searchParams.get("user") || "all";
  const [searchQuery, setSearchQuery] = useState("");

  const updateSearchParams = useCallback(
    (newParams: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams);
      Object.entries(newParams).forEach(([key, value]) => {
        if (
          value === undefined ||
          value === "all" ||
          (key === "sort" && value === "dueDate-asc")
        ) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  // Save active filters to sessionStorage whenever they change
  useEffect(() => {
    const paramsString = searchParams.toString();
    if (paramsString) {
      sessionStorage.setItem("last-followups-filters", paramsString);
    } else {
      sessionStorage.removeItem("last-followups-filters");
    }
  }, [searchParams]);

  // Restore filters on mount if URL has no filters
  useEffect(() => {
    const hasParams = Array.from(searchParams.keys()).some(
      (k) => k !== "filter",
    );
    if (!hasParams) {
      const savedFilters = sessionStorage.getItem("last-followups-filters");
      if (savedFilters) {
        const saved = new URLSearchParams(savedFilters);
        if (filterParam) saved.set("filter", filterParam);
        setSearchParams(saved);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: branchesData } = useQuery({
    queryKey: ["branches"],
    queryFn: () => getBranches(),
  });
  const branches = branchesData || [];

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
  });
  const users = usersData?.users || [];

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "follow-ups",
      searchQuery,
      statusFilter,
      branchFilter,
      userFilter,
    ],
    queryFn: () =>
      getFollowUps({
        search: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        branchId: branchFilter !== "all" ? branchFilter : undefined,
        userId: userFilter !== "all" ? userFilter : undefined,
        limit: 1000,
      }),
  });

  const followUps = data?.tasks || [];
  const activeCount = data?.counts?.active || 0;
  const overdueCount = data?.counts?.overdue || 0;
  const todayCount = data?.counts?.today || 0;
  const upcomingCount = data?.counts?.upcoming || 0;

  const hasActiveFilters = useMemo(
    () =>
      statusFilter !== "all" ||
      branchFilter !== "all" ||
      userFilter !== "all" ||
      sortBy !== "dueDate-asc" ||
      !!filterParam ||
      !!searchQuery,
    [statusFilter, branchFilter, userFilter, sortBy, filterParam, searchQuery],
  );

  // ----------------------------------------------------------------
  // Clear All Filters — NEVER navigates away from /follow-ups
  // ----------------------------------------------------------------
  const handleClearAllFilters = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    sessionStorage.removeItem("last-followups-filters");
    setSearchQuery("");
    setSearchParams(new URLSearchParams({}));
  };

  const activeFiltersList = useMemo(() => {
    const list: {
      key: string;
      label: string;
      clear: (e?: React.MouseEvent) => void;
    }[] = [];

    if (filterParam) {
      list.push({
        key: "filter",
        label: `Timeframe: ${filterParam.charAt(0).toUpperCase() + filterParam.slice(1)}`,
        clear: (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          const params = new URLSearchParams(searchParams);
          params.delete("filter");
          setSearchParams(params);
        },
      });
    }
    if (sortBy !== "dueDate-asc") {
      const labels: Record<string, string> = {
        "dueDate-desc": "Due Date (Latest)",
        "priority-desc": "Priority (High to Low)",
        "assignedTo-asc": "User (A-Z)",
        "status-asc": "Status (A-Z)",
        "subject-asc": "Subject (A-Z)",
      };
      list.push({
        key: "sort",
        label: `Sorting: ${labels[sortBy] || sortBy}`,
        clear: (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          updateSearchParams({ sort: undefined });
        },
      });
    }
    if (statusFilter !== "all") {
      const labels: Record<string, string> = {
        not_started: "Not Started",
        in_progress: "In Progress",
        completed: "Completed",
        deferred: "Deferred",
      };
      list.push({
        key: "status",
        label: `Status: ${labels[statusFilter] || statusFilter}`,
        clear: (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          updateSearchParams({ status: undefined });
        },
      });
    }
    if (branchFilter !== "all") {
      const found = branches.find((b: any) => b.id === branchFilter);
      list.push({
        key: "branch",
        label: found ? `Branch: ${found.name}` : `Branch: ${branchFilter}`,
        clear: (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          updateSearchParams({ branch: undefined });
        },
      });
    }
    if (userFilter !== "all") {
      const found = users.find((u: any) => u.id === userFilter);
      list.push({
        key: "user",
        label: found
          ? `User: ${found.firstName} ${found.lastName || ""}`
          : `User: ${userFilter}`,
        clear: (e) => {
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          updateSearchParams({ user: undefined });
        },
      });
    }
    return list;
  }, [
    filterParam,
    sortBy,
    statusFilter,
    branchFilter,
    userFilter,
    branches,
    users,
    updateSearchParams,
    searchParams,
    setSearchParams,
  ]);

  // ----------------------------------------------------------------
  // Data filtering & sorting
  // ----------------------------------------------------------------
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const filteredFollowUps = useMemo(() => {
    let result = filterParam
      ? followUps.filter((task: any) => {
          switch (filterParam) {
            case "overdue":
              return (
                new Date(task.dueDate) < new Date() &&
                task.status !== "completed"
              );
            case "today":
              return (
                isToday(new Date(task.dueDate)) && task.status !== "completed"
              );
            case "upcoming":
              return (
                new Date(task.dueDate) > new Date() &&
                !isToday(new Date(task.dueDate)) &&
                task.status !== "completed"
              );
            default:
              return true;
          }
        })
      : statusFilter === "all"
        ? followUps.filter((task: any) => task.status !== "completed")
        : [...followUps];

    const [field, direction] = sortBy.split("-");
    result.sort((a: any, b: any) => {
      let valA = a[field];
      let valB = b[field];
      if (field === "dueDate") {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }
      if (field === "assignedTo") {
        valA = a.assignedTo
          ? `${a.assignedTo.firstName} ${a.assignedTo.lastName}`
          : "";
        valB = b.assignedTo
          ? `${b.assignedTo.firstName} ${b.assignedTo.lastName}`
          : "";
      }
      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [followUps, filterParam, today, sortBy, statusFilter]);

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <p className="text-red-500 text-sm">
          Error loading follow-ups. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen p-4 sm:p-8 space-y-6 animate-in fade-in duration-300 font-poppins">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Follow-ups
            </h1>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 ml-11 hidden sm:block">
            Track and manage all your follow-up tasks and your team's.
          </p>
        </div>
        {/* Clear Filters — hidden when no active filters on mobile */}
        {hasActiveFilters && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClearAllFilters}
            className="h-9 px-3 rounded-[10px] border-dashed text-destructive border-destructive/40
                       hover:bg-destructive/10 gap-1.5 font-semibold text-xs shrink-0 transition-all"
            title="Clear All Active Filters"
          >
            <X className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear Filters</span>
            <span className="sm:hidden">Clear</span>
          </Button>
        )}
      </div>

      {/* ── Stats Cards: 2×2 on mobile, 4×1 on desktop ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div
          className={cn(
            "cursor-pointer rounded-[14px] border border-border/60 bg-card p-4 sm:p-5 shadow-xs transition-all hover:border-border hover:-translate-y-0.5 active:scale-95",
            !filterParam && "ring-2 ring-primary/60",
          )}
          onClick={() => navigate("/follow-ups")}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active</span>
            <div className="h-8 w-8 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {activeCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">All pending</p>
        </div>

        <div
          className={cn(
            "cursor-pointer rounded-[14px] border border-destructive/20 bg-destructive/5 p-4 sm:p-5 shadow-xs transition-all hover:border-destructive/30 hover:-translate-y-0.5 active:scale-95",
            filterParam === "overdue" && "ring-2 ring-destructive/60",
          )}
          onClick={() => navigate("/follow-ups?filter=overdue")}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-destructive uppercase tracking-wider">Overdue</span>
            <div className="h-8 w-8 rounded-[10px] bg-destructive/15 text-destructive flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-destructive">
            {overdueCount}
          </div>
          <p className="text-[11px] text-destructive/80 mt-1">Past due date</p>
        </div>

        <div
          className={cn(
            "cursor-pointer rounded-[14px] border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5 shadow-xs transition-all hover:border-amber-500/30 hover:-translate-y-0.5 active:scale-95",
            filterParam === "today" && "ring-2 ring-amber-500/60",
          )}
          onClick={() => navigate("/follow-ups?filter=today")}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">Today</span>
            <div className="h-8 w-8 rounded-[10px] bg-amber-500/15 text-amber-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-amber-700 dark:text-amber-400">
            {todayCount}
          </div>
          <p className="text-[11px] text-amber-600/80 mt-1">Due today</p>
        </div>

        <div
          className={cn(
            "cursor-pointer rounded-[14px] border border-emerald-500/20 bg-emerald-500/5 p-4 sm:p-5 shadow-xs transition-all hover:border-emerald-500/30 hover:-translate-y-0.5 active:scale-95",
            filterParam === "upcoming" && "ring-2 ring-emerald-500/60",
          )}
          onClick={() => navigate("/follow-ups?filter=upcoming")}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Upcoming</span>
            <div className="h-8 w-8 rounded-[10px] bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
            {upcomingCount}
          </div>
          <p className="text-[11px] text-emerald-600/80 mt-1">Future</p>
        </div>
      </div>

      {/* ── Filters Panel ── */}
      <div className="rounded-[14px] border border-border/60 bg-card shadow-xs">
        {/* Search row */}
        <div className="p-3 border-b border-border/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search follow-ups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 sm:h-9 w-full bg-background text-sm sm:text-xs rounded-[10px] border-border/60 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Filter selects — stacked on mobile (1 col), row on sm+ */}
        <div className="p-3 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
          {/* Sort */}
          <Select
            value={sortBy}
            onValueChange={(val) => updateSearchParams({ sort: val })}
          >
            <SelectTrigger className="h-10 sm:h-9 w-full sm:w-[172px] bg-background text-sm sm:text-xs rounded-[10px] border-border/60">
              <SelectValue placeholder="Sort: Due Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dueDate-asc">Due Date (Earliest)</SelectItem>
              <SelectItem value="dueDate-desc">Due Date (Latest)</SelectItem>
              <SelectItem value="priority-desc">
                Priority (High to Low)
              </SelectItem>
              <SelectItem value="assignedTo-asc">User (A-Z)</SelectItem>
              <SelectItem value="status-asc">Status (A-Z)</SelectItem>
              <SelectItem value="subject-asc">Subject (A-Z)</SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select
            value={statusFilter}
            onValueChange={(val) => updateSearchParams({ status: val })}
          >
            <SelectTrigger className="h-10 sm:h-9 w-full sm:w-[145px] bg-background text-sm sm:text-xs rounded-[10px] border-border/60">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="deferred">Deferred</SelectItem>
            </SelectContent>
          </Select>

          {/* Branch */}
          {branches.length > 0 && (
            <Select
              value={branchFilter}
              onValueChange={(val) => updateSearchParams({ branch: val })}
            >
              <SelectTrigger className="h-10 sm:h-9 w-full sm:w-[145px] bg-background text-sm sm:text-xs rounded-[10px] border-border/60">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch: any) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* User */}
          {users.length > 0 && (
            <Select
              value={userFilter}
              onValueChange={(val) => updateSearchParams({ user: val })}
            >
              <SelectTrigger className="h-10 sm:h-9 w-full sm:w-[145px] bg-background text-sm sm:text-xs rounded-[10px] border-border/60">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users
                  .filter((user: any) => branchFilter === 'all' || user.branchId === branchFilter)
                  .map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* ── Active Filter Chips ── */}
      {activeFiltersList.length > 0 && (
        <div
          className="
      mx-0 sm:mx-0
      rounded-[14px] border border-border/60 bg-card
      p-3
      sm:p-2.5
    "
        >
          {/* Mobile Layout */}
          <div className="flex flex-col gap-3 sm:hidden">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary/70 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Active Filters
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeFiltersList.map((filter) => (
                <div
                  key={filter.key}
                  className="
              flex items-center
              max-w-full
              rounded-full
              border border-primary/20
              bg-primary/10
              px-3 py-1.5
              text-xs font-medium
              text-primary
            "
                >
                  <span className="truncate max-w-[150px]">{filter.label}</span>

                  <button
                    type="button"
                    onClick={filter.clear}
                    title={`Remove ${filter.key} filter`}
                    className="
                ml-2
                flex h-5 w-5 shrink-0
                items-center justify-center
                rounded-full
                transition-colors
                hover:bg-primary/20
                active:scale-95
              "
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={handleClearAllFilters}
              className="
          h-10
          w-full
          rounded-lg
          border border-destructive/20
          bg-destructive/5
          text-sm font-semibold text-destructive
          hover:bg-destructive/10
        "
            >
              <X className="mr-2 h-4 w-4" />
              Clear All Filters
            </Button>
          </div>

          {/* Existing Desktop Layout */}
          <div className="hidden sm:flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground/80">
              <Filter className="h-3.5 w-3.5 text-primary/60" />
              Active:
            </span>

            {activeFiltersList.map((filter) => (
              <div
                key={filter.key}
                className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
              >
                <span>{filter.label}</span>

                <button
                  type="button"
                  onClick={filter.clear}
                  className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-primary/20"
                  title={`Remove ${filter.key} filter`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearAllFilters}
              className="ml-auto h-7 gap-1 rounded-full border border-destructive/20 bg-destructive/5 px-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
            >
              <X className="h-3 w-3" />
              Clear all
            </Button>
          </div>
        </div>
      )}

      {/* ── Data ── */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="rounded-[14px] border border-border/70 bg-card overflow-hidden shadow-xs pb-20 sm:pb-0">
          <DataTable
            columns={columns}
            data={filteredFollowUps}
            initialPageSize={100}
            mobileCardRender={(task) => (
              <FollowUpMobileCard key={(task as any).id} task={task as any} />
            )}
          />
        </div>
      )}
    </div>
  );
}
