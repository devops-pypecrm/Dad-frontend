import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { bulkLeadAction } from "@/services/leadService"
import { useLeadStatuses } from "@/hooks/useLeadStatuses"
import { toast } from "sonner"
import { Loader2, CheckCircle2, ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface BulkStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedLeads: string[]
  onSuccess: () => void
}

export function BulkStatusDialog({
  open,
  onOpenChange,
  selectedLeads,
  onSuccess,
}: BulkStatusDialogProps) {
  const { selectableStatuses, isLoading: loadingStatuses } = useLeadStatuses()
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [statusPickerOpen, setStatusPickerOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const selectedStatusObj = selectableStatuses.find((s) => s.id === selectedStatus)

  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      toast.error("Please select a status")
      return
    }

    setLoading(true)
    try {
      await bulkLeadAction("update-status", selectedLeads, { status: selectedStatus })
      toast.success(`Successfully updated status for ${selectedLeads.length} leads`)
      onSuccess()
      onOpenChange(false)
      setSelectedStatus("")
    } catch (error: any) {
      console.error("Bulk status update failed:", error)
      toast.error(error.message || "Failed to update lead statuses")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-[14px] font-poppins">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="h-8 w-8 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            Update Lead Status
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Change the status of {selectedLeads.length} selected lead{selectedLeads.length === 1 ? '' : 's'}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <label className="text-xs font-semibold text-foreground mb-1.5 block">
            New Status
          </label>
          <Popover open={statusPickerOpen} onOpenChange={setStatusPickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={loading || loadingStatuses}
                className="flex h-10 w-full items-center justify-between rounded-[10px] border border-border/60 bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted/40 transition-colors"
              >
                {selectedStatusObj ? (
                  <span className="flex items-center gap-2 truncate">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedStatusObj.color }} />
                    {selectedStatusObj.label}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {loadingStatuses ? "Loading statuses..." : "Select a new status"}
                  </span>
                )}
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              collisionPadding={16}
              className="w-[--radix-popover-trigger-width] p-1 rounded-[10px] shadow-2xl border-border/50"
            >
              <div className="max-h-64 overflow-y-auto">
                {selectableStatuses.map((status) => {
                  const checked = status.id === selectedStatus
                  return (
                    <button
                      key={status.id}
                      type="button"
                      onClick={() => { setSelectedStatus(status.id); setStatusPickerOpen(false) }}
                      className={cn(
                        "w-full flex items-center gap-2 rounded-[8px] px-2.5 py-2 text-sm text-left hover:bg-muted/60 transition-colors",
                        checked && "bg-muted"
                      )}
                    >
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
                      <span className="truncate flex-1">{status.label}</span>
                      {checked && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-[10px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateStatus}
            disabled={loading || !selectedStatus}
            className="bg-primary text-primary-foreground rounded-[10px]"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
