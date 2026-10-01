import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBranches } from "@/services/settingsService";
import { getCallActivityTrend } from "@/services/analyticsService";
import { CallOverviewCard } from "@/components/dashboard-v2/CallOverviewCard";
import { QuickStatsBar } from "@/components/dashboard-v2/QuickStatsBar";
import { CallActivityTrendChart } from "@/components/dashboard-v2/CallActivityTrendChart";
import { UserTrendsQuickPanel } from "@/components/dashboard-v2/UserTrendsQuickPanel";
import { UserRankingCard } from "@/components/dashboard-v2/UserRankingCard";
import { MyRecentActivity } from "@/components/dashboard-v2/MyRecentActivity";
import { TaskFollowUpStatusChart } from "@/components/dashboard-v2/TaskFollowUpStatusChart";
import { AiInsightCard } from "@/components/dashboard-v2/AiInsightCard";
import { SectionHeading } from "@/components/dashboard-v2/SectionHeading";
import { useDashboardRoleTier } from "@/components/dashboard-v2/useDashboardRoleTier";
import { DateRangeDropdown, getDefaultDateRange, type DateRangeValue } from "@/components/dashboard-v2/DateRangeDropdown";

interface Branch {
  id: string;
  name: string;
}

export default function UserTrendPage() {
  const [range, setRange] = useState<DateRangeValue>(getDefaultDateRange());
  const [branchId, setBranchId] = useState<string>("all");
  const { tier } = useDashboardRoleTier();

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["branches", "list"],
    queryFn: getBranches,
    staleTime: 1000 * 60 * 5,
  });

  const selectedBranchId = branchId !== "all" ? branchId : undefined;

  // Same queryKey CallActivityTrendChart uses below, so this shares the
  // cached result instead of firing a second request - the summary just
  // rides along for the AI insight prompt.
  const { data: callActivity = [] } = useQuery({
    queryKey: ["call-activity-trend", range.period, range.startDate, range.endDate, selectedBranchId],
    queryFn: () =>
      getCallActivityTrend({
        period: range.period,
        startDate: range.period === "custom" ? range.startDate : undefined,
        endDate: range.period === "custom" ? range.endDate : undefined,
        branchId: selectedBranchId,
      }),
  });

  return (
    <div className="bg-white space-y-4 sm:space-y-8 animate-in fade-in duration-500 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-xl sm:text-3xl font-medium font-poppins tracking-tight text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-[#69a63a]" /> User Trend
          </h1>
          <p className="text-gray-600 tracking-tight font-poppins mt-0.5 text-[12px] sm:text-[14px] opacity-80">
            Discover how call conversations trend over time.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger className="h-9 w-[140px] rounded-[10px] text-xs border-[hsl(var(--chart-5))]/20 bg-[hsl(var(--chart-5))]/5 text-[hsl(var(--chart-5))] focus:outline-none focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent className="rounded-[10px]">
              <SelectItem value="all" className="rounded-[10px] focus:bg-[hsl(var(--chart-5))]/10 focus:text-[hsl(var(--chart-5))]">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id} className="rounded-[10px] focus:bg-[hsl(var(--chart-5))]/10 focus:text-[hsl(var(--chart-5))]">{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangeDropdown
            value={range}
            onChange={setRange}
            variant="accent"
            presets={["allTime", "today", "yesterday", "week", "thisMonth", "lastMonth", "custom"]}
          />
        </div>
      </div>

      <AiInsightCard type="user-trend" summary={{ callActivity }} />

      <QuickStatsBar range={range} branchId={selectedBranchId} />

      <div className="bg-card overflow-hidden rounded-[10px] border border-border">
        <div className="grid lg:grid-cols-[auto_1fr] divide-y lg:divide-y-0 lg:divide-x divide-border">
          <div className="p-4 sm:p-5 w-fit">
            <CallOverviewCard range={range} branchId={selectedBranchId} />
          </div>
          <div className="p-4 sm:p-5">
            <UserTrendsQuickPanel range={range} branchId={selectedBranchId} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeading icon={<TrendingUp strokeWidth={1} className="h-5.5 w-5.5 text-[hsl(var(--chart-5))]" />}>
          Call Activity Over Time
        </SectionHeading>
        <CallActivityTrendChart range={range} branchId={selectedBranchId} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[10px] bg-card border border-border overflow-hidden p-4 sm:p-6">
          {tier === "rep" ? <MyRecentActivity /> : <UserRankingCard range={range} branchId={selectedBranchId} />}
        </div>
        <TaskFollowUpStatusChart branchId={selectedBranchId} />
      </div>
    </div>
  );
}
