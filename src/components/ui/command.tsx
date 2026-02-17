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
  ({ className, value: controlledValue, onValueChange, ...props }, ref) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState("")
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

    return (
      <CommandContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(
            "flex h-full w-full flex-col overflow-hidden rounded-md bg-bg-surface text-fg",
            className
          )}
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
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <Command
          className="py-1"
          {...commandProps}
        >
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<"input">
>(({ className, onChange, autoFocus, ...props }, ref) => {
  const context = useCommandContext()

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      context?.onValueChange(event.target.value)
      onChange?.(event)
    },
    [context, onChange]
  )

  return (
    <div className="flex items-center border-b px-3" data-slot="command-input-wrapper">
      <IconSearch className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-fg-subtle disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        autoFocus={autoFocus ?? true}
        value={context?.value ?? ""}
        onChange={handleChange}
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
      ).filter((item) => item.offsetParent !== null)

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
      className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
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
    className={cn("overflow-hidden p-1 text-fg", className)}
    {...props}
  >
    {heading && (
      <div className="px-2 py-1.5 text-xs font-medium text-fg-muted">
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
    className={cn("-mx-1 h-px bg-border", className)}
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
        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-left outline-none hover:bg-bg-selected/70 focus-visible:bg-bg-selected focus-visible:text-fg disabled:pointer-events-none disabled:opacity-50",
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
        "ml-auto text-xs tracking-widest text-fg-muted",
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
