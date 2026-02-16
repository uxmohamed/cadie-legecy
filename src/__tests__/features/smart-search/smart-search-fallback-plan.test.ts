import { buildSmartFallbackPlan } from "@/features/search/lib/smart-search-fallback-plan";

describe("smart-search fallback planner", () => {
  it("maps imgs to image chip", () => {
    const plan = buildSmartFallbackPlan("imgs");
    expect(plan.chips.some((chip) => chip.kind === "content_type" && chip.value === "image")).toBe(true);
  });

  it("creates useful chips for neutral intent text", () => {
    const plan = buildSmartFallbackPlan("Portfolio links");
    expect(plan.chips.some((chip) => chip.kind === "content_type")).toBe(false);
    expect(plan.chips.some((chip) => chip.kind === "keyword" && chip.term.includes("portfolio"))).toBe(true);
  });

  it("extracts concise keyword from natural-language ask", () => {
    const plan = buildSmartFallbackPlan("I want any link that related to AI and tech.");
    expect(plan.chips.some((chip) => chip.kind === "keyword" && chip.term === "ai tech")).toBe(true);
  });
});
