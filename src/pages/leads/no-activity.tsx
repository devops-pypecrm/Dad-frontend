import { useState } from "react"
import { MoonStar, Trash2 } from "lucide-react"
import { LeadListPage } from "./LeadListPage"
import { NoActivityCleanupDialog } from "./NoActivityCleanupDialog"
import { Button } from "@/components/ui/button"
import { getNoActivityLeads } from "@/services/leadService"
import { getUserInfo, isAdmin } from "@/lib/utils"

export default function NoActivityLeadsPage() {
  const [cleanupOpen, setCleanupOpen] = useState(false)
  const canCleanUp = isAdmin(getUserInfo())

  return (
    <>
      <LeadListPage
        title="No Activity Leads"
        description="Still-workable leads with no update in 30+ days. Won, lost, invalid and opportunity leads are excluded."
        icon={<MoonStar className="h-6 w-6" />}
        queryKey="no-activity-leads"
        queryFn={(params) => getNoActivityLeads({ pageSize: 2000, ...params })}
        emptyMessage="Every open lead has had activity in the last 30 days. Nothing has gone cold."
        showStageFilter
        headerActions={canCleanUp && (
          <Button variant="outline" onClick={() => setCleanupOpen(true)}
            className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-medium text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" /> Clean up
          </Button>
        )}
      />
      {canCleanUp && <NoActivityCleanupDialog open={cleanupOpen} onOpenChange={setCleanupOpen} />}
    </>
  )
}
