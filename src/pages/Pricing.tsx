import LandingNavbar from "@/components/landing/LandingNavbar";
import PricingTable from "@/components/landing/PricingTable";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/shared/SEO";
import { PageTransition, Reveal } from "@/components/shared/MotionReveal";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-jakarta">
      <SEO
        title="Pricing Plans"
        description="Compare Pype CRM plans and choose the right sales and lead-management solution for your team."
        canonical="https://pypecrm.com/pricing"
        keywords="pype crm pricing, crm plans, sales crm pricing, lead management pricing"
      />
      <LandingNavbar />
      <PageTransition><main>
        <section className="px-6 pb-4 pt-32 text-center sm:px-8 md:pt-40">
          <div className="mx-auto max-w-3xl">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-brand-600">Simple per-user pricing</p>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              Enterprise CRM without enterprise complexity
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              Every billing option includes the complete feature set. Choose the term that works for your team and start with a 14-day free trial.
            </p>
          </div>
        </section>
        <Reveal><PricingTable /></Reveal>
        <Reveal><FAQSection /></Reveal>
        <Reveal><CTASection /></Reveal>
      </main></PageTransition>
      <Footer />
    </div>
  );
}
