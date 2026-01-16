import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "neutral-900" | "neutral-800" | "neutral-700" | "neutral-600" | "neutral-500" | "neutral-400" | "neutral-300" | "neutral-200" | "neutral-100" | "white" | "black";
}

const variantClasses = {
  "neutral-900": "fill-[var(--text-primary)]",
  "neutral-800": "fill-[var(--text-primary)]",
  "neutral-700": "fill-[var(--text-secondary)]",
  "neutral-600": "fill-[var(--text-secondary)]",
  "neutral-500": "fill-[var(--text-tertiary)]",
  "neutral-400": "fill-[var(--text-tertiary)]",
  "neutral-300": "fill-[var(--text-tertiary)]",
  "neutral-200": "fill-[var(--text-tertiary)]",
  "neutral-100": "fill-[var(--text-tertiary)]",
  "white": "fill-[var(--text-inverse)]",
  "black": "fill-[var(--text-primary)]",
} as const;

export function Logo({ className, variant = "neutral-900" }: LogoProps) {
  // Determine fill color class based on variant, with theme awareness
  const getFillClass = () => {
    // For variants that should be theme-aware, use dark mode classes
    if (variant === "white") {
      return "fill-[var(--text-inverse)] dark:fill-[var(--text-primary)]";
    }
    if (variant === "neutral-200") {
      return "fill-[var(--text-tertiary)] dark:fill-[var(--text-primary)]";
    }
    // For other variants, use the existing CSS variable approach
    return variantClasses[variant];
  };

  const fillClass = getFillClass();

  return (
    <svg 
      width="83" 
      height="25" 
      viewBox="0 0 83 25" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-5 w-auto", className)}
      suppressHydrationWarning
    >
      <path className={fillClass} d="M11.552 22.784C14.592 22.784 16.224 20.896 17.44 17.152H19.2L18.528 22.816C16.512 23.936 14.272 24.672 10.912 24.672C4.224 24.672 0 20.032 0 13.6C0 6.144 4.992 1.568 11.296 1.568C14.56 1.568 16.896 2.432 18.432 3.68V8.672H16.704C15.84 5.12 14.016 3.424 11.136 3.424C6.4 3.424 4.448 7.712 4.448 12.672C4.448 18.464 6.848 22.784 11.552 22.784Z" />
      <path className={fillClass} d="M34.736 12.736C34.736 13.504 34.64 19.168 34.64 20.16C34.64 21.44 35.056 22.176 35.952 22.176C36.24 22.176 36.944 22.112 37.424 21.984L37.616 23.008C36.528 24.096 35.312 24.672 33.968 24.672C32.272 24.672 31.344 23.488 30.96 21.76C29.84 23.104 28.112 24.64 25.68 24.64C22.832 24.64 21.36 22.752 21.36 20.256C21.36 17.312 23.632 16.288 25.776 15.552L30.864 13.728V12.032C30.864 9.952 30.224 8.544 28.112 8.544C26.544 8.544 25.776 9.312 25.776 10.784C25.776 11.392 25.84 11.936 26 12.608L23.184 13.024C22.576 12.608 22.288 12 22.288 11.136C22.288 8.352 25.008 6.88 28.688 6.88C32.624 6.88 34.736 8.64 34.736 12.736ZM27.664 22.016C28.912 22.016 29.776 21.664 30.864 20.896V15.296L27.12 16.736C25.936 17.184 25.264 18.048 25.264 19.264C25.264 21.024 26.128 22.016 27.664 22.016Z" />
      <path className={fillClass} d="M50.3443 24.672V21.728C49.1283 23.488 47.5283 24.672 45.0323 24.672C40.8403 24.672 38.3123 21.28 38.3123 16.608C38.3123 10.592 41.9603 6.944 46.6643 6.944C48.2323 6.944 49.6403 7.488 50.3443 8.416V3.68L48.1683 2.336V1.504L53.3523 0H54.2163V20.544C54.2163 21.632 54.5363 21.952 55.8483 22.08L56.6483 22.144V23.584L51.0483 24.672H50.3443ZM46.7923 8.608C43.9763 8.608 42.2163 11.328 42.2163 15.264C42.2163 18.976 43.7523 22.016 46.8883 22.016C48.2003 22.016 49.5123 21.536 50.3443 20.768V12.672C50.3443 9.92 49.0323 8.608 46.7923 8.608Z" />
      <path className={fillClass} d="M62.144 4.96C60.704 4.96 59.68 3.872 59.68 2.56C59.68 1.248 60.704 0.16 62.144 0.16C63.552 0.16 64.576 1.248 64.576 2.56C64.576 3.872 63.552 4.96 62.144 4.96ZM64.192 6.88V21.088C64.192 22.56 65.056 22.72 66.496 22.912V24.352H58.016V22.912C59.424 22.72 60.32 22.56 60.32 21.088V10.624L58.176 9.248V8.48L63.296 6.88H64.192Z" />
      <path className={fillClass} d="M76.0947 6.88C80.4467 6.88 82.7188 9.952 82.7188 14.08V15.136H71.5508C71.5508 19.008 73.7268 21.6 77.1188 21.6C79.3908 21.6 80.8948 20.544 82.0468 19.008L82.7508 19.424C81.9508 22.528 79.5187 24.672 75.7747 24.672C71.0707 24.672 68.0947 21.12 68.0947 16.32C68.0947 10.656 71.5507 6.88 76.0947 6.88ZM75.5828 8.64C73.2788 8.64 71.9028 10.912 71.6468 13.504H79.1028C79.0708 10.56 77.9188 8.64 75.5828 8.64Z" />
    </svg>
  );
}
