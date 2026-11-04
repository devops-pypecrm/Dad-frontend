import { useLeadStatuses } from "@/hooks/useLeadStatuses";

interface StatusCellProps {
  statusId: string;
}

export const StatusCell = ({ statusId }: StatusCellProps) => {
  const { getStatusDetails, isLoading } = useLeadStatuses();
  
  if (isLoading) {
    return <span className="text-xs text-muted-foreground">Loading…</span>;
  }

  const { label, color } = getStatusDetails(statusId);

  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      <span className="capitalize">{label}</span>
    </span>
  );
};
