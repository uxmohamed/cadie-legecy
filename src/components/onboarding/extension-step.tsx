"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
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
    <div className="w-full max-w-[450px] flex justify-center">
      {/* Card Container - Matching Figma Design */}
      <div 
        className="bg-[var(--bg-pure-white)] rounded-[24px] p-[48px] flex flex-col gap-[48px] items-center w-full max-w-[500px] text-[15px]"
        style={{
          boxShadow: '0 2px 2px 0 rgba(0, 0, 0, 0.01), 0 4px 4px 0 rgba(0, 0, 0, 0.01), 0 2px 24px 0 rgba(0, 0, 0, 0.03), 0 0 0 1px #E5E5E5',
          borderWidth: '0px'
        }}
      >
        {/* Icon Section */}
        <div className="flex flex-col items-center w-full">
          {/* Extension Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-emphasis)]">
            <IconPuzzle className="h-8 w-8 text-[var(--text-primary)]" />
          </div>
        </div>

        {/* Header Section */}
        <div className="flex flex-col gap-[2px] items-center w-full">
          <h1 className="text-[18px] font-semibold leading-[32px] text-[var(--text-primary)] text-center">
            Save from anywhere
          </h1>
          <p className="text-[16px] font-medium leading-[32px] text-[var(--grey-400)] text-center">
            Add our Chrome extension to save links with one click while browsing.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-[12px] items-start w-full">
          {!hasClicked ? (
            <>
              <button
                type="button"
                onClick={handleInstallClick}
                className="bg-[#f5f5f5] flex items-center justify-center p-3 rounded-[12px] w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                <ChromeIcon className="h-5 w-5 mr-2" />
                <span className="font-medium text-[14px] leading-[24px] text-[#171717]">
                  Add to Chrome
                </span>
              </button>

              <button
                type="button"
                onClick={onSkip}
                className="bg-transparent flex items-center justify-center p-3 rounded-[12px] w-full cursor-pointer hover:bg-[var(--bg-field-hover)] transition-colors"
              >
                <span className="font-medium text-[14px] leading-[24px] text-[var(--text-primary)]">
                  I&apos;ll do this later
                </span>
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--text-tertiary)] text-center w-full">
                After installing, click the extension icon to save any page!
              </p>
              
              <button
                type="button"
                onClick={onComplete}
                className="bg-[#2783de] text-white flex items-center justify-center p-3 rounded-[12px] w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                <span className="font-medium text-[14px] leading-[24px] text-white">
                  Continue to Cadie
                </span>
                <IconArrowRight className="h-4 w-4 ml-2" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
