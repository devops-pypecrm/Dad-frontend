import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Minus, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";

const fallbackPlans = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 29,
    yearlyPrice: 290,
    description: "Perfect for small teams getting started.",
    features: ["5 Users", "Basic CRM", "Email Support", "1,000 Contacts"],
    popular: false,
  },
];

const pricingFaqs = [
  { question: "Do you offer custom pricing for unique teams?", answer: "Yes. We can tailor user limits, onboarding, integrations, and support to match your workflow." },
  { question: "Is there a free trial?", answer: "Yes, you can explore Pype CRM with a 14-day free trial before choosing a plan." },
  { question: "Are there any hidden fees?", answer: "No. Your selected plan and any optional custom services are clearly agreed before billing." },
];

type DisplayPlan = { id?: string; name: string; monthlyPrice: number; yearlyPrice: number; description?: string; features: string[]; popular: boolean };

export default function PricingTable() {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const { data: serverPlans } = useQuery({
    queryKey: ["public-plans"],
    queryFn: async () => (await api.get("/plans")).data.plans,
  });

  const filteredPlans = serverPlans?.length
    ? serverPlans.filter((plan: { name: string }) => !/trail|trial/i.test(plan.name))
    : [];
  const displayPlans: DisplayPlan[] = filteredPlans.length
    ? filteredPlans.slice(0, 1).map((plan: { id: string; name: string; price: number; features?: string[]; maxUsers: number }) => ({
        id: plan.id, name: plan.name, monthlyPrice: plan.price, yearlyPrice: plan.price * 10,
        description: /enterprise/i.test(plan.name) ? "For complex teams and enterprises" : "Built to scale with your sales team",
        features: (plan.features?.length ? plan.features : [`Up to ${plan.maxUsers} users`, "Lead management", "Sales pipeline", "Reporting"]).slice(0, 4),
        popular: /pro|growth/i.test(plan.name),
      }))
    : fallbackPlans;

  return (
    <section id="pricing" className="relative overflow-hidden bg-white py-24 dark:bg-gray-950">
      <div className="container relative z-10 mx-auto px-6 sm:px-8 md:px-12 lg:px-20 xl:px-28">
        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.25fr] lg:gap-20">
          <div className="lg:sticky lg:top-28">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Flexible plans for every team</p>
            <h2 className="max-w-lg text-4xl font-bold leading-[1.08] tracking-tight text-gray-950 dark:text-white md:text-5xl">
              Affordable pricing.<br />Easy scaling.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-gray-600 dark:text-gray-400">
              Choose a plan that fits your business today, with the flexibility to add users, automation, and integrations as you grow.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3 text-sm font-semibold">
              <span className={!isYearly ? "text-gray-950 dark:text-white" : "text-gray-400"}>Monthly</span>
              <Switch checked={isYearly} onCheckedChange={setIsYearly} aria-label="Toggle yearly billing" />
              <span className={isYearly ? "text-gray-950 dark:text-white" : "text-gray-400"}>Yearly</span>
              <span className="rounded-full bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">2 months free</span>
            </div>
            <div className="mt-12 divide-y divide-gray-200 border-y border-gray-200 dark:divide-gray-800 dark:border-gray-800">
              {pricingFaqs.map((faq, index) => {
                const open = openFaq === index;
                return (
                  <div key={faq.question} className="py-4">
                    <button type="button" onClick={() => setOpenFaq(open ? -1 : index)} className="flex w-full items-center justify-between gap-4 text-left text-sm font-bold text-gray-900 dark:text-white" aria-expanded={open}>
                      {faq.question}
                      {open ? <Minus className="h-4 w-4 shrink-0" /> : <Plus className="h-4 w-4 shrink-0" />}
                    </button>
                    <div className={`grid transition-all duration-300 ${open ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <p className="overflow-hidden pr-8 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{faq.answer}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {displayPlans.map((plan, index) => {
              const custom = plan.monthlyPrice === 0;
              const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              return (
                <motion.article key={plan.id || plan.name} initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.45, delay: index * 0.08 }}
                  className={`relative rounded-[24px] border p-6 shadow-sm transition-colors sm:p-7 ${plan.popular ? "border-brand-300 bg-brand-50/80 dark:border-brand-800 dark:bg-brand-950/30" : "border-gray-200 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-900/60"}`}>
                  {plan.popular && <span className="absolute right-5 top-0 -translate-y-1/2 rounded-full bg-brand-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">Most popular</span>}
                  <div className="grid gap-6 sm:grid-cols-[0.9fr_1.1fr] sm:items-center">
                    <div>
                      <p className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white">
                        {custom ? "Custom Pricing" : `₹${price.toLocaleString("en-IN")}`}
                        {!custom && <span className="ml-1 text-xs font-medium text-gray-500">/{isYearly ? "year" : "month"}</span>}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{plan.description}</p>
                      <Button asChild className="mt-5 h-10 rounded-xl bg-gray-950 px-5 text-white shadow-none hover:bg-gray-800 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200">
                        <Link to={`/enquire?plan=${plan.id || plan.name}`}>{custom ? "Talk to sales" : "Get started"}</Link>
                      </Button>
                    </div>
                    <ul className="grid gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      {plan.features.map((feature) => <li key={feature} className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /><span>{feature}</span></li>)}
                    </ul>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
