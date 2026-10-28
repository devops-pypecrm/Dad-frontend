/**
 * Design tokens for the web app's "Dashboard V2" look (src/pages/DashboardV2.tsx and
 * src/components/dashboard-v2/*). New and revamped pages must use these instead of
 * hand-copying class strings. See .claude/skills/web-ui-v2.md for the full guide.
 *
 * Brand accent = hsl(var(--chart-5)) (green). Tints: /5 hover, /10 tile, /20 border.
 */
export const V2 = {
  /** Page wrapper (list + detail pages). */
  page: "flex flex-col gap-5 p-5 sm:p-6 animate-in fade-in duration-500",
  h1: "text-xl sm:text-3xl font-medium font-poppins tracking-tight text-foreground",
  subtitle: "text-gray-600 tracking-tight font-poppins mt-0.5 text-[12px] sm:text-[14px] opacity-80",
  /** Header icon square next to a page title. */
  headerIcon:
    "h-12 w-12 rounded-[10px] bg-[hsl(var(--chart-5))]/10 flex items-center justify-center text-[hsl(var(--chart-5))] shrink-0",

  /** Bordered surface. */
  card: "rounded-[10px] bg-card border border-border",
  cardPad: "rounded-[10px] bg-card border border-border p-4 sm:p-6",
  cardTitle: "text-base sm:text-lg font-medium font-poppins text-foreground flex items-center gap-2",
  /** Small square icon next to a card title (strokeWidth 1 lucide icons look right here). */
  cardIcon: "h-5 w-5 text-[hsl(var(--chart-5))]",
  /** Row inside a card (list item) - hover tints brand green. */
  row: "flex items-center justify-between gap-3 rounded-[10px] border border-border bg-card px-4 py-3 transition-colors hover:bg-[hsl(var(--chart-5))]/5",
  emptyState: "text-center py-10 text-muted-foreground rounded-[10px] border border-dashed border-border bg-muted/20",

  /** Buttons. Primary = brand green, never the default black `Button`. */
  btnPrimary:
    "h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-semibold bg-[hsl(var(--chart-5))] text-white shadow-lg shadow-[hsl(var(--chart-5))]/20 hover:bg-[hsl(var(--chart-5))]/90",
  btnOutline: "h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-medium",
  btnAccent:
    "h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-semibold text-[hsl(var(--chart-5))] bg-[hsl(var(--chart-5))]/5 border border-[hsl(var(--chart-5))]/20 hover:bg-[hsl(var(--chart-5))]/10 hover:text-[hsl(var(--chart-5))]",
  btnDanger:
    "h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-semibold border border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive/10 hover:text-destructive",

  /** Stat bar: one bordered card, divided tiles, thin coloured top line per tile. */
  statBar: "rounded-[10px] bg-card border border-border overflow-hidden",
  statGrid: "divide-y sm:divide-y-0 sm:divide-x divide-border",
  statTile: "group relative flex flex-col items-center justify-center gap-1 px-4 py-4 overflow-hidden",
  statLine: "absolute top-0 left-0 right-0 h-0.5 opacity-70",
  statLabel: "text-xs font-poppins text-muted-foreground",
  statValue: "text-xl sm:text-2xl font-medium font-poppins text-black",

  /** Dialogs. */
  dialog: "rounded-[10px] border border-border",
  dialogTitle: "text-lg font-medium font-poppins flex items-center gap-2",
  label: "text-xs font-medium font-poppins text-muted-foreground",
  input: "h-9 rounded-[10px] text-sm focus-visible:ring-[hsl(var(--chart-5))]/40",
} as const

/** Stat-tile top-line colours, in the order DashboardV2's QuickStatsBar uses them. */
export const V2_ACCENTS = [
  "bg-[hsl(var(--chart-1))]",
  "bg-[hsl(var(--chart-2))]",
  "bg-[hsl(var(--chart-3))]",
  "bg-emerald-500",
  "bg-destructive",
  "bg-[hsl(var(--chart-4))]",
] as const
