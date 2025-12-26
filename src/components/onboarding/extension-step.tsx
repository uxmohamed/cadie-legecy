"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { IconPuzzle, IconArrowRight } from "@tabler/icons-react";

interface ExtensionStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

// Chrome icon SVG - Official Chrome logo
function ChromeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4CAF50" d="M44,24c0,11.044-8.956,20-20,20S4,35.044,4,24S12.956,4,24,4S44,12.956,44,24z"/>
      <path fill="#FFC107" d="M24,4v20l8,4l-8.843,16.32C12.202,42.975,4,34.419,4,24C4,12.956,12.956,4,24,4z"/>
      <path fill="#4CAF50" d="M44,24c0,10.419-8.202,18.975-18.843,19.32L33,27L24,24V4c2.552,0,4.982,0.485,7.227,1.354L24,24l4.771,2.386L44,24z"/>
      <path fill="#F44336" d="M24,4c2.552,0,4.982,0.485,7.227,1.354L24,24h20c0-2.552-0.485-4.982-1.354-7.227L24,4z"/>
      <path fill="#DD2C00" d="M42.646,16.773L24,24L31.227,5.354C36.7,7.533,40.992,11.608,42.646,16.773z"/>
      <path fill="#FFC107" d="M24,44c-7.791,0-14.556-4.458-17.846-10.961L24,24l8,4l-8.843,16.32C23.438,43.996,23.72,44,24,44z"/>
      <path fill="#388E3C" d="M24,24l0.157,19.32C23.438,43.996,23.72,44,24,44c7.791,0,14.556-4.458,17.846-10.961L24,24z"/>
      <circle cx="24" cy="24" r="8" fill="#455A64"/>
      <circle cx="24" cy="24" r="6" fill="#FAFAFA"/>
      <circle cx="24" cy="24" r="4" fill="#4284F4"/>
    </svg>
  );
}


export function ExtensionStep({ onComplete, onSkip }: ExtensionStepProps) {
  const [hasClicked, setHasClicked] = React.useState(false);

  const handleInstallClick = () => {
    // Open Chrome Web Store (placeholder URL - update when published)
    window.open("https://chrome.google.com/webstore", "_blank");
    setHasClicked(true);
  };

  return (
    <div className="w-full max-w-[400px] space-y-8">
      {/* Logo/Icon Section */}
      <div className="flex flex-col items-center space-y-6">
        <Logo variant="neutral-200" className="h-7 mb-4 w-auto" />
        
        {/* Extension Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-emphasis)]">
          <IconPuzzle className="h-8 w-8 text-[var(--text-primary)]" />
        </div>
        
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Save from anywhere
          </h1>
          <p className="text-base text-[var(--text-secondary)]">
            Add our Chrome extension to save links with one click while browsing.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {!hasClicked ? (
          <>
            <Button
              type="button"
              onClick={handleInstallClick}
              variant="secondary"
              size="xl"
              className="w-full"
            >
              <ChromeIcon className="size-5 mr-2" />
              Add to Chrome
            </Button>

            <Button
              type="button"
              onClick={onSkip}
              variant="ghost"
              size="xl"
              className="w-full"
            >
              I&apos;ll do this later
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-[var(--text-tertiary)] text-center">
              After installing, click the extension icon to save any page!
            </p>
            
            <Button
              type="button"
              onClick={onComplete}
              variant="secondary"
              size="xl"
              className="w-full"
            >
              Continue to Cadie
              <IconArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
