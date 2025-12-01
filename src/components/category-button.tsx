'use client';

import { useState } from 'react';

interface CategoryButtonProps {
  label: string;
  color: 'white' | 'blue' | 'pink' | 'green' | 'purple' | 'orange';
  variant?: 'default' | 'compact';
}

const colorClasses = {
  white: 'bg-white/10 hover:bg-white/20',
  blue: 'bg-blue-500/20 hover:bg-blue-500/30',
  pink: 'bg-pink-500/20 hover:bg-pink-500/30',
  green: 'bg-green-500/20 hover:bg-green-500/30',
  purple: 'bg-purple-500/20 hover:bg-purple-500/30',
  orange: 'bg-orange-500/20 hover:bg-orange-500/30',
};

const dotColorClasses = {
  white: 'bg-white',
  blue: 'bg-blue-500',
  pink: 'bg-pink-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
};

export function CategoryButton({ label, color, variant = 'default' }: CategoryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          group flex items-center justify-between gap-2 pl-2 pr-4 py-2 rounded-full
          bg-zinc-900 hover:bg-zinc-800
          border border-zinc-800 hover:border-zinc-700
          transition-all duration-200
          min-w-[280px]
        `}
      >
        {/* Left Section: Plus Icon */}
        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-zinc-400 group-hover:text-zinc-300"
          >
            <path
              d="M8 3.5V12.5M3.5 8H12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Middle Section: Colored Pill */}
        <div className={`
          flex-1 flex items-center justify-between px-6 py-3 rounded-full
          transition-colors duration-200
          ${colorClasses[color]}
        `}>
          <div className="flex items-center gap-2.5">
            <div className={`w-4 h-3 rounded-full ${dotColorClasses[color]}`} />
            <span className="text-white text-sm font-medium">{label}</span>
          </div>
          
          <svg
            width="10"
            height="10"
            viewBox="0 0 12 12"
            fill="none"
            className={`text-zinc-400 transition-transform ml-2 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Right Section: Three Dots Menu */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-zinc-800 transition-colors">
          <div className="flex flex-col gap-0.5">
            <div className="w-1 h-1 rounded-full bg-zinc-500" />
            <div className="w-1 h-1 rounded-full bg-zinc-500" />
            <div className="w-1 h-1 rounded-full bg-zinc-500" />
          </div>
        </div>
      </button>
    </div>
  );
}
