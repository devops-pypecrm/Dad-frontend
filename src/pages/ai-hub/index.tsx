import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { Bot, Flame, Lightbulb, Newspaper, PenLine, TrendingUp } from 'lucide-react'
import { cn, getUserInfo, isOrgAdmin } from '@/lib/utils'
import Assistant from './Assistant'
import { BriefingPanel, HotLeadsPanel, ComposePanel, ForecastPanel, CoachPanel } from './panels'

export const AI_TABS = [
  { key: 'assistant', label: 'Assistant', icon: Bot },
  { key: 'briefing', label: 'Daily Briefing', icon: Newspaper },
  { key: 'hot-leads', label: 'Hot Leads', icon: Flame },
  { key: 'compose', label: 'Smart Compose', icon: PenLine },
  { key: 'forecast', label: 'Forecast & Risk', icon: TrendingUp },
  { key: 'coach', label: 'Team Coach', icon: Lightbulb },
] as const

/** AI Assistant Hub: one module with a tab strip. Visible only to admins of organisations that have the `ai_assistant` feature. */
export default function AiHubPage() {
  const { tab = 'assistant' } = useParams()
  const [sp] = useSearchParams()
  const user = getUserInfo()
  const enabled = Array.isArray(user?.organisation?.enabledFeatures) && user.organisation.enabledFeatures.includes('ai_assistant')
  if (!isOrgAdmin(user) || (!enabled && !user?.isSuperAdmin)) {
    return <div className="p-8 text-sm text-muted-foreground">The AI Assistant isn't enabled for your organisation. Contact Pype CRM support to switch it on.</div>
  }
  if (!AI_TABS.some((t) => t.key === tab)) return <Navigate to="/ai/assistant" replace />

  return (
    <div className="flex flex-col">
      <div className="flex gap-1.5 overflow-x-auto px-5 pt-5">
        {AI_TABS.map((t) => (
          <Link key={t.key} to={`/ai/${t.key}`} className={cn('flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition', tab === t.key ? 'border-[hsl(var(--chart-5))] bg-[hsl(var(--chart-5))] text-white' : 'border-border bg-card text-muted-foreground hover:text-foreground')}>
            <t.icon className="h-3.5 w-3.5" />{t.label}
          </Link>
        ))}
      </div>
      {tab === 'assistant' && <Assistant />}
      {tab !== 'assistant' && (
        <div className="p-5">
          {tab === 'briefing' && <BriefingPanel />}
          {tab === 'hot-leads' && <HotLeadsPanel />}
          {tab === 'compose' && <ComposePanel key={sp.get('lead') || 'none'} initialLead={sp.get('lead') || undefined} showSummary={sp.get('summary') === '1'} />}
          {tab === 'forecast' && <ForecastPanel />}
          {tab === 'coach' && <CoachPanel />}
        </div>
      )}
    </div>
  )
}
