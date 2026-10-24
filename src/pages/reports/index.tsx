import { Link } from "react-router-dom";
import {
  BarChart3,
  Users,
  CalendarCheck,
  Phone,
  FileText,
  Trophy,
  DollarSign,
  ChevronRight,
  LineChart,
} from "lucide-react";
import { isAdmin, isManager } from "@/lib/utils";

export default function ReportsPage() {
  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const showAuditLogs = isAdmin(user) || isManager(user);

  return (
    <div className="bg-white min-h-screen p-4 sm:p-8 space-y-6 animate-in fade-in duration-300 font-poppins">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-border/40">
        <div className="h-9 w-9 rounded-[10px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <LineChart className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Reports</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">View analytics and generate reports across your organisation.</p>
        </div>
      </div>

      {/* Quick-link sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReportSection icon={Phone} title="Leads" accent="primary">
          <ReportLink to="/leads?view=no-activity-leads" label="No Activity Leads" />
          <ReportLink to="/leads?view=today-leads" label="Today's Leads" />
          <ReportLink to="/leads?view=leads-by-status" label="Leads by Status" />
          <ReportLink to="/leads?view=leads-by-source" label="Leads by Source" />
          <ReportLink to="/leads?view=leads-by-ownership" label="Leads by Ownership" />
          <ReportLink to="/leads?view=converted-leads" label="Converted Leads" />
          <ReportLink to="/leads?view=lost-leads" label="Lost Leads" />
          <ReportLink to="/reports/lead-distribution" label="Lead Distribution Report" />
        </ReportSection>

        <ReportSection icon={CalendarCheck} title="Follow Ups" accent="emerald">
          <ReportLink to="/follow-ups?filter=overdue" label="Overdue Follow Ups" />
          <ReportLink to="/follow-ups?filter=today" label="Today's Follow Ups" />
          <ReportLink to="/follow-ups?filter=upcoming" label="Upcoming Follow Ups" />
          <ReportLink to="/follow-ups" label="All Follow Ups" />
        </ReportSection>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <ReportCard to="/reports/field-force" icon={Users} title="Field Force Activity" description="Field agent tracking." accent="primary" />
        <ReportCard to="/reports/sales-book" icon={CalendarCheck} title="Sales Book" description="Detailed transaction log." accent="primary" />
        <ReportCard to="/reports/expected-revenue" icon={DollarSign} title="Expected Revenue" description="Open deals & carried-forward pipeline." accent="emerald" />
        {showAuditLogs && (
          <ReportCard to="/reports/audit-logs" icon={FileText} title="Audit Logs" description="System activity and user actions." accent="primary" />
        )}
        <ReportCard to="/reports/user-total" icon={Trophy} title="User Total Report" description="Individual performance, efficiency metrics, and PDF exports." accent="amber" />
        <ReportCard to="/reports/daily" icon={BarChart3} title="Daily Report" description="Today's exact call and conversion metrics at a glance." accent="emerald" />
      </div>
    </div>
  );
}

const ACCENT_CLASSES: Record<string, { icon: string; border: string }> = {
  primary: { icon: "bg-primary/10 text-primary", border: "hover:border-primary/30" },
  emerald: { icon: "bg-emerald-500/10 text-emerald-600", border: "hover:border-emerald-500/30" },
  amber: { icon: "bg-amber-500/10 text-amber-600", border: "hover:border-amber-500/30" },
};

function ReportSection({
  icon: Icon,
  title,
  accent,
  children,
}: {
  icon: typeof Phone;
  title: string;
  accent: keyof typeof ACCENT_CLASSES;
  children: React.ReactNode;
}) {
  const classes = ACCENT_CLASSES[accent];
  return (
    <div className="rounded-[14px] border border-border/60 bg-card shadow-xs overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <div className={`h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0 ${classes.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className="px-2 pb-2">{children}</div>
    </div>
  );
}

function ReportLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between px-3 py-2.5 rounded-[10px] hover:bg-muted/60 transition-colors text-sm font-medium text-foreground group"
    >
      <span>{label}</span>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
    </Link>
  );
}

function ReportCard({
  to,
  icon: Icon,
  title,
  description,
  accent,
}: {
  to: string;
  icon: typeof Phone;
  title: string;
  description: string;
  accent: keyof typeof ACCENT_CLASSES;
}) {
  const classes = ACCENT_CLASSES[accent];
  return (
    <Link
      to={to}
      className={`rounded-[14px] border border-border/60 bg-card p-4 sm:p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-sm ${classes.border}`}
    >
      <div className={`h-10 w-10 rounded-[10px] flex items-center justify-center mb-3 ${classes.icon}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </Link>
  );
}
