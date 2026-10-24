import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn, formatRoleName } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getUsers } from "@/services/userService"
import { bulkLeadAction } from "@/services/leadService"
import { toast } from "sonner"
import { Loader2, Users, Search, Check, ChevronsUpDown } from "lucide-react"

interface BulkAssignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedLeads: string[]
  onSuccess: () => void
}

export function BulkAssignDialog({
  open,
  onOpenChange,
  selectedLeads,
  onSuccess,
}: BulkAssignDialogProps) {
  const [users, setUsers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetchingUsers, setFetchingUsers] = useState(false)
  const [openPopover, setOpenPopover] = useState(false)

  useEffect(() => {
    if (open) {
      fetchUsers()
      setSearchTerm("")
    }
  }, [open])

  const fetchUsers = async () => {
    setFetchingUsers(true)
    try {
      const data = await getUsers()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Failed to fetch users:", error)
      toast.error("Failed to load users list")
    } finally {
      setFetchingUsers(false)
    }
  }

  const filteredUsers = users.filter(user => {
    if (user.isActive === false) return false;
    const name = `${user.firstName} ${user.lastName}`.toLowerCase()
    const email = (user.email || '').toLowerCase()
    const search = searchTerm.toLowerCase()
    return name.includes(search) || email.includes(search)
  })

  const handleAssign = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user")
      return
    }

    setLoading(true)
    try {
      await bulkLeadAction("assign", selectedLeads, { assignedToId: selectedUserId })
      toast.success(`Successfully assigned ${selectedLeads.length} leads`)
      onSuccess()
      onOpenChange(false)
      setSelectedUserId("")
    } catch (error: any) {
      console.error("Bulk assignment failed:", error)
      toast.error(error.message || "Failed to assign leads")
    } finally {
      setLoading(false)
    }
  }

  const selectedUser = users.find(u => u.id === selectedUserId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-[14px] font-poppins">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="h-8 w-8 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="h-4 w-4" />
            </div>
            Bulk Assign Leads
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Reassign {selectedLeads.length} selected lead{selectedLeads.length === 1 ? '' : 's'} to a specific team member.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <label className="text-xs font-semibold text-foreground mb-1.5 block">
            Select User
          </label>

          <Popover open={openPopover} onOpenChange={setOpenPopover}>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={fetchingUsers || loading}
                className="flex h-10 w-full items-center justify-between rounded-[10px] border border-border/60 bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted/40 transition-colors"
              >
                {selectedUser ? (
                  <span className="flex items-center gap-2 truncate">
                    <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                      {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0] || ''}
                    </span>
                    {selectedUser.firstName} {selectedUser.lastName}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Select a team member...</span>
                )}
                <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[--radix-popover-trigger-width] rounded-[10px] shadow-2xl border-border/50" align="start" collisionPadding={16}>
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-sm"
                    autoFocus
                  />
                </div>
              </div>
              <ScrollArea className="h-64">
                <div className="p-1">
                  {filteredUsers.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No users found.
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setSelectedUserId(user.id)
                          setOpenPopover(false)
                        }}
                        className={cn(
                          "flex w-full items-center justify-between px-2 py-2 text-sm rounded-[8px] hover:bg-muted/60 text-left transition-colors",
                          selectedUserId === user.id ? "bg-muted" : ""
                        )}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                            {user.firstName?.[0]}{user.lastName?.[0] || ''}
                          </span>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate">{user.firstName} {user.lastName}</span>
                            <span className="text-[10px] text-muted-foreground truncate">
                              {user.email} • {formatRoleName(user.role)}
                            </span>
                          </div>
                        </div>
                        {selectedUserId === user.id && (
                          <Check className="h-4 w-4 text-primary ml-2 shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
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
            onClick={handleAssign}
            disabled={loading || !selectedUserId}
            className="bg-primary text-primary-foreground rounded-[10px]"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Leads
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
