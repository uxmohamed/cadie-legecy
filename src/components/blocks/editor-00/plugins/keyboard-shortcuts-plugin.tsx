"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_MODIFIER_COMMAND,
} from "lexical";
import { useEffect } from "react";
import {
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
} from "lexical";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";

export function KeyboardShortcutsPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (event) => {
        const { ctrlKey, metaKey, key } = event;
        const isModifier = ctrlKey || metaKey;

        if (!isModifier) {
          return false;
        }

        switch (key) {
          case "b":
          case "B":
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
            return true;

          case "i":
          case "I":
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
            return true;

          case "u":
          case "U":
            event.preventDefault();
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
            return true;

          case "k":
          case "K":
            event.preventDefault();
            // Prompt for link URL
            const url = prompt("Enter URL:");
            if (url) {
              editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
            }
            return true;

          default:
            return false;
        }
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}

