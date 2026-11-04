import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";

const billingTerms = [
  { id: "monthly", eyebrow: "1 month", price: 299, standardPrice: 599, effective: "₹299 per user / month", description: "Month-to-month access with no long-term commitment. A practical way to try Pype CRM with your team.", cta: "Start monthly" },
  { id: "quarterly", eyebrow: "3 months", price: 799, standardPrice: 1797, effective: "≈ ₹266 per user / month", description: "Billed once for the full quarter at a reduced rate—ideal for teams settling into their workflow.", saving: "Save 11%", cta: "Choose quarterly" },
  { id: "yearly", eyebrow: "Yearly", price: 2499, standardPrice: 7188, effective: "≈ ₹208 per user / month", description: "The lowest effective monthly rate with a full year of uninterrupted access for long-term teams.", saving: "Save 30%", cta: "Choose yearly", popular: true },
];

const includedFeatures = [
  "Hierarchy-based reporting",
  "Target assignment and achievement tracking",
  "Incentive calculation",
  "Lead assignment and utilisation reports",
  "Facebook Page, Meta Ads and WhatsApp connections",
  "AI lead scoring and next-step suggestions",
  "Daily reports to owners",
  "EMI scheduling and tracking",
  "Android mobile app",
];

const pricingFaqs = [
  { question: "Does every billing term include the same features?", answer: "Yes. Monthly, quarterly and yearly billing all include the complete Enterprise feature set. Only the commitment period and effective monthly price change." },
  { question: "Is there a free trial?", answer: "Yes. Every billing option starts with a 14-day free trial so your team can evaluate Pype CRM before committing." },
  { question: "How does billing work?", answer: "Prices are per user and the selected term is billed upfront. Prices exclude 18% GST. A one-time implementation fee may apply per organisation." },
];

export default function PricingTable() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <section id="pricing" className="bg-white py-20 dark:bg-gray-950 sm:py-24">
      <div className="container mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col justify-between gap-5 border-b border-gray-200 pb-8 dark:border-gray-800 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">One product. Three billing options.</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-4xl">Full Enterprise access from ₹208 per user/month</h2>
              <p className="mt-3 text-base leading-relaxed text-gray-600 dark:text-gray-400">Choose how long you want to commit. Features stay exactly the same on every option.</p>
            </div>
            <div className="shrink-0 text-left md:text-right">
              <p className="text-sm font-semibold text-gray-950 dark:text-white">14-day free trial</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">No feature restrictions during trial</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {billingTerms.map((term, index) => (
              <motion.article key={term.id} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.38, delay: index * 0.06 }} className={`relative flex min-h-[390px] flex-col rounded-2xl border bg-white p-6 dark:bg-gray-900 ${term.popular ? "border-brand-500 shadow-[0_12px_35px_rgba(52,168,83,0.10)]" : "border-gray-200 dark:border-gray-800"}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">{term.eyebrow}</p>
                  {term.popular && <span className="rounded-full bg-brand-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Best value</span>}
                </div>
                <div className="mt-7">
                  <div className="flex items-end gap-2"><span className="text-4xl font-bold tracking-tight text-gray-950 dark:text-white">₹{term.price.toLocaleString("en-IN")}</span><span className="pb-1 text-sm text-gray-500 dark:text-gray-400">/ user</span></div>
                  <p className="mt-2 text-sm text-gray-400 line-through dark:text-gray-500">₹{term.standardPrice.toLocaleString("en-IN")} standard price</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{term.effective}</p>
                  <div className="mt-3 h-5">{term.saving && <span className="text-xs font-bold text-brand-700 dark:text-brand-400">{term.saving} compared with monthly</span>}</div>
                </div>
                <p className="mt-5 flex-1 text-sm leading-6 text-gray-600 dark:text-gray-400">{term.description}</p>
                <Link to={`/enquire?plan=${term.id}`} className={`mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-colors ${term.popular ? "bg-brand-600 text-white hover:bg-brand-700" : "bg-gray-950 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"}`}>{term.cta}<ArrowRight className="h-4 w-4" /></Link>
              </motion.article>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/60 sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Included in every plan</p>
                <h3 className="mt-3 text-2xl font-bold tracking-tight text-gray-950 dark:text-white">The complete CRM, without feature gating</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">Your team receives the full Enterprise feature set regardless of the billing term selected.</p>
              </div>
              <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {includedFeatures.map((feature) => <li key={feature} className="flex items-start gap-3 text-sm leading-5 text-gray-700 dark:text-gray-300"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-400"><Check className="h-3 w-3" strokeWidth={3} /></span><span>{feature}</span></li>)}
              </ul>
            </div>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_0.65fr]">
            <div className="divide-y divide-gray-200 border-y border-gray-200 dark:divide-gray-800 dark:border-gray-800">
              {pricingFaqs.map((faq, index) => {
                const open = openFaq === index;
                return <div key={faq.question} className="py-4"><button type="button" onClick={() => setOpenFaq(open ? -1 : index)} className="flex w-full items-center justify-between gap-4 text-left text-sm font-bold text-gray-900 dark:text-white" aria-expanded={open}>{faq.question}{open ? <Minus className="h-4 w-4 shrink-0" /> : <Plus className="h-4 w-4 shrink-0" />}</button><div className={`grid transition-all duration-300 ${open ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}><p className="overflow-hidden pr-8 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{faq.answer}</p></div></div>;
              })}
            </div>
            <aside className="rounded-2xl border border-gray-200 p-6 dark:border-gray-800">
              <p className="text-sm font-bold text-gray-950 dark:text-white">Need help choosing?</p>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">Talk to our team about rollout, user count and implementation.</p>
              <a href="mailto:info@pypecrm.com" className="mt-5 block text-sm font-semibold text-brand-700 hover:underline dark:text-brand-400">info@pypecrm.com</a>
              <a href="tel:+918448119359" className="mt-2 block text-sm font-semibold text-gray-900 hover:underline dark:text-white">+91 84481 19359</a>
            </aside>
          </div>
          <p className="mt-8 text-center text-xs leading-5 text-gray-500 dark:text-gray-400">All prices are per user and exclude 18% GST. Plans are billed upfront for the selected term. A one-time implementation fee may apply per organisation.</p>
        </div>
      </div>
    </section>
  );
}
