import Link from "next/link";
import { Logo } from "@/components/logo";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-2">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 sm:py-20 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 md:gap-12">
            {/* Logo & Description */}
            <div>
              <Link href="/" className="inline-block mb-4">
                <Logo className="h-7" />
              </Link>
            </div>

            {/* Resources and Social - Right Side */}
            <div className="grid grid-cols-2 gap-8 md:gap-12">
              {/* Resources */}
              <div>
                <h3 className="text-sm font-semibold text-fg mb-4">
                  Resources
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      href="/changelog"
                      className="text-sm font-[470] text-fg-muted hover:text-fg transition-colors"
                    >
                      Changelog
                    </Link>
                  </li>
                  <li>
                    <a
                      href="https://chromewebstore.google.com/detail/cadie/efcdfndkolpokgobbejhcegfgodfepdd"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-[470] text-fg-muted hover:text-fg transition-colors"
                    >
                      Chrome Extension
                    </a>
                  </li>
                </ul>
              </div>

              {/* Social */}
              <div>
                <h3 className="text-sm font-semibold text-fg mb-4">
                  Social
                </h3>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="https://x.com/uxmohamed_"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-[470] text-fg-muted hover:text-fg transition-colors"
                    >
                      X (Twitter)
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.linkedin.com/company/usecadie/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-[470] text-fg-muted hover:text-fg transition-colors"
                    >
                      LinkedIn
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border-muted py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-fg-subtle">
              © {currentYear} Cadie. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/terms"
                className="text-sm font-[470] text-fg-subtle hover:text-fg transition-colors"
              >
                Terms and Conditions
              </Link>
              <Link
                href="/privacy"
                className="text-sm font-[470] text-fg-subtle hover:text-fg transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
