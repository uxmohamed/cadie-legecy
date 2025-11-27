import { EditorThemeClasses } from "lexical";

import "./editor-theme.css";

export const editorTheme: EditorThemeClasses = {
  ltr: "text-left",
  rtl: "text-right",
  heading: {
    h1: "text-3xl font-bold mt-6 mb-2 first:mt-0",
    h2: "text-2xl font-semibold mt-5 mb-2 first:mt-0",
    h3: "text-xl font-semibold mt-4 mb-2 first:mt-0",
    h4: "text-lg font-semibold mt-3 mb-1 first:mt-0",
    h5: "text-base font-semibold mt-3 mb-1 first:mt-0",
    h6: "text-sm font-semibold mt-2 mb-1 first:mt-0",
  },
  paragraph: "leading-7 my-1 first:mt-0",
  quote: "my-2 border-l-4 border-[var(--border-secondary)] pl-4 italic text-[var(--text-secondary)]",
  link: "text-[var(--accent-blue-primary)] hover:underline hover:cursor-pointer",
  list: {
    checklist: "relative",
    listitem: "mx-8",
    listitemChecked:
      'relative mx-2 px-6 list-none outline-none line-through before:content-["\""] before:w-4 before:h-4 before:top-0.5 before:left-0 before:cursor-pointer before:block before:bg-cover before:absolute before:border before:border-[var(--text-primary)] before:rounded before:bg-[var(--text-primary)] before:bg-no-repeat after:content-["\""] after:cursor-pointer after:border-[var(--bg-l0-solid)] after:border-solid after:absolute after:block after:top-[6px] after:w-[3px] after:left-[7px] after:right-[7px] after:h-[6px] after:rotate-45 after:border-r-2 after:border-b-2 after:border-l-0 after:border-t-0',
    listitemUnchecked:
      'relative mx-2 px-6 list-none outline-none before:content-["\""] before:w-4 before:h-4 before:top-0.5 before:left-0 before:cursor-pointer before:block before:bg-cover before:absolute before:border before:border-[var(--text-primary)] before:rounded',
    nested: {
      listitem: "list-none before:hidden after:hidden",
    },
    ol: "m-0 p-0 list-decimal [&>li]:mt-2",
    olDepth: [
      "list-outside !list-decimal",
      "list-outside !list-[upper-roman]",
      "list-outside !list-[lower-roman]",
      "list-outside !list-[upper-alpha]",
      "list-outside !list-[lower-alpha]",
    ],
    ul: "m-0 p-0 list-outside [&>li]:mt-2",
    ulDepth: [
      "list-outside !list-disc",
      "list-outside !list-disc",
      "list-outside !list-disc",
      "list-outside !list-disc",
      "list-outside !list-disc",
    ],
  },
  hashtag: "text-[var(--accent-blue-primary)] bg-[var(--accent-blue-subtle)] rounded-md px-1",
  text: {
    bold: "font-bold",
    code: "bg-[var(--bg-l1-solid)] px-1.5 py-0.5 rounded-md font-mono text-sm",
    italic: "italic",
    strikethrough: "line-through",
    subscript: "sub",
    superscript: "sup",
    underline: "underline",
    underlineStrikethrough: "underline line-through",
  },
  image: "relative inline-block user-select-none cursor-default editor-image",
  inlineImage:
    "relative inline-block user-select-none cursor-default inline-editor-image",
  keyword: "text-[var(--accent-purple-strong)] font-bold",
  code: "EditorTheme__code",
  codeHighlight: {
    atrule: "EditorTheme__tokenAttr",
    attr: "EditorTheme__tokenAttr",
    boolean: "EditorTheme__tokenProperty",
    builtin: "EditorTheme__tokenSelector",
    cdata: "EditorTheme__tokenComment",
    char: "EditorTheme__tokenSelector",
    class: "EditorTheme__tokenFunction",
    "class-name": "EditorTheme__tokenFunction",
    comment: "EditorTheme__tokenComment",
    constant: "EditorTheme__tokenProperty",
    deleted: "EditorTheme__tokenProperty",
    doctype: "EditorTheme__tokenComment",
    entity: "EditorTheme__tokenOperator",
    function: "EditorTheme__tokenFunction",
    important: "EditorTheme__tokenVariable",
    inserted: "EditorTheme__tokenSelector",
    keyword: "EditorTheme__tokenAttr",
    namespace: "EditorTheme__tokenVariable",
    number: "EditorTheme__tokenProperty",
    operator: "EditorTheme__tokenOperator",
    prolog: "EditorTheme__tokenComment",
    property: "EditorTheme__tokenProperty",
    punctuation: "EditorTheme__tokenPunctuation",
    regex: "EditorTheme__tokenVariable",
    selector: "EditorTheme__tokenSelector",
    string: "EditorTheme__tokenSelector",
    symbol: "EditorTheme__tokenProperty",
    tag: "EditorTheme__tokenProperty",
    url: "EditorTheme__tokenOperator",
    variable: "EditorTheme__tokenVariable",
  },
  characterLimit: "!bg-[var(--accent-red-subtle)]",
  table: "EditorTheme__table w-fit overflow-scroll border-collapse",
  tableCell:
    "EditorTheme__tableCell w-24 relative border border-[var(--border-primary)] px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right\"",
  tableCellActionButton:
    "EditorTheme__tableCellActionButton bg-[var(--bg-l0-solid)] block border-0 rounded-2xl w-5 h-5 text-[var(--text-primary)] cursor-pointer",
  tableCellActionButtonContainer:
    "EditorTheme__tableCellActionButtonContainer block right-1 top-1.5 absolute z-10 w-5 h-5",
  tableCellEditing: "EditorTheme__tableCellEditing rounded-sm shadow-sm",
  tableCellHeader:
    "EditorTheme__tableCellHeader bg-[var(--bg-l1-solid)] border border-[var(--border-primary)] px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
  tableCellPrimarySelected:
    "EditorTheme__tableCellPrimarySelected border border-[var(--border-primary)] border-[var(--text-primary)] border-solid block h-[calc(100%-2px)] w-[calc(100%-2px)] absolute -left-[1px] -top-[1px] z-10",
  tableCellResizer:
    "EditorTheme__tableCellResizer absolute -right-1 h-full w-2 cursor-ew-resize z-10 top-0",
  tableCellSelected: "EditorTheme__tableCellSelected bg-[var(--bg-l1-solid)]",
  tableCellSortedIndicator:
    "EditorTheme__tableCellSortedIndicator block opacity-50 bsolute bottom-0 left-0 w-full h-1 bg-[var(--bg-l1-solid)]",
  tableResizeRuler:
    "EditorTheme__tableCellResizeRuler block absolute w-[1px] h-full bg-[var(--text-primary)] top-0",
  tableRowStriping:
    "EditorTheme__tableRowStriping m-0 border-t p-0 even:bg-[var(--bg-l1-solid)]",
  tableSelected: "EditorTheme__tableSelected ring-2 ring-[var(--ring-primary)] ring-offset-2",
  tableSelection: "EditorTheme__tableSelection bg-transparent",
  layoutItem: "border border-dashed px-4 py-2",
  layoutContainer: "grid gap-2.5 my-2.5 mx-0",
  autocomplete: "text-[var(--text-tertiary)]",
  blockCursor: "",
  embedBlock: {
    base: "user-select-none",
    focus: "ring-2 ring-[var(--ring-primary)] ring-offset-2",
  },
  hr: 'p-0.5 border-none my-1 mx-0 cursor-pointer after:content-["\""] after:block after:h-0.5 after:bg-[var(--bg-l1-solid)] selected:ring-2 selected:ring-[var(--ring-primary)] selected:ring-offset-2 selected:user-select-none',
  indent: "[--lexical-indent-base-value:40px]",
  mark: "",
  markOverlap: "",
};
