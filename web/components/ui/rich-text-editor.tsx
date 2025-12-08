"use client"

import { type ElementType, useEffect } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import StarterKit from "@tiptap/starter-kit"
import { Bold, Italic, List, ListOrdered, Quote, Redo2, Strikethrough, Undo2, UnderlineIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  className?: string
}

interface ToolbarButtonProps {
  onClick: () => void
  label: string
  isActive?: boolean
  disabled?: boolean
  icon: ElementType
}

function ToolbarButton({ onClick, label, isActive, disabled, icon: Icon }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted",
        isActive && "bg-primary/10 text-primary hover:bg-primary/15",
      )}
      aria-label={label}
    >
      <Icon className="h-3.5 w-3.5" />
    </Button>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Add description...",
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap focus:outline-none text-sm",
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML()
      const isEmpty = editor.state.doc.textContent.trim().length === 0
      onChange(isEmpty ? null : html)
    },
  })

  useEffect(() => {
    if (!editor) return
    const incoming = value || ""
    const current = editor.getHTML()
    if (incoming === current) return
    editor.commands.setContent(incoming || "<p></p>", false)
  }, [editor, value])

  if (!editor) {
    return (
      <div className={cn("rounded-md border bg-background p-2 text-sm text-muted-foreground", className)}>
        Loading editor...
      </div>
    )
  }

  const canUndo = editor.can().chain().focus().undo().run()
  const canRedo = editor.can().chain().focus().redo().run()

  return (
    <div className={cn("rich-text-editor rounded-md border border-input bg-background", className)}>
      <div className="flex items-center gap-0.5 border-b border-border/50 bg-muted/30 px-1.5 py-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          label="Bold"
          icon={Bold}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          label="Italic"
          icon={Italic}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          label="Underline"
          icon={UnderlineIcon}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          label="Strikethrough"
          icon={Strikethrough}
        />

        <Separator orientation="vertical" className="h-5 mx-0.5" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          label="Bullet list"
          icon={List}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          label="Numbered list"
          icon={ListOrdered}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          label="Quote"
          icon={Quote}
        />

        <div className="ml-auto flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            label="Undo"
            icon={Undo2}
            disabled={!canUndo}
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            label="Redo"
            icon={Redo2}
            disabled={!canRedo}
          />
        </div>
      </div>

      <div className="px-2.5 py-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}