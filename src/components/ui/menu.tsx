"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const MenuContext = React.createContext<MenuContextValue | undefined>(undefined);

function useMenu() {
  const context = React.useContext(MenuContext);
  if (!context) {
    throw new Error("Menu components must be used within a Menu");
  }
  return context;
}

interface MenuProps {
  children: React.ReactNode;
}

export function Menu({ children }: MenuProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        !(event.target as Element).closest('[data-menu-popup]')
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <MenuContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </MenuContext.Provider>
  );
}

interface MenuTriggerProps {
  children: React.ReactNode;
  render?: React.ReactElement;
}

export function MenuTrigger({ children, render }: MenuTriggerProps) {
  const { open, setOpen, triggerRef } = useMenu();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!open);
  };

  if (render) {
    return React.cloneElement(render, {
      ref: triggerRef as any,
      onClick: handleClick,
      "aria-expanded": open,
      "aria-haspopup": "true" as const,
    } as any);
  }

  return (
    <button
      ref={triggerRef as any}
      onClick={handleClick}
      aria-expanded={open}
      aria-haspopup="true"
      className="inline-flex items-center justify-center"
    >
      {children}
    </button>
  );
}

interface MenuPopupProps {
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}

export function MenuPopup({ children, align = "end", className }: MenuPopupProps) {
  const { open } = useMenu();
  const popupRef = React.useRef<HTMLDivElement>(null);

  if (!open) return null;

  return (
    <div
      ref={popupRef}
      data-menu-popup
      className={cn(
        "absolute z-50 mt-2 min-w-[240px] overflow-hidden rounded-lg border border-neutral-200 bg-white p-1 shadow-lg animate-in fade-in-0 zoom-in-95",
        align === "end" ? "right-0" : "left-0",
        className
      )}
    >
      {children}
    </div>
  );
}

interface MenuGroupProps {
  children: React.ReactNode;
}

export function MenuGroup({ children }: MenuGroupProps) {
  return <div className="py-1">{children}</div>;
}

interface MenuGroupLabelProps {
  children: React.ReactNode;
}

export function MenuGroupLabel({ children }: MenuGroupLabelProps) {
  return (
    <div className="px-3 py-2 text-xs font-semibold text-neutral-500">
      {children}
    </div>
  );
}

interface MenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive";
  className?: string;
}

export function MenuItem({ 
  children, 
  onClick, 
  disabled, 
  variant = "default",
  className 
}: MenuItemProps) {
  const { setOpen } = useMenu();

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
      setOpen(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm outline-none transition-colors",
        "hover:bg-neutral-100 focus:bg-neutral-100",
        disabled && "pointer-events-none opacity-50",
        variant === "destructive" && "text-red-600 hover:bg-red-50 focus:bg-red-50",
        className
      )}
    >
      {children}
    </button>
  );
}

interface MenuSeparatorProps {
  className?: string;
}

export function MenuSeparator({ className }: MenuSeparatorProps) {
  return <div className={cn("my-1 h-px bg-neutral-200", className)} />;
}

interface MenuShortcutProps {
  children: React.ReactNode;
}

export function MenuShortcut({ children }: MenuShortcutProps) {
  return (
    <span className="ml-auto text-xs tracking-widest text-neutral-400">
      {children}
    </span>
  );
}

interface MenuCheckboxItemProps {
  children: React.ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export function MenuCheckboxItem({ 
  children, 
  checked, 
  onCheckedChange,
  disabled 
}: MenuCheckboxItemProps) {
  const { setOpen } = useMenu();

  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm outline-none transition-colors",
        "hover:bg-neutral-100 focus:bg-neutral-100",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <span className="flex h-4 w-4 items-center justify-center">
        {checked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 3L4.5 8.5L2 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {children}
    </button>
  );
}

interface MenuRadioGroupProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}

const MenuRadioGroupContext = React.createContext<{
  value?: string;
  onValueChange?: (value: string) => void;
} | undefined>(undefined);

export function MenuRadioGroup({ children, value, onValueChange }: MenuRadioGroupProps) {
  return (
    <MenuRadioGroupContext.Provider value={{ value, onValueChange }}>
      <div>{children}</div>
    </MenuRadioGroupContext.Provider>
  );
}

interface MenuRadioItemProps {
  children: React.ReactNode;
  value: string;
  disabled?: boolean;
}

export function MenuRadioItem({ children, value, disabled }: MenuRadioItemProps) {
  const context = React.useContext(MenuRadioGroupContext);
  const isSelected = context?.value === value;

  const handleClick = () => {
    if (!disabled && context?.onValueChange) {
      context.onValueChange(value);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm outline-none transition-colors",
        "hover:bg-neutral-100 focus:bg-neutral-100",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <span className="flex h-4 w-4 items-center justify-center">
        {isSelected && (
          <span className="h-2 w-2 rounded-full bg-current" />
        )}
      </span>
      {children}
    </button>
  );
}

interface MenuSubProps {
  children: React.ReactNode;
}

export function MenuSub({ children }: MenuSubProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const childProps = child.props as Record<string, any>;
          return React.cloneElement(child, { ...childProps, open, triggerRef } as any);
        }
        return child;
      })}
    </div>
  );
}

interface MenuSubTriggerProps {
  children: React.ReactNode;
  open?: boolean;
  triggerRef?: React.RefObject<HTMLDivElement>;
}

export function MenuSubTrigger({ children, open, triggerRef }: MenuSubTriggerProps) {
  return (
    <div
      ref={triggerRef}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm outline-none transition-colors cursor-pointer",
        "hover:bg-neutral-100 focus:bg-neutral-100",
        open && "bg-neutral-100"
      )}
    >
      {children}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="ml-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 4L10 8L6 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

interface MenuSubPopupProps {
  children: React.ReactNode;
  open?: boolean;
}

export function MenuSubPopup({ children, open }: MenuSubPopupProps) {
  if (!open) return null;

  return (
    <div
      className="absolute left-full top-0 ml-1 min-w-[200px] overflow-hidden rounded-lg border border-neutral-200 bg-white p-1 shadow-lg"
      data-menu-popup
    >
      {children}
    </div>
  );
}

