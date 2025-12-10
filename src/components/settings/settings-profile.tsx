"use client";

import * as React from "react";
import type { User } from "@supabase/supabase-js";
import { AvatarPicker } from "@/components/onboarding/avatar-picker";
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
import { IconTrash, IconLoader2 } from "@tabler/icons-react";
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
  const [hasChanges, setHasChanges] = React.useState(false);
  
  // Store original values to detect changes
  const originalValues = React.useRef({ displayName: "", avatarUrl: "" });

  // Load profile on mount
  React.useEffect(() => {
    const loadProfile = async () => {
      const profile = await getUserProfile(user.id);
      const name = profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || "";
      const avatar = profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || getDefaultAvatar(user.id);
      
      setDisplayName(name);
      setAvatarUrl(avatar);
      originalValues.current = { displayName: name, avatarUrl: avatar };
      setIsLoading(false);
    };
    loadProfile();
  }, [user]);

  // Detect changes
  React.useEffect(() => {
    const changed = 
      displayName !== originalValues.current.displayName ||
      avatarUrl !== originalValues.current.avatarUrl;
    setHasChanges(changed);
  }, [displayName, avatarUrl]);

  const handleAvatarChange = (url: string) => {
    setAvatarUrl(url);
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    setIsSaving(true);
    try {
      const result = await completeOnboarding(user.id, displayName.trim(), avatarUrl);
      if (result.success) {
        originalValues.current = { displayName: displayName.trim(), avatarUrl };
        setHasChanges(false);
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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const supabase = createClient();
      
      // Sign out and delete account
      // Note: Full account deletion typically requires a server-side function
      // For now, we sign out the user; proper deletion would need an API route
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
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
    <div className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-4">
        <AvatarPicker
          value={avatarUrl}
          onChange={handleAvatarChange}
          userId={user.id}
          userInitial={displayName.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
        />
        <p className="text-xs text-[var(--text-secondary)]">
          Click the pencil to change your avatar
        </p>
      </div>

      <Separator />

      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="display-name">Display name</Label>
        <Input
          id="display-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter your name"
          className="max-w-sm"
        />
      </div>

      {/* Email (read-only) */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={user.email || ""}
          disabled
          className="max-w-sm bg-[var(--bg-field)] text-[var(--text-secondary)]"
        />
        <p className="text-xs text-[var(--text-secondary)]">
          Email cannot be changed
        </p>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full max-w-sm"
        >
          {isSaving ? (
            <>
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      )}

      <Separator />

      {/* Delete Account */}
      <div className="space-y-2">
        <Label className="text-[var(--accent-red-primary)]">Danger zone</Label>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="gap-2"
              disabled={isDeleting}
            >
              <IconTrash className="h-4 w-4" />
              Delete account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and all of your data.
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
                {isDeleting ? "Deleting..." : "Delete account"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
