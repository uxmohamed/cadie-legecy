"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@tabler/icons-react";
import { useTheme } from "@/components/theme-provider";

interface ExtensionStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

// Link icon SVG
function LinkIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="32" 
      height="32" 
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth="1.5"
    >
      <path d="M12 8.25a3.75 3.75 0 0 0-3.747 3.904M12 8.25a3.75 3.75 0 0 1 3.608 4.775M12 8.25h8.458m-4.85 4.775a3.752 3.752 0 0 1-7.355-.871m7.355.871l-3.08 8.21m7.93-12.985A9.252 9.252 0 0 0 4.6 6.45m15.858 1.8q.085.19.161.386a9.25 9.25 0 0 1-8.09 12.599m0 0A9.25 9.25 0 0 1 2.75 12c0-2.083.688-4.004 1.85-5.55m3.653 5.704L4.6 6.45"/>
    </svg>
  );
}

// Chrome logo SVG for top of card
function ChromeLogo({ className }: { className?: string }) {
  const { theme } = useTheme();
  
  // Determine if dark mode is effectively active
  const isDarkMode = React.useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'system' && typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }, [theme]);
  
  return (
    <svg className={className} viewBox="0 0 256 223" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="SVGHPFpg7JP" x1="0%" x2="100%" y1="50%" y2="50%">
          <stop offset="0%" stopColor="#D93025"/>
          <stop offset="100%" stopColor="#EA4335"/>
        </linearGradient>
        <linearGradient id="SVGOMJglc4y" x1="74.943%" x2="19.813%" y1="95.826%" y2="-4.161%">
          <stop offset="0%" stopColor="#1E8E3E"/>
          <stop offset="100%" stopColor="#34A853"/>
        </linearGradient>
        <linearGradient id="SVG7xeYgbFl" x1="59.898%" x2="21.416%" y1="-.134%" y2="99.86%">
          <stop offset="0%" stopColor="#FBBC04"/>
          <stop offset="100%" stopColor="#FCC934"/>
        </linearGradient>
        <path id="SVGxfiKEebH" d="M255.983 0H0v204.837c0 9.633 7.814 17.464 17.464 17.464h221.072c9.633 0 17.464-7.814 17.464-17.464z"/>
      </defs>
      <path fill={isDarkMode ? "#2A2A2A" : "#F1F3F4"} d="M255.983 0H0v204.837c0 9.633 7.814 17.464 17.464 17.464h221.072c9.633 0 17.464-7.814 17.464-17.464z"/>
      <path fill={isDarkMode ? "#1F1F1F" : "#E8EAED"} d="M0 0h255.983v111.74H0z"/>
      <path fill={isDarkMode ? "#3A3A3A" : "#FFF"} d="M157.076 47.727H98.907A11.63 11.63 0 0 1 87.27 36.09a11.63 11.63 0 0 1 11.637-11.637h58.169a11.63 11.63 0 0 1 11.637 11.637c0 6.417-5.204 11.637-11.637 11.637"/>
      <mask id="SVGzv8eNeik" fill="#fff">
        <use href="#SVGxfiKEebH"/>
      </mask>
      <g mask="url(#SVGzv8eNeik)">
        <g transform="translate(17.455 94.293)">
          <path fill="url(#SVGHPFpg7JP)" d="m14.812 55.255l15.241 46.498l32.638 36.427l47.845-82.908l95.724-.017C187.146 22.213 151.443 0 110.536 0s-76.61 22.213-95.724 55.255"/>
          <path fill="url(#SVGOMJglc4y)" d="m110.52 221.105l32.637-36.443l15.224-46.482H62.674L14.812 55.255c-19.047 33.076-20.445 75.128.017 110.561c20.445 35.434 57.545 55.256 95.69 55.29"/>
          <path fill="url(#SVG7xeYgbFl)" d="M206.26 55.272h-95.724l47.862 82.908l-47.862 82.925c38.162-.033 75.263-19.855 95.708-55.289c20.461-35.433 19.064-77.468.016-110.544"/>
          <ellipse cx="110.536" cy="110.544" fill={isDarkMode ? "#2A2A2A" : "#F1F3F4"} rx="55.255" ry="55.272"/>
          <ellipse cx="110.536" cy="110.544" fill="#1A73E8" rx="44.898" ry="44.915"/>
        </g>
      </g>
      <path fill={isDarkMode ? "#3A3A3A" : "#BDC1C6"} d="M0 111.74h255.983v1.448H0zm0-1.465h255.983v1.448H0z" opacity=".1"/>
    </svg>
  );
}


export function ExtensionStep({ onComplete, onSkip }: ExtensionStepProps) {
  const { theme } = useTheme();
  const [hasClicked, setHasClicked] = React.useState(false);
  
  // Determine if dark mode is effectively active
  const isDarkMode = React.useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'system' && typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }, [theme]);

  const handleInstallClick = () => {
    // Open Chrome Web Store (placeholder URL - update when published)
    window.open("https://chrome.google.com/webstore", "_blank");
    setHasClicked(true);
  };

  return (
    <div className="w-full max-w-[450px] flex justify-center">
      {/* Card Container - Matching Figma Design */}
      <div 
        className="rounded-[24px] p-[48px] flex flex-col gap-[48px] items-center w-full max-w-[500px] text-[15px]"
        style={{
          backgroundColor: isDarkMode 
            ? 'color-mix(in oklab, oklch(1 0 0) 20%, oklch(0 0 0) 80%)'
            : 'var(--bg-l2-solid)',
          boxShadow: isDarkMode 
            ? '0 2px 2px 0 rgba(0, 0, 0, 0.2), 0 4px 4px 0 rgba(0, 0, 0, 0.15), 0 2px 24px 0 rgba(0, 0, 0, 0.3), 0 0 0 1px var(--border-primary)'
            : '0 2px 2px 0 rgba(0, 0, 0, 0.01), 0 4px 4px 0 rgba(0, 0, 0, 0.01), 0 2px 24px 0 rgba(0, 0, 0, 0.03), 0 0 0 1px #E5E5E5',
          borderWidth: '0px',
        }}
      >
        {/* Logo and Header Section */}
        <div className="flex flex-col gap-[18px] items-center w-full">
          {/* Chrome Logo */}
          <div className="flex justify-center w-full">
            <ChromeLogo className="h-12 w-auto" />
          </div>

          {/* Header Section */}
          <div className="flex flex-col gap-[2px] items-center w-full">
            <h1 className="text-[18px] font-semibold leading-[32px] text-[var(--text-primary)] text-center">
              One Click and it's saved!
            </h1>
            <p className="text-[16px] font-medium leading-[32px] text-[var(--grey-400)] text-center">
              Save links you want to remember.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-[12px] items-start w-full">
          {!hasClicked ? (
            <>
              <Button
                type="button"
                onClick={handleInstallClick}
                variant="secondary"
                className="w-full p-3 rounded-[12px] gap-2"
              >
                <LinkIcon className="size-6" />
                <span className="font-medium text-[14px] leading-[24px]">
                  Add to Chrome
                </span>
              </Button>

              <Button
                type="button"
                onClick={onSkip}
                variant="ghost"
                className="w-full p-3 rounded-[12px]"
              >
                <span className="font-medium text-[14px] leading-[24px]">
                  I&apos;ll do this later
                </span>
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--text-tertiary)] text-center w-full">
                After installing, click the extension icon to save any page!
              </p>
              
              <Button
                type="button"
                onClick={onComplete}
                variant="default"
                className="w-full p-3 rounded-[12px] text-white"
              >
                <span className="font-medium text-[14px] leading-[24px] text-white">
                  Continue to Cadie
                </span>
                <IconArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
