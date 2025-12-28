import type { Metadata } from "next";
import { ChangelogHeader } from "@/components/changelog/changelog-header";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Terms of Service | Cadie",
  description: "Terms of Service for Cadie",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-main-container)]">
      <ChangelogHeader />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 lg:pt-10 pb-12">
          <div className="mb-8 sm:mb-10 lg:mb-12">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text-primary)] font-custom">
              Terms of Service
            </h1>
          </div>
          <div className="prose prose-lg max-w-none text-[var(--text-primary)]">
            <p className="text-[var(--text-secondary)] mb-8">
              <strong>Last updated:</strong> December 27, 2025
            </p>
            <p className="text-[var(--text-secondary)] mb-6">
              Welcome to <strong>Cadie</strong> ("Cadie", "we", "us", or "our"). These Terms of Service ("Terms") govern your access to and use of Cadie, including <a href="http://cadie.app" className="text-[var(--text-primary)] underline hover:text-[var(--text-secondary)]">cadie.app</a> and any related apps, extensions, or services (collectively, the "Service").
            </p>
            <p className="text-[var(--text-secondary)] mb-8">
              By creating an account or using Cadie, you agree to be bound by these Terms. If you do not agree, you must not use the Service.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">1. Eligibility</h2>
            <p className="text-[var(--text-secondary)] mb-2">
              To use Cadie, you must:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] mb-4 space-y-1 ml-4">
              <li>Be at least 13 years old or the minimum age required in your country to use online services.</li>
              <li>Have the legal capacity to enter into a binding agreement.</li>
              <li>Use the Service in compliance with these Terms and all applicable laws.</li>
            </ul>
            <p className="text-[var(--text-secondary)] mb-8">
              If you use Cadie on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">2. Your Account</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              To access Cadie, you may need to create an account.
            </p>
            <p className="text-[var(--text-secondary)] mb-2">
              You agree to:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] mb-4 space-y-1 ml-4">
              <li>Provide accurate and up-to-date information when creating your account.</li>
              <li>Keep your login credentials secure and confidential.</li>
              <li>Be responsible for all activity that occurs under your account.</li>
            </ul>
            <p className="text-[var(--text-secondary)] mb-4">
              You must notify us promptly if you become aware of any unauthorized access to or use of your account.
            </p>
            <p className="text-[var(--text-secondary)] mb-8">
              We may suspend or terminate your account if we believe you have violated these Terms or used the Service in a harmful or abusive way.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">3. Using Cadie</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              Cadie allows you to save and organize <strong>links, colors, notes, and collections</strong> and sync them across your devices.
            </p>
            <p className="text-[var(--text-secondary)] mb-2">
              You agree <strong>not</strong> to use Cadie to:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] mb-4 space-y-1 ml-4">
              <li>Break any laws or regulations.</li>
              <li>Infringe on the rights of others, including privacy, publicity, or intellectual property rights.</li>
              <li>Upload, save, or share illegal, harmful, hateful, or abusive content.</li>
              <li>Spread spam, malware, or other malicious content.</li>
              <li>Attempt to gain unauthorized access to any part of the Service, other accounts, or systems.</li>
              <li>Interfere with or disrupt the normal operation or security of the Service.</li>
            </ul>
            <p className="text-[var(--text-secondary)] mb-8">
              We may investigate and take action (including limiting access, removing content, or terminating accounts) if we believe your use of the Service violates these Terms or harms other users or Cadie.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">4. Your Content</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              "Content" means any links, colors, notes, collections, or other data you save or upload to Cadie ("Your Content").
            </p>
            <p className="text-[var(--text-secondary)] mb-2">
              You:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] mb-4 space-y-1 ml-4">
              <li>Keep ownership of Your Content.</li>
              <li>Are responsible for Your Content and for making sure it does not violate any laws or third-party rights.</li>
            </ul>
            <p className="text-[var(--text-secondary)] mb-4">
              By using Cadie, you grant us a limited, non-exclusive, worldwide license to use, store, display, process, and back up Your Content <strong>only as necessary to operate, maintain, and improve the Service</strong> (for example, to sync your data across devices, create backups, or display your items in the app).
            </p>
            <p className="text-[var(--text-secondary)] mb-4">
              We do <strong>not</strong> sell Your Content or use it to build advertising profiles.
            </p>
            <p className="text-[var(--text-secondary)] mb-8">
              We may remove or restrict access to Content that we reasonably believe violates these Terms or applicable law.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">5. Data, Privacy, and Security</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              Your use of Cadie is also governed by our <strong>Privacy Policy</strong>, which explains how we collect, use, and protect your information.
            </p>
            <p className="text-[var(--text-secondary)] mb-4">
              By using the Service, you agree that we can handle your data as described in the Privacy Policy.
            </p>
            <p className="text-[var(--text-secondary)] mb-8">
              We take reasonable measures to protect your data, but no system is completely secure. You are responsible for keeping your device and account credentials safe.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">6. Third-Party Services</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              Cadie may use third-party services for hosting, analytics, and error monitoring. These providers only receive the minimum data needed to operate and are required to protect your information as described in our Privacy Policy.
            </p>
            <p className="text-[var(--text-secondary)] mb-8">
              The Service may also include links to third-party websites or services that we do not control. We are not responsible for their content, policies, or practices. Your use of third-party services is at your own risk and may be governed by separate terms and privacy policies.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">7. Service Changes and Availability</h2>
            <p className="text-[var(--text-secondary)] mb-2">
              We are always working to improve Cadie. As a result, we may:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] mb-4 space-y-1 ml-4">
              <li>Add, change, or remove features.</li>
              <li>Limit access to parts or all of the Service.</li>
              <li>Suspend or stop the Service temporarily or permanently.</li>
            </ul>
            <p className="text-[var(--text-secondary)] mb-8">
              We are not liable for any changes, suspensions, or discontinuation of the Service, as long as we act in line with applicable laws.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">8. Subscription, Payments, and Fees (if applicable)</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              Some parts of Cadie may be offered for a fee, such as premium features or higher usage limits.
            </p>
            <p className="text-[var(--text-secondary)] mb-2">
              If you choose a paid plan, you agree to:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] mb-4 space-y-1 ml-4">
              <li>Pay all applicable fees described at the time of purchase.</li>
              <li>Allow us or our payment processor to charge your chosen payment method.</li>
            </ul>
            <p className="text-[var(--text-secondary)] mb-4">
              Unless otherwise stated, subscriptions:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] mb-4 space-y-1 ml-4">
              <li>Renew automatically at the end of each billing period.</li>
              <li>Can be canceled at any time, but fees already paid are generally non-refundable except where required by law.</li>
            </ul>
            <p className="text-[var(--text-secondary)] mb-8">
              We may change pricing or plans in the future. If we do, we will provide notice where required, and changes will apply from the next billing cycle or as stated in the notice.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">9. Termination</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              You may stop using Cadie and delete your account at any time, as described in the app or by contacting us.
            </p>
            <p className="text-[var(--text-secondary)] mb-2">
              We may suspend or terminate your access to the Service, with or without notice, if:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] mb-4 space-y-1 ml-4">
              <li>You violate these Terms or applicable law.</li>
              <li>We are required to do so by law.</li>
              <li>Providing the Service is no longer commercially or technically viable.</li>
            </ul>
            <p className="text-[var(--text-secondary)] mb-4">
              If your account is terminated, Your Content may be deleted or become inaccessible, subject to any legal obligations we have to retain certain data.
            </p>
            <p className="text-[var(--text-secondary)] mb-8">
              Sections of these Terms that by their nature should survive termination (such as intellectual property, disclaimers, and limitations of liability) will continue to apply.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">10. Disclaimer of Warranties</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              Cadie is provided <strong>"as is"</strong> and <strong>"as available"</strong>.
            </p>
            <p className="text-[var(--text-secondary)] mb-2">
              To the maximum extent permitted by law, we do not make any promises or warranties about the Service, including that it will be:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] mb-4 space-y-1 ml-4">
              <li>Error-free or uninterrupted.</li>
              <li>Secure or free from harmful components.</li>
              <li>Compatible with every device or configuration.</li>
            </ul>
            <p className="text-[var(--text-secondary)] mb-8">
              You use Cadie at your own risk.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">11. Limitation of Liability</h2>
            <p className="text-[var(--text-secondary)] mb-2">
              To the maximum extent permitted by law, Cadie and its operators are <strong>not</strong> liable for:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] mb-4 space-y-1 ml-4">
              <li>Any indirect, incidental, special, consequential, or punitive damages.</li>
              <li>Loss of data, profits, revenue, or business opportunities.</li>
              <li>Any damage resulting from your use of or inability to use the Service.</li>
            </ul>
            <p className="text-[var(--text-secondary)] mb-4">
              Where our liability cannot be excluded under applicable law, it will be limited to the amount you paid (if any) for the Service during the <strong>last 3 months</strong> before the event giving rise to the claim.
            </p>
            <p className="text-[var(--text-secondary)] mb-8">
              Some jurisdictions do not allow certain limitations of liability, so some of the above may not apply to you.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">12. Indemnification</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              You agree to indemnify and hold harmless the operator of Cadie, its affiliates, and their respective owners, employees, and agents from and against any claims, damages, losses, liabilities, and expenses (including reasonable legal fees) arising out of or related to:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] mb-8 space-y-1 ml-4">
              <li>Your use of the Service.</li>
              <li>Your violation of these Terms.</li>
              <li>Your violation of any rights of another person or entity.</li>
            </ul>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">13. Governing Law</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              These Terms are governed by the laws of <strong>Egypt</strong>, without regard to its conflict-of-law rules.
            </p>
            <p className="text-[var(--text-secondary)] mb-8">
              Any disputes arising from or relating to these Terms or the Service will be subject to the exclusive jurisdiction of the courts located in <strong>Aswan, Egypt</strong>, unless applicable law requires otherwise.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">14. Changes to These Terms</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              We may update these Terms from time to time. When we do, we will:
            </p>
            <ul className="list-disc list-inside text-[var(--text-secondary)] mb-4 space-y-1 ml-4">
              <li>Update the "Last updated" date at the top of this page.</li>
              <li>Provide additional notice if the changes are material (for example, within the app or by email, where appropriate).</li>
            </ul>
            <p className="text-[var(--text-secondary)] mb-8">
              By continuing to use Cadie after the updated Terms become effective, you agree to be bound by the new version.
            </p>

            <hr className="border-[var(--border-primary)] my-8" />

            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-8 mb-4">15. Contact</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              If you have any questions about these Terms or Cadie, you can contact us at:
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

            <p className="text-[var(--text-secondary)]">
              © 2025 Cadie. All rights reserved.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
