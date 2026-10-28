import { Ban, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { V2 } from "@/lib/uiV2"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  name: string
  multipleNumbers?: boolean
  isPending?: boolean
}

/** Confirmation before blocking a contact's number(s). */
export function BlockContactDialog({ open, onOpenChange, onConfirm, name, multipleNumbers, isPending }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-[440px] ${V2.dialog}`}>
        <DialogHeader>
          <DialogTitle className={V2.dialogTitle}>
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-destructive/10 text-destructive">
              <Ban strokeWidth={1.5} className="h-5 w-5" />
            </span>
            Block number
          </DialogTitle>
          <DialogDescription className="font-poppins text-sm">
            Block <span className="font-medium text-foreground">{name}</span>? New leads and re-enquiries from{" "}
            {multipleNumbers ? "these numbers" : "this number"} will be dropped and will not reach the CRM. You can
            unblock it any time from the Blocked list.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" className={V2.btnOutline} onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Block number
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
