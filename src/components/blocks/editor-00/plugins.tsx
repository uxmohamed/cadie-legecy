import { useState } from "react"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"

import { ContentEditable } from "@/components/editor/editor-ui/content-editable"
import { SlashCommandPlugin } from "./plugins/slash-command-plugin"
import { BlockMenuPlugin } from "./plugins/block-menu-plugin"
import { KeyboardShortcutsPlugin } from "./plugins/keyboard-shortcuts-plugin"
import { FloatingToolbarPlugin } from "./plugins/floating-toolbar-plugin"
import { CodeHighlightPlugin } from "./plugins/code-highlight-plugin"

export function Plugins() {
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null)

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

  return (
    <div className="relative">
      {/* toolbar plugins */}
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <div className="">
              <div className="" ref={onRef}>
                <ContentEditable placeholder={"Type '/' for commands"} />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        {/* editor plugins */}
        <ListPlugin />
        <CheckListPlugin />
        <CodeHighlightPlugin />
        <HistoryPlugin />
        <LinkPlugin />
        <SlashCommandPlugin />
        <BlockMenuPlugin />
        <KeyboardShortcutsPlugin />
        <FloatingToolbarPlugin />
      </div>
      {/* actions plugins */}
    </div>
  )
}
