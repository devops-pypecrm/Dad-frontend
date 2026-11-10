import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { ChevronDown, ChevronRight, Trophy } from "lucide-react"
import { getTargetWonDeals } from "@/services/salesTargetService"
import { useCurrency } from "@/contexts/CurrencyContext"

/** Collapsible list of the won deals that count toward a target. Loads only when opened. */
export function WonDealsList({ targetId, showOwner = false }: { targetId: string; showOwner?: boolean }) {
  const [open, setOpen] = useState(false)
  const { formatCurrency } = useCurrency()
  const { data, isLoading, isError } = useQuery({
    queryKey: ["sales-targets", "won-deals", targetId],
    queryFn: () => getTargetWonDeals(targetId),
    enabled: open,
  })
  const deals = data?.deals ?? []

  return (
    <div className="mt-3 border-t border-border pt-2">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        <Trophy className="h-3.5 w-3.5 text-green-600" />
        Won cases{open && !isLoading ? ` (${deals.length})` : ""}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {isLoading && <p className="text-xs text-muted-foreground">Loading…</p>}
          {isError && <p className="text-xs text-destructive">Couldn't load won cases.</p>}
          {!isLoading && !isError && deals.length === 0 && <p className="text-xs text-muted-foreground">No won cases counted for this target yet.</p>}
          {deals.map((d) => (
            <Link key={d.id} to={`/opportunities/${d.id}`} className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2 text-xs hover:bg-muted">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{d.name}</p>
                <p className="truncate text-muted-foreground">
                  {[d.accountName, showOwner ? d.ownerName : null].filter(Boolean).join(" · ")}
                  {d.closedAt ? `${d.accountName || (showOwner && d.ownerName) ? " · " : ""}${new Date(d.closedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}` : ""}
                </p>
              </div>
              <span className="shrink-0 font-semibold text-foreground">{formatCurrency(d.amount, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
