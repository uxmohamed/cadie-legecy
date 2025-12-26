"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { IconBrandX, IconExternalLink } from "@tabler/icons-react";
import Image from "next/image";

export function SettingsAbout() {
  return (
    <div className="space-y-6">
      {/* App Info */}
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center shadow-sm overflow-hidden">
          <Image
            src="/icon.svg"
            alt="Cadie"
            width={32}
            height={32}
            className="text-white"
          />
        </div>
        <div>
          <h3 className="text-base font-semibold">Cadie</h3>
          <p className="text-sm text-[var(--text-secondary)]">1.0.0-beta</p>
        </div>
      </div>

      {/* Legal */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Legal</h3>
        <div className="space-y-1">
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-[var(--brand-primary)] hover:opacity-80 transition-opacity"
          >
            Terms and Conditions
          </a>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-[var(--brand-primary)] hover:opacity-80 transition-opacity"
          >
            Privacy Policy
          </a>
          <a
            href="/licenses"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-[var(--brand-primary)] hover:opacity-80 transition-opacity"
          >
            License and Open Source Notes
          </a>
        </div>
      </div>

      {/* Social */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Social</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-3">
          Interested in new and upcoming features for Cadie? Follow us on X and be the first one to know!
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          asChild
        >
          <a
            href="https://x.com/cadieapp_"
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconBrandX className="h-4 w-4" />
            Follow @cadieapp_ on X
            <IconExternalLink className="h-3 w-3 opacity-50" />
          </a>
        </Button>
      </div>

      {/* Send Feedback */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Send Feedback</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-3">
          Have an idea, feature request, or found a bug? Let us know, and we&apos;ll take a look at it!
        </p>
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <a
            href="https://x.com/messages/compose?recipient_id=1649994120725778432"
            target="_blank"
            rel="noopener noreferrer"
          >
            Send Feedback
          </a>
        </Button>
      </div>
    </div>
  );
}
