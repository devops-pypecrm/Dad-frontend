import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { HappileePage, H_CARD } from '@/components/happilee/shared';

interface Section { id: string; title: string; body: ReactNode }

const Code = ({ children }: { children: ReactNode }) => <code className="rounded bg-muted px-1.5 py-0.5 text-[12px] font-mono">{children}</code>;
const Steps = ({ items }: { items: ReactNode[] }) => <ol className="list-decimal space-y-1.5 pl-5">{items.map((i, n) => <li key={n}>{i}</li>)}</ol>;
const List = ({ items }: { items: ReactNode[] }) => <ul className="list-disc space-y-1.5 pl-5">{items.map((i, n) => <li key={n}>{i}</li>)}</ul>;
const Note = ({ tone = 'info', children }: { tone?: 'info' | 'warn'; children: ReactNode }) => (
  <div className={`rounded-lg border p-3 text-sm ${tone === 'warn' ? 'border-amber-300/60 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200' : 'border-primary/30 bg-accent text-accent-foreground'}`}>{children}</div>
);

const SECTIONS: Section[] = [
  {
    id: 'overview', title: 'What this module does',
    body: (
      <div className="space-y-3">
        <p>Happilee is a WhatsApp Business provider. This section of Pype CRM connects to your Happilee account through its API, so your team can send <b>approved WhatsApp templates</b> to leads, run <b>broadcasts</b>, push leads to Happilee as <b>contacts</b>, manage <b>tags</b> and follow <b>delivery status</b>, all without leaving the CRM.</p>
        <List items={[
          <>It is switched on <b>per organisation</b> by Pype CRM support (Super Admin → Feature Settings → Happilee). If you do not see the Happilee group in the sidebar, ask support to enable it.</>,
          <>It has its <b>own connection</b> (the API key). It does not depend on the WhatsApp section.</>,
          <>Only <b>approved templates</b> can be sent. Free-text messages are not available here, in line with WhatsApp's rules for business-initiated messages.</>,
        ]} />
        <Note>Templates are created and approved inside Happilee. This module reads them; it does not create or edit them.</Note>
      </div>
    ),
  },
  {
    id: 'before', title: 'Before you start',
    body: (
      <Steps items={[
        <>Have an active <b>Happilee account</b> with at least one <b>approved template</b>.</>,
        <>Get your <b>API key</b> from Happilee (your project's Integrations / API settings). Happilee calls it the <Code>x-api-key</Code>.</>,
        <>Ask Happilee support to <b>allowlist the Pype CRM server IP</b> <Code>65.2.169.30</Code> for API access. Without this, Happilee blocks every call and the connection fails.</>,
        <>You need to be an <b>organisation admin</b> to connect the key, run broadcasts and sync contacts.</>,
      ]} />
    ),
  },
  {
    id: 'connect', title: 'Connecting your account',
    body: (
      <div className="space-y-3">
        <Steps items={[
          <>Open <Link className="text-primary underline" to="/happilee/overview">Happilee → Overview</Link>.</>,
          <>Paste the API key. Add an optional label (for example "Main number").</>,
          <>Click <b>Connect Happilee</b>. The CRM checks the key with Happilee first and only saves it if Happilee accepts it.</>,
        ]} />
        <p>Once connected, the page shows the label, the last four characters of the key, the connect date and your message counts. The key is stored <b>encrypted</b> and is never shown again.</p>
        <p><b>Test connection</b> makes a real call to Happilee and tells you how many templates it found, or shows Happilee's own error. <b>Disconnect</b> removes the key; sending stops until you reconnect.</p>
      </div>
    ),
  },
  {
    id: 'templates', title: 'Templates',
    body: (
      <div className="space-y-3">
        <p>Open <Link className="text-primary underline" to="/happilee/templates">Templates</Link> to browse everything in your Happilee account. Use the search box to filter by name.</p>
        <p>Each card shows the template name, its status, category, language, a preview of the header, body and footer, and the <b>variables</b> it expects (for example <Code>{'{{name}}'}</Code>).</p>
        <List items={[
          <><b>Approved</b> templates can be sent. Pending or rejected ones are listed but cannot be selected for sending.</>,
          <>To add or change a template, do it in Happilee. New ones appear here the next time you open the page.</>,
        ]} />
      </div>
    ),
  },
  {
    id: 'single', title: 'Sending one message',
    body: (
      <div className="space-y-3">
        <p>Available to every user. Open <Link className="text-primary underline" to="/happilee/send">Send &amp; Broadcast</Link> → <b>Single message</b>.</p>
        <Steps items={[
          <>Search for a lead by name or phone and pick it. You only see leads you are allowed to see. Or leave the lead empty and type a phone number <b>with country code</b>, for example <Code>919876543210</Code>.</>,
          <>Choose an approved template.</>,
          <>Fill in each variable. The preview updates as you type, so you can check the final text.</>,
          <>Click <b>Send template</b>.</>,
        ]} />
        <p>Every send is recorded in the <b>Message Log</b>, including failures and the reason.</p>
      </div>
    ),
  },
  {
    id: 'broadcast', title: 'Broadcasts (admin)',
    body: (
      <div className="space-y-3">
        <p>Send one template to many people. Open <b>Send &amp; Broadcast → Broadcast</b>.</p>
        <Steps items={[
          <>Choose the template and fill the variables. The same values go to every recipient.</>,
          <>Add recipients: search and add leads, and/or paste numbers, one per line, as <Code>name, number</Code> or just the number, always with the country code.</>,
          <>Check the count on the button, click it and confirm.</>,
        ]} />
        <List items={[
          <>Up to <b>1000 recipients</b> per broadcast. Duplicates are removed automatically.</>,
          <>Happilee processes the broadcast in the background, so the log shows it as <b>queued</b>. Happilee does not report per-recipient status through the API.</>,
          <>Only send to people who have agreed to receive your messages. Misuse can get your WhatsApp number restricted.</>,
        ]} />
      </div>
    ),
  },
  {
    id: 'contacts', title: 'Contacts & tags (admin)',
    body: (
      <div className="space-y-3">
        <p>Under <b>Send &amp; Broadcast → Contacts &amp; tags</b>:</p>
        <List items={[
          <><b>Sync leads to Happilee contacts:</b> pick leads, optionally add comma-separated tags, and click Sync. Each lead is created in Happilee with name, phone and email. The result shows how many succeeded and the first error, if any.</>,
          <><b>Update a contact's tags:</b> enter the phone with country code, a tag to add and/or a tag to remove (for example add <Code>paid</Code>, remove <Code>unpaid</Code>).</>,
        ]} />
      </div>
    ),
  },
  {
    id: 'log', title: 'Message Log & delivery status',
    body: (
      <div className="space-y-3">
        <p><Link className="text-primary underline" to="/happilee/messages">Message Log</Link> lists everything sent from this module: time, recipient (or broadcast size), template and status.</p>
        <List items={[
          <><b>sent</b>: accepted by Happilee. Click the refresh icon on a row to fetch the latest status (for example delivered or read).</>,
          <><b>queued</b>: a broadcast handed to Happilee.</>,
          <><b>failed</b>: rejected; the reason is shown under the status.</>,
        ]} />
        <p>The Overview page totals the messages sent and failed.</p>
      </div>
    ),
  },
  {
    id: 'permissions', title: 'Who can do what',
    body: (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2 pr-4">Action</th><th className="py-2">Who</th></tr></thead>
          <tbody className="divide-y">
            {[['View templates and message log', 'Every user in the organisation'], ['Send a single template to a lead', 'Every user (only leads they can see)'], ['Connect / disconnect the API key', 'Organisation admins'], ['Broadcast, sync contacts, edit tags', 'Organisation admins'], ['Turn the module on for an organisation', 'Pype CRM Super Admin']].map(([a, w]) => <tr key={a}><td className="py-2 pr-4">{a}</td><td className="py-2">{w}</td></tr>)}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: 'troubleshooting', title: 'Troubleshooting',
    body: (
      <div className="space-y-4">
        {[
          ['"OpenAPI access from this IP is not authorized"', <>Happilee is blocking the Pype CRM server. Ask Happilee support to allowlist <Code>65.2.169.30</Code>, then try again. A correct key will not work until this is done.</>],
          ['"Invalid Happilee API key"', <>Happilee rejected the key. Re-copy it from Happilee without extra spaces, and confirm API access is enabled on your plan.</>],
          ['Template not found, or not approved', <>The name changed or the template is not approved in Happilee. Open Templates to see its current status.</>],
          ['Message failed to send', <>Open the Message Log and read the reason under "failed". Common causes: wrong number format (include the country code), the recipient has not opted in, or a missing template variable.</>],
          ['No templates in the list', <>Check that the account has approved templates, then use Test connection on the Overview page.</>],
          ['"Happilee is not connected"', <>An admin must add the API key on the Overview page.</>],
          ['Happilee is not enabled', <>The module is off for your organisation. Ask Pype CRM support to switch it on.</>],
        ].map(([q, a]) => <div key={String(q)}><p className="font-medium">{q}</p><p className="text-muted-foreground">{a}</p></div>)}
      </div>
    ),
  },
  {
    id: 'limits', title: 'Current limits',
    body: (
      <List items={[
        <>Templates with a <b>media header</b> or dynamic button links are not filled in from the CRM; only body variables are.</>,
        <>Replies from customers do not appear here. Read and answer them in Happilee.</>,
        <>Broadcast results are shown as queued; per-recipient delivery is not available.</>,
        <>Templates are read-only in the CRM.</>,
      ]} />
    ),
  },
];

export default function HappileeDocs() {
  const [q, setQ] = useState('');
  const sections = q.trim() ? SECTIONS.filter(s => s.title.toLowerCase().includes(q.toLowerCase())) : SECTIONS;
  return (
    <HappileePage title="Happilee Docs" subtitle="How to connect, send, broadcast and troubleshoot">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <Input placeholder="Filter topics…" value={q} onChange={e => setQ(e.target.value)} className="mb-3" />
          <nav className={`${H_CARD} p-2`}>
            {SECTIONS.map((s, i) => <a key={s.id} href={`#hd-${s.id}`} className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"><span className="mr-2 text-xs">{i + 1}.</span>{s.title}</a>)}
          </nav>
        </aside>
        <div className="space-y-5">
          {sections.map(s => (
            <section key={s.id} id={`hd-${s.id}`} className={`${H_CARD} scroll-mt-24 p-5 text-sm leading-relaxed`}>
              <h2 className="mb-3 text-lg font-semibold">{s.title}</h2>
              {s.body}
            </section>
          ))}
          {!sections.length && <p className="text-sm text-muted-foreground">No topics match.</p>}
        </div>
      </div>
    </HappileePage>
  );
}
