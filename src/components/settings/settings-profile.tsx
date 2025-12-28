"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { getUserProfile, completeOnboarding } from "@/hooks/use-onboarding";
import { getDefaultAvatar } from "@/lib/avatar";
import { createClient } from "@/lib/supabase/client";
import { IconCamera, IconLoader2, IconTrash, IconLogout } from "@tabler/icons-react";
import { toast } from "sonner";

interface SettingsProfileProps {
  user: User;
}

export function SettingsProfile({ user }: SettingsProfileProps) {
  const [displayName, setDisplayName] = React.useState("");
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
      const avatar = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || getDefaultAvatar(user.id);
      
      setDisplayName(name);
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
      const result = await completeOnboarding(user.id, displayName.trim(), avatarUrl);
      if (result.success) {
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
        const data = await response.json();
        throw new Error(data.error || "Failed to delete account");
      }

      // Sign out and redirect after successful deletion
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete account");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-6 w-6 animate-spin text-[var(--icon-secondary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Avatar Section */}
      <div className="flex items-center gap-6">
        <div className="relative group">
          <Avatar className="h-24 w-24 shadow-sm">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-[var(--brand-primary)] text-white text-2xl">
              {displayName.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-inverse)] text-[var(--text-inverse)] shadow-md transition-all hover:bg-[var(--text-primary)] disabled:opacity-50 cursor-pointer"
          >
            {isUploadingAvatar ? (
              <IconLoader2 className="h-4 w-4 animate-spin" />
            ) : (
              <IconCamera className="h-4 w-4" />
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
          <h3 className="text-lg font-medium text-[var(--text-primary)]">Profile Photo</h3>
        </div>
      </div>

      {/* Form Section */}
      <div className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="name">Display Name</Label>
          <div className="flex gap-2">
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="max-w-md bg-[var(--bg-field)]"
            />
            <Button 
              onClick={handleSaveName} 
              disabled={isSaving}
              variant="default"
            >
              {isSaving ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            value={user.email}
            readOnly
            disabled
            className="max-w-md bg-[var(--bg-field)] opacity-75"
          />
          <p className="text-sm text-[var(--text-secondary)]">
            Your email address is managed via your login provider.
          </p>
        </div>
      </div>

      {/* Account Actions */}
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">Account Actions</h3>
          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full justify-start text-[var(--text-secondary)] hover:text-[var(--text-primary)] max-w-xs"
            >
              <IconLogout className="mr-2 h-4 w-4" />
              Sign Out
            </Button>

            <div className="rounded-lg border border-[var(--cadie-red)]/20 bg-[var(--cadie-red)]/5 p-4 mt-2">
              <h4 className="text-sm font-medium text-[var(--cadie-red)] flex items-center gap-2 mb-2">
                <IconTrash className="h-4 w-4" /> 
                Danger Zone
              </h4>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Permanently delete your account and all associated data.
              </p>
              <AlertDialog onOpenChange={(open) => !open && setDeleteConfirmEmail("")}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Account</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-4">
                        <p>
                          This action cannot be undone. This will permanently delete your account and all associated data.
                        </p>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-email" className="text-[var(--text-secondary)]">
                            Type <span className="font-medium text-[var(--text-primary)]">{user.email}</span> to confirm
                          </Label>
                          <Input
                            id="confirm-email"
                            value={deleteConfirmEmail}
                            onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="bg-[var(--bg-field)]"
                          />
                        </div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogClose asChild>
                      <Button variant="outline">Cancel</Button>
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
      </div>
    </div>
  );
}
