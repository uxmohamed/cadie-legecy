import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useState } from "react";

import { ContentEditable } from "@/features/editor/components/editor-ui/content-editable";
import { BlockMenuPlugin } from "./plugins/block-menu-plugin";
import { CodeHighlightPlugin } from "./plugins/code-highlight-plugin";
import { FloatingToolbarPlugin } from "./plugins/floating-toolbar-plugin";
import { KeyboardShortcutsPlugin } from "./plugins/keyboard-shortcuts-plugin";
import { SlashCommandPlugin } from "./plugins/slash-command-plugin";

export function Plugins() {
  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

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
  );
}
