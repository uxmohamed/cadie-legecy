"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IconBrandX, IconExternalLink, IconMail, IconArrowRight } from "@tabler/icons-react";
import Image from "next/image";

export function SettingsAbout() {
  return (
    <div className="space-y-8">
      {/* App Info */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 flex items-center justify-center overflow-hidden">
          <Image
            src="/icon.svg"
            alt="Cadie"
            width={36}
            height={36}
            className="text-white"
          />
        </div>
        <div>
          <h3 className="text-xl font-semibold tracking-tight">Cadie</h3>
          <p className="text-sm text-[var(--text-secondary)]">Version 1.0.0-beta</p>
        </div>
      </div>

      <Separator />

      {/* Legal */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">Legal</h3>
        <div className="grid gap-2">
          {[
            { label: "Terms and Conditions", href: "/terms" },
            { label: "Privacy Policy", href: "/privacy" },
            { label: "License and Open Source Notes", href: "/licenses" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-lg bg-[var(--bg-field)] p-3 text-sm transition-all hover:bg-[var(--bg-element-hover)]"
            >
              <span className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                {item.label}
              </span>
              <IconExternalLink className="h-4 w-4 text-[var(--icon-tertiary)] group-hover:text-[var(--icon-secondary)]" />
            </a>
          ))}
        </div>
      </div>

      <Separator />

      {/* Social & Feedback */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">Connect</h3>
        <div className="grid gap-3">
          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-field)] p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
                <IconBrandX className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Follow us on X</h4>
                <p className="text-xs text-[var(--text-secondary)]">Get the latest updates and features</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2" asChild>
              <a href="https://x.com/cadieapp_" target="_blank" rel="noopener noreferrer">
                Follow @cadieapp_
                <IconArrowRight className="h-3 w-3 opacity-50" />
              </a>
            </Button>
          </div>

          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-field)] p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-white">
                <IconMail className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Share Feedback</h4>
                <p className="text-xs text-[var(--text-secondary)]">Found a bug or have an idea?</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2" asChild>
              <a href="https://x.com/messages/compose?recipient_id=1649994120725778432" target="_blank" rel="noopener noreferrer">
                Send Message
                <IconArrowRight className="h-3 w-3 opacity-50" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
