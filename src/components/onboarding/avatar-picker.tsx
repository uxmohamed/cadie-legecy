"use client";

import * as React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { IconPencil, IconLoader2 } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";

interface AvatarPickerProps {
  value: string;
  onChange: (url: string, file?: File) => void;
  userId: string;
  userInitial?: string;
}

export function AvatarPicker({ value, onChange, userId, userInitial = "U" }: AvatarPickerProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const uploadToStorage = async (file: File): Promise<string | null> => {
    const supabase = createClient();
    
    // Create unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Upload error:", error);
      throw new Error(error.message);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be less than 2MB");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const uploadedUrl = await uploadToStorage(file);
      if (uploadedUrl) {
        onChange(uploadedUrl, file);
      }
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      setError("Failed to upload. Please try again.");
      // Fallback: use local preview URL (will be lost on refresh but better than nothing)
      const localUrl = URL.createObjectURL(file);
      onChange(localUrl, file);
    } finally {
      setIsUploading(false);
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleEditClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="relative">
      {/* Avatar Display */}
      <Avatar className="h-24 w-24">
        <AvatarImage src={value} alt="Your avatar" />
        <AvatarFallback className="bg-bg-inverse text-fg-inverse text-2xl">
          {userInitial}
        </AvatarFallback>
      </Avatar>

      {/* Pencil Edit Button - Bottom Right */}
      <button
        type="button"
        onClick={handleEditClick}
        disabled={isUploading}
        className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-bg text-fg-muted transition-transform hover:scale-110 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        style={{
          boxShadow: '0 1.556px 4.667px 0 rgba(0, 0, 0, .1)'
        }}
        aria-label="Change avatar"
      >
        {isUploading ? (
          <IconLoader2 className="h-4 w-4 animate-spin" />
        ) : (
          <IconPencil className="h-4 w-4" />
        )}
      </button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Select avatar image"
      />

      {/* Error Message */}
      {error && (
        <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-destructive whitespace-nowrap">
          {error}
        </p>
      )}
    </div>
  );
}
