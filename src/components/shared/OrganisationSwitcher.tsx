import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Building2, Check, Plus, ChevronsUpDown } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { saveAndroidToken } from "@/utils/androidBridge"

interface MyOrg { organisationId: string; name: string; status: string; isCurrent: boolean }
interface MyOrgsResponse { enabled: boolean; canCreate: boolean; organisations: MyOrg[] }

/**
 * Header switcher for admins with the "Multiple Organisations" feature. Renders nothing for
 * everyone else, so accounts without the feature see no change at all.
 */
export function OrganisationSwitcher() {
  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)

  const { data } = useQuery<MyOrgsResponse>({
    queryKey: ["multi-org"],
    queryFn: async () => (await api.get("/multi-org")).data,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  if (!data || !data.enabled) return null
  const current = data.organisations.find(o => o.isCurrent)

  const switchTo = async (organisationId: string) => {
    setBusy(true)
    try {
      const res = await api.post("/multi-org/switch", { organisationId })
      const info = { ...res.data }
      if (info.profileImage?.includes("null")) info.profileImage = null
      localStorage.setItem("userInfo", JSON.stringify(info))
      saveAndroidToken(info.token)
      queryClient.clear()
      // Full reload so sockets, caches and every context start clean in the new organisation.
      window.location.assign("/dashboard")
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || "Could not switch organisation")
      setBusy(false)
    }
  }

  const createOrg = async () => {
    setBusy(true)
    try {
      const res = await api.post("/multi-org", { name })
      toast.success("Organisation created")
      setCreating(false)
      setName("")
      await queryClient.invalidateQueries({ queryKey: ["multi-org"] })
      await switchTo(res.data.id)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg || "Could not create organisation")
      setBusy(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2 max-w-[200px]" disabled={busy}>
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate hidden sm:inline">{current?.name || "Organisation"}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Your organisations</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {data.organisations.map(o => (
            <DropdownMenuItem key={o.organisationId} disabled={o.isCurrent || busy} onClick={() => switchTo(o.organisationId)}>
              <span className="truncate flex-1">{o.name}</span>
              {o.isCurrent && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
          {data.canCreate && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4 mr-2" /> New organisation
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New organisation</DialogTitle>
            <DialogDescription>
              Creates a separate organisation with its own leads, branches and users. It is not connected to this one and copies this organisation&apos;s plan and user limit. You become its admin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Organisation name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Acme Education" maxLength={120} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)} disabled={busy}>Cancel</Button>
            <Button onClick={createOrg} disabled={busy || name.trim().length < 2}>{busy ? "Creating..." : "Create & switch"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
