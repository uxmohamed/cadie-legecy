"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { IconCamera, IconPencil, IconLoader2 } from "@tabler/icons-react";
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
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [editedName, setEditedName] = React.useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
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
    if (!editedName.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsSaving(true);
    try {
      const result = await completeOnboarding(user.id, editedName.trim(), avatarUrl);
      if (result.success) {
        setDisplayName(editedName.trim());
        setIsEditingName(false);
        toast.success("Name updated");
      } else {
        toast.error(result.error || "Failed to update name");
      }
    } catch (error) {
      console.error("Error saving name:", error);
      toast.error("Failed to update name");
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
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
      setIsDeleting(false);
    }
  };

  const startEditingName = () => {
    setEditedName(displayName);
    setIsEditingName(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-6 w-6 animate-spin text-[var(--icon-secondary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="rounded-xl bg-[var(--bg-field)] p-4">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-[var(--brand-primary)] text-white text-2xl">
                {displayName.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-inverse)] text-[var(--text-inverse)] shadow-md transition-transform hover:scale-105 disabled:opacity-50"
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

          {/* Name & Email */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Name */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--text-secondary)] mb-0.5">Name</p>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName();
                        if (e.key === "Escape") setIsEditingName(false);
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleSaveName}
                      disabled={isSaving}
                      className="h-8"
                    >
                      {isSaving ? "..." : "Save"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm font-medium truncate">{displayName || "Add your name"}</p>
                )}
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Your name is visible on documents you share with others.
                </p>
              </div>
              {!isEditingName && (
                <button
                  onClick={startEditingName}
                  className="p-1.5 text-[var(--icon-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <IconPencil className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Email */}
            <div>
              <p className="text-xs text-[var(--text-secondary)] mb-0.5">Email</p>
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Your email address used for this account.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="rounded-xl bg-[var(--bg-field)] p-4">
        <button
          onClick={handleSignOut}
          className="text-sm font-medium text-[var(--brand-primary)] hover:opacity-80 transition-opacity"
        >
          Sign Out
        </button>
      </div>

      {/* Danger Zone */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Danger Zone</h3>
        <div className="rounded-xl bg-[var(--bg-field)] p-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="text-sm font-medium text-[var(--accent-red-primary)] hover:opacity-80 transition-opacity">
                Delete Account
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Account</AlertDialogTitle>
                <AlertDialogDescription>
                  Deleting your account will permanently delete all your data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </AlertDialogClose>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Account"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Deleting your account will permanently delete all your documents. This action cannot be undone.
          </p>
        </div>
      </div>
    </div>
  );
}
