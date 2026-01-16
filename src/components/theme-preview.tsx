"use client";

import * as React from "react";

interface ThemePreviewProps {
  variant: "light" | "dark" | "system";
  isSelected?: boolean;
  className?: string;
}

export function ThemePreview({ variant, isSelected = false, className = "" }: ThemePreviewProps) {
  const lightPreview = (
    <div className="absolute inset-0 bg-[#F8F8F8] p-2 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1 mb-2">
        <div className="w-2 h-2 rounded-[3px] bg-[#D8D8D8]" />
        <div className="flex-1" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#D8D8D8]" />
      </div>
      
      {/* Search bar */}
      <div className="w-[60%] mx-auto h-[5px] rounded-full bg-[#EBEBEB] mb-2" />
      
      {/* List items */}
      <div className="flex-1 flex flex-col gap-[3px]">
        <div className="h-[6px] rounded-[2px] bg-[#EFEFEF] flex items-center px-1 gap-1">
          <div className="w-1 h-1 rounded-[1px] bg-[#D8D8D8]" />
          <div className="w-[45%] h-[2px] rounded-full bg-[#DEDEDE]" />
        </div>
        <div className="h-[6px] rounded-[2px] bg-[#EFEFEF] flex items-center px-1 gap-1">
          <div className="w-1 h-1 rounded-[1px] bg-[#D8D8D8]" />
          <div className="w-[55%] h-[2px] rounded-full bg-[#DEDEDE]" />
        </div>
        <div className="h-[6px] rounded-[2px] bg-[#EFEFEF] flex items-center px-1 gap-1">
          <div className="w-1 h-1 rounded-[1px] bg-[#D8D8D8]" />
          <div className="w-[38%] h-[2px] rounded-full bg-[#DEDEDE]" />
        </div>
        <div className="h-[6px] rounded-[2px] bg-[#EFEFEF] flex items-center px-1 gap-1">
          <div className="w-1 h-1 rounded-[1px] bg-[#D8D8D8]" />
          <div className="w-[50%] h-[2px] rounded-full bg-[#DEDEDE]" />
        </div>
        <div className="h-[6px] rounded-[2px] bg-[#EFEFEF] flex items-center px-1 gap-1">
          <div className="w-1 h-1 rounded-[1px] bg-[#D8D8D8]" />
          <div className="w-[42%] h-[2px] rounded-full bg-[#DEDEDE]" />
        </div>
      </div>
    </div>
  );

  const darkPreview = (
    <div className="absolute inset-0 bg-[#161616] p-2 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-1 mb-2">
        <div className="w-2 h-2 rounded-[3px] bg-[#2A2A2A]" />
        <div className="flex-1" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#2A2A2A]" />
      </div>
      
      {/* Search bar */}
      <div className="w-[60%] mx-auto h-[5px] rounded-full bg-[#1E1E1E] mb-2" />
      
      {/* List items */}
      <div className="flex-1 flex flex-col gap-[3px]">
        <div className="h-[6px] rounded-[2px] bg-[#1E1E1E] flex items-center px-1 gap-1">
          <div className="w-1 h-1 rounded-[1px] bg-[#2A2A2A]" />
          <div className="w-[45%] h-[2px] rounded-full bg-[#2A2A2A]" />
        </div>
        <div className="h-[6px] rounded-[2px] bg-[#1E1E1E] flex items-center px-1 gap-1">
          <div className="w-1 h-1 rounded-[1px] bg-[#2A2A2A]" />
          <div className="w-[55%] h-[2px] rounded-full bg-[#2A2A2A]" />
        </div>
        <div className="h-[6px] rounded-[2px] bg-[#1E1E1E] flex items-center px-1 gap-1">
          <div className="w-1 h-1 rounded-[1px] bg-[#2A2A2A]" />
          <div className="w-[38%] h-[2px] rounded-full bg-[#2A2A2A]" />
        </div>
        <div className="h-[6px] rounded-[2px] bg-[#1E1E1E] flex items-center px-1 gap-1">
          <div className="w-1 h-1 rounded-[1px] bg-[#2A2A2A]" />
          <div className="w-[50%] h-[2px] rounded-full bg-[#2A2A2A]" />
        </div>
        <div className="h-[6px] rounded-[2px] bg-[#1E1E1E] flex items-center px-1 gap-1">
          <div className="w-1 h-1 rounded-[1px] bg-[#2A2A2A]" />
          <div className="w-[42%] h-[2px] rounded-full bg-[#2A2A2A]" />
        </div>
      </div>
    </div>
  );

  if (variant === "system") {
    return (
      <div className={`relative h-full w-full overflow-hidden ${className}`}>
        {/* Light half - left side */}
        <div 
          className="absolute inset-0"
          style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}
        >
          {lightPreview}
        </div>
        {/* Dark half - right side */}
        <div 
          className="absolute inset-0"
          style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}
        >
          {darkPreview}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      {variant === "light" ? lightPreview : darkPreview}
    </div>
  );
}
