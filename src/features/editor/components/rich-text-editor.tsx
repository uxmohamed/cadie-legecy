"use client";

import { Editor } from "@/features/editor/components/blocks/editor-00/editor";
import type { SerializedEditorState } from "lexical";
import * as React from "react";

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
  const [editorState, setEditorState] = React.useState<
    SerializedEditorState | undefined
  >(value || undefined);

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
    [onChange],
  );

  return (
    <div className={className || "w-full"}>
      <Editor
        editorSerializedState={editorState}
        onSerializedChange={handleChange}
      />
    </div>
  );
}
