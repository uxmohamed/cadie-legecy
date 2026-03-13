"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogClose,
} from "@/components/ui/alert-dialog";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipPopup,
} from "@/components/ui/tooltip";
import { getUserProfile, completeOnboarding } from "@/hooks/use-onboarding";
import { buildAvatarFallbackChain } from "@/lib/avatar";
import { clearAllCaches } from "@/lib/query/auth-reset";
import { createClient } from "@/lib/supabase/client";
import { IconPencil, IconLoader2, IconLogout } from "@tabler/icons-react";
import { toast } from "sonner";

interface SettingsProfileProps {
  user: User;
  onProfileUpdate?: () => void;
}

export function SettingsProfile({ user, onProfileUpdate }: SettingsProfileProps) {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = React.useState("");
  const [originalDisplayName, setOriginalDisplayName] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = React.useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Load profile on mount
  React.useEffect(() => {
    const loadProfile = async () => {
      const profile = await getUserProfile(user.id);
      const name = profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || "";
      const avatar = buildAvatarFallbackChain(
        user.id,
        profile?.avatar_url,
        user.user_metadata?.avatar_url,
        user.user_metadata?.picture,
      )[0];
      
      setDisplayName(name);
      setOriginalDisplayName(name);
      setAvatarUrl(avatar);
      setIsLoading(false);
    };
    loadProfile();
  }, [user]);

  const uploadToStorage = async (file: File): Promise<string | null> => {
    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { cacheControl: "3600", upsert: true });

    if (error) throw new Error(error.message);
    
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(data.path);
    return urlData.publicUrl;
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const uploadedUrl = await uploadToStorage(file);
      if (uploadedUrl) {
        setAvatarUrl(uploadedUrl);
        await completeOnboarding(user.id, displayName, uploadedUrl);
        onProfileUpdate?.();
        toast.success("Avatar updated");
      }
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsSaving(true);
    try {
      const trimmedName = displayName.trim();
      const result = await completeOnboarding(user.id, trimmedName, avatarUrl);
      if (result.success) {
        setOriginalDisplayName(trimmedName);
        onProfileUpdate?.();
        toast.success("Profile updated");
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await clearAllCaches(queryClient, user.id);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to delete account");
      }

      // Sign out and redirect after successful deletion
      const supabase = createClient();
      await clearAllCaches(queryClient, user.id);
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete account");
      setIsDeleting(false);
    }
  };

  const avatarSources = React.useMemo(
    () =>
      buildAvatarFallbackChain(
        user.id,
        avatarUrl,
        user.user_metadata?.avatar_url,
        user.user_metadata?.picture,
      ),
    [avatarUrl, user.id, user.user_metadata?.avatar_url, user.user_metadata?.picture],
  );
  const [avatarSourceIndex, setAvatarSourceIndex] = React.useState(0);

  React.useEffect(() => {
    setAvatarSourceIndex(0);
  }, [avatarSources]);

  const visibleAvatar = avatarSources[Math.min(avatarSourceIndex, avatarSources.length - 1)];

  const handleAvatarLoadingStatusChange = React.useCallback(
    (status: "idle" | "loading" | "loaded" | "error") => {
      if (status !== "error") return;
      setAvatarSourceIndex((prev) => (prev < avatarSources.length - 1 ? prev + 1 : prev));
    },
    [avatarSources.length],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-6 w-6 animate-spin text-fg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="flex items-center gap-6">
        <div className="relative group">
          <Avatar className="h-24 w-24 shadow-sm">
            <AvatarImage
              src={visibleAvatar}
              alt={displayName}
              onLoadingStatusChange={handleAvatarLoadingStatusChange}
            />
            <AvatarFallback className="bg-accent text-white text-2xl">
              {displayName.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-btn-secondary shadow-none text-fg-muted transition-transform hover:scale-110 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Change avatar"
          >
            {isUploadingAvatar ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconPencil className="h-4 w-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div>
          <h3 className="text-sm font-medium text-fg">Profile Photo</h3>
        </div>
      </div>

      {/* Form Section */}
      <div className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="name">Your name</Label>
          <div className="relative w-full">
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-bg-input border-transparent shadow-none before:shadow-none [&_input]:px-4 [&_input]:pr-24 [&_input]:py-[12px]"
            />
            <Button 
              onClick={handleSaveName} 
              disabled={isSaving || displayName.trim() === originalDisplayName.trim()}
              variant="default"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4 text-sm text-fg-on-accent"
            >
              {isSaving ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating
                </>
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email Address</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={<div className="inline-block w-full cursor-not-allowed" />}
              >
                <Input
                  id="email"
                  value={user.email}
                  readOnly
                  disabled
                  className="w-full bg-bg-input border-transparent shadow-none before:shadow-none opacity-75 [&_input]:px-4 [&_input]:py-[12px]"
                  style={{ cursor: 'not-allowed' }}
                />
              </TooltipTrigger>
              <TooltipPopup>
                <p>Your email address is managed via your login provider.</p>
              </TooltipPopup>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Account Actions */}
      <div className="flex flex-col gap-6">
        <Button
          variant="secondary"
          onClick={handleSignOut}
          className="w-fit justify-start"
        >
          <IconLogout />
          Sign Out
        </Button>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-fg">Danger Zone</h3>
          <AlertDialog onOpenChange={(open) => !open && setDeleteConfirmEmail("")}>
            <AlertDialogTrigger
              render={
                <button
                  type="button"
                  className="w-full text-left rounded-xl bg-destructive/10 hover:bg-destructive/[0.14] p-4 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              }
            >
              <div className="text-sm font-medium text-destructive mb-3">
                Delete Account
              </div>
              <p className="text-sm text-fg-muted">
                Deleting your account will permanently delete all your data. This action cannot be undone.
              </p>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Account</AlertDialogTitle>
                <AlertDialogDescription render={<div className="space-y-4" />}>
                  <p>
                    This action cannot be undone. This will permanently delete your account and all associated data.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-email" className="text-fg-muted">
                      Type <span className="font-medium text-fg">{user.email}</span> to confirm
                    </Label>
                    <Input
                      id="confirm-email"
                      value={deleteConfirmEmail}
                      onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="bg-bg-input border-transparent shadow-none before:shadow-none"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogClose render={<Button variant="outline" />}>
                  Cancel
                </AlertDialogClose>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmEmail !== user.email}
                >
                  {isDeleting ? "Deleting..." : "Delete My Account"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
