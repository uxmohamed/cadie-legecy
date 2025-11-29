"use client";

import { Button } from "@/components/ui/button";
import { IconStar } from "@tabler/icons-react";

const variants = [
  "default",
  "neutral",
  "destructive",
  "destructive-outline",
  "destructive-secondary",
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
  "pill-sm",
  "pill",
  "pill-lg",
  "icon-xs",
  "icon-sm",
  "icon",
  "icon-lg",
  "icon-xl",
  "icon-pill-xs",
  "icon-pill-sm",
  "icon-pill",
  "icon-pill-lg",
  "icon-pill-xl",
] as const;

export default function ButtonDebugPage() {
  const textSizes = ["xs", "sm", "default", "lg", "xl"] as const;
  const pillSizes = ["pill-xs", "pill-sm", "pill", "pill-lg", "pill-xl"] as const;
  const iconSizes = ["icon-xs", "icon-sm", "icon", "icon-lg", "icon-xl"] as const;
  const iconPillSizes = ["icon-pill-xs", "icon-pill-sm", "icon-pill", "icon-pill-lg", "icon-pill-xl"] as const;

  return (
    <div className="min-h-screen bg-white p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Button Debug</h1>
        <p className="text-[var(--text-secondary)]">
          Debug page for all button variants, sizes, and states.
        </p>
      </div>

      {/* Text Buttons */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Text Buttons</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-4 border-b border-[var(--border-primary)] text-[var(--text-secondary)] font-medium">
                  Variant / Size
                </th>
                {textSizes.map((size) => (
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
                  {textSizes.map((size) => (
                    <td key={`${variant}-${size}`} className="p-4">
                      <Button variant={variant} size={size}>
                        Button
                      </Button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pill Buttons */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Pill Buttons (Fully Rounded)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-4 border-b border-[var(--border-primary)] text-[var(--text-secondary)] font-medium">
                  Variant / Size
                </th>
                {pillSizes.map((size) => (
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
                  {pillSizes.map((size) => (
                    <td key={`${variant}-${size}`} className="p-4">
                      <Button variant={variant} size={size}>
                        Button
                      </Button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Icon Buttons (Rounded) */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Icon Buttons (Rounded)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-4 border-b border-[var(--border-primary)] text-[var(--text-secondary)] font-medium">
                  Variant / Size
                </th>
                {iconSizes.map((size) => (
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
                  {iconSizes.map((size) => (
                    <td key={`${variant}-${size}`} className="p-4">
                      <Button variant={variant} size={size}>
                        <IconStar className="size-4" />
                      </Button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Icon Buttons (Circular) */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Icon Buttons (Circular)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-4 border-b border-[var(--border-primary)] text-[var(--text-secondary)] font-medium">
                  Variant / Size
                </th>
                {iconPillSizes.map((size) => (
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
                  {iconPillSizes.map((size) => (
                    <td key={`${variant}-${size}`} className="p-4">
                      <Button variant={variant} size={size}>
                        <IconStar className="size-4" />
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
