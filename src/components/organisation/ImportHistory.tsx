import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getImportJobs, getImportJobRows, type ImportJobSummary } from "@/services/leadService"
import { downloadNotCreatedReport } from "./BulkImportLeads"

interface Session {
  key: string
  fileName: string
  when: string
  by: string
  rows: number
  created: number
  reEnquiries: number
  skipped: number
  blocked: number
  errored: number
  jobIds: string[]
}

// Batches of one upload share importSessionId; older/other uploads stand alone.
const group = (jobs: ImportJobSummary[]): Session[] => {
  const map = new Map<string, Session>()
  for (const j of jobs) {
    const m = j.metadata || {}
    const key = m.importSessionId || j.id
    const s = map.get(key) || {
      key, fileName: m.fileName || 'Imported file', when: j.createdAt,
      by: [j.createdBy?.firstName, j.createdBy?.lastName].filter(Boolean).join(' ') || j.createdBy?.email || '',
      rows: 0, created: 0, reEnquiries: 0, skipped: 0, blocked: 0, errored: 0, jobIds: [],
    }
    s.rows += j.total || 0
    s.created += m.created ?? j.successCount ?? 0
    s.reEnquiries += m.reEnquiries || 0
    s.skipped += m.duplicatesSkipped || 0
    s.blocked += m.blocked || 0
    s.errored += m.errored ?? j.failureCount ?? 0
    s.jobIds.push(j.id)
    if (j.createdAt < s.when) s.when = j.createdAt
    map.set(key, s)
  }
  return [...map.values()].sort((a, b) => b.when.localeCompare(a.when))
}

export function ImportHistory() {
  const { data, isLoading } = useQuery({ queryKey: ["import-jobs"], queryFn: getImportJobs })
  const sessions = group(data || [])

  const download = async (s: Session) => {
    try {
      const all = (await Promise.all(s.jobIds.map(getImportJobRows))).flat()
      if (all.length === 0) return toast.info("Every row in this upload was created as a new lead.")
      downloadNotCreatedReport(all, `import-report-${s.fileName.replace(/\.[^.]+$/, "")}.csv`)
    } catch {
      toast.error("Could not load the report")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import History</CardTitle>
        <CardDescription>Every upload with what was created and what was not. Download the report for the row-by-row reason.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No imports recorded yet. Uploads from now on appear here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b">
                <th className="py-2 pr-3">When</th><th className="pr-3">File</th><th className="pr-3">By</th>
                <th className="pr-3">Rows</th><th className="pr-3">Created</th><th className="pr-3">Re-enquiry</th>
                <th className="pr-3">Skipped</th><th className="pr-3">Blocked</th><th className="pr-3">Failed</th><th />
              </tr></thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.key} className="border-b last:border-0">
                    <td className="py-2 pr-3 whitespace-nowrap">{new Date(s.when).toLocaleString()}</td>
                    <td className="pr-3 max-w-[200px] truncate">{s.fileName}</td>
                    <td className="pr-3">{s.by}</td>
                    <td className="pr-3">{s.rows}</td>
                    <td className="pr-3 text-green-600 font-medium">{s.created}</td>
                    <td className="pr-3">{s.reEnquiries}</td>
                    <td className="pr-3">{s.skipped}</td>
                    <td className="pr-3">{s.blocked}</td>
                    <td className={`pr-3 ${s.errored ? "text-destructive font-medium" : ""}`}>{s.errored}</td>
                    <td><Button size="sm" variant="ghost" className="gap-1" onClick={() => download(s)}><Download className="w-3.5 h-3.5" />Report</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
