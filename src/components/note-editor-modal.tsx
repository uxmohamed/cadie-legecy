"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconBold, IconList, IconListNumbers, IconHighlight } from "@tabler/icons-react";

interface NoteEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: { title: string; html: string; plainText: string }) => Promise<void>;
}

export function NoteEditorModal({ open, onOpenChange, onSave }: NoteEditorModalProps) {
  const [title, setTitle] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const editorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) {
      setTitle("");
      if (editorRef.current) editorRef.current.innerHTML = "";
    }
  }, [open]);

  const exec = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false);
  };

  const toggleHighlight = () => {
    editorRef.current?.focus();
    document.execCommand("hiliteColor", false, "#fff59d");
  };

  const getHtml = () => editorRef.current?.innerHTML || "";
  const getPlainText = () => editorRef.current?.innerText || "";

  const canSave = title.trim().length > 0 && getPlainText().trim().length > 0 && !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await onSave({ title: title.trim(), html: getHtml(), plainText: getPlainText() });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create note</DialogTitle>
          <DialogDescription>
            Add a title and write formatted notes with bullets, numbering, bold, and highlights.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Note title"
            maxLength={160}
          />

          <div className="flex items-center gap-1.5 rounded-md border border-border p-1">
            <Button type="button" size="icon" variant="ghost" onClick={() => exec("bold")}><IconBold className="h-4 w-4" /></Button>
            <Button type="button" size="icon" variant="ghost" onClick={() => exec("insertUnorderedList")}><IconList className="h-4 w-4" /></Button>
            <Button type="button" size="icon" variant="ghost" onClick={() => exec("insertOrderedList")}><IconListNumbers className="h-4 w-4" /></Button>
            <Button type="button" size="icon" variant="ghost" onClick={toggleHighlight}><IconHighlight className="h-4 w-4" /></Button>
          </div>

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="note-editor min-h-52 rounded-md border border-border bg-bg-surface p-3 text-sm outline-none"
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={() => void handleSave()} disabled={!canSave}>{isSaving ? "Saving..." : "Save note"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
