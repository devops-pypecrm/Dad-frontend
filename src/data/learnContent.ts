// Content for the "Learn" mega menu and its landing sub-pages.
//
// NOTE: the customer stories below are ILLUSTRATIVE. The companies, people
// and figures are fictional placeholders written to show the page layout.
// Replace them with real, approved customer data before presenting them as
// real testimonials.

export interface LearnLink {
  label: string;
  href: string;
}

export interface LearnColumn {
  title: string;
  links: LearnLink[];
}

export const LEARN_COLUMNS: LearnColumn[] = [
  {
    title: "Learn",
    links: [
      { label: "Academy", href: "/academy" },
      { label: "Demos", href: "/demos" },
      { label: "Video tutorials", href: "/tutorials" },
      { label: "Webinars", href: "/webinars" },
    ],
  },
  {
    title: "Discover",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Customer stories", href: "/customers" },
      { label: "Guides", href: "/guides" },
      { label: "Documentation", href: "/docs" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "24/7 Support", href: "/support-center" },
      { label: "Onboarding services", href: "/services" },
      { label: "Premium support", href: "/support-center#premium" },
      { label: "Hire an expert", href: "/partners" },
    ],
  },
];

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  meta: string; // duration / level / date
  tag: string;
  href?: string;
}

export const ACADEMY_COURSES: ResourceItem[] = [
  { id: "crm-basics", title: "CRM Fundamentals", description: "Leads, contacts, accounts and opportunities: how Pype CRM models your sales process end to end.", meta: "6 lessons · 45 min", tag: "Beginner" },
  { id: "lead-routing", title: "Lead Capture & Auto-Assignment", description: "Connect Meta, web forms and portals, then route every lead to the right rep with round-robin rules.", meta: "5 lessons · 40 min", tag: "Beginner" },
  { id: "whatsapp-selling", title: "Selling on WhatsApp", description: "Templates, inbox etiquette and automated follow-ups using the official WhatsApp Cloud API.", meta: "7 lessons · 55 min", tag: "Intermediate" },
  { id: "pipeline-design", title: "Designing Your Pipeline", description: "Stages, win probability and the exit criteria that keep deals from stalling.", meta: "4 lessons · 30 min", tag: "Intermediate" },
  { id: "automation", title: "Workflow Automation", description: "Trigger tasks, reminders and escalations so nothing depends on a rep remembering.", meta: "6 lessons · 50 min", tag: "Intermediate" },
  { id: "reports", title: "Reports & Sales Targets", description: "Build dashboards managers actually open and tie targets to real activity.", meta: "5 lessons · 35 min", tag: "Advanced" },
];

export const DEMOS: ResourceItem[] = [
  { id: "demo-leads", title: "Lead management in 3 minutes", description: "From a new Meta lead to a booked site visit, shown on a live board.", meta: "3 min · Interactive", tag: "Sales" },
  { id: "demo-ai", title: "Pype AI insights", description: "See how AI summarises a lead's history and suggests the next best action.", meta: "4 min · Interactive", tag: "AI" },
  { id: "demo-whatsapp", title: "Shared WhatsApp inbox", description: "Team inbox, templates and assignment, all inside the CRM.", meta: "5 min · Interactive", tag: "Channels" },
  { id: "demo-mobile", title: "The mobile app for field teams", description: "Call logging, follow-up reminders and check-ins from the field.", meta: "3 min · Interactive", tag: "Mobile" },
];

export const TUTORIALS: ResourceItem[] = [
  { id: "tut-import", title: "Import leads from a spreadsheet", description: "Map columns, catch duplicates and assign owners during import.", meta: "4:20", tag: "Getting started" },
  { id: "tut-forms", title: "Build a web form and embed it", description: "Create a lead capture form and publish it on your own site.", meta: "5:05", tag: "Lead capture" },
  { id: "tut-roles", title: "Set up roles and branches", description: "Give each team the right access across branches and territories.", meta: "6:40", tag: "Admin" },
  { id: "tut-template", title: "Create a WhatsApp template", description: "Write, submit and use an approved message template.", meta: "4:55", tag: "WhatsApp" },
  { id: "tut-automation", title: "Your first automation", description: "Auto-create a follow-up task when a lead enters a stage.", meta: "5:30", tag: "Automation" },
  { id: "tut-report", title: "Read the sales dashboard", description: "What each widget means and which numbers to act on.", meta: "3:50", tag: "Reports" },
];

export const WEBINARS: ResourceItem[] = [
  { id: "web-1", title: "Cut lead response time to under 10 minutes", description: "A live walkthrough of routing rules, alerts and WhatsApp auto-replies.", meta: "Monthly · 45 min", tag: "Live" },
  { id: "web-2", title: "CRM migration without the chaos", description: "How to move from spreadsheets and clean your data on day one.", meta: "On demand · 38 min", tag: "Recording" },
  { id: "web-3", title: "Running Meta lead ads into your CRM", description: "Connect, de-duplicate and measure cost per qualified lead.", meta: "On demand · 42 min", tag: "Recording" },
];

export const GUIDES: ResourceItem[] = [
  { id: "guide-1", title: "The Sales Team Setup Checklist", description: "Everything to configure in your first week, in the right order.", meta: "12 min read", tag: "Checklist" },
  { id: "guide-2", title: "Lead Follow-Up Playbook", description: "Cadences for the first 24 hours, 7 days and 30 days after enquiry.", meta: "10 min read", tag: "Playbook" },
  { id: "guide-3", title: "Choosing Your Pipeline Stages", description: "A practical template for real estate, education and services.", meta: "8 min read", tag: "Template" },
  { id: "guide-4", title: "WhatsApp Compliance Basics", description: "Opt-in, templates and the rules that keep your number healthy.", meta: "9 min read", tag: "Compliance" },
];

export interface CustomerStory {
  slug: string;
  company: string;
  initials: string;
  industry: string;
  location: string;
  teamSize: string;
  headline: string;
  summary: string;
  quote: string;
  quoteBy: string;
  quoteRole: string;
  stats: { value: string; label: string }[];
  challenge: string[];
  solution: { title: string; body: string }[];
  results: string[];
  featuresUsed: string[];
}

export const CUSTOMER_STORIES: CustomerStory[] = [
  {
    slug: "meridian-estates",
    company: "Meridian Estates",
    initials: "ME",
    industry: "Real estate",
    location: "Kochi, India",
    teamSize: "42 sales reps · 3 branches",
    headline: "Meridian Estates cut lead response time from 4 hours to 9 minutes",
    summary:
      "A residential developer replaced spreadsheets and scattered WhatsApp chats with one pipeline, and booked far more site visits from the same ad spend.",
    quote:
      "We were paying for leads and then losing them to our own slow follow-up. Now every enquiry reaches a rep in minutes, and I can see who called whom without asking.",
    quoteBy: "Anita Varghese",
    quoteRole: "Head of Sales",
    stats: [
      { value: "4h → 9 min", label: "Average first response" },
      { value: "+62%", label: "Site visits booked" },
      { value: "31%", label: "Fewer leads left untouched" },
    ],
    challenge: [
      "Meridian Estates sells apartments and villas across three branches. Leads arrived from Meta ads, property portals, walk-ins and referrals, and each branch tracked them in its own spreadsheet.",
      "Leads were assigned by whoever noticed them first in a shared WhatsApp group. Good enquiries sat for hours, the same buyer was often called by two reps, and managers had no reliable view of what happened after the first call.",
    ],
    solution: [
      { title: "One pipeline for every source", body: "Meta lead ads, web forms and portal enquiries flow into Pype CRM automatically, with duplicates caught on arrival so a buyer is never contacted twice." },
      { title: "Round-robin assignment by branch", body: "Each lead is assigned to an available rep in the right branch the moment it lands, and the rep is notified on the mobile app." },
      { title: "WhatsApp follow-ups inside the CRM", body: "Reps send approved templates and chat from a shared inbox, and every conversation stays attached to the lead." },
      { title: "Site-visit tracking and reminders", body: "Visits are booked on the calendar, with automated reminders to the buyer and a follow-up task for the rep afterwards." },
    ],
    results: [
      "Average first response dropped from about four hours to nine minutes within the first month.",
      "Site visits booked per hundred leads rose by 62% over the first quarter.",
      "Managers replaced the weekly spreadsheet roll-up with a live dashboard, saving roughly a day of reporting work each week.",
    ],
    featuresUsed: ["Lead auto-assignment", "WhatsApp inbox", "Duplicate detection", "Mobile app", "Reports & targets"],
  },
  {
    slug: "brightpath-institute",
    company: "BrightPath Institute",
    initials: "BP",
    industry: "Education",
    location: "Bengaluru, India",
    teamSize: "14 admissions counsellors",
    headline: "BrightPath Institute doubled its enquiry-to-admission follow-up rate",
    summary:
      "An entrance-coaching institute used automated follow-up sequences so every enquiry was contacted again at the right moment.",
    quote:
      "Counsellors used to forget half the callbacks. Automated reminders did what no amount of reminding in team meetings could.",
    quoteBy: "Rohit Menon",
    quoteRole: "Admissions Director",
    stats: [
      { value: "2x", label: "Follow-up completion" },
      { value: "-40%", label: "Time spent on admin" },
      { value: "100%", label: "Enquiries logged" },
    ],
    challenge: [
      "Enquiries came in through the website, campus fairs and ad campaigns. Counsellors logged them inconsistently, and callbacks promised to parents were frequently missed.",
    ],
    solution: [
      { title: "Automated follow-up tasks", body: "Each stage change creates a callback task with a due date, and overdue tasks escalate to the admissions director." },
      { title: "Web forms on the institute site", body: "Enquiry forms feed straight into the pipeline with the course of interest filled in." },
    ],
    results: [
      "Follow-up task completion roughly doubled in the first admissions season.",
      "Counsellors spend less time on data entry and more time on calls.",
    ],
    featuresUsed: ["Automation", "Web forms", "Follow-ups", "Calendar"],
  },
  {
    slug: "sunvolt-solar",
    company: "SunVolt Solar",
    initials: "SV",
    industry: "Solar installation",
    location: "Coimbatore, India",
    teamSize: "9 field sales · 5 office staff",
    headline: "SunVolt Solar sends quotes the same day, straight from the field",
    summary:
      "A rooftop-solar installer moved quoting and site-survey follow-ups onto the mobile app so field reps stopped waiting for the office.",
    quote:
      "A customer standing on their roof used to wait two days for a quote. Now they have it before we leave the site.",
    quoteBy: "Karthik Subramanian",
    quoteRole: "Founder",
    stats: [
      { value: "Same day", label: "Quote turnaround" },
      { value: "+28%", label: "Quote-to-order conversion" },
      { value: "0", label: "Lost survey notes" },
    ],
    challenge: [
      "Survey details were written on paper and relayed to the office by phone, so quotes took days and details were often lost.",
    ],
    solution: [
      { title: "Quotes from the mobile app", body: "Reps capture survey details on the lead and generate a quote on the spot." },
      { title: "Field force tracking", body: "Managers see site visits and check-ins in one place." },
    ],
    results: [
      "Quote turnaround went from days to the same day.",
      "Quote-to-order conversion rose by 28% over two quarters.",
    ],
    featuresUsed: ["Quotes", "Field force", "Mobile app", "Products"],
  },
];

export const getCustomerStory = (slug: string) => CUSTOMER_STORIES.find((s) => s.slug === slug);

export const SUPPORT_OPTIONS = [
  { title: "Help center & documentation", body: "Step-by-step articles for every module, searchable and kept up to date.", cta: "Browse docs", href: "/docs" },
  { title: "Chat with our team", body: "Message us from your workspace or on WhatsApp for quick questions.", cta: "Contact us", href: "/enquire" },
  { title: "Ask our AI", body: "Get instant answers from the assistant on our FAQ section.", cta: "Ask now", href: "/#faq" },
];

export const SERVICES = [
  { title: "Guided onboarding", body: "We configure your pipeline, roles and lead sources with you in the first two weeks.", points: ["Pipeline and stage design", "Roles, branches and territories", "Lead source connections"] },
  { title: "Data migration", body: "Bring leads and contacts from spreadsheets or another CRM, cleaned and de-duplicated.", points: ["Column mapping", "Duplicate clean-up", "Import validation"] },
  { title: "Team training", body: "Live sessions for reps and managers, with recordings for new joiners.", points: ["Rep walkthrough", "Manager reporting session", "Admin training"] },
  { title: "Custom automation", body: "Workflows built around how your team really sells.", points: ["Assignment rules", "Follow-up cadences", "Escalation alerts"] },
];
