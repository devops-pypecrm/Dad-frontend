import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBranches } from "@/services/settingsService";
import { getLeadSourceAnalytics } from "@/services/analyticsService";
import { LeadSourceDonutChart } from "@/components/dashboard-v2/LeadSourceDonutChart";
import { ConversionFunnelChart } from "@/components/dashboard-v2/ConversionFunnelChart";
import { OpportunityPipelineChart } from "@/components/dashboard-v2/OpportunityPipelineChart";
import { BranchPerformanceChart } from "@/components/dashboard-v2/BranchPerformanceChart";
import { AiInsightCard } from "@/components/dashboard-v2/AiInsightCard";
import { SectionHeading } from "@/components/dashboard-v2/SectionHeading";
import { useDashboardRoleTier } from "@/components/dashboard-v2/useDashboardRoleTier";
import { DateRangeDropdown, getDefaultDateRange, type DateRangeValue } from "@/components/dashboard-v2/DateRangeDropdown";

interface Branch {
  id: string;
  name: string;
}

export default function BusinessTrendPage() {
  const [range, setRange] = useState<DateRangeValue>(getDefaultDateRange());
  const [branchId, setBranchId] = useState<string>("all");
  const { tier } = useDashboardRoleTier();

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["branches", "list"],
    queryFn: getBranches,
    staleTime: 1000 * 60 * 5,
  });

  const selectedBranchId = branchId !== "all" ? branchId : undefined;

  // Same queryKey LeadSourceDonutChart uses below - shares the cached
  // result, so this only rides along for the AI insight prompt.
  const { data: leadSourceRaw = [] } = useQuery({
    queryKey: ["lead-source-analytics-v2", selectedBranchId],
    queryFn: () => getLeadSourceAnalytics(selectedBranchId),
  });
  const leadSources = (Array.isArray(leadSourceRaw) ? leadSourceRaw : []).map((item: { source?: string; count?: number }) => ({
    source: item.source || "unknown",
    count: Number(item.count || 0),
  }));

  return (
    <div className="bg-white space-y-4 sm:space-y-8 animate-in fade-in duration-500 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-xl sm:text-3xl font-medium font-poppins tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-rose-600" /> Business Trend
          </h1>
          <p className="text-gray-600 tracking-tight font-poppins mt-0.5 text-[12px] sm:text-[14px] opacity-80">
            Business insight on conversation calls and lead sources to drive results.
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
            presets={["allTime", "thisMonth", "lastMonth", "custom"]}
          />
        </div>
      </div>

      <AiInsightCard type="business-trend" summary={{ leadSources }} />

      <div className="space-y-3">
        <SectionHeading icon={<BarChart3 strokeWidth={1} className="h-5.5 w-5.5 text-[hsl(var(--chart-5))]" />}>
          Lead Sources &amp; Conversion
        </SectionHeading>
        <div className="grid gap-4 lg:grid-cols-2">
          <LeadSourceDonutChart branchId={selectedBranchId} />
          <ConversionFunnelChart branchId={selectedBranchId} />
          <OpportunityPipelineChart branchId={selectedBranchId} />
          {tier === "full" && <BranchPerformanceChart />}
        </div>
      </div>
    </div>
  );
}
