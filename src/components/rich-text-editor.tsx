"use client";

import * as React from "react";
import type { SerializedEditorState } from "lexical";
import { Editor } from "@/components/blocks/editor-00/editor";

interface RichTextEditorProps {
  value?: SerializedEditorState | null;
  onChange?: (value: SerializedEditorState) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  const [editorState, setEditorState] = React.useState<SerializedEditorState | undefined>(
    value || undefined
  );

  React.useEffect(() => {
    if (value !== undefined) {
      setEditorState(value || undefined);
    }
  }, [value]);

  const handleChange = React.useCallback(
    (newState: SerializedEditorState) => {
      setEditorState(newState);
      onChange?.(newState);
    },
    [onChange]
  );

  return (
    <div className={className}>
      <Editor
        editorSerializedState={editorState}
        onSerializedChange={handleChange}
      />
    </div>
  );
}

