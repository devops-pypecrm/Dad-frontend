import LandingNavbar from "@/components/landing/LandingNavbar";
import FeatureSpotlight from "@/components/landing/FeatureSpotlight";
import FeatureSection from "@/components/landing/FeatureSection";
import IntegrationSection from "@/components/landing/IntegrationSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/shared/SEO";
import { PageTransition, Reveal } from "@/components/shared/MotionReveal";

export default function Features() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-jakarta">
      <SEO
        title="CRM Features & Sales Automation"
        description="Explore Pype CRM's lead management, workflow automation, reporting, integrations, and AI-powered sales tools."
        canonical="https://pypecrm.com/features"
        keywords="crm features, sales automation, lead management, crm integrations, ai crm"
      />
      <LandingNavbar />
      <PageTransition><main>
        <section className="px-6 pb-12 pt-32 text-center sm:px-8 md:pt-40">
          <div className="mx-auto max-w-3xl">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-brand-600">Product features</p>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              Everything your team needs to close more deals
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              Manage every lead, automate repetitive work, and give your team a complete view of the customer journey.
            </p>
          </div>
        </section>
        <Reveal><FeatureSpotlight /></Reveal>
        <Reveal><FeatureSection /></Reveal>
        <Reveal><IntegrationSection /></Reveal>
        <Reveal><CTASection /></Reveal>
      </main></PageTransition>
      <Footer />
    </div>
  );
}
