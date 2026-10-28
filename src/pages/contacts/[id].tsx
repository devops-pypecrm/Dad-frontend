import { useNavigate, useParams, Link } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeft, Mail, Phone, Building, Briefcase, Pencil, Ban, ShieldCheck, ArrowRight, Users, User, RefreshCw, Contact as ContactIcon,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { EditContactDialog } from "@/components/shared/EditContactDialog"
import { BlockContactDialog } from "@/components/shared/BlockContactDialog"
import TimelineFeed from "@/components/shared/TimelineFeed"
import { SectionHeading } from "@/components/dashboard-v2/SectionHeading"
import { blockContact, unblockContact, getContactLeads } from "@/services/contactService"
import { useLeadStatuses } from "@/hooks/useLeadStatuses"
import { formatIST } from "@/lib/dateUtils"
import { isAdmin, getUserInfo } from "@/lib/utils"
import { V2 } from "@/lib/uiV2"

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
  const errMsg = (e: unknown, fallback: string) =>
    (e as { response?: { data?: { message?: string } } }).response?.data?.message || fallback

  const blockMutation = useMutation({
    mutationFn: () => blockContact(id as string),
    onSuccess: () => {
      refresh()
      setIsBlockOpen(false)
      toast.success("Number blocked. Leads from it will no longer reach the CRM.")
    },
    onError: (e: unknown) => toast.error(errMsg(e, "Failed to block")),
  })

  const unblockMutation = useMutation({
    mutationFn: () => unblockContact(id as string),
    onSuccess: () => {
      refresh()
      toast.success("Number unblocked.")
    },
    onError: (e: unknown) => toast.error(errMsg(e, "Failed to unblock")),
  })

  if (id === "new") return <div className="p-8">Create Contact (Placeholder)</div>
  if (id === "undefined") return <div className="p-8">Invalid Contact ID</div>
  if (isLoading) {
    return (
      <div className={V2.page}>
        <Skeleton className="h-14 w-1/3 rounded-[10px]" />
        <Skeleton className="h-20 w-full rounded-[10px]" />
        <Skeleton className="h-64 w-full rounded-[10px]" />
      </div>
    )
  }
  if (!contact) return <div className="p-8">Contact not found</div>

  const phones: { number: string; type: string }[] = Array.isArray(contact.phones) ? contact.phones : []
  const fullName = `${contact.firstName} ${contact.lastName || ""}`.trim()
  const reEnquiries = leads.reduce((n, l) => n + (l.reEnquiryCount ?? 0), 0)

  const stats = [
    { label: "Leads", value: leads.length, accent: "bg-[hsl(var(--chart-1))]" },
    { label: "Re-enquiries", value: reEnquiries, accent: "bg-[hsl(var(--chart-2))]" },
    { label: "Numbers", value: phones.length, accent: "bg-[hsl(var(--chart-4))]" },
    { label: "Status", value: contact.isBlocked ? "Blocked" : "Active", accent: contact.isBlocked ? "bg-destructive" : "bg-emerald-500" },
  ]

  return (
    <div className={V2.page}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate("/contacts")} className="h-9 w-9 rounded-[10px] shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className={V2.headerIcon}>
            <ContactIcon strokeWidth={1.5} className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className={`${V2.h1} flex items-center gap-2.5 truncate`}>
              {fullName}
              {contact.isBlocked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                  <Ban className="h-3 w-3" /> Blocked
                </span>
              )}
            </h1>
            <p className={`${V2.subtitle} flex items-center gap-x-2 flex-wrap`}>
              {contact.jobTitle && (<><Briefcase className="h-3.5 w-3.5" /> {contact.jobTitle}<span>•</span></>)}
              <Building className="h-3.5 w-3.5" /> {contact.account?.name || "No Account"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className={V2.btnOutline} onClick={() => setIsEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          {canBlock && (contact.isBlocked ? (
            <Button className={V2.btnPrimary} onClick={() => unblockMutation.mutate()} disabled={unblockMutation.isPending}>
              <ShieldCheck className="h-3.5 w-3.5" /> Unblock
            </Button>
          ) : (
            <Button variant="outline" className={V2.btnDanger} onClick={() => setIsBlockOpen(true)}>
              <Ban className="h-3.5 w-3.5" /> Block
            </Button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className={V2.statBar}>
        <div className={`grid grid-cols-2 lg:grid-cols-4 ${V2.statGrid} [&>*:nth-child(n+3)]:border-t sm:[&>*:nth-child(n+3)]:border-t lg:[&>*:nth-child(n+3)]:border-t-0`}>
          {stats.map((tile) => (
            <div key={tile.label} className={V2.statTile}>
              <span className={`${V2.statLine} ${tile.accent}`} />
              <span className={V2.statLabel}>{tile.label}</span>
              <span className={V2.statValue}>{tile.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Details */}
        <div className="lg:col-span-1 space-y-5">
          <div className={V2.cardPad}>
            <h3 className={`${V2.cardTitle} mb-4`}>
              <User strokeWidth={1} className={V2.cardIcon} /> Contact Details
            </h3>
            <div className="space-y-3.5 text-sm">
              {phones.length === 0 && <p className="text-muted-foreground">No numbers saved.</p>}
              {phones.map((phone, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium tabular-nums">{phone.number} <span className="text-xs text-muted-foreground font-normal">({phone.type})</span></span>
                </div>
              ))}
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${contact.email}`} className="text-[hsl(var(--chart-5))] hover:underline break-all">{contact.email}</a>
                </div>
              )}
              {contact.owner && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Owner: <span className="font-medium">{contact.owner.firstName} {contact.owner.lastName}</span></span>
                </div>
              )}
              {contact.isBlocked && (
                <div className="rounded-[10px] border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                  Leads and re-enquiries from {phones.length > 1 ? "these numbers are" : "this number is"} being dropped.
                  {contact.blockedAt && <span className="block opacity-80 mt-1">Blocked {formatIST(contact.blockedAt, "MMM d, yyyy")}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Leads + timeline */}
        <div className="lg:col-span-2 space-y-5">
          <div className="space-y-3">
            <SectionHeading icon={<Users strokeWidth={1} className="h-5.5 w-5.5 text-[hsl(var(--chart-5))]" />}>
              Leads from this contact
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">{leads.length}</span>
            </SectionHeading>
            <div className="space-y-2">
              {leadsLoading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-[10px]" />)
              ) : leads.length === 0 ? (
                <div className={V2.emptyState}>
                  <Users strokeWidth={1} className="mx-auto h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm font-poppins">No leads have come in on this number yet.</p>
                </div>
              ) : (
                leads.map((lead) => {
                  const status = getStatusDetails(lead.status)
                  return (
                    <Link key={lead.id} to={`/leads/${lead.id}`} className={`group ${V2.row}`}>
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-medium font-poppins">{lead.firstName} {lead.lastName || ""}</span>
                          <span
                            className="inline-flex h-5 items-center rounded-full border px-2.5 text-[10px] font-semibold uppercase tracking-tight"
                            style={{ backgroundColor: `${status.color}15`, color: status.color, borderColor: `${status.color}30` }}
                          >
                            {status.label}
                          </span>
                          {(lead.reEnquiryCount ?? 0) > 0 && (
                            <span className="inline-flex h-5 items-center gap-1 rounded-full bg-orange-100 px-2.5 text-[10px] font-semibold text-orange-700">
                              <RefreshCw className="h-3 w-3" /> {lead.reEnquiryCount}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <span className="capitalize">{lead.source?.replace(/_/g, " ")}</span>
                          {" · "}{formatIST(lead.createdAt, "MMM d, yyyy")}
                          {lead.ownerFirstName ? ` · ${lead.ownerFirstName} ${lead.ownerLastName || ""}` : " · Unassigned"}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-[hsl(var(--chart-5))] transition-colors" />
                    </Link>
                  )
                })
              )}
            </div>
          </div>

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

      <BlockContactDialog
        open={isBlockOpen}
        onOpenChange={setIsBlockOpen}
        onConfirm={() => blockMutation.mutate()}
        name={fullName}
        multipleNumbers={phones.length > 1}
        isPending={blockMutation.isPending}
      />
    </div>
  )
}
