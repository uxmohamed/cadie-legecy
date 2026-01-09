"use client";

import { useState, useEffect } from "react";

interface KeyboardShortcut {
  keys: string[];
  action: string;
}

const shortcuts: KeyboardShortcut[] = [
  { keys: ["⌥", "D"], action: "Add new link" },
  { keys: ["/"], action: "Search" },
  { keys: ["M"], action: "Toggle dark mode" },
  { keys: ["⇧", "T"], action: "Open Trash" },
  { keys: ["1"], action: "Switch to All" },
  { keys: ["2"], action: "Switch to Inspo" },
  { keys: ["⌘", "⌫"], action: "Delete item" },
  { keys: ["⌘", "A"], action: "Select all" },
  { keys: ["?"], action: "Keyboard shortcuts" },
];

export function KeyboardShortcuts() {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPressed, setIsPressed] = useState(false);
  const [showText, setShowText] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // Phase 1: Start fade out and hide text
      setIsTransitioning(true);
      setShowText(false);
      
      setTimeout(() => {
        // Phase 2: Change shortcut and show it (no press, no text yet)
        setActiveIndex((prev) => (prev + 1) % shortcuts.length);
        setIsPressed(false);
        setIsTransitioning(false);
        
        setTimeout(() => {
          // Phase 3: Show press animation
          setIsPressed(true);
          
          setTimeout(() => {
            // Phase 4: Release press and show text
            setIsPressed(false);
            setShowText(true);
          }, 300);
        }, 600); // Wait 600ms before pressing
      }, 400); // Wait for fade out
    }, 3500); // Total cycle time

    return () => clearInterval(interval);
  }, []);

  const currentShortcut = shortcuts[activeIndex];

  return (
    <div className="w-full aspect-[4/3] flex items-center justify-center bg-[color-mix(in_oklab,var(--grey-50)_60%,transparent)] dark:bg-[color-mix(in_oklab,var(--grey-900)_60%,transparent)] p-12">
      <div className={`
        flex flex-col items-center gap-8
        transition-all duration-400
        ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
      `}>
        {/* Keyboard Keys */}
        <div className="flex items-center gap-3">
          {currentShortcut.keys.map((key, index) => (
            <div key={index} className="flex items-center gap-3">
              <div
                className={`
                  relative flex items-center justify-center
                  min-w-[64px] h-[64px] px-5
                  rounded-[10px]
                  bg-gradient-to-b from-[var(--grey-100)] via-[var(--grey-200)] to-[var(--grey-300)]
                  dark:from-[var(--grey-700)] dark:via-[var(--grey-750)] dark:to-[var(--grey-800)]
                  border-2 border-[var(--grey-400)] dark:border-[var(--grey-600)]
                  transition-all duration-150 ease-out
                  ${isPressed ? 'translate-y-[3px] shadow-[0_1px_4px_rgba(0,0,0,0.1)]' : 'translate-y-0 shadow-[0_2px_6px_rgba(0,0,0,0.12)]'}
                `}
              >
                {/* Inner highlight for realism */}
                <div className="absolute inset-x-[3px] top-[3px] h-[20%] rounded-t-lg bg-gradient-to-b from-white/40 to-transparent dark:from-white/10" />
                
                {/* Key Top Surface */}
                <div className={`
                  absolute inset-[3px] rounded-[7px]
                  bg-gradient-to-b from-[var(--grey-50)] to-[var(--grey-100)]
                  dark:from-[var(--grey-800)] dark:to-[var(--grey-850)]
                  border border-[var(--grey-300)] dark:border-[var(--grey-700)]
                  transition-all duration-150
                  ${isPressed ? 'inset-[2px]' : 'inset-[3px]'}
                `} />
                
                {/* Key Label */}
                <span className="relative z-10 text-[22px] font-semibold text-[var(--text-primary)]">
                  {key}
                </span>
              </div>
              
              {/* Plus sign between keys */}
              {index < currentShortcut.keys.length - 1 && (
                <span className="text-2xl text-[var(--text-tertiary)] font-light">+</span>
              )}
            </div>
          ))}
        </div>

        {/* Action Feedback */}
        <div className={`
          min-h-[32px] flex items-center justify-center
          transition-all duration-300
          ${showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        `}>
          <span className="text-base font-medium text-[var(--text-primary)]">
            {currentShortcut.action}
          </span>
        </div>
      </div>
    </div>
  );
}
