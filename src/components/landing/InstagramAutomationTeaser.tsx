import { Link } from "react-router-dom";
import { ArrowRight, MessageCircle, UserPlus, Inbox } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { HAPPILEE_IG_KEYFRAMES, IG_GRADIENT, IgAutomationPhone } from "./IgAutomationPreview";

/** Small hook on the home page: a short pitch plus an animated phone, linking to /instagram-automation. */
export default function InstagramAutomationTeaser() {
  return (
    <section className="bg-white px-6 py-20 sm:px-8 md:px-12 lg:px-20 xl:px-28">
      <style>{HAPPILEE_IG_KEYFRAMES}</style>
      <div className="container mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-violet-50 via-white to-pink-50 p-8 md:p-12">
          <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: IG_GRADIENT }} />
          <div className="grid items-center gap-10 md:grid-cols-[1.3fr_1fr]">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-5">
              <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: IG_GRADIENT }}>New · Instagram automation</span>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">Turn Instagram comments into DMs, and DMs into customers</h2>
              <p className="max-w-xl text-gray-600">Someone comments “LINK” on your Reel. A second later they have your message in their inbox, and the lead is already in your CRM.</p>
              <ul className="space-y-2 text-sm text-gray-700">
                {[[MessageCircle, "Keyword comment-to-DM, 24/7"], [UserPlus, "Ask To Follow comment bots"], [Inbox, "One shared inbox for your team"]].map(([Icon, t]: any) => (
                  <li key={t} className="flex items-center gap-2"><Icon className="h-4 w-4 text-violet-600" />{t}</li>
                ))}
              </ul>
              <Button asChild size="lg" className="bg-violet-600 text-white hover:bg-violet-700">
                <Link to="/instagram-automation">See how it works <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
            </motion.div>
            <IgAutomationPhone compact />
          </div>
        </div>
      </div>
    </section>
  );
}
