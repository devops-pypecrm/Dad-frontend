export interface HelpArticle {
  slug: string;
  title: string;
  category: string;
  summary: string;
  content: string[];
}

export const HELP_CATEGORIES = [
  "Getting Started",
  "Leads & Assignment",
  "Importing Data",
  "Integrations",
  "Visibility & Permissions",
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "getting-started",
    title: "Getting started: your first 15 minutes",
    category: "Getting Started",
    summary: "Set up your organisation, add branches, and invite your team.",
    content: [
      "Once your account is created, the first three things worth setting up are your branches, your team, and your lead statuses — everything else builds on top of these.",
      "Branches represent physical or operational divisions of your business (a city office, a department, a product line). Most things in PypeCRM — leads, products, targets — can optionally be scoped to a branch, so set these up before inviting your team.",
      "Next, invite your team under Settings → Team, assigning each person a role (sales rep, manager, admin) and a branch. Roles control what a person can see and do; branch controls which leads they're scoped to by default.",
      "Finally, review Settings → Lead Statuses to make sure your pipeline stages (New, Contacted, Qualified, Won, Lost, or your own custom set) match how your team actually talks about a deal's progress. Reports and dashboards are built around these stages, so getting them right early saves a lot of re-labeling later.",
    ],
  },
  {
    slug: "how-assignment-rules-work",
    title: "How lead assignment rules actually work",
    category: "Leads & Assignment",
    summary: "Criteria matching, round-robin pools, and what happens when nothing matches.",
    content: [
      "Assignment Rules let incoming leads route to the right person automatically, based on conditions like campaign name, source, or lead score — instead of someone manually triaging every new lead.",
      "Each rule has a set of criteria (for example, \"campaign name equals X\") and a distribution target — a specific person, or a rotation pool for round-robin distribution across a team.",
      "Matching is exact: a criterion checks whether the lead's field value equals (or contains, depending on the operator) the value you typed in — so a campaign-name rule only fires for leads whose campaign name matches exactly what's configured. A common setup mistake is leaving the match value blank when creating a rule, which means it will never match any real lead.",
      "If a new lead doesn't match any active rule, it doesn't disappear — it falls back to being auto-assigned to your organisation's admin/creator, with a note in that lead's history explaining why. If you ever see leads landing on an admin account unexpectedly, that's the first place to check: either a rule's criteria is wrong, or there genuinely isn't a rule covering that source yet.",
    ],
  },
  {
    slug: "importing-leads-from-excel",
    title: "Bulk importing leads from Excel or CSV",
    category: "Importing Data",
    summary: "Column mapping, campaign tagging, and setting a default branch for the batch.",
    content: [
      "You can bring in leads in bulk from an Excel or CSV file under Leads → Import. Download the template first — it already has the column headers the importer recognizes (name, phone, email, status, and others), including an optional Campaign column.",
      "If your file already has a Campaign column, each row keeps its own campaign tag. If it doesn't, you can set a single \"Target Campaign\" for the whole batch instead — useful when you're importing a list that's entirely from one source, like a single Meta Ads campaign or a single event's sign-up sheet.",
      "You can also default the whole batch to a specific branch. If you leave it unset, imported leads are visible organisation-wide rather than scoped to any one branch — worth knowing if you expect only one team to work a particular list.",
      "Duplicate phone numbers are detected automatically. By default a duplicate is logged as a re-enquiry against the existing lead rather than creating a second record — so the same person reappearing in two different import files won't fork into two separate conversations.",
    ],
  },
  {
    slug: "connecting-meta-ads-and-whatsapp",
    title: "Connecting Meta Ads and WhatsApp",
    category: "Integrations",
    summary: "What happens when a Meta lead form or WhatsApp message comes in.",
    content: [
      "Connecting your Meta (Facebook/Instagram) ad account lets lead-form submissions flow straight into PypeCRM as new leads, tagged with the ad campaign they came from — no manual export/import needed.",
      "Once connected, it's worth setting up Assignment Rules for your active campaigns so new leads route to the right rep immediately rather than waiting on manual triage. A lead sitting unassigned for even an hour is a real cost — see our note on response time in the blog for why that matters.",
      "WhatsApp conversations are tied directly to a lead record once connected, so any rep (or their manager) can see the full message history instead of it living on one person's phone. If the same number messages in again later, it's recognized as a re-enquiry on the existing lead rather than starting a fresh, disconnected thread.",
    ],
  },
  {
    slug: "lead-visibility-and-hierarchy",
    title: "Who can see which leads?",
    category: "Visibility & Permissions",
    summary: "How assignment, creation, and your reporting hierarchy decide visibility.",
    content: [
      "Lead visibility isn't just role-based — it follows your reporting hierarchy. A sales rep sees leads assigned to them, plus leads they personally created. A manager additionally sees everything assigned to, or created by, anyone who reports to them (directly or through their team).",
      "Admins and org admins see every lead in the organisation, with no hierarchy restriction.",
      "This is also why a colleague's lead doesn't show up in your own list even though you're in the same organisation — visibility is scoped to your own assignments and your reporting chain, by design, not a bug. If a lead should be visible to someone who can't currently see it, the fix is either reassigning it to them or adjusting the reporting relationship between the two users.",
      "Branch also plays a role for some views (like the Products catalog): a user with a branch set sees branch-specific items plus anything marked organisation-wide, but not another branch's items.",
    ],
  },
];

export const getHelpArticle = (slug: string) => HELP_ARTICLES.find((a) => a.slug === slug);
