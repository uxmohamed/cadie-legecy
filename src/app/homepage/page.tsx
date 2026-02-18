import { LandingPage } from "@/components/landing-page";
import { allChangelogs } from "contentlayer/generated";
import { fetchVariantPrices } from "@/lib/billing/lemon-client";

export default async function HomePage() {
  const [latestChangelogs, pricing] = await Promise.all([
    Promise.resolve(
      [...allChangelogs]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 2)
    ),
    fetchVariantPrices(),
  ]);

  return <LandingPage changelogEntries={latestChangelogs} pricing={pricing} />;
}
