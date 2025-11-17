"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
} from "lexical";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { Bold, Italic, Strikethrough, Code, Link, Highlighter } from "lucide-react";
import { $patchStyleText } from "@lexical/selection";

const HIGHLIGHT_COLORS = [
  { name: "None", value: "" },
  { name: "Yellow", value: "#fef08a" },
  { name: "Green", value: "#bbf7d0" },
  { name: "Turquoise", value: "#99f6e4" },
  { name: "Cyan", value: "#a5f3fc" },
  { name: "Blue", value: "#bfdbfe" },
  { name: "Purple", value: "#ddd6fe" },
  { name: "Pink", value: "#fbcfe8" },
  { name: "Peach", value: "#fed7aa" },
  { name: "Gray", value: "#e5e5e5" },
];

export function FloatingToolbarPlugin(): React.ReactPortal | null {
  const [editor] = useLexicalComposerContext();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    
    if (!$isRangeSelection(selection) || selection.isCollapsed()) {
      setIsVisible(false);
      setShowColorPicker(false);
      return;
    }

    const domSelection = window.getSelection();
    if (!domSelection || domSelection.rangeCount === 0) {
      setIsVisible(false);
      return;
    }

    const range = domSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (rect.width === 0 && rect.height === 0) {
      setIsVisible(false);
      return;
    }

    // Position toolbar above selection
    setPosition({
      top: rect.top + window.scrollY - 48, // 48px above for toolbar height
      left: rect.left + window.scrollX + rect.width / 2 - 150, // Center toolbar (300px wide / 2)
    });
    setIsVisible(true);
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        editor.getEditorState().read(() => {
          updateToolbar();
        });
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatText = (format: "bold" | "italic" | "strikethrough" | "code") => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const insertLink = () => {
    const url = prompt("Enter URL:");
    if (url) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    }
  };

  const applyHighlight = (color: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, {
          "background-color": color || null,
        });
      }
    });
    setShowColorPicker(false);
  };

  if (!isVisible || !position) return null;

  return createPortal(
    <div
      ref={toolbarRef}
      className="fixed z-50 flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseDown={(e) => {
        // Prevent toolbar from losing selection
        e.preventDefault();
      }}
    >
      <button
        className="flex h-8 w-8 items-center justify-center rounded hover:bg-neutral-100 transition-colors"
        onClick={() => formatText("bold")}
        title="Bold (Cmd+B)"
      >
        <Bold className="h-4 w-4 text-neutral-700" />
      </button>
      
      <button
        className="flex h-8 w-8 items-center justify-center rounded hover:bg-neutral-100 transition-colors"
        onClick={() => formatText("italic")}
        title="Italic (Cmd+I)"
      >
        <Italic className="h-4 w-4 text-neutral-700" />
      </button>
      
      <button
        className="flex h-8 w-8 items-center justify-center rounded hover:bg-neutral-100 transition-colors"
        onClick={() => formatText("strikethrough")}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4 text-neutral-700" />
      </button>
      
      <button
        className="flex h-8 w-8 items-center justify-center rounded hover:bg-neutral-100 transition-colors"
        onClick={() => formatText("code")}
        title="Code"
      >
        <Code className="h-4 w-4 text-neutral-700" />
      </button>
      
      <div className="w-px h-6 bg-neutral-200" />
      
      <button
        className="flex h-8 w-8 items-center justify-center rounded hover:bg-neutral-100 transition-colors"
        onClick={insertLink}
        title="Link (Cmd+K)"
      >
        <Link className="h-4 w-4 text-neutral-700" />
      </button>
      
      <div className="relative">
        <button
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-neutral-100 transition-colors"
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Highlight Color"
        >
          <Highlighter className="h-4 w-4 text-neutral-700" />
        </button>
        
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 rounded-lg border border-neutral-200 bg-white p-2 shadow-lg">
            <div className="flex gap-1">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.name}
                  className="h-6 w-6 rounded border border-neutral-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value || "#ffffff" }}
                  onClick={() => applyHighlight(color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

