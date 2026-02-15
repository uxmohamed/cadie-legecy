/**
 * Gets a deterministic default avatar for a user based on their ID.
 * This ensures the same user always gets the same avatar.
 * 
 * @param userId - The user's unique ID
 * @returns Path to the avatar image (e.g., "/avatars/avatar-pic-01.webp")
 */
export function getDefaultAvatar(userId: string): string {
  // Convert userId to a number using a simple hash
  // This ensures deterministic assignment
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Get a number between 1-10 (we have 10 avatars)
  const avatarNumber = Math.abs(hash % 10) + 1;
  const paddedNumber = String(avatarNumber).padStart(2, "0");
  
  return `/avatars/avatar-pic-${paddedNumber}.webp`;
}

/**
 * Converts an avatar number (1-10) to an avatar path.
 * 
 * @param avatarNumber - The avatar number (1-10)
 * @returns Path to the avatar image (e.g., "/avatars/avatar-pic-01.webp")
 */
export function getAvatarPath(avatarNumber: number): string {
  const clampedNumber = Math.max(1, Math.min(10, Math.round(avatarNumber)));
  const paddedNumber = String(clampedNumber).padStart(2, "0");
  return `/avatars/avatar-pic-${paddedNumber}.webp`;
}
