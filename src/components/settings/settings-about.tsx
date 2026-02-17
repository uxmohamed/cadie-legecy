"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IconBrandX, IconExternalLink, IconMail, IconArrowRight } from "@tabler/icons-react";
import { LogoIcon } from "@/components/logo-icon";

export function SettingsAbout() {
  return (
    <div className="space-y-8">
      {/* App Info */}
      <div className="flex items-center gap-4">
        <LogoIcon className="h-12 w-12" />
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Cadie</h3>
          <p className="text-sm text-fg-muted">Version 1.0.0-beta</p>
        </div>
      </div>

      {/* Legal */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-fg">Legal</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[
            { label: "Terms and Conditions", href: "/terms" },
            { label: "Privacy Policy", href: "/privacy" },
          ].map((item, index, array) => (
            <React.Fragment key={item.href}>
              <a
                href={item.href}
                className="text-fg-muted hover:text-fg transition-colors"
              >
                {item.label}
              </a>
              {index < array.length - 1 && (
                <span className="text-fg-subtle">·</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <Separator />

      {/* Social & Feedback */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-fg">Connect</h3>
        <div className="grid gap-3">
          <div className="rounded-xl border border-border bg-bg-muted p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
                <IconBrandX className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Follow us on X</h4>
                <p className="text-xs text-fg-muted">Get the latest updates and features</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="w-full gap-2"
              render={<a href="https://x.com/cadieapp_" target="_blank" rel="noopener noreferrer" />}
            >
              Follow @cadieapp_
              <IconArrowRight className="h-3 w-3 opacity-50" />
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-bg-muted p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                <IconMail className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-medium">Share Feedback</h4>
                <p className="text-xs text-fg-muted">Found a bug or have an idea?</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="w-full justify-between"
              render={<a href="https://x.com/messages/compose?recipient_id=1649994120725778432" target="_blank" rel="noopener noreferrer" />}
            >
              <span>Send Message</span>
              <IconArrowRight className="h-3 w-3 opacity-50" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
