export interface BlogStat {
  value: string;
  label: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  authorRole: string;
  stats?: BlogStat[];
  pullQuote?: string;
  // A line starting with "## " renders as a section heading; everything
  // else renders as a paragraph. Keeps the data plain strings while still
  // giving the article real <h2> structure for both readers and SEO.
  content: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "hidden-cost-of-duplicate-leads",
    title: "The Hidden Cost of Duplicate Leads",
    subtitle: "Every duplicate record in your pipeline is a decision your team already made once — and is about to make badly a second time.",
    excerpt: "A lead that comes in twice isn't just a data-hygiene annoyance — it's two reps about to have the same awkward conversation with the same person, and a number almost nobody is tracking.",
    category: "Sales Process",
    date: "2026-10-04",
    readTime: "6 min read",
    author: "Pype CRM Team",
    authorRole: "Leadership Perspective",
    stats: [
      { value: "2x", label: "Work logged against the same prospect" },
      { value: "0", label: "Of that history carried to the new owner" },
      { value: "1", label: "Field needed to catch it — the phone number" },
    ],
    pullQuote: "A duplicate lead isn't a data problem. It's a prospect your system is about to insult twice.",
    content: [
      "A founder I'd bet you'd recognize once told me the moment she stopped trusting her own pipeline report. A prospect called in annoyed — a second rep had phoned him in the same week, pitching the same package, asking questions he'd already answered. Nobody had done anything wrong. The lead had simply been entered twice.",
      "That's the thing about duplicate leads: they don't show up as an error. They show up as a slightly worse version of your business, running quietly in parallel with the real one.",
      "## Why This Isn't a Data-Entry Problem",
      "It's tempting to file duplicates under \"human error, fix with training.\" That's the wrong frame. The same person re-enquires after a campaign retarget. A rep re-keys a WhatsApp contact into the CRM by hand because the two systems don't talk. An import runs twice because nobody was sure the first one finished. None of that is carelessness — it's what happens by default when there's no single gate checking \"have we seen this phone number before.\"",
      "Add up enough of those moments and you get a pipeline that quietly overstates itself. Your \"total leads this month\" number includes some prospects twice. Your conversion rate is calculated against an inflated denominator. The dashboard looks fine. The math underneath it doesn't.",
      "## What It Actually Costs",
      "The direct cost is obvious once you see it: two reps' time spent on one opportunity, and a visibly disorganized first impression for the prospect — which, for a lot of businesses, is the entire sales pitch.",
      "The indirect cost is worse. Every duplicate record starts with zero history. No notes on what the prospect asked. No record that they already said the price was too high for the basic plan. Whoever picks up the duplicate is negotiating blind, repeating ground that's already been covered, and the prospect notices.",
      "## The Fix Is Matching, Not Discipline",
      "The reliable fix isn't asking your team to double-check before they enter anything — that doesn't survive contact with a busy Tuesday. It's matching incoming leads against what you already have, automatically, the moment they arrive. Phone number alone catches the overwhelming majority of real-world duplicates, because it's the one field a prospect can't easily vary by accident.",
      "When a match is found, the right move usually isn't to block the new enquiry — it's to route it back to whoever already owns that conversation, logged as a re-enquiry rather than a fresh lead. That one change means a prospect who comes back six months later for a different reason lands with full context intact, instead of being treated like a stranger by someone who has no idea they ever spoke.",
      "## The Number Worth Asking For",
      "If you run a sales team, there's one question worth putting to whoever owns your CRM this week: how many of our \"new\" leads this quarter were actually repeats? If nobody can answer with confidence, that's not a reporting gap — that's a visibility gap into how your pipeline actually behaves, and it's cheaper to close now than to keep discovering it one annoyed phone call at a time.",
    ],
  },
  {
    slug: "signs-your-sales-team-outgrew-spreadsheets",
    title: "5 Signs Your Sales Team Has Outgrown Spreadsheets",
    subtitle: "Spreadsheets don't fail with a crash. They fail with a shrug — \"wait, who's actually talking to this lead?\" — repeated until everyone assumes it's normal.",
    excerpt: "Spreadsheets are a great way to start tracking leads. They're also the first thing to break once more than one person touches them. Here's how to tell you've already hit that point.",
    category: "Sales Process",
    date: "2026-09-02",
    readTime: "6 min read",
    author: "Pype CRM Team",
    authorRole: "Leadership Perspective",
    stats: [
      { value: "1", label: "Person who can explain the whole pipeline" },
      { value: "0", label: "Automatic reminders when a follow-up is due" },
      { value: "∞", label: "Tabs required to get a real total" },
    ],
    pullQuote: "The tool didn't get worse. The job got bigger than the tool was ever built for.",
    content: [
      "Every sales team starts somewhere, and for most, that somewhere is a shared spreadsheet. It's free, everyone already knows how to use it, and for one or two people chasing a handful of leads a week, it's genuinely fine. The failure mode isn't in the spreadsheet — it's in not noticing the exact week it stopped being fine.",
      "Spreadsheets don't fail loudly. They fail quietly, one skipped follow-up and one duplicate entry at a time, until someone finally asks a question nobody can answer with confidence. Here are the five moments that question usually shows up.",
      "## 1. Two People Are Calling the Same Lead",
      "Without a single source of truth for who owns what, overlap is inevitable the moment a second rep joins. It's awkward for your team internally, and worse for the prospect who now assumes your business doesn't talk to itself.",
      "## 2. Leads Go Cold Because Nobody Remembered",
      "A spreadsheet doesn't remind anyone to call back in three days. A person has to remember — and people forget, especially once they're juggling forty open conversations instead of four.",
      "## 3. \"How Are We Doing\" Takes an Afternoon to Answer",
      "If getting a pipeline total means filtering, summing, and cross-checking three tabs by hand, that's an afternoon your team didn't spend selling. Worse, it's a number nobody trusts enough to make a decision on, because everyone's seen it be wrong before.",
      "## 4. New Leads Sit Untouched Because Nobody Was Assigned",
      "Round-robin by hand works until someone's on leave, someone's overloaded, or it's 7pm and the person who usually triages new leads has gone home. Leads don't wait for your team's schedule.",
      "## 5. A Rep Leaves and Takes the Context With Them",
      "When the real history of a deal lives in one person's head instead of a shared record, that history leaves the building the day they do — along with whatever leverage you had in that negotiation.",
      "## None of This Means Your Team Did Anything Wrong",
      "It means the tool stopped matching the size of the job. A CRM's entire purpose is taking exactly these five problems off your plate: one clear owner per lead, automatic follow-up reminders, a pipeline total you can trust without an afternoon of reconciling, automatic assignment that doesn't depend on someone being awake to do it, and a shared history every rep — and their manager — can actually see.",
    ],
  },
  {
    slug: "what-belongs-on-a-sales-dashboard",
    title: "What Actually Belongs on a Sales Dashboard",
    subtitle: "Most sales dashboards are full of numbers nobody has ever acted on. Here's the much shorter list that changes what a rep does before lunch.",
    excerpt: "Most sales dashboards are full of numbers nobody acts on. Here's a shorter list that actually changes what a rep or manager does that day.",
    category: "Product",
    date: "2026-09-10",
    readTime: "5 min read",
    author: "Pype CRM Team",
    authorRole: "Leadership Perspective",
    stats: [
      { value: "1", label: "Question every tile should answer: what do I do next" },
      { value: "30", label: "Days of silence that should trigger an alert" },
      { value: "0", label: "Charts that exist just because they look good" },
    ],
    pullQuote: "A dashboard that doesn't change anyone's next action is a wall decoration with a database behind it.",
    content: [
      "It's easy to build a dashboard that looks impressive and does nothing — a wall of charts glanced at once a week, if that. The test for whether a number belongs on it isn't \"is this interesting.\" It's \"would a specific person change what they do today because they saw it.\"",
      "## The Tiles That Pass the Test",
      "Leads with no activity in 30-plus days earn their place because they're a direct to-do list, not a statistic — each one is a name someone should call today. Leads sitting unassigned right now are a routing failure to fix immediately, not a trend to review next sprint. Today's follow-ups due matter because they're the difference between a promise kept and a prospect quietly written off.",
      "## The Tiles That Usually Don't",
      "Lifetime total leads ever created is a vanity number — satisfying in a board deck, useless on a Tuesday morning. A pie chart of lead sources from two quarters ago tells you where you've been, not what to do next. If a number only ever gets discussed in a quarterly review, it probably doesn't belong on a screen your reps look at daily.",
      "## The Quiet Failure Mode",
      "The dangerous version of a bad dashboard isn't one that's empty — it's one that looks complete while hiding the actual problem. A \"this month\" filter applied by default to every tile will make even a serious backlog of neglected leads look like a clean, healthy pipeline, simply because the leads piling up were created in a previous month. If a founder checks the dashboard and sees reassuring numbers while the sales team quietly knows better, the dashboard isn't wrong — it's just answering a question nobody asked.",
      "## Build It Like a To-Do List With Numbers Attached",
      "The best dashboards read less like a report and more like a worklist. Every tile should answer \"what do I do next,\" not just \"how are we doing\" — and the two questions, despite looking similar, lead to completely different products.",
    ],
  },
  {
    slug: "round-robin-vs-manual-assignment",
    title: "Round-Robin vs. Manual Assignment: Which Actually Scales",
    subtitle: "Manually deciding who gets the next lead feels fair at three reps. Here's the exact point where it stops working, and what replaces it.",
    excerpt: "Manually deciding who gets the next lead works fine for a team of three. Here's exactly where it stops working — and what to replace it with.",
    category: "Leads & Assignment",
    date: "2026-09-14",
    readTime: "5 min read",
    author: "Pype CRM Team",
    authorRole: "Leadership Perspective",
    stats: [
      { value: "1", label: "Person usually doing the triage by hand" },
      { value: "0s", label: "Delay with automatic rotation on arrival" },
      { value: "100%", label: "Of leads routed, even after hours" },
    ],
    pullQuote: "Manual assignment doesn't fail because someone's unfair. It fails because someone's just one person.",
    content: [
      "In a small team, one person — a manager, a founder, a team lead — usually eyeballs new leads and hands them out as they come in. It feels personal, it's flexible, and for a while it genuinely works well.",
      "## Where the Cracks Actually Show Up",
      "The breaking point is predictable: once there are enough leads coming in that no single person can watch them all day, or enough reps that \"who's free right now\" stops being obvious from across the room. From there, assignment either slows down — leads queue up waiting for a human to triage them — or gets uneven, because the person assigning naturally defaults to whoever's top of mind, not whoever's actually available.",
      "## Why \"Just Be More Organized\" Doesn't Fix It",
      "This isn't a discipline problem you can train your way out of. The person doing manual assignment has a day job that isn't \"watch the lead inbox.\" The moment they're in a client meeting, on a flight, or simply offline for the evening, assignment stops — and leads don't stop arriving just because nobody's watching.",
      "## What Automated Distribution Actually Buys You",
      "Round-robin distribution assigns a new lead to the next person in rotation the instant it arrives, with no human in the loop required. Done properly, it's scoped the way your business actually works — by team, by branch, or by whatever criteria matters, like a specific ad campaign routing straight to the specialist who handles it — with a sensible fallback for anything that doesn't match a rule.",
      "## The Resistance Is Usually About the Wrong Thing",
      "Teams that resist automating this usually aren't wrong that manual assignment feels more personal — they're underestimating what it's already costing them in delayed first contact once volume creeps past what one person can watch. The fix isn't removing the human judgment from sales. It's removing the human bottleneck from routing, so the judgment gets applied to the conversation instead of the inbox.",
    ],
  },
  {
    slug: "lead-response-time-and-conversion",
    title: "Why Lead Response Time Quietly Decides Most of Your Win Rate",
    subtitle: "Pitch quality gets the credit. Response time does most of the actual work — and almost nobody puts it on the dashboard.",
    excerpt: "The single biggest lever most sales teams aren't pulling isn't a better script or a bigger discount — it's simply responding faster.",
    category: "Sales Process",
    date: "2026-09-18",
    readTime: "5 min read",
    author: "Pype CRM Team",
    authorRole: "Leadership Perspective",
    stats: [
      { value: "1", label: "Moment of peak interest — right when they enquire" },
      { value: "0", label: "Minutes a competitor needs to beat a slow reply" },
      { value: "1", label: "Metric worth a TV on the sales floor" },
    ],
    pullQuote: "Every hour a lead waits is an hour you've handed your competitor to get there first.",
    content: [
      "Ask most sales leaders what drives conversion and you'll hear about pitch quality, pricing, or lead quality. All of that matters. There's a quieter factor that usually matters more, and it rarely makes the leadership meeting: how fast you respond.",
      "## The Moment Interest Peaks — and Fades",
      "A prospect who fills out a form or messages you on WhatsApp is, at that exact moment, at peak interest. They're actively comparing options, thinking hard about the problem you solve, and very likely talking to more than one provider at once. Every hour that passes is an hour a competitor has to get there first — and interest, unlike a good lead, doesn't wait around to be followed up with later.",
      "## Why \"Unattended Lead\" Deserves to Be a Headline Metric",
      "This is exactly why tracking unattended leads matters more than it sounds like it should. A lead sitting unassigned, or assigned but never actually contacted, isn't a data-hygiene footnote — it's a live deal quietly slipping away in real time, and most teams only discover it after the fact, if at all.",
      "## The Fix Isn't \"Work Harder\"",
      "The real fix is removing the gap between a lead arriving and a human being notified — automatic assignment the instant a lead comes in, not at the next team stand-up, paired with a dashboard that actually surfaces who's been neglected instead of burying it three tabs deep where nobody checks.",
      "## The One Number Worth Watching Daily",
      "If there's a single metric worth putting on a screen in your sales floor, it isn't \"deals closed this month.\" It's \"leads older than an hour with no first contact.\" Get that number close to zero, consistently, and the conversion numbers downstream tend to take care of themselves.",
    ],
  },
  {
    slug: "whatsapp-as-a-primary-sales-channel",
    title: "WhatsApp Is Quietly Becoming India's Primary Sales Channel",
    subtitle: "For a lot of businesses selling into India, the real sales conversation never happens on a phone call. It happens in a chat thread nobody's tracking.",
    excerpt: "For a lot of businesses selling into India, the first real conversation with a prospect doesn't happen over a phone call or email — it happens on WhatsApp.",
    category: "Channels",
    date: "2026-09-27",
    readTime: "5 min read",
    author: "Pype CRM Team",
    authorRole: "Leadership Perspective",
    stats: [
      { value: "1", label: "Phone screen most prospects actually check first" },
      { value: "0", label: "Context kept when a rep goes offline unexpectedly" },
      { value: "2x", label: "Faster a brochure reaches someone than a callback" },
    ],
    pullQuote: "If your real sales conversations live in a chat app your CRM can't see, your CRM isn't tracking your business — it's tracking a summary of it.",
    content: [
      "If you're running an education, consulting, or services business in India, there's a good chance more of your real sales conversations are happening on WhatsApp than on any other channel — even if your CRM was built around phone calls and email forms.",
      "## Why It Happened Without Anyone Deciding It Should",
      "It makes sense once you look at it from the prospect's side. A WhatsApp message gets read almost immediately. It's asynchronous, so they can reply on their own time instead of taking a call mid-meeting. And it lets a rep share a brochure, a pricing sheet, or a quick voice note without the friction of scheduling anything.",
      "## The Problem Nobody Notices Until It's Expensive",
      "Most teams end up running this on a personal phone, or a shared number with no real ownership, no searchable history, and no way to tell who replied to what. The moment a rep is unavailable — sick, on leave, gone entirely — that conversation, and the deal attached to it, goes dark with them.",
      "## What \"Treating WhatsApp as a Real Channel\" Actually Means",
      "It means every conversation is tied to a lead record that anyone on the team can open. It means a prospect who messages in again months later is recognized immediately, instead of starting from zero with someone who has no idea they ever spoke. It's the difference between WhatsApp being a side-channel your team quietly improvises around, and WhatsApp being a real, auditable part of your pipeline — which, for a lot of businesses, it already functionally is, whether the CRM admits it or not.",
    ],
  },
];

export const getBlogPost = (slug: string) => BLOG_POSTS.find((p) => p.slug === slug);
