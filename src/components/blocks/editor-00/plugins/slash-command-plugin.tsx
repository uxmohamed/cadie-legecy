"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW, COMMAND_PRIORITY_HIGH, KEY_ARROW_DOWN_COMMAND, KEY_ARROW_UP_COMMAND, KEY_ENTER_COMMAND, KEY_ESCAPE_COMMAND, $isElementNode, $isTextNode } from "lexical";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $createCodeNode } from "@lexical/code";
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_CHECK_LIST_COMMAND } from "@lexical/list";
import { $isParagraphNode, $getRoot } from "lexical";

interface SlashCommandOption {
  title: string;
  description: string;
  icon?: string;
  keywords: string[];
  onSelect: () => void;
}

function replaceBlockWithNode(editor: any, createNewNode: () => any) {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    const anchorNode = selection.anchor.getNode();
    const textContent = anchorNode.getTextContent();
    const offset = selection.anchor.offset;
    
    // Find the parent element node (block level)
    let elementNode = anchorNode;
    while (elementNode && !$isElementNode(elementNode)) {
      const parent = elementNode.getParent();
      if (parent) {
        elementNode = parent;
      } else {
        break;
      }
    }
    
    // Get top-level element
    if ($isElementNode(elementNode)) {
      const topLevelElement = elementNode.getTopLevelElement();
      if (topLevelElement && $isElementNode(topLevelElement)) {
        elementNode = topLevelElement;
      }
    }
    
    if ($isElementNode(elementNode)) {
      // Remove "/" character
      if (offset > 0 && textContent[offset - 1] === "/" && $isTextNode(anchorNode)) {
        const beforeSlash = textContent.slice(0, offset - 1);
        const afterSlash = textContent.slice(offset);
        anchorNode.setTextContent(beforeSlash + afterSlash);
      }
      
      const newNode = createNewNode();
      // Move children from old node to new node
      const children = elementNode.getChildren();
      newNode.append(...children);
      elementNode.replace(newNode);
      newNode.select();
    }
  });
}

function createSlashCommandOptions(editor: any): SlashCommandOption[] {
  return [
    {
      title: "Heading 1",
      description: "Big section heading",
      keywords: ["h1", "heading", "title"],
      onSelect: () => replaceBlockWithNode(editor, () => $createHeadingNode("h1")),
    },
    {
      title: "Heading 2",
      description: "Medium section heading",
      keywords: ["h2", "heading", "subtitle"],
      onSelect: () => replaceBlockWithNode(editor, () => $createHeadingNode("h2")),
    },
    {
      title: "Heading 3",
      description: "Small section heading",
      keywords: ["h3", "heading"],
      onSelect: () => replaceBlockWithNode(editor, () => $createHeadingNode("h3")),
    },
    {
      title: "Bulleted List",
      description: "Create a bulleted list",
      keywords: ["ul", "unordered", "bullet", "list"],
      onSelect: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            const textContent = anchorNode.getTextContent();
            const offset = selection.anchor.offset;
            
            if (offset > 0 && textContent[offset - 1] === "/" && $isTextNode(anchorNode)) {
              const beforeSlash = textContent.slice(0, offset - 1);
              const afterSlash = textContent.slice(offset);
              anchorNode.setTextContent(beforeSlash + afterSlash);
            }
          }
        });
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
      },
    },
    {
      title: "Numbered List",
      description: "Create a numbered list",
      keywords: ["ol", "ordered", "number", "list"],
      onSelect: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            const textContent = anchorNode.getTextContent();
            const offset = selection.anchor.offset;
            
            if (offset > 0 && textContent[offset - 1] === "/" && $isTextNode(anchorNode)) {
              const beforeSlash = textContent.slice(0, offset - 1);
              const afterSlash = textContent.slice(offset);
              anchorNode.setTextContent(beforeSlash + afterSlash);
            }
          }
        });
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
      },
    },
    {
      title: "To-do List",
      description: "Create a to-do list",
      keywords: ["todo", "checklist", "task"],
      onSelect: () => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const anchorNode = selection.anchor.getNode();
            const textContent = anchorNode.getTextContent();
            const offset = selection.anchor.offset;
            
            if (offset > 0 && textContent[offset - 1] === "/" && $isTextNode(anchorNode)) {
              const beforeSlash = textContent.slice(0, offset - 1);
              const afterSlash = textContent.slice(offset);
              anchorNode.setTextContent(beforeSlash + afterSlash);
            }
          }
        });
        editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
      },
    },
    {
      title: "Code Block",
      description: "Create a code block",
      keywords: ["code", "pre", "```"],
      onSelect: () => replaceBlockWithNode(editor, () => $createCodeNode()),
    },
    {
      title: "Quote",
      description: "Create a quote block",
      keywords: ["quote", "blockquote"],
      onSelect: () => replaceBlockWithNode(editor, () => $createQuoteNode()),
    },
  ];
}

export function SlashCommandPlugin(): React.ReactPortal | null {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const options = createSlashCommandOptions(editor);
  const filteredOptions = options.filter((option) => {
    const searchTerm = query.toLowerCase();
    return (
      option.title.toLowerCase().includes(searchTerm) ||
      option.description.toLowerCase().includes(searchTerm) ||
      option.keywords.some((keyword) => keyword.includes(searchTerm))
    );
  });

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setIsOpen(false);
          return;
        }

        const anchorNode = selection.anchor.getNode();
        const anchorOffset = selection.anchor.offset;
        const textContent = anchorNode.getTextContent();

        // Find "/" character and check if it's at start of line or after space
        let slashIndex = -1;
        for (let i = anchorOffset - 1; i >= 0; i--) {
          if (textContent[i] === "/") {
            // Check if "/" is at start or after space/newline
            if (i === 0 || textContent[i - 1] === " " || textContent[i - 1] === "\n") {
              slashIndex = i;
              break;
            }
          }
          // Stop if we hit a newline (start of line)
          if (textContent[i] === "\n") {
            break;
          }
        }

        if (slashIndex >= 0) {
          // Check if we're in a valid block type (paragraph or heading)
          let parentNode = $isElementNode(anchorNode) ? anchorNode : anchorNode.getParent();
          
          const isValidBlock = parentNode !== null && $isElementNode(parentNode) && 
            ($isParagraphNode(parentNode) || parentNode.getType().startsWith("heading"));
          
          if (isValidBlock) {
            // Get query text after "/"
            const queryText = textContent.slice(slashIndex + 1, anchorOffset);
            setIsOpen(true);
            setQuery(queryText);
            setSelectedIndex(0);

            // Get position for menu
            const domSelection = window.getSelection();
            if (domSelection && domSelection.rangeCount > 0) {
              const range = domSelection.getRangeAt(0);
              const rect = range.getBoundingClientRect();
              setMenuPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
              });
            }
          } else {
            setIsOpen(false);
          }
        } else {
          setIsOpen(false);
        }
      });
    });
  }, [editor]);

  useEffect(() => {
    if (!isOpen) return;

    return editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      (event) => {
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredOptions.length);
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, isOpen, filteredOptions.length]);

  useEffect(() => {
    if (!isOpen) return;

    return editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      (event) => {
        event.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, isOpen, filteredOptions.length]);

  useEffect(() => {
    if (!isOpen) return;

    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (event) {
          event.preventDefault();
        }
        if (filteredOptions[selectedIndex]) {
          filteredOptions[selectedIndex].onSelect();
          setIsOpen(false);
        }
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, isOpen, selectedIndex, filteredOptions]);

  useEffect(() => {
    if (!isOpen) return;

    return editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        setIsOpen(false);
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, isOpen]);

  if (!isOpen || !menuPosition || filteredOptions.length === 0) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[200px] max-w-[300px] rounded-lg border border-[var(--border-primary)] bg-[var(--bg-l0-solid)] shadow-lg"
      style={{
        top: `${menuPosition.top}px`,
        left: `${menuPosition.left}px`,
      }}
    >
      <div className="max-h-[300px] overflow-y-auto p-1">
        {filteredOptions.length === 0 ? (
          <div className="px-3 py-2 text-sm text-[var(--text-secondary)]">No results</div>
        ) : (
          filteredOptions.map((option, index) => (
            <button
              key={option.title}
              className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                index === selectedIndex
                  ? "bg-[var(--bg-field-hover)] text-[var(--text-primary)]"
                  : "text-[var(--text-primary)] hover:bg-[var(--bg-field-hover)]"
              }`}
              onClick={() => {
                option.onSelect();
                setIsOpen(false);
              }}
            >
              <div className="font-medium">{option.title}</div>
              <div className="text-xs text-[var(--text-secondary)]">{option.description}</div>
            </button>
          ))
        )}
      </div>
    </div>,
    document.body
  );
}

