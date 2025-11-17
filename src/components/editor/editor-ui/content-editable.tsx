import { JSX } from "react"
import { ContentEditable as LexicalContentEditable } from "@lexical/react/LexicalContentEditable"

type Props = {
  placeholder: string
  className?: string
  placeholderClassName?: string
}

export function ContentEditable({
  placeholder,
  className,
  placeholderClassName,
}: Props): JSX.Element {
  return (
    <LexicalContentEditable
      className={
        className ??
        `ContentEditable__root relative block min-h-[400px] w-full overflow-auto px-4 py-2 focus:outline-none text-neutral-900`
      }
      aria-placeholder={placeholder}
      placeholder={
        <div
          className={
            placeholderClassName ??
            `pointer-events-none absolute top-2 left-4 overflow-hidden text-ellipsis select-none text-neutral-400`
          }
        >
          {placeholder}
        </div>
      }
    />
  )
}
