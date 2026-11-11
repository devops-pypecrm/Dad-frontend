import React from "react";
import { flexRender, type Row } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { type Lead } from "@/services/leadService";

interface LeadTableRowProps {
  row: Row<Lead>;
  onDragOver?: (e: React.DragEvent, rowId: string) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent, row: Row<Lead>) => void;
  dragOverRowId?: string | null;
  handleRowClick: (e: React.MouseEvent, row: Row<Lead>) => void;
  /** Passed in by the table on every render. Needed because `row.getIsSelected()` reads live table state, so the memo below could never see a change by comparing it on the old and new row. */
  isSelected?: boolean;
}

const LeadTableRowComponent = ({
  row,
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverRowId,
  handleRowClick,
  isSelected: isSelectedProp
}: LeadTableRowProps) => {
  const isSelected = isSelectedProp ?? row.getIsSelected();
  return (
    <div
      data-state={isSelected && "selected"}
      onDragOver={(e) => onDragOver?.(e, row.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop?.(e, row)}
      onClick={(e) => {
        // Don't toggle selection if clicking on interactive elements (checkbox, button, link)
        const target = e.target as HTMLElement;
        const isInteractive = target.closest('button, a, input, [role="checkbox"]');
        if (!isInteractive) {
          handleRowClick(e, row);
        }
      }}
      className={cn(
        "flex w-full border-b border-border/60 transition-colors hover:bg-muted/35 group shrink-0 cursor-pointer",
        isSelected && "bg-emerald-100 hover:bg-emerald-200/80 border-emerald-300 shadow-[inset_4px_0_0_0_#059669] dark:bg-emerald-500/25 dark:hover:bg-emerald-500/30 dark:border-emerald-500/40",
        dragOverRowId === row.id && "bg-accent border-primary"
      )}
    >
      {row.getVisibleCells().map((cell) => {
        const width = cell.column.getSize();
        return (
          <div 
            key={cell.id} 
            className="px-4 py-3 font-medium text-sm shrink-0 flex items-center overflow-hidden truncate"
            style={{ width: `${width}px` }}
          >
            {flexRender(
              cell.column.columnDef.cell,
              cell.getContext()
            )}
          </div>
        );
      })}
    </div>
  );
};

// Memoize to prevent re-renders unless the row's selection or data actually changes
export const LeadTableRow = React.memo(LeadTableRowComponent, (prev, next) => {
  return (
    prev.isSelected === next.isSelected &&
    prev.row.original === next.row.original &&
    prev.dragOverRowId === next.dragOverRowId
  );
});
