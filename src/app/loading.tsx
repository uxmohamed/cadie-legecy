import { DashboardSkeleton } from "@/components/skeletons";

/**
 * Loading UI for the dashboard route.
 * This enables streaming - the skeleton shows instantly (0ms)
 * while the page content loads in the background.
 */
export default function Loading() {
  return <DashboardSkeleton />;
}
