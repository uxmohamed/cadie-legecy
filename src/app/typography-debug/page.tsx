"use client";

const textSizes = [
  { name: "text-xs", class: "text-xs", size: "12px" },
  { name: "text-sm", class: "text-sm", size: "14px" },
  { name: "text-base", class: "text-base", size: "16px" },
  { name: "text-lg", class: "text-lg", size: "18px" },
  { name: "text-xl", class: "text-xl", size: "20px" },
  { name: "text-2xl", class: "text-2xl", size: "24px" },
  { name: "text-3xl", class: "text-3xl", size: "30px" },
  { name: "text-4xl", class: "text-4xl", size: "36px" },
  { name: "text-5xl", class: "text-5xl", size: "48px" },
  { name: "text-6xl", class: "text-6xl", size: "60px" },
  { name: "text-7xl", class: "text-7xl", size: "72px" },
  { name: "text-8xl", class: "text-8xl", size: "96px" },
  { name: "text-9xl", class: "text-9xl", size: "128px" },
] as const;

const fontWeights = [
  { name: "Thin", class: "font-thin", weight: "100" },
  { name: "Extra Light", class: "font-extralight", weight: "200" },
  { name: "Light", class: "font-light", weight: "300" },
  { name: "Normal", class: "font-normal", weight: "400" },
  { name: "Book", class: "font-[470]", weight: "470" },
  { name: "Medium", class: "font-medium", weight: "500" },
  { name: "Text", class: "font-[570]", weight: "570" },
  { name: "Semibold", class: "font-semibold", weight: "600" },
  { name: "Bold", class: "font-bold", weight: "700" },
  { name: "Extra Bold", class: "font-extrabold", weight: "800" },
  { name: "Black", class: "font-black", weight: "900" },
] as const;

export default function TypographyDebugPage() {
  return (
    <div className="min-h-screen bg-white p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">Typography Debug</h1>
        <p className="text-[var(--text-secondary)]">
          Debug page for all text sizes and font weight variants.
        </p>
      </div>

      {/* Text Sizes */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Text Sizes</h2>
        <div className="space-y-4">
          {textSizes.map((size) => (
            <div
              key={size.name}
              className="flex items-baseline gap-6 p-4 border-b border-[var(--border-primary)]"
            >
              <div className="w-32 shrink-0">
                <span className="font-mono text-sm text-[var(--text-secondary)]">{size.name}</span>
                <span className="block font-mono text-xs text-[var(--text-tertiary)]">
                  {size.size}
                </span>
              </div>
              <p className={`${size.class} text-[var(--text-primary)]`}>
                The quick brown fox jumps over the lazy dog
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Font Weights */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Font Weights</h2>
        <div className="space-y-4">
          {fontWeights.map((weight) => (
            <div
              key={weight.name}
              className="flex items-baseline gap-6 p-4 border-b border-[var(--border-primary)]"
            >
              <div className="w-32 shrink-0">
                <span className="font-mono text-sm text-[var(--text-secondary)]">
                  {weight.class}
                </span>
                <span className="block font-mono text-xs text-[var(--text-tertiary)]">
                  {weight.weight}
                </span>
              </div>
              <p className={`${weight.class} text-lg text-[var(--text-primary)]`}>
                The quick brown fox jumps over the lazy dog
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Size × Weight Matrix */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
          Size × Weight Matrix (Common Sizes)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-4 border-b border-[var(--border-primary)] text-[var(--text-secondary)] font-medium">
                  Size / Weight
                </th>
                {fontWeights.map((weight) => (
                  <th
                    key={weight.name}
                    className="p-4 border-b border-[var(--border-primary)] text-[var(--text-secondary)] font-medium whitespace-nowrap"
                  >
                    <div className="text-xs">{weight.name}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">{weight.weight}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {textSizes.slice(0, 7).map((size) => (
                <tr key={size.name} className="border-b border-[var(--border-primary)]">
                  <td className="p-4 font-medium text-[var(--text-primary)] whitespace-nowrap">
                    <div className="text-sm">{size.name}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">{size.size}</div>
                  </td>
                  {fontWeights.map((weight) => (
                    <td key={`${size.name}-${weight.name}`} className="p-4">
                      <span className={`${size.class} ${weight.class} text-[var(--text-primary)]`}>
                        Aa
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Text Colors */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Text Colors</h2>
        <div className="space-y-4">
          <div className="p-4 border-b border-[var(--border-primary)]">
            <span className="font-mono text-sm text-[var(--text-secondary)] block mb-2">
              --text-primary
            </span>
            <p className="text-lg text-[var(--text-primary)]">
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
          <div className="p-4 border-b border-[var(--border-primary)]">
            <span className="font-mono text-sm text-[var(--text-secondary)] block mb-2">
              --text-secondary
            </span>
            <p className="text-lg text-[var(--text-secondary)]">
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
          <div className="p-4 border-b border-[var(--border-primary)]">
            <span className="font-mono text-sm text-[var(--text-secondary)] block mb-2">
              --text-tertiary
            </span>
            <p className="text-lg text-[var(--text-tertiary)]">
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
          <div className="p-4 border-b border-[var(--border-primary)]">
            <span className="font-mono text-sm text-[var(--text-secondary)] block mb-2">
              --text-disabled
            </span>
            <p className="text-lg text-[var(--text-disabled)]">
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
          <div className="p-4 border-b border-[var(--border-primary)]">
            <span className="font-mono text-sm text-[var(--text-secondary)] block mb-2">
              --text-link
            </span>
            <p className="text-lg text-[var(--text-link)]">
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
          <div className="p-4 border-b border-[var(--border-primary)]">
            <span className="font-mono text-sm text-[var(--text-secondary)] block mb-2">
              --text-destructive
            </span>
            <p className="text-lg text-[var(--text-destructive)]">
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
          <div className="p-4 border-b border-[var(--border-primary)] bg-[var(--bg-inverse)]">
            <span className="font-mono text-sm text-[var(--text-inverse)] block mb-2">
              --text-inverse
            </span>
            <p className="text-lg text-[var(--text-inverse)]">
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
