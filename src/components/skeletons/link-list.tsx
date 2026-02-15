import { LinkItemSkeleton } from "./link-item";

export function LinkListSkeleton() {
  return (
    <div className="w-full">
      <div className="space-y-px py-4 relative">
        {Array.from({ length: 8 }).map((_, index) => (
          <LinkItemSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
