import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Ban, Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatIST } from "@/lib/dateUtils"
import { getBlockedContacts, unblockContact } from "@/services/contactService"
import { isAdmin, getUserInfo } from "@/lib/utils"
import { V2 } from "@/lib/uiV2"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BlockedContactsDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient()
  const canUnblock = isAdmin(getUserInfo())

  const { data, isLoading } = useQuery({
    queryKey: ["contacts", "blocked"],
    queryFn: getBlockedContacts,
    enabled: open,
  })

  const unblock = useMutation({
    mutationFn: (id: string) => unblockContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] })
      queryClient.invalidateQueries({ queryKey: ["contact"] })
      queryClient.invalidateQueries({ queryKey: ["lead-contacts"] })
      toast.success("Number unblocked. New enquiries from it will reach the CRM again.")
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to unblock")
    },
  })

  const contacts = data?.contacts || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-[560px] ${V2.dialog}`}>
        <DialogHeader>
          <DialogTitle className={V2.dialogTitle}>
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-destructive/10 text-destructive">
              <Ban strokeWidth={1.5} className="h-5 w-5" />
            </span>
            Blocked list
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">{contacts.length}</span>
          </DialogTitle>
          <DialogDescription className="font-poppins text-sm">
            Leads and re-enquiries from these numbers never reach the CRM.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {isLoading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-[10px]" />)
          ) : contacts.length === 0 ? (
            <div className={V2.emptyState}>
              <ShieldCheck strokeWidth={1} className="mx-auto mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm font-poppins">No blocked numbers</p>
            </div>
          ) : (
            contacts.map((c) => {
              const numbers = Array.isArray(c.phones) ? c.phones.map((p) => p.number).filter(Boolean) : []
              const pending = unblock.isPending && unblock.variables === c.id
              return (
                <div key={c.id} className={V2.row}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium font-poppins">{c.firstName} {c.lastName}</p>
                    <p className="truncate text-xs text-muted-foreground tabular-nums">{numbers.join(", ") || "—"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {c.blockedAt ? `Blocked ${formatIST(c.blockedAt, "MMM d, yyyy")}` : ""}
                      {c.blockedReason ? ` · ${c.blockedReason}` : ""}
                    </p>
                  </div>
                  {canUnblock && (
                    <Button variant="outline" size="sm" className={`${V2.btnAccent} h-8 shrink-0`} disabled={pending} onClick={() => unblock.mutate(c.id)}>
                      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unblock"}
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
