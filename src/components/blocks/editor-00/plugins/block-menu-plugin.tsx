"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isElementNode,
  $getRoot,
  $createParagraphNode,
} from "lexical";
import { useEffect, useRef, useState } from "react";
import { $createHeadingNode } from "@lexical/rich-text";
import { $createQuoteNode } from "@lexical/rich-text";
import { $createCodeNode } from "@lexical/code";
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, INSERT_CHECK_LIST_COMMAND } from "@lexical/list";
import { MoreHorizontal, Trash2, Copy, Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare, Code, Quote } from "lucide-react";

interface BlockMenuPosition {
  top: number;
  left: number;
  blockKey: string;
}

export function BlockMenuPlugin(): null {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<BlockMenuPosition | null>(null);
  const [hoveredBlockKey, setHoveredBlockKey] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Use selection to detect current block
    return editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setHoveredBlockKey(null);
          return;
        }

        const anchorNode = selection.anchor.getNode();
        const blockNode = anchorNode.getTopLevelElement();
        
        if (blockNode) {
          setHoveredBlockKey(blockNode.getKey());
        }
      });
    });
  }, [editor]);

  useEffect(() => {
    if (!hoveredBlockKey) {
      setIsOpen(false);
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Show menu after short delay
    timeoutRef.current = setTimeout(() => {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const blockNode = root.getDescendantByKey(hoveredBlockKey);
        
        if (blockNode && $isElementNode(blockNode)) {
          // Get DOM element for positioning
          const domElement = editor.getElementByKey(hoveredBlockKey);
          if (domElement) {
            const rect = domElement.getBoundingClientRect();
            setPosition({
              top: rect.top + window.scrollY,
              left: rect.left + window.scrollX - 40,
              blockKey: hoveredBlockKey,
            });
            setIsOpen(true);
          }
        }
      });
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [hoveredBlockKey, editor]);

  const handleDelete = () => {
    editor.update(() => {
      const root = $getRoot();
      const blockNode = root.getDescendantByKey(position?.blockKey || "");
      if (blockNode) {
        blockNode.remove();
      }
    });
    setIsOpen(false);
  };

  const handleDuplicate = () => {
    editor.update(() => {
      const root = $getRoot();
      const blockNode = root.getDescendantByKey(position?.blockKey || "");
      if (blockNode && $isElementNode(blockNode)) {
        const clonedNode = blockNode.constructor.create(blockNode.getJSON());
        blockNode.insertAfter(clonedNode);
      }
    });
    setIsOpen(false);
  };

  const handleConvertTo = (type: string) => {
    editor.update(() => {
      const root = $getRoot();
      const blockNode = root.getDescendantByKey(position?.blockKey || "");
      if (!blockNode) return;

      let newNode;
      switch (type) {
        case "h1":
          newNode = $createHeadingNode("h1");
          break;
        case "h2":
          newNode = $createHeadingNode("h2");
          break;
        case "h3":
          newNode = $createHeadingNode("h3");
          break;
        case "paragraph":
          newNode = $createParagraphNode();
          break;
        case "quote":
          newNode = $createQuoteNode();
          break;
        case "code":
          newNode = $createCodeNode();
          break;
        default:
          newNode = $createParagraphNode();
      }

      if (newNode) {
        const textContent = blockNode.getTextContent();
        newNode.append(...blockNode.getChildren());
        blockNode.replace(newNode);
        newNode.select();
      }
    });
    setIsOpen(false);
  };

  if (!isOpen || !position) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] rounded-lg border border-neutral-200 bg-white shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="p-1">
        <div className="mb-1 border-b border-neutral-200 px-2 py-1.5 text-xs font-medium text-neutral-500">
          Turn into
        </div>
        <button
          className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
          onClick={() => handleConvertTo("h1")}
        >
          <Heading1 className="h-4 w-4" />
          Heading 1
        </button>
        <button
          className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
          onClick={() => handleConvertTo("h2")}
        >
          <Heading2 className="h-4 w-4" />
          Heading 2
        </button>
        <button
          className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
          onClick={() => handleConvertTo("h3")}
        >
          <Heading3 className="h-4 w-4" />
          Heading 3
        </button>
        <button
          className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
          onClick={() => handleConvertTo("paragraph")}
        >
          Paragraph
        </button>
        <button
          className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
          onClick={() => handleConvertTo("quote")}
        >
          <Quote className="h-4 w-4" />
          Quote
        </button>
        <button
          className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
          onClick={() => handleConvertTo("code")}
        >
          <Code className="h-4 w-4" />
          Code Block
        </button>
        
        <div className="my-1 border-b border-neutral-200" />
        
        <button
          className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
          onClick={handleDuplicate}
        >
          <Copy className="h-4 w-4" />
          Duplicate
        </button>
        <button
          className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </div>
  );
}

