"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { IconUser, IconPalette } from "@tabler/icons-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { SettingsProfile } from "@/components/settings/settings-profile";
import { SettingsAppearance } from "@/components/settings/settings-appearance";

type SettingsSection = "profile" | "appearance";

const navItems = [
  { id: "profile" as const, name: "Profile", icon: IconUser },
  { id: "appearance" as const, name: "Appearance", icon: IconPalette },
];

interface SettingsDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ user, open, onOpenChange }: SettingsDialogProps) {
  const [activeSection, setActiveSection] = React.useState<SettingsSection>("profile");

  // Reset to profile when dialog opens
  React.useEffect(() => {
    if (open) {
      setActiveSection("profile");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Manage your profile and preferences.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navItems.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={activeSection === item.id}
                          onClick={() => setActiveSection(item.id)}
                          className="cursor-pointer"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
            {/* Mobile navigation */}
            <header className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--border-primary)] px-4 md:hidden">
              <nav className="flex gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                      activeSection === item.id
                        ? "bg-[var(--bg-field)] text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </button>
                ))}
              </nav>
            </header>
            {/* Content area */}
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {navItems.find((item) => item.id === activeSection)?.name}
              </h2>
              {activeSection === "profile" && <SettingsProfile user={user} />}
              {activeSection === "appearance" && <SettingsAppearance />}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
