import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Ban, Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatIST } from "@/lib/dateUtils"
import { getBlockedContacts, unblockContact } from "@/services/contactService"
import { isAdmin, getUserInfo } from "@/lib/utils"

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
      toast.success("Number unblocked. New enquiries from it will reach the CRM again.")
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to unblock")
    },
  })

  const contacts = data?.contacts || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] rounded-[1.5rem] border-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-extrabold tracking-tight">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Ban className="h-5 w-5" />
            </span>
            Blocked numbers
          </DialogTitle>
          <DialogDescription>
            Leads and re-enquiries from these numbers never reach the CRM.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {isLoading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-[1rem]" />)
          ) : contacts.length === 0 ? (
            <div className="rounded-[1.5rem] border-2 border-dashed bg-muted/20 py-10 text-center text-muted-foreground">
              <ShieldCheck className="mx-auto mb-2 h-8 w-8 opacity-30" />
              <p className="text-sm font-medium">No blocked numbers</p>
            </div>
          ) : (
            contacts.map((c) => {
              const numbers = Array.isArray(c.phones) ? c.phones.map((p) => p.number).filter(Boolean) : []
              return (
                <div key={c.id} className="flex items-center justify-between gap-3 rounded-[1rem] bg-muted/40 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{c.firstName} {c.lastName}</p>
                    <p className="truncate text-sm text-muted-foreground">{numbers.join(", ") || "—"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {c.blockedAt ? `Blocked ${formatIST(c.blockedAt, "MMM d, yyyy")}` : ""}
                      {c.blockedReason ? ` · ${c.blockedReason}` : ""}
                    </p>
                  </div>
                  {canUnblock && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 rounded-[0.8rem]"
                      disabled={unblock.isPending && unblock.variables === c.id}
                      onClick={() => unblock.mutate(c.id)}
                    >
                      {unblock.isPending && unblock.variables === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unblock"}
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
