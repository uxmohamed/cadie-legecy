"use client";

import { Button } from "@/components/ui/button";
import { IconStar } from "@tabler/icons-react";

const variants = [
  "default",
  "neutral",
  "destructive",
  "destructive-outline",
  "ghost",
  "link",
  "outline",
  "secondary",
] as const;

const sizes = [
  "xs",
  "sm",
  "default",
  "lg",
  "xl",
  "icon-xs",
  "icon-sm",
  "icon",
  "icon-lg",
  "icon-xl",
] as const;

export default function ButtonDebugPage() {
  return (
    <div className="min-h-screen bg-white p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Button Debug</h1>
        <p className="text-[var(--text-secondary)]">
          Debug page for all button variants, sizes, and states.
        </p>
      </div>

      {/* Variants Matrix */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Variants & Sizes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-4 border-b border-[var(--border-primary)] text-[var(--text-secondary)] font-medium">
                  Variant / Size
                </th>
                {sizes.map((size) => (
                  <th
                    key={size}
                    className="p-4 border-b border-[var(--border-primary)] text-[var(--text-secondary)] font-medium whitespace-nowrap"
                  >
                    {size}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr key={variant} className="border-b border-[var(--border-primary)]">
                  <td className="p-4 font-medium text-[var(--text-primary)] whitespace-nowrap">
                    {variant}
                  </td>
                  {sizes.map((size) => (
                    <td key={`${variant}-${size}`} className="p-4">
                      <Button variant={variant} size={size}>
                        {size.includes("icon") ? <IconStar className="size-4" /> : "Button"}
                      </Button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Disabled State */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Disabled State</h2>
        <div className="flex flex-wrap gap-4">
          {variants.map((variant) => (
            <Button key={variant} variant={variant} disabled>
              {variant} (Disabled)
            </Button>
          ))}
        </div>
      </section>

      {/* With Icons (Text + Icon) */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Text + Icon</h2>
        <div className="flex flex-wrap gap-4">
          {variants.map((variant) => (
            <Button key={variant} variant={variant}>
              <IconStar className="mr-2 size-4" />
              {variant}
            </Button>
          ))}
        </div>
      </section>
      
       {/* With Icons (Icon + Text) */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Icon + Text</h2>
        <div className="flex flex-wrap gap-4">
          {variants.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
              <IconStar className="ml-2 size-4" />
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
