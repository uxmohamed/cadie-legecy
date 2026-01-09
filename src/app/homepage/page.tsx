import { LandingPage } from "@/components/landing-page";
import { allChangelogs } from "contentlayer/generated";

export default function HomePage() {
  // Get latest changelog entries for the landing page
  const latestChangelogs = [...allChangelogs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 2);

  return <LandingPage changelogEntries={latestChangelogs} />;
}
