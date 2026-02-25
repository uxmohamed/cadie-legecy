"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import {
  IconUserFilled,
  IconPaletteFilled,
  IconInfoCircleFilled,
  IconPuzzleFilled,
  IconCapsuleHorizontalFilled,
  IconExchangeFilled,
  IconCreditCardFilled,
} from "@tabler/icons-react";
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
import { SettingsData } from "@/components/settings/settings-data";
import { SettingsBilling } from "@/components/settings/settings-billing";

type SettingsSection =
  | "profile"
  | "spaces"
  | "billing"
  | "appearance"
  | "extensions"
  | "data"
  | "about";

const navItems = [
  { id: "profile" as const, name: "Profile", icon: IconUserFilled },
  { id: "spaces" as const, name: "Spaces", icon: IconCapsuleHorizontalFilled },
  { id: "billing" as const, name: "Billing", icon: IconCreditCardFilled },
  { id: "appearance" as const, name: "Appearance", icon: IconPaletteFilled },
  { id: "extensions" as const, name: "Extensions", icon: IconPuzzleFilled },
  { id: "data" as const, name: "Data", icon: IconExchangeFilled },
  { id: "about" as const, name: "About", icon: IconInfoCircleFilled },
];

// Mock user for preview purposes
const MOCK_USER: User = {
  id: "preview-user-id",
  app_metadata: {},
  user_metadata: {
    full_name: "Hassan Aboray",
    avatar_url: "",
    email: "hassan@cadie.app",
  },
  aud: "authenticated",
  created_at: new Date().toISOString(),
  email: "hassan@cadie.app",
  role: "authenticated",
  updated_at: new Date().toISOString(),
};

function getSectionFromUrl(): SettingsSection {
  if (typeof window === "undefined") return "profile";
  const params = new URLSearchParams(window.location.search);
  const section = params.get("section") as SettingsSection | null;
  if (section && navItems.find((item) => item.id === section)) return section;
  return "profile";
}

export default function SettingsPreviewPage() {
  const [activeSection, setActiveSection] = React.useState<SettingsSection>("profile");

  // Read section from URL query params on mount (avoids Suspense from useSearchParams)
  React.useEffect(() => {
    setActiveSection(getSectionFromUrl());
  }, []);

  return (
    <div className="min-h-screen bg-bg-scrim flex items-center justify-center p-8">
      {/* Settings dialog rendered as a full page element (no modal wrapper) */}
      <div className="overflow-hidden rounded-xl bg-bg-elevated shadow-lg w-full max-w-[900px] h-[640px] border border-border">
        <SidebarProvider className="items-start h-full">
          <Sidebar collapsible="none" className="flex">
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
          <main className="flex h-full flex-1 flex-col overflow-hidden min-w-0 border-l border-border">
            {/* Content area */}
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden p-6 min-w-0">
              <h2 className="text-lg font-semibold text-fg">
                {navItems.find((item) => item.id === activeSection)?.name}
              </h2>
              {activeSection === "profile" && (
                <SettingsProfile user={MOCK_USER} onProfileUpdate={() => {}} />
              )}
              {activeSection === "spaces" && <SettingsSpaces />}
              {activeSection === "billing" && <SettingsBilling />}
              {activeSection === "appearance" && <SettingsAppearance />}
              {activeSection === "extensions" && <SettingsExtensions />}
              {activeSection === "data" && <SettingsData />}
              {activeSection === "about" && <SettingsAbout />}
            </div>
          </main>
        </SidebarProvider>
      </div>
    </div>
  );
}
