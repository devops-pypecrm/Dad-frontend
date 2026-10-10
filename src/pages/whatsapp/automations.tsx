import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Bot, Edit2, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { WhatsAppPage } from "@/components/WhatsApp/hub/WhatsAppPage"
import { WhatsAppStatsBar } from "@/components/WhatsApp/hub/WhatsAppStatsBar"
import { WhatsAppSection } from "@/components/WhatsApp/hub/WhatsAppSection"
import { StatusPill } from "@/components/WhatsApp/hub/StatusPill"
import { EmptyState } from "@/components/WhatsApp/hub/EmptyRow"
import { WA_PRIMARY_BTN } from "@/components/WhatsApp/hub/whatsappStyles"
import { getWorkflows, deleteWorkflow, type Workflow } from "@/services/workflowService"
import { whatsAppAccountService } from "@/services/whatsAppAccountService"
import { WhatsAppAutomationDialog } from "@/components/WhatsApp/WhatsAppAutomationDialog"

export default function WhatsAppAutomationsPage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [automationToEdit, setAutomationToEdit] = useState<Workflow | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["whatsapp-automations"],
    queryFn: () => getWorkflows({ triggerEntity: "WhatsAppMessage" }),
  })

  const { data: accounts = [] } = useQuery({
    queryKey: ["whatsapp-accounts"],
    queryFn: whatsAppAccountService.getWhatsAppAccounts,
  })

  const automations: Workflow[] = data?.workflows || []

  const deleteMutation = useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-automations"] })
      toast.success("Automation deleted")
    },
    onError: () => toast.error("Failed to delete automation"),
  })

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this automation?")) {
      deleteMutation.mutate(id)
    }
  }

  const accountLabel = (accountId?: string) => {
    if (!accountId) return "All Numbers"
    const account = accounts.find((a) => a.id === accountId)
    return account?.displayName || account?.phoneNumber || "Unknown number"
  }

  const escalatesCount = automations.filter((a) => (a.actions || []).some((x) => x.type === "escalate_to_agent")).length

  return (
    <WhatsAppPage
      title="Automations"
      emoji="⚡"
      subtitle="Auto-reply to keywords and hand off conversations to the assigned agent."
      actions={
        <WhatsAppAutomationDialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open)
            if (!open) setAutomationToEdit(null)
          }}
        >
          <Button
            className={WA_PRIMARY_BTN}
            onClick={() => {
              setAutomationToEdit(null)
              setIsCreateOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Automation
          </Button>
        </WhatsAppAutomationDialog>
      }
    >
      <WhatsAppStatsBar
        loading={isLoading}
        tiles={[
          { label: "Total", value: automations.length, accent: "bg-[hsl(var(--chart-4))]" },
          { label: "Active", value: automations.filter((a) => a.isActive).length, accent: "bg-emerald-500" },
          { label: "Inactive", value: automations.filter((a) => !a.isActive).length, accent: "bg-[hsl(var(--chart-2))]" },
          { label: "Escalate to agent", value: escalatesCount, accent: "bg-[hsl(var(--chart-5))]" },
        ]}
      />

      <WhatsAppSection flush title="Active Automations" description="Rule-based keyword replies and agent escalation, per WhatsApp number." icon={<Bot />}>
        {isLoading ? (
          <EmptyState>Loading automations...</EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-poppins text-xs">Status</TableHead>
                <TableHead className="font-poppins text-xs">Name</TableHead>
                <TableHead className="font-poppins text-xs">Number</TableHead>
                <TableHead className="font-poppins text-xs">Trigger</TableHead>
                <TableHead className="font-poppins text-xs">Escalates</TableHead>
                <TableHead className="text-right font-poppins text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {automations.length > 0 ? (
                automations.map((automation) => {
                  const accountCondition = automation.conditions?.find((c) => c.field === "whatsappAccountId")
                  const keywordCondition = automation.conditions?.find((c) => c.field === "body")
                  const escalates = (automation.actions || []).some((a) => a.type === "escalate_to_agent")

                  return (
                    <TableRow key={automation.id}>
                      <TableCell>
                        <StatusPill tone={automation.isActive ? "success" : "muted"}>{automation.isActive ? "Active" : "Inactive"}</StatusPill>
                      </TableCell>
                      <TableCell className="font-medium font-poppins">{automation.name}</TableCell>
                      <TableCell className="font-poppins text-sm">{accountLabel(accountCondition ? String(accountCondition.value) : undefined)}</TableCell>
                      <TableCell className="font-poppins text-sm">
                        {keywordCondition && Array.isArray(keywordCondition.value)
                          ? `Contains: ${keywordCondition.value.join(", ")}`
                          : "Any message"}
                      </TableCell>
                      <TableCell className="font-poppins text-sm">{escalates ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setAutomationToEdit(automation)
                            setIsCreateOpen(true)
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(automation.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState icon={<Bot strokeWidth={1.25} />}>No automations yet. Create one to auto-reply to incoming WhatsApp messages.</EmptyState>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </WhatsAppSection>
    </WhatsAppPage>
  )
}
