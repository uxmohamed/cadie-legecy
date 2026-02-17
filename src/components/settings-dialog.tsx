"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import {
  IconUserFilled,
  IconPaletteFilled,
  IconInfoCircleFilled,
  IconPuzzleFilled,
  IconCapsuleHorizontalFilled,
  IconFileDownloadFilled,
  IconFileUploadFilled,
} from "@tabler/icons-react";

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
import { SettingsSpaces } from "@/components/settings/settings-spaces";
import { SettingsAppearance } from "@/components/settings/settings-appearance";
import { SettingsAbout } from "@/components/settings/settings-about";
import { SettingsExtensions } from "@/components/settings/settings-extensions";
import { SettingsImport } from "@/components/settings/settings-import";
import { SettingsExport } from "@/components/settings/settings-export";

type SettingsSection =
  | "profile"
  | "spaces"
  | "appearance"
  | "extensions"
  | "import"
  | "export"
  | "about";

const navItems = [
  { id: "profile" as const, name: "Profile", icon: IconUserFilled },
  { id: "spaces" as const, name: "Spaces", icon: IconCapsuleHorizontalFilled },
  { id: "appearance" as const, name: "Appearance", icon: IconPaletteFilled },
  { id: "extensions" as const, name: "Extensions", icon: IconPuzzleFilled },
  { id: "import" as const, name: "Import", icon: IconFileDownloadFilled },
  { id: "export" as const, name: "Export", icon: IconFileUploadFilled },
  { id: "about" as const, name: "About", icon: IconInfoCircleFilled },
];

interface SettingsDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdate?: () => void;
}

export function SettingsDialog({ user, open, onOpenChange, onProfileUpdate }: SettingsDialogProps) {
  const [activeSection, setActiveSection] = React.useState<SettingsSection>("profile");

  // Reset to profile when dialog opens
  React.useEffect(() => {
    if (open) {
      setActiveSection("profile");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 max-sm:h-dvh md:max-h-[640px] md:max-w-[800px] lg:max-w-[900px]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Manage your profile and preferences.
        </DialogDescription>
        <SidebarProvider className="items-start h-full">
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
                          className="cursor-pointer py-[18px] px-3 data-[active=true]:!font-normal"
                        >
                          <item.icon className="h-6 w-6" />
                          <span>{item.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-full md:h-[620px] flex-1 flex-col overflow-hidden min-w-0">
            {/* Mobile navigation */}
            <header className="flex h-12 shrink-0 items-center border-b border-border md:hidden">
              <nav className="no-scrollbar flex overflow-x-auto pl-4 pr-12 gap-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                      activeSection === item.id
                        ? "bg-bg-muted text-fg"
                        : "text-fg-muted hover:text-fg"
                    }`}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="whitespace-nowrap">{item.name}</span>
                  </button>
                ))}
              </nav>
            </header>
            {/* Content area */}
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden p-6 min-w-0">
              <h2 className="text-lg font-semibold text-fg">
                {navItems.find((item) => item.id === activeSection)?.name}
              </h2>
              {activeSection === "profile" && <SettingsProfile user={user} onProfileUpdate={onProfileUpdate} />}
              {activeSection === "spaces" && <SettingsSpaces />}
              {activeSection === "appearance" && <SettingsAppearance />}
              {activeSection === "extensions" && <SettingsExtensions />}
              {activeSection === "import" && <SettingsImport />}
              {activeSection === "export" && <SettingsExport />}
              {activeSection === "about" && <SettingsAbout />}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
