"use client";

import { registerCodeHighlighting } from "@lexical/code";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";

// Import Prism and languages
if (typeof window !== "undefined") {
  require("prismjs");
  require("prismjs/components/prism-javascript");
  require("prismjs/components/prism-typescript");
  require("prismjs/components/prism-python");
  require("prismjs/components/prism-jsx");
  require("prismjs/components/prism-tsx");
  require("prismjs/components/prism-css");
  require("prismjs/components/prism-json");
  require("prismjs/components/prism-markdown");
}

export function CodeHighlightPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (typeof window !== "undefined" && window.Prism) {
      return registerCodeHighlighting(editor);
    }
  }, [editor]);

  return null;
}

