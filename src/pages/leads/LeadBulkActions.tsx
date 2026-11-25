import { useState } from "react"
import { toast } from "sonner"
import { BulkActionsToolbar } from "@/components/shared/BulkActionsToolbar"
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog"
import { BulkAssignDialog } from "./BulkAssignDialog"
import { BulkStatusDialog } from "./BulkStatusDialog"
import { BulkScheduleFollowUpDialog } from "./BulkScheduleFollowUpDialog"
import { BulkSendEmailDialog } from "./BulkSendEmailDialog"
import { bulkLeadAction } from "@/services/leadService"
import { isOrgAdmin as checkIsOrgAdmin, isManager } from "@/lib/utils"

interface Props {
  /** Ids of the selected leads (keys of the table's rowSelection). */
  selectedIds: string[]
  onClearSelection: () => void
  /** Re-fetch the list after a bulk change. */
  onRefresh: () => void
  /** Export (same behaviour as the main Leads page). */
  onExport: () => void
}

/**
 * The floating bulk-action bar and its dialogs, identical to the main Leads page, for the
 * Unattended / No Activity lists (which share LeadListPage). Admins and managers only.
 */
export function LeadBulkActions({ selectedIds, onClearSelection, onRefresh, onExport }: Props) {
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}")
  const isOrgAdmin = checkIsOrgAdmin(userInfo)
  const isAdminOrManager = isOrgAdmin || isManager(userInfo)

  const [assignOpen, setAssignOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  if (!isAdminOrManager || selectedIds.length === 0) return null

  const done = () => { onClearSelection(); onRefresh() }

  const handleAction = (action: string) => {
    switch (action) {
      case "update-status": setStatusOpen(true); break
      case "assign": setAssignOpen(true); break
      case "delete": setDeleteOpen(true); break
      case "export": onExport(); break
      case "schedule-followup": setFollowUpOpen(true); break
      case "send-email": setEmailOpen(true); break
      default: console.warn(`Action ${action} not implemented for leads`)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await bulkLeadAction("delete", selectedIds)
      toast.success(`${selectedIds.length} leads deleted successfully`)
      done()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete leads")
    } finally {
      setIsDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 w-full max-w-2xl px-4">
        <BulkActionsToolbar
          selectedItems={selectedIds}
          entityType="leads"
          onClearSelection={onClearSelection}
          onBulkAction={handleAction}
          className="shadow-2xl !mb-0 bg-primary text-primary-foreground border-primary/20"
        />
      </div>

      <BulkAssignDialog open={assignOpen} onOpenChange={setAssignOpen} selectedLeads={selectedIds} onSuccess={done} />
      <BulkStatusDialog open={statusOpen} onOpenChange={setStatusOpen} selectedLeads={selectedIds} onSuccess={done} />
      <BulkScheduleFollowUpDialog open={followUpOpen} onOpenChange={setFollowUpOpen} selectedLeads={selectedIds} onSuccess={done} />
      <BulkSendEmailDialog open={emailOpen} onOpenChange={setEmailOpen} selectedLeads={selectedIds} onSuccess={onClearSelection} />
      <DeleteConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title={`Delete ${selectedIds.length} Leads`}
        description="Are you sure you want to delete these leads? This action cannot be undone."
        isDeleting={isDeleting}
      />
    </>
  )
}
