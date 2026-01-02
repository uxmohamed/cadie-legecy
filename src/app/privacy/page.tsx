import type { Metadata } from "next";
import { ChangelogHeader } from "@/components/changelog/changelog-header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Cadie",
  description: "Privacy Policy for Cadie",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-main-container)]">
      <ChangelogHeader />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 lg:pt-10 pb-12">
          <div className="mb-8 sm:mb-10 lg:mb-12">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text-primary)] font-custom">
              Privacy Policy
            </h1>
          </div>
          <div className="prose prose-lg max-w-none text-[var(--text-primary)]">
            <p className="text-[var(--text-secondary)] mb-6">
              <strong>Cadie</strong> values your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use <a href="http://cadie.app" className="text-[var(--text-primary)] underline hover:text-[var(--text-secondary)]"><strong>cadie.app</strong></a> ("Cadie", "we", "us", or "our").
            </p>
            <p className="text-[var(--text-secondary)] mb-8">
              By using Cadie, you agree to the practices described in this policy.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">Information We Collect</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              Cadie only collects the information needed to provide, secure, and improve the service.
            </p>

            <h3 className="text-xl font-semibold text-[var(--text-primary)] mt-6 mb-3">Information you provide</h3>
            <p className="text-[var(--text-secondary)] mb-2">
              We collect information you provide directly to us, such as:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] mb-4 space-y-1 ml-4">
              <li>Email address when you create an account</li>
              <li>Content you save, such as links, colors, notes, and collections</li>
              <li>Feedback, support requests, or other messages you send to us</li>
            </ul>

            <h3 className="text-xl font-semibold text-[var(--text-primary)] mt-6 mb-3">Information collected automatically</h3>
            <p className="text-[var(--text-secondary)] mb-2">
              When you use Cadie, we may automatically collect:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] mb-4 space-y-1 ml-4">
              <li>Basic usage data to understand how the app is used (for example, feature usage and basic interaction events)</li>
              <li>Device and browser information for performance, debugging, and security</li>
            </ul>
            <p className="text-[var(--text-secondary)] mb-8">
              Cadie <strong>does not sell your personal data</strong>.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">How We Use Your Information</h2>
            <p className="text-[var(--text-secondary)] mb-2">
              We use your information to:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] mb-4 space-y-1 ml-4">
              <li>Provide and maintain the Cadie service</li>
              <li>Sync your saved items across your devices</li>
              <li>Improve app performance, reliability, and usability</li>
              <li>Communicate with you about updates, security notices, or support requests</li>
              <li>Protect Cadie and its users, including detecting and preventing abuse or misuse</li>
            </ul>
            <p className="text-[var(--text-secondary)] mb-8">
              We use your data only for operating and improving Cadie and for communicating with you where necessary.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">Data Storage and Security</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              Your data is stored using trusted infrastructure and industry-standard security practices.
            </p>
            <p className="text-[var(--text-secondary)] mb-2">
              We take reasonable steps to protect your information, including:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] mb-4 space-y-1 ml-4">
              <li>Using secure connections (HTTPS) where appropriate</li>
              <li>Applying access controls to production systems</li>
            </ul>
            <p className="text-[var(--text-secondary)] mb-8">
              However, no online service can ever be completely secure. You are responsible for keeping your account credentials and devices safe.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">Third-Party Services</h2>
            <p className="text-[var(--text-secondary)] mb-2">
              Cadie may use trusted third-party providers for:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] mb-4 space-y-1 ml-4">
              <li>Hosting and infrastructure</li>
              <li>Analytics and performance monitoring</li>
              <li>Error tracking and logging</li>
            </ul>
            <p className="text-[var(--text-secondary)] mb-4">
              These services receive only the minimum data required to operate and are contractually obligated to protect your information and use it only for providing their service to us.
            </p>
            <p className="text-[var(--text-secondary)] mb-8">
              We do not allow third parties to use your data for their own advertising or for selling your personal information.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">Cookies and Similar Technologies</h2>
            <p className="text-[var(--text-secondary)] mb-2">
              Cadie may use cookies or similar technologies to:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] mb-4 space-y-1 ml-4">
              <li>Keep you signed in</li>
              <li>Remember your preferences</li>
              <li>Improve performance and reliability</li>
              <li>Understand high-level usage patterns</li>
            </ul>
            <p className="text-[var(--text-secondary)] mb-8">
              You can choose to disable cookies in your browser settings. If you do, some features of Cadie may not work properly.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">Your Rights</h2>
            <p className="text-[var(--text-secondary)] mb-2">
              Depending on your location, you may have the right to:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] mb-4 space-y-1 ml-4">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your account and associated personal data, subject to legal requirements</li>
            </ul>
            <p className="text-[var(--text-secondary)] mb-8">
              You can usually manage your account and content directly in the app. If you need additional help, contact us using the email below.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">Data Retention</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              We keep your data for as long as your account is active or as needed to provide the service.
            </p>
            <p className="text-[var(--text-secondary)] mb-8">
              If you delete your account, we will delete or anonymize your personal data within a reasonable period, except where we are required to retain certain information for legal, security, or operational reasons.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">Changes to This Policy</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              We may update this Privacy Policy from time to time.
            </p>
            <p className="text-[var(--text-secondary)] mb-4">
              If we make material changes, we may provide additional notice (for example, in the app or by email, where appropriate). The "Effective date" at the bottom of this page will always show when this policy was last updated.
            </p>
            <p className="text-[var(--text-secondary)] mb-8">
              By continuing to use Cadie after an update becomes effective, you agree to the revised Privacy Policy.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">Contact</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              If you have any questions about this Privacy Policy or how Cadie handles your data, you can contact us at:
            </p>
            <p className="text-[var(--text-secondary)] mb-2">
              <strong>Email:</strong> <a href="mailto:mo73426@gmail.com" className="text-[var(--text-primary)] underline hover:text-[var(--text-secondary)]">mo73426@gmail.com</a>
            </p>
            <p className="text-[var(--text-secondary)] mb-2">
              <strong>Website:</strong> <a href="http://cadie.app" className="text-[var(--text-primary)] underline hover:text-[var(--text-secondary)]">cadie.app</a>
            </p>
            <p className="text-[var(--text-secondary)] mb-8">
              <strong>Address:</strong> Aswan, Egypt
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <p className="text-[var(--text-secondary)] mb-2">
              <strong>Effective date:</strong> December 27, 2025
            </p>
            <p className="text-[var(--text-secondary)]">
              © 2025 Cadie
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
