import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import * as XLSX from "xlsx"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { getContacts, getBlockedContacts, type Contact } from "@/services/contactService"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useEntityTotalCount } from "@/hooks/useEntityTotalCount"
import { CreateContactDialog } from "@/components/shared/CreateContactDialog"
import { BlockedContactsDialog } from "@/components/shared/BlockedContactsDialog"
import { FILTER_CARD_CLASS, FILTER_ICON_CLASS, FILTER_LABEL_CLASS, FILTER_TRIGGER_CLASS } from "@/pages/leads/filterStyles"
import { formatIST } from "@/lib/dateUtils"
import { useNavigate } from "react-router-dom"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Plus,
  Download,
  Search,
  Filter,
  X,
  Contact as ContactIcon,
  Building2,
  ArrowRight,
  Ban,
  Phone,
  Users,
} from "lucide-react"

type AccountFilter = "all" | "linked" | "unlinked"

export default function ContactsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState("")
  const [accountFilter, setAccountFilter] = useState<AccountFilter>("all")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isBlockedOpen, setIsBlockedOpen] = useState(false)

  const { data: blockedData } = useQuery({
    queryKey: ['contacts', 'blocked'],
    queryFn: getBlockedContacts,
  })
  const blockedCount = blockedData?.contacts?.length ?? 0

  const { data, isLoading, isError } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => getContacts(),
    refetchInterval: 5000,
  })

  const contacts: Contact[] = useMemo(
    () => (data?.contacts || []).filter((c: unknown) => c && typeof c === 'object'),
    [data]
  )
  const contactsTotalCount = useEntityTotalCount('contacts', '/contacts')

  const hasActiveFilters = !!searchTerm || accountFilter !== "all"

  const clearFilters = () => {
    setSearchTerm("")
    setAccountFilter("all")
  }

  const filteredContacts = useMemo(() => {
    const searchLower = searchTerm.toLowerCase()
    return contacts.filter(contact => {
      if (accountFilter === "linked" && !contact.account) return false
      if (accountFilter === "unlinked" && contact.account) return false
      if (!searchTerm) return true
      const phoneMatch = (contact.phones || []).some(p => p.number?.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, '')) && searchTerm.replace(/\D/g, '').length > 0)
      return (
        contact.firstName?.toLowerCase().includes(searchLower) ||
        contact.lastName?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.jobTitle?.toLowerCase().includes(searchLower) ||
        phoneMatch
      )
    })
  }, [contacts, searchTerm, accountFilter])

  const linkedCount = contacts.filter(c => !!c.account).length
  const unassignedCount = contacts.filter(c => !c.owner).length

  const stats = [
    { label: "Total Contacts", value: contacts.length, icon: Users, tile: "bg-primary/10 text-primary", glow: "from-primary/5" },
    { label: "Linked to Account", value: linkedCount, icon: Building2, tile: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400", glow: "from-indigo-500/5" },
    { label: "Unassigned", value: unassignedCount, icon: ContactIcon, tile: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400", glow: "from-amber-500/5" },
    { label: "Blocked", value: blockedCount, icon: Ban, tile: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400", glow: "from-red-500/5" },
  ]

  const handleExcelDownload = () => {
    if (filteredContacts.length === 0) return

    const excelData = filteredContacts.map((contact) => ({
      'Name': `${contact.firstName} ${contact.lastName || ''}`.trim(),
      'Email': contact.email || '',
      'Phone': (contact.phones || []).map(p => p.number).join(', '),
      'Job Title': contact.jobTitle || '',
      'Department': contact.department || '',
      'Account': contact.account?.name || '',
      'Owner': contact.owner ? `${contact.owner.firstName} ${contact.owner.lastName}` : '',
      'Created At': contact.createdAt ? formatIST(contact.createdAt, 'yyyy-MM-dd HH:mm:ss') : '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts')
    XLSX.writeFile(workbook, `contacts_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center flex-1">
        <div className="text-red-500 mb-4">Error loading contacts. Please try again.</div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 pt-3 sm:p-8 animate-in fade-in duration-500 pb-20 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            Contacts
            <span className="bg-muted text-muted-foreground px-3 py-0.5 rounded-full text-sm font-bold">
              {contacts.length.toLocaleString()}
            </span>
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs sm:text-base opacity-80">
            Save numbers, see every lead that came from them, and block the ones you never want.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setIsBlockedOpen(true)}
            variant="outline"
            className="h-10 rounded-[0.8rem] gap-2 text-xs sm:text-sm font-medium"
          >
            <Ban className="h-4 w-4" />
            <span>Blocked list{blockedCount > 0 ? ` (${blockedCount})` : ""}</span>
          </Button>
          <Button
            onClick={handleExcelDownload}
            disabled={filteredContacts.length === 0}
            variant="outline"
            className="h-10 rounded-[0.8rem] gap-2 text-xs sm:text-sm font-medium"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="h-10 rounded-[0.8rem] gap-2 px-4 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((tile) => (
          <div key={tile.label} className="relative overflow-hidden rounded-[0.8rem] md:rounded-[2rem] bg-card p-4 sm:p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 group">
            <div className={`absolute inset-0 bg-gradient-to-br ${tile.glow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
            <div className="relative flex flex-col items-center justify-center space-y-2 sm:space-y-3">
              <div className={`flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl ${tile.tile} group-hover:scale-110 transition-transform`}>
                <tile.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-[9px] sm:text-sm font-bold text-muted-foreground text-center uppercase tracking-tight sm:normal-case sm:tracking-normal">{tile.label}</h3>
              <div className="text-xl sm:text-2xl font-extrabold text-card-foreground">{tile.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        <div className={FILTER_CARD_CLASS}>
          <Search className={FILTER_ICON_CLASS} />
          <div className="min-w-0 flex-1">
            <label className={FILTER_LABEL_CLASS}>Search</label>
            <input
              placeholder="Name, number, email, title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-0 p-0 text-sm font-bold outline-none placeholder:font-normal placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className={FILTER_CARD_CLASS}>
          <Filter className={FILTER_ICON_CLASS} />
          <div className="min-w-0 flex-1">
            <label className={FILTER_LABEL_CLASS}>Account</label>
            <Select value={accountFilter} onValueChange={(v) => setAccountFilter(v as AccountFilter)}>
              <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl border-border/50">
                <SelectItem value="all" className="rounded-lg">All Contacts</SelectItem>
                <SelectItem value="linked" className="rounded-lg">Linked to Account</SelectItem>
                <SelectItem value="unlinked" className="rounded-lg">No Account</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-3 -mt-1">
          <Button variant="ghost" onClick={clearFilters} className="h-8 px-3 text-xs text-destructive hover:bg-destructive/10 rounded-[10px] font-bold gap-1.5">
            <X className="h-3.5 w-3.5" />
            Reset Filters
          </Button>
          <span className="text-xs text-muted-foreground">
            Showing {filteredContacts.length} of {contacts.length} contacts
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-[0.8rem] md:rounded-[2rem] bg-card shadow-sm">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
            <ContactIcon className="h-6 w-6" />
          </div>
          <p className="font-semibold text-lg text-foreground">
            {hasActiveFilters ? "No matching contacts" : "No contacts yet"}
          </p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
            {hasActiveFilters ? "Try adjusting your search or filters." : "Add your first contact to get started."}
          </p>
          {hasActiveFilters ? (
            <Button variant="ghost" onClick={clearFilters} className="mt-4 h-8 px-3 text-xs rounded-[0.8rem] font-bold text-primary hover:bg-primary/10">
              Clear filters
            </Button>
          ) : (
            <Button onClick={() => setIsCreateOpen(true)} className="mt-4 h-10 rounded-[0.8rem] gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-3.5 w-3.5" />
              Add Contact
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="flex flex-col gap-2.5 lg:hidden">
            {filteredContacts.map((contact) => (
              <Card
                key={contact.id}
                onClick={() => navigate(`/contacts/${contact.id}`)}
                className="cursor-pointer rounded-[1rem] border-0 shadow-sm active:scale-[0.99] transition-all hover:shadow-md"
              >
                <CardContent className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-foreground truncate">{contact.firstName} {contact.lastName}</h4>
                      <p className="text-xs text-muted-foreground truncate">{contact.jobTitle || 'No title'}</p>
                    </div>
                    {contact.account && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Building2 className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[100px]">{contact.account.name}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {contact.phones?.[0]?.number && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{contact.phones[0].number}</span>}
                    {contact.email && <span className="truncate">{contact.email}</span>}
                    {contact.owner && (
                      <span>Owner: <span className="text-foreground/70 font-medium">{contact.owner.firstName} {contact.owner.lastName}</span></span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      {contact.createdAt ? formatIST(contact.createdAt, 'MMM d, yyyy') : ''}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block rounded-[2rem] border-0 shadow-sm bg-card text-card-foreground overflow-hidden">
            <DataTable columns={columns} data={filteredContacts} searchKeys={["firstName", "lastName", "email", "jobTitle"]} resultsLabel="contacts" totalCount={contactsTotalCount} />
          </div>
        </>
      )}

      <BlockedContactsDialog open={isBlockedOpen} onOpenChange={setIsBlockedOpen} />

      <CreateContactDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={(contactId) => {
          queryClient.invalidateQueries({ queryKey: ['contacts'] })
          navigate(`/contacts/${contactId}`)
        }}
      />
    </div>
  )
}
