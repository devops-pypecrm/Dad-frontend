import { useNavigate, useParams, Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Mail, Phone, Building, Briefcase, Pencil, Ban, ShieldCheck, ChevronRight, Users, User, RefreshCw } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { EditContactDialog } from "@/components/shared/EditContactDialog"
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog"
import TimelineFeed from "@/components/shared/TimelineFeed"
import { blockContact, unblockContact, getContactLeads } from "@/services/contactService"
import { useLeadStatuses } from "@/hooks/useLeadStatuses"
import { formatIST } from "@/lib/dateUtils"
import { isAdmin, getUserInfo } from "@/lib/utils"

const CARD = "rounded-[0.8rem] md:rounded-[2rem] border-0 shadow-sm bg-card"
const SECTION_TITLE = "text-base font-extrabold tracking-tight flex items-center gap-2"
const ICON_TILE = "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"

export default function ContactDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isBlockOpen, setIsBlockOpen] = useState(false)
  const { getStatusDetails } = useLeadStatuses()
  const canBlock = isAdmin(getUserInfo())
  const validId = !!id && id !== "new" && id !== "undefined"

  const { data: contact, isLoading } = useQuery({
    queryKey: ["contact", id],
    queryFn: async () => (await api.get(`/contacts/${id}`)).data,
    enabled: validId,
  })

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ["contact-leads", id],
    queryFn: () => getContactLeads(id as string),
    enabled: validId,
  })
  const leads = leadsData?.leads || []

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["contact", id] })
    queryClient.invalidateQueries({ queryKey: ["contacts"] })
    queryClient.invalidateQueries({ queryKey: ["lead-contacts"] })
  }

  const blockMutation = useMutation({
    mutationFn: () => blockContact(id as string),
    onSuccess: () => {
      refresh()
      setIsBlockOpen(false)
      toast.success("Number blocked. Leads from it will no longer reach the CRM.")
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to block"),
  })

  const unblockMutation = useMutation({
    mutationFn: () => unblockContact(id as string),
    onSuccess: () => {
      refresh()
      toast.success("Number unblocked.")
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to unblock"),
  })

  if (id === "new") return <div className="p-8">Create Contact (Placeholder)</div>
  if (id === "undefined") return <div className="p-8">Invalid Contact ID</div>
  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 space-y-4">
        <Skeleton className="h-28 w-full rounded-[2rem]" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-72 rounded-[2rem]" />
          <Skeleton className="h-72 md:col-span-2 rounded-[2rem]" />
        </div>
      </div>
    )
  }
  if (!contact) return <div className="p-8">Contact not found</div>

  const phones: { number: string; type: string }[] = Array.isArray(contact.phones) ? contact.phones : []
  const fullName = `${contact.firstName} ${contact.lastName || ""}`.trim()

  return (
    <div className="space-y-4 sm:space-y-6 pt-3 sm:p-8 animate-in fade-in duration-500 pb-20 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-[0.8rem] md:rounded-[2rem] bg-card p-4 sm:p-6 shadow-sm">
        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate("/contacts")} className="h-10 w-10 shrink-0 rounded-[0.8rem]">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary text-xl font-extrabold">
            {(contact.firstName?.[0] || "?").toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight truncate">{fullName}</h1>
              {contact.isBlocked && (
                <Badge variant="destructive" className="h-6 gap-1 rounded-full px-3 text-xs font-bold">
                  <Ban className="h-3 w-3" /> Blocked
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-muted-foreground mt-1">
              {contact.jobTitle && (<><Briefcase className="h-4 w-4" /> {contact.jobTitle}<span className="mx-1">•</span></>)}
              <Building className="h-4 w-4" /> {contact.account?.name || "No Account"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" className="h-10 rounded-[0.8rem] gap-2" onClick={() => setIsEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          {canBlock && (contact.isBlocked ? (
            <Button
              className="h-10 rounded-[0.8rem] gap-2 bg-success text-success-foreground hover:bg-success/90 shadow-lg shadow-success/20"
              onClick={() => unblockMutation.mutate()}
              disabled={unblockMutation.isPending}
            >
              <ShieldCheck className="h-4 w-4" /> Unblock
            </Button>
          ) : (
            <Button
              variant="outline"
              className="h-10 rounded-[0.8rem] gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setIsBlockOpen(true)}
            >
              <Ban className="h-4 w-4" /> Block
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left: details */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <Card className={CARD}>
            <CardHeader>
              <CardTitle className={SECTION_TITLE}><span className={ICON_TILE}><User className="h-4 w-4" /></span>Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {phones.length === 0 && <p className="text-sm text-muted-foreground">No numbers saved.</p>}
              {phones.map((phone, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{phone.number} <span className="text-xs text-muted-foreground font-normal">({phone.type})</span></span>
                </div>
              ))}
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${contact.email}`} className="text-primary hover:underline break-all">{contact.email}</a>
                </div>
              )}
              {contact.owner && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Owner: <span className="font-medium">{contact.owner.firstName} {contact.owner.lastName}</span></span>
                </div>
              )}
              {contact.isBlocked && (
                <div className="rounded-[1rem] bg-destructive/10 p-3 text-sm text-destructive">
                  Leads and re-enquiries from {phones.length > 1 ? "these numbers are" : "this number is"} being dropped.
                  {contact.blockedAt && <span className="block text-xs opacity-80 mt-1">Blocked {formatIST(contact.blockedAt, "MMM d, yyyy")}</span>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: leads + timeline */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card className={CARD}>
            <CardHeader>
              <CardTitle className={`${SECTION_TITLE} justify-between`}>
                <span className="flex items-center gap-2">
                  <span className={ICON_TILE}><Users className="h-4 w-4" /></span>
                  Leads from this contact
                </span>
                <span className="rounded-full bg-muted px-3 py-0.5 text-sm font-bold text-muted-foreground">{leads.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {leadsLoading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-[1rem]" />)
              ) : leads.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-[1.5rem] border-2 border-dashed">
                  <Users className="mx-auto h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm">No leads have come in on this number yet.</p>
                </div>
              ) : (
                leads.map((lead) => {
                  const status = getStatusDetails(lead.status)
                  return (
                    <Link
                      key={lead.id}
                      to={`/leads/${lead.id}`}
                      className="flex items-center justify-between gap-3 rounded-[1rem] bg-muted/40 px-4 py-3 transition-all hover:bg-primary/10 hover:-translate-y-0.5"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-bold">{lead.firstName} {lead.lastName || ""}</span>
                          <Badge
                            variant="outline"
                            className="h-5 rounded-full px-2.5 text-[10px] font-bold uppercase tracking-tight"
                            style={{ backgroundColor: `${status.color}15`, color: status.color, borderColor: `${status.color}30` }}
                          >
                            {status.label}
                          </Badge>
                          {(lead.reEnquiryCount ?? 0) > 0 && (
                            <Badge variant="secondary" className="h-5 gap-1 rounded-full px-2.5 text-[10px] font-bold bg-orange-100 text-orange-700 hover:bg-orange-100">
                              <RefreshCw className="h-3 w-3" /> {lead.reEnquiryCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <span className="capitalize">{lead.source?.replace(/_/g, " ")}</span>
                          {" · "}{formatIST(lead.createdAt, "MMM d, yyyy")}
                          {lead.ownerFirstName ? ` · ${lead.ownerFirstName} ${lead.ownerLastName || ""}` : " · Unassigned"}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  )
                })
              )}
            </CardContent>
          </Card>

          {validId && id && <TimelineFeed type="contact" id={id} />}
        </div>
      </div>

      <EditContactDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        contact={contact}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["contact", id] })
          queryClient.invalidateQueries({ queryKey: ["contact-leads", id] })
        }}
      />

      <DeleteConfirmationDialog
        open={isBlockOpen}
        onOpenChange={setIsBlockOpen}
        onConfirm={() => blockMutation.mutate()}
        title="Block Number"
        description={`Block ${fullName}? New leads and re-enquiries from ${phones.length > 1 ? "these numbers" : "this number"} will be dropped and will not reach the CRM. You can unblock it later from the Blocked list.`}
        confirmText="Block Number"
        isDeleting={blockMutation.isPending}
      />
    </div>
  )
}
