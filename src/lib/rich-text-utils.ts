import type { SerializedEditorState } from "lexical";

/**
 * Creates an initial Lexical editor state from plain text
 */
export function createInitialRichTextState(text: string): SerializedEditorState {
  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: text,
              type: "text",
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  } as SerializedEditorState;
}

/**
 * Extracts plain text from Lexical editor state for preview
 */
export function extractTextFromRichText(
  state: SerializedEditorState | null | undefined
): string {
  if (!state?.root?.children) return "";

  const extractText = (node: any): string => {
    if (node.type === "text") {
      return node.text || "";
    }
    if (node.children && Array.isArray(node.children)) {
      return node.children.map(extractText).join("");
    }
    return "";
  };

  return state.root.children.map(extractText).join(" ").trim();
}

