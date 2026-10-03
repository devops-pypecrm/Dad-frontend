export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  content: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "signs-your-sales-team-outgrew-spreadsheets",
    title: "5 Signs Your Sales Team Has Outgrown Spreadsheets",
    excerpt: "Spreadsheets are a great way to start tracking leads. They're also the first thing to break once more than one person touches them. Here's how to tell you've hit that point.",
    category: "Sales Process",
    date: "2026-09-02",
    readTime: "5 min read",
    content: [
      "Every sales team starts somewhere, and for most, that somewhere is a shared spreadsheet. It's free, everyone already knows how to use it, and for a team of one or two people chasing a handful of leads a week, it works fine.",
      "The trouble is spreadsheets don't fail loudly. They fail quietly, one skipped follow-up and one duplicate entry at a time, until one day someone asks \"wait, who's actually talking to this lead?\" and nobody has a confident answer.",
      "Here are five signs that's already happening to you.",
      "1. Two people are calling the same lead. Without a single source of truth for who owns what, overlap is inevitable the moment you have more than one rep. It's awkward for your team and worse for the prospect.",
      "2. Leads go cold because nobody remembers to follow up. A spreadsheet doesn't remind you to call someone back in three days. A person has to remember, and people forget — especially when they're juggling fifty open conversations.",
      "3. You can't answer \"how are we doing this month\" without an afternoon of manual tallying. If getting a pipeline total means filtering, summing, and cross-checking three tabs, that's time your team isn't spending selling.",
      "4. New leads sit untouched because nobody was assigned. Round-robin assignment by hand works until it doesn't — someone's on leave, someone's overloaded, and leads start queueing up with no clear owner.",
      "5. You've lost a deal because the history lived in someone's head, not in a system. When a rep leaves or goes on leave, their open conversations shouldn't leave with them.",
      "None of this means your team is doing anything wrong — it means the tool has stopped matching the size of the job. A CRM's entire purpose is to take exactly these five problems off your plate: single ownership per lead, automatic follow-up reminders, real-time pipeline totals, automatic assignment, and a shared history every rep (and their manager) can see.",
    ],
  },
  {
    slug: "lead-response-time-and-conversion",
    title: "Why Lead Response Time Quietly Decides Most of Your Win Rate",
    excerpt: "The single biggest lever most sales teams aren't pulling isn't a better script or a bigger discount — it's simply responding faster.",
    category: "Sales Process",
    date: "2026-09-18",
    readTime: "4 min read",
    content: [
      "Ask most sales leaders what drives conversion and you'll hear about pitch quality, pricing, or lead quality. All of those matter. But there's a quieter factor that often matters more: how fast you respond.",
      "A lead who fills out a form or messages you on WhatsApp is, at that exact moment, at peak interest. They're comparing options, they're actively thinking about the problem you solve, and they're probably talking to more than one provider at the same time. Every hour that passes is an hour your competitor has to get there first.",
      "This is exactly why \"unattended lead\" tracking matters so much more than it sounds like it should. A lead sitting unassigned, or assigned but never contacted, isn't just a data-hygiene issue — it's a live deal quietly slipping away in real time.",
      "The fix isn't \"work harder.\" It's removing the gap between a lead arriving and a human being notified. That means automatic assignment the moment a lead comes in (not at the next team stand-up), and a dashboard that actually surfaces who's been neglected — not buried three tabs deep where nobody checks it.",
      "If there's one metric worth putting on a TV in your sales floor, it's not just \"deals closed this month.\" It's \"leads older than an hour with no first contact.\" Get that number close to zero and the conversion numbers tend to take care of themselves.",
    ],
  },
  {
    slug: "whatsapp-as-a-primary-sales-channel",
    title: "WhatsApp Is Quietly Becoming India's Primary Sales Channel",
    excerpt: "For a lot of businesses selling into India, the first real conversation with a prospect doesn't happen over a phone call or email — it happens on WhatsApp.",
    category: "Channels",
    date: "2026-09-27",
    readTime: "4 min read",
    content: [
      "If you're running an education, consulting, or services business in India, there's a good chance more of your real sales conversations are happening on WhatsApp than on any other channel — even if your CRM was built around phone calls and email.",
      "It makes sense. A WhatsApp message gets read almost immediately, it's asynchronous so prospects can reply on their own time, and it lets a rep share brochures, pricing sheets, or a quick voice note without the friction of scheduling a call.",
      "The problem is most teams end up running this on a personal phone, or a shared number with no ownership, no history, and no way to tell who replied to what. The moment a rep is unavailable, that conversation — and the deal attached to it — goes dark.",
      "Treating WhatsApp as a first-class channel means every conversation is tied to a lead record, every rep sees the same thread history, and a lead who message in again later is recognized instead of starting from zero. It's the difference between WhatsApp being a side-channel your team improvises around, and WhatsApp being a real, trackable part of your pipeline.",
    ],
  },
];

export const getBlogPost = (slug: string) => BLOG_POSTS.find((p) => p.slug === slug);
