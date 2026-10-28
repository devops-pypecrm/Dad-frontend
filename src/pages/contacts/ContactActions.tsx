import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteContact, blockContact, type Contact } from "@/services/contactService"
import { toast } from "sonner"
import { Trash2, MoreHorizontal, Ban } from "lucide-react"
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog"
import { BlockContactDialog } from "@/components/shared/BlockContactDialog"
import { EditContactDialog } from "@/components/shared/EditContactDialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { copyToClipboard, isAdmin, getUserInfo } from "@/lib/utils";

export function ContactActions({ contact }: { contact: Contact }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const queryClient = useQueryClient()

  const user = getUserInfo();
  const canDelete = isAdmin(user);

  const deleteMutation = useMutation({
    mutationFn: () => deleteContact(contact.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] })
      toast.success("Contact deleted successfully")
      setShowDeleteDialog(false)
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to delete contact")
    },
  })

  const blockMutation = useMutation({
    mutationFn: () => blockContact(contact.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] })
      toast.success("Number blocked. Leads from it will no longer reach the CRM.")
      setShowBlockDialog(false)
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to block contact")
    },
  })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => copyToClipboard(contact.id)}>
            Copy ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => window.location.href = `/contacts/${contact.id}`}>View Details</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>Edit Contact</DropdownMenuItem>
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowBlockDialog(true)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Ban className="mr-2 h-4 w-4" />
                Block Number
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Contact
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Contact"
        description={`Are you sure you want to delete ${contact.firstName} ${contact.lastName}? This action cannot be undone.`}
        confirmText="Delete Contact"
        isDeleting={deleteMutation.isPending}
      />

      <BlockContactDialog
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        onConfirm={() => blockMutation.mutate()}
        name={`${contact.firstName} ${contact.lastName || ''}`.trim()}
        multipleNumbers={(contact.phones?.length ?? 0) > 1}
        isPending={blockMutation.isPending}
      />

      <EditContactDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        contact={{ ...contact, email: contact.email || '' }}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["contacts"] })}
      />
    </>
  )
}
