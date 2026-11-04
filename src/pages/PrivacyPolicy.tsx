import { Link } from "react-router-dom";
import LandingNavbar from "@/components/landing/LandingNavbar";
import Footer from "@/components/landing/Footer";
import SEO from "@/components/shared/SEO";
import { Shield, Lock, Eye, FileText, Trash2 } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 font-sans">
      <SEO
        title="Privacy Policy | Pype CRM"
        description="Our commitment to your security. Read the Pype CRM privacy policy to understand how we protect your data and ensure compliance."
        canonical="https://pypecrm.com/privacy"
      />
      <LandingNavbar />
      <main className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400 mb-6">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Privacy Policy - Pype CRM
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Last Updated: November 4, 2026
            </p>
          </div>

          <div className="space-y-12 text-gray-700 dark:text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                1. Introduction
              </h2>
              <p>
                Welcome to Pype CRM ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our CRM services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Eye className="h-6 w-6 text-blue-600" />
                2. Information We Collect
              </h2>
              <p className="mb-4">
                We collect personal information that you voluntarily provide to us when you register for an account, express an interest in obtaining information about us or our products, or otherwise contact us. This may include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name and contact data (Email, Phone, Address)</li>
                <li>Credentials (Passwords and similar security information)</li>
                <li>Payment data (Processed through secure third-party providers)</li>
                <li>CRM data (Leads, contacts, and opportunities you manage on our platform)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Lock className="h-6 w-6 text-blue-600" />
                3. How We Use Your Information
              </h2>
              <p className="mb-4">
                We use personal information collected via our Services for a variety of business purposes, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>To facilitate account creation and logon process</li>
                <li>To send administrative information to you</li>
                <li>To fulfill and manage your orders and subscriptions</li>
                <li>To protect our Services and ensure security</li>
                <li>To respond to user inquiries and offer support</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Lock className="h-6 w-6 text-blue-600" />
                The Pype CRM mobile app (Android)
              </h2>
              <p className="mb-4">
                Pype CRM is provided by Prohostix LLP. The Pype CRM mobile app is a companion to the web CRM: accounts are created by your organisation's administrator, and you sign in with the email and password you were given. There is no advertising and no third-party analytics or tracking in the app. What the app handles, and why:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account and CRM data</strong> — your name, email, role, and the leads, contacts, accounts, opportunities, follow-ups, quotes and notes your organisation manages in Pype CRM. It is shown to you and sent to our servers over HTTPS. Your organisation's administrators can see data entered by users in that organisation.</li>
                <li><strong>Sign-in token</strong> — after you sign in, a session token is kept in the phone's secure storage so you stay signed in. Signing out removes it.</li>
                <li><strong>Location</strong> — only when you tap Check-in (field visits), the app reads the phone's precise location once and sends it with the check-in. The app does not track your location in the background.</li>
                <li><strong>Camera and photos</strong> — only when you choose to take or attach a photo (for example a check-in photo or profile picture). The photo is uploaded to our servers.</li>
                <li><strong>Device information and push notifications</strong> — the app registers a push token and basic device details (model and a device identifier) so we can deliver notifications (for example "a lead was assigned to you") to the phones you are signed in on, and so you can see and sign out your devices. Notification delivery uses Google Firebase Cloud Messaging, which receives the token and the notification text.</li>
                <li><strong>On-device storage</strong> — some data is cached on the phone to make the app faster; signing out clears the sign-in state.</li>
                <li><strong>Phone, WhatsApp and email</strong> — tapping a call, WhatsApp or email button opens the corresponding app on your phone. The app does not read your call log, SMS or contacts.</li>
              </ul>
              <p className="mt-4">
                We do not sell personal data. Data is shared only with your organisation's Pype CRM users according to their roles, and with the service providers needed to run the product (hosting, Google Firebase Cloud Messaging for push notifications). Data is kept while your organisation's account is active and removed on a valid deletion request as described below. The app is intended for working adults and is not directed at children.
              </p>
            </section>
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                4. Data Security
              </h2>
              <p>
                We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure. Although we will do our best to protect your personal information, transmission of personal information to and from our Services is at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Trash2 className="h-6 w-6 text-blue-600" />
                5. User Data Deletion
              </h2>
              <p className="mb-4">
                You have the right to request the deletion of your personal data held by us. Send
                an email to{" "}
                <a
                  href="mailto:support@pypecrm.com"
                  className="text-blue-600 font-medium hover:underline"
                >
                  support@pypecrm.com
                </a>{" "}
                with the subject "Data Deletion Request", including the email address associated
                with your account. Full details on the process, timeframe, and what gets deleted
                are on our{" "}
                <Link to="/data-deletion" className="text-blue-600 font-medium hover:underline">
                  Data Deletion page
                </Link>
                .
              </p>
            </section>

            <section className="p-8 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                6. Contact Us
              </h2>
              <p className="mb-4">
                If you have questions or comments about this policy, you may email us at:
              </p>
              <a href="mailto:support@pypecrm.com" className="text-blue-600 font-bold hover:underline">
                support@pypecrm.com
              </a>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
