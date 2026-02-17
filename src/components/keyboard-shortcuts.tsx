"use client";

import { useState, useEffect } from "react";

interface KeyboardShortcut {
  keys: string[];
  action: string;
}

const shortcuts: KeyboardShortcut[] = [
  { keys: ["N"], action: "Add new link" },
  { keys: ["/"], action: "Focus search" },
  { keys: ["⌘", "F"], action: "Focus search" },
  { keys: ["M"], action: "Toggle dark mode" },
  { keys: ["⇧", "T"], action: "Open Trash" },
  { keys: ["1"], action: "Switch to All" },
  { keys: ["2"], action: "Switch to first Space" },
  { keys: ["J"], action: "Move down" },
  { keys: ["K"], action: "Move up" },
  { keys: ["⌘", "⌫"], action: "Delete selection" },
  { keys: ["⌘", "A"], action: "Select all" },
  { keys: ["?"], action: "Keyboard shortcuts" },
];

export function KeyboardShortcuts() {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPressed, setIsPressed] = useState(false);
  const [showText, setShowText] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      if (e.matches) setShowText(true);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const timeoutIds = new Set<number>();
    const scheduleTimeout = (callback: () => void, delay: number) => {
      const timeoutId = window.setTimeout(() => {
        timeoutIds.delete(timeoutId);
        callback();
      }, delay);
      timeoutIds.add(timeoutId);
    };

    const intervalId = window.setInterval(() => {
      // Phase 1: Start fade out and hide text
      setIsTransitioning(true);
      setShowText(false);
      
      scheduleTimeout(() => {
        // Phase 2: Change shortcut and show it (no press, no text yet)
        setActiveIndex((prev) => (prev + 1) % shortcuts.length);
        setIsPressed(false);
        setIsTransitioning(false);
        
        scheduleTimeout(() => {
          // Phase 3: Show press animation
          setIsPressed(true);
          
          scheduleTimeout(() => {
            // Phase 4: Release press and show text
            setIsPressed(false);
            setShowText(true);
          }, 300);
        }, 600); // Wait 600ms before pressing
      }, 400); // Wait for fade out
    }, 3500); // Total cycle time

    return () => {
      window.clearInterval(intervalId);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutIds.clear();
    };
  }, [prefersReducedMotion]);

  const currentShortcut = shortcuts[activeIndex];

  return (
    <div className="w-full aspect-[4/3] flex items-center justify-center p-12">
      <div className={`
        flex flex-col items-center gap-8
        transition-[opacity,transform] duration-400
        ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
      `}>
        {/* Keyboard Keys */}
        <div className="flex items-center gap-2.5">
          {currentShortcut.keys.map((key, index) => (
            <div key={index} className="flex items-center gap-2.5">
              <div
                className={`
                  relative flex items-center justify-center
                  min-w-[56px] h-[56px] px-4
                  rounded-xl
                  bg-gradient-to-b from-white to-[#F5F5F7]
                  dark:from-[#333333] dark:to-[#222222]
                  border border-[#E5E5E5] dark:border-[#404040]
                  shadow-[0_4px_0_#E5E5E5,0_4px_8px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.5)]
                  dark:shadow-[0_4px_0_#111111,0_4px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]
                  transform transition-[transform,box-shadow] duration-100 ease-out motion-reduce:transition-none
                  ${isPressed
                    ? 'translate-y-[4px] shadow-none'
                    : 'translate-y-0'}
                `}
              >
                <span className="text-xl font-medium text-[#404040] dark:text-[#E0E0E0] drop-shadow-sm">
                  {key}
                </span>
              </div>

              {/* Plus sign between keys */}
              {index < currentShortcut.keys.length - 1 && (
                <span className="text-lg text-[var(--grey-300)] dark:text-[var(--grey-600)] font-light">+</span>
              )}
            </div>
          ))}
        </div>

        {/* Action Feedback */}
        <div className={`
          min-h-[28px] flex items-center justify-center
          transition-[opacity,transform] duration-300
          ${showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        `}>
          <span className="text-sm font-medium text-[var(--grey-500)] dark:text-[var(--grey-400)]">
            {currentShortcut.action}
          </span>
        </div>
      </div>
    </div>
  );
}
