import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTrendInsight } from "@/services/analyticsService";

export function AiInsightCard({ type, summary }: { type: "user-trend" | "business-trend"; summary: unknown }) {
  const { data, isLoading } = useQuery({
    queryKey: ["trend-insight", type, JSON.stringify(summary)],
    queryFn: () => getTrendInsight(type, summary),
    enabled: !!summary,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <Card className="rounded-[10px] md:rounded-[20px] border border-border overflow-hidden bg-gradient-to-br from-[hsl(var(--chart-5))]/10 to-transparent">
      <CardContent className="p-5 flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 rounded-xl bg-[hsl(var(--chart-5))]/15 flex items-center justify-center">
          <Sparkles className="h-4.5 w-4.5 text-[hsl(var(--chart-5))]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold font-poppins text-foreground">Insight</h3>
            {data?.source && (
              <span className="text-[10px] font-poppins font-medium px-1.5 py-0.5 rounded-full bg-[hsl(var(--chart-5))]/15 text-[hsl(var(--chart-5))]">
                {data.source === "ai" ? "AI-generated" : "Computed"}
              </span>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-4 w-3/4" />
          ) : (
            <p className="text-sm font-poppins text-foreground/80 leading-relaxed">
              {data?.insight || "Not enough data yet to generate an insight for this range."}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
