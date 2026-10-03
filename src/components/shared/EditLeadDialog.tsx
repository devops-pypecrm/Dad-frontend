import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { updateLead, type Lead } from "@/services/leadService"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useLeadStatuses } from "@/hooks/useLeadStatuses"
import { identifyCountryFromPhone, splitLeadPhone, uniquePrefixes } from "@/lib/countryCodes"

interface EditLeadFormData {
  firstName: string
  lastName?: string
  email: string
  phone: string
  phoneCountryCode: string
  secondaryPhone?: string
  company: string
  enquiryAbout: string
  status: string
}

interface EditLeadDialogProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  lead: Lead
}

// Shows the number as picker + local digits, whichever way the lead was stored
const phoneDefaults = (lead: Lead) => {
  const { prefix, local } = splitLeadPhone(lead.phone, lead.phoneCountryCode)
  return { phone: local, phoneCountryCode: prefix }
}

export function EditLeadDialog({ children, open, onOpenChange, lead }: EditLeadDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined

  const finalOpen = isControlled ? open : internalOpen
  const finalOnOpenChange = isControlled ? onOpenChange : setInternalOpen

  const { statuses, selectableStatuses } = useLeadStatuses()
  const queryClient = useQueryClient()

  const form = useForm<EditLeadFormData>({
    defaultValues: {
      firstName: lead.firstName || "",
      lastName: lead.lastName || "",
      email: lead.email || "",
      ...phoneDefaults(lead),
      secondaryPhone: lead.secondaryPhone || "",
      company: lead.company || "",
      enquiryAbout: lead.enquiryAbout || "",
      status: lead.status || "new",
    },
  })

  // Update form values if lead prop changes
  useEffect(() => {
    if (lead) {
      form.reset({
        firstName: lead.firstName || "",
        lastName: lead.lastName || "",
        email: lead.email || "",
        ...phoneDefaults(lead),
        secondaryPhone: lead.secondaryPhone || "",
        company: lead.company || "",
        enquiryAbout: lead.enquiryAbout || "",
        status: lead.status || "new",
      })
    }
  }, [lead, form])

  const mutation = useMutation({
    mutationFn: (data: EditLeadFormData) => updateLead(lead.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead", lead.id] })
      queryClient.invalidateQueries({ queryKey: ["leads"] })
      toast.success("Lead updated successfully")
      finalOnOpenChange?.(false)
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to update lead")
    },
  })

  function onSubmit(values: EditLeadFormData) {
    mutation.mutate(values)
  }

  return (
    <Dialog open={finalOpen} onOpenChange={finalOnOpenChange}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[460px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
          <DialogDescription>
            Update lead details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                rules={{ required: "First name is required", minLength: { value: 2, message: "Min 2 chars" } }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name <span className="text-muted-foreground text-[10px] font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              rules={{
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-[96px_1fr] gap-2">
              <FormField
                control={form.control}
                name="phoneCountryCode"
                render={({ field }) => {
                  // keep a lead's own code selectable even if it is not in the standard list
                  const options = uniquePrefixes.some(c => c.prefix === field.value)
                    ? uniquePrefixes
                    : [{ name: 'Other', code: 'XX', prefix: field.value, flag: '🌐' }, ...uniquePrefixes]
                  return (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="px-2">
                            <SelectValue>{field.value}</SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {options.map((c) => (
                            <SelectItem key={c.prefix} value={c.prefix}>
                              <span className="flex items-center gap-2">
                                <span>{c.flag}</span>
                                <span className="font-mono">{c.prefix}</span>
                                <span className="text-muted-foreground text-[10px] truncate max-w-[80px]">{c.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )
                }}
              />
              <FormField
                control={form.control}
                name="phone"
                rules={{
                  required: "Phone number is required",
                  validate: (v) => v.replace(/\D/g, '').length >= 5 || "Too short",
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        placeholder="9876543210"
                        {...field}
                        onChange={(e) => {
                          const raw = e.target.value
                          // A pasted "+971..." number picks its own country code
                          if (raw.trim().startsWith('+')) {
                            const found = identifyCountryFromPhone(raw)
                            if (found) {
                              form.setValue('phoneCountryCode', found.country.prefix, { shouldDirty: true })
                              field.onChange(found.localNumber)
                              return
                            }
                          }
                          field.onChange(raw.replace(/\D/g, ''))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="secondaryPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary Phone <span className="text-muted-foreground text-[10px] font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+1234567890"
                      {...field}
                      onChange={(e) => {
                        let value = e.target.value.replace(/[^0-9+\s-]/g, '');
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="enquiryAbout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enquiry About <span className="text-muted-foreground text-xs font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Course, Integration..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value)} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectableStatuses.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: status.color }}
                            />
                            {status.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
