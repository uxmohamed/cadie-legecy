"use client"

import * as React from "react"
import { IconSearch } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"

type CommandContextValue = {
  value: string
  onValueChange: (value: string) => void
}

const CommandContext = React.createContext<CommandContextValue | null>(null)

function useCommandContext() {
  return React.useContext(CommandContext)
}

interface CommandProps extends React.ComponentPropsWithoutRef<"div"> {
  value?: string
  onValueChange?: (value: string) => void
}

const Command = React.forwardRef<HTMLDivElement, CommandProps>(
  ({ className, value: controlledValue, onValueChange, onKeyDown, ...props }, ref) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState("")
    const rootRef = React.useRef<HTMLDivElement | null>(null)
    const isControlled = controlledValue !== undefined
    const value = isControlled ? controlledValue : uncontrolledValue

    const handleValueChange = React.useCallback(
      (nextValue: string) => {
        if (!isControlled) {
          setUncontrolledValue(nextValue)
        }
        onValueChange?.(nextValue)
      },
      [isControlled, onValueChange]
    )

    const contextValue = React.useMemo(
      () => ({ value, onValueChange: handleValueChange }),
      [value, handleValueChange]
    )

    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node
        if (!ref) return
        if (typeof ref === "function") {
          ref(node)
          return
        }
        ref.current = node
      },
      [ref]
    )

    const getVisibleItems = React.useCallback(() => {
      if (!rootRef.current) return []
      return Array.from(
        rootRef.current.querySelectorAll<HTMLButtonElement>("[data-command-item='true']:not([disabled])")
      )
    }, [])

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return

        const target = event.target
        const isCommandInput =
          target instanceof HTMLInputElement &&
          target.getAttribute("data-command-input") === "true"

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          const items = getVisibleItems()
          if (items.length === 0) return

          event.preventDefault()
          const currentIndex = items.findIndex((item) => item === document.activeElement)

          if (currentIndex === -1) {
            if (event.key === "ArrowDown") {
              items[0]?.focus()
            } else {
              items[items.length - 1]?.focus()
            }
            return
          }

          const nextIndex =
            event.key === "ArrowDown"
              ? (currentIndex + 1) % items.length
              : (currentIndex - 1 + items.length) % items.length

          items[nextIndex]?.focus()
          return
        }

        if (
          event.key === "Enter" &&
          isCommandInput &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.altKey &&
          !event.shiftKey
        ) {
          const items = getVisibleItems()
          if (items.length === 0) return

          event.preventDefault()
          const activeItem = items.find((item) => item === document.activeElement)
          ;(activeItem ?? items[0])?.click()
        }
      },
      [getVisibleItems, onKeyDown]
    )

    return (
      <CommandContext.Provider value={contextValue}>
        <div
          ref={setRefs}
          data-command-root="true"
          className={cn(
            "flex h-full w-full flex-col overflow-hidden rounded-md bg-bg-surface text-fg",
            className
          )}
          onKeyDown={handleKeyDown}
          {...props}
        />
      </CommandContext.Provider>
    )
  }
)
Command.displayName = "Command"

interface CommandDialogProps
  extends Omit<React.ComponentProps<typeof Dialog>, "children"> {
  children?: React.ReactNode
  commandProps?: CommandProps
}

const CommandDialog = ({ children, commandProps, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl sm:max-w-2xl">
        <Command
          className="relative overflow-hidden rounded-[1.25rem] border border-border/70 bg-bg-elevated/95 py-2 backdrop-blur-xl"
          {...commandProps}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-accent/12 via-accent/4 to-transparent"
          />
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<"input">
>(({ className, onChange, onKeyDown, autoFocus, ...props }, ref) => {
  const context = useCommandContext()

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      context?.onValueChange(event.target.value)
      onChange?.(event)
    },
    [context, onChange]
  )

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event)
      if (event.defaultPrevented) return

      const isEnter = event.key === "Enter"
      const isArrow = event.key === "ArrowDown" || event.key === "ArrowUp"
      if (!isEnter && !isArrow) return

      if (isEnter && (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey)) {
        return
      }

      const root = event.currentTarget.closest<HTMLElement>("[data-command-root='true']")
      if (!root) return

      const items = Array.from(
        root.querySelectorAll<HTMLButtonElement>("[data-command-item='true']:not([disabled])")
      )

      if (items.length === 0) return

      if (isArrow) {
        event.preventDefault()
        const currentIndex = items.findIndex((item) => item === document.activeElement)
        if (currentIndex === -1) {
          if (event.key === "ArrowDown") {
            items[0]?.focus()
          } else {
            items[items.length - 1]?.focus()
          }
          return
        }

        const nextIndex =
          event.key === "ArrowDown"
            ? (currentIndex + 1) % items.length
            : (currentIndex - 1 + items.length) % items.length

        items[nextIndex]?.focus()
        return
      }

      event.preventDefault()
      const activeItem = items.find((item) => item === document.activeElement)
      ;(activeItem ?? items[0])?.click()
    },
    [onKeyDown]
  )

  return (
    <div
      className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/70 bg-bg-elevated/95 px-3 py-2 backdrop-blur-xl"
      data-slot="command-input-wrapper"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-muted/80 text-fg-subtle">
        <IconSearch className="h-4 w-4" />
      </span>
      <input
        ref={ref}
        data-command-input="true"
        className={cn(
          "flex h-12 w-full rounded-xl bg-bg-muted/60 px-3 py-3 text-[15px] text-fg outline-none ring-1 ring-transparent transition-[background-color,box-shadow] placeholder:text-fg-subtle focus:bg-bg-surface focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        autoFocus={autoFocus ?? true}
        value={context?.value ?? ""}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
    </div>
  )
})

CommandInput.displayName = "CommandInput"

const CommandList = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, onKeyDown, ...props }, ref) => {
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event)
      if (event.defaultPrevented) return
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return

      const list = event.currentTarget
      const items = Array.from(
        list.querySelectorAll<HTMLButtonElement>("[data-command-item='true']:not([disabled])")
      )

      if (items.length === 0) return

      event.preventDefault()
      const currentIndex = items.findIndex((item) => item === document.activeElement)
      if (currentIndex === -1) {
        items[0]?.focus()
        return
      }

      const nextIndex =
        event.key === "ArrowDown"
          ? (currentIndex + 1) % items.length
          : (currentIndex - 1 + items.length) % items.length

      items[nextIndex]?.focus()
    },
    [onKeyDown]
  )

  return (
    <div
      ref={ref}
      className={cn("max-h-[420px] overflow-y-auto overflow-x-hidden px-2 pb-2 pt-1", className)}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
})

CommandList.displayName = "CommandList"

const CommandEmpty = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>((props, ref) => (
  <div
    ref={ref}
    className="py-6 text-center text-sm"
    {...props}
  />
))

CommandEmpty.displayName = "CommandEmpty"

interface CommandGroupProps extends React.ComponentPropsWithoutRef<"div"> {
  heading?: React.ReactNode
}

const CommandGroup = React.forwardRef<
  HTMLDivElement,
  CommandGroupProps
>(({ className, heading, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("overflow-hidden rounded-xl border border-transparent p-1 text-fg", className)}
    {...props}
  >
    {heading && (
      <div className="px-2 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-fg-muted uppercase">
        {heading}
      </div>
    )}
    {children}
  </div>
))

CommandGroup.displayName = "CommandGroup"

const CommandSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mx-1 my-1 h-px bg-gradient-to-r from-transparent via-border to-transparent", className)}
    {...props}
  />
))
CommandSeparator.displayName = "CommandSeparator"

interface CommandItemProps
  extends Omit<React.ComponentPropsWithoutRef<"button">, "onSelect" | "value"> {
  onSelect?: (value: string) => void
  value?: string
}

const CommandItem = React.forwardRef<
  HTMLButtonElement,
  CommandItemProps
>(({ className, onClick, onSelect, value, ...props }, ref) => {
  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (event.defaultPrevented) return
      onSelect?.(value ?? event.currentTarget.textContent?.trim() ?? "")
    },
    [onClick, onSelect, value]
  )

  return (
    <button
      ref={ref}
      type="button"
      data-command-item="true"
      className={cn(
        "group/item relative my-0.5 flex w-full cursor-pointer select-none items-center rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium text-left text-fg outline-none transition-[background-color,border-color,transform] duration-150 hover:border-border/80 hover:bg-bg-hover focus:border-accent/35 focus:bg-bg-selected focus:text-fg focus-visible:border-accent/35 focus-visible:bg-bg-selected focus-visible:text-fg data-[active=true]:border-accent/35 data-[active=true]:bg-bg-selected disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={handleClick}
      {...props}
    />
  )
})

CommandItem.displayName = "CommandItem"

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto rounded-md border border-border/80 bg-bg-muted/70 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-fg-muted",
        className
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
