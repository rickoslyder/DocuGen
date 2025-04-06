import { useState, useEffect, useCallback } from "react";
import { Document } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered, Quote, Undo, Redo, Link as LinkIcon, Code } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { DOCUMENT_TYPE_INFO } from "@/lib/database";

interface DocumentEditorProps {
  document: Document | null | undefined;
  isLoading: boolean;
  onChange: (content: string) => void;
}

export default function DocumentEditor({ document, isLoading, onChange }: DocumentEditorProps) {
  const [content, setContent] = useState("");
  
  // Update local state when document changes
  useEffect(() => {
    if (document) {
      setContent(document.content);
    }
  }, [document]);
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start typing or paste content here...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
      onChange(html);
    },
  });
  
  // Update editor content when document changes
  useEffect(() => {
    if (editor && document) {
      // Only update if the content is different to avoid cursor jumps during typing
      if (editor.getHTML() !== document.content) {
        editor.commands.setContent(document.content);
      }
    }
  }, [editor, document]);
  
  const documentTitle = document 
    ? DOCUMENT_TYPE_INFO[document.type as keyof typeof DOCUMENT_TYPE_INFO]?.name || document.type.replace(/-/g, ' ')
    : '';
  
  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }
  
  if (!document) {
    return (
      <div className="border-b border-gray-200 px-4 py-5 sm:px-6 text-center text-gray-500">
        <p className="text-lg">No document selected</p>
        <p className="mt-1">Select a document type from the tabs above</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 px-4 py-4 sm:px-6 flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">{documentTitle}</h2>
        <div className="flex items-center">
          <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            document.status === "completed"
              ? "bg-green-100 text-green-800"
              : "bg-blue-100 text-blue-800"
          )}>
            <span className={cn(
              "mr-1.5 h-2 w-2 rounded-full",
              document.status === "completed" ? "bg-green-400" : "bg-blue-400"
            )} />
            {document.status === "completed" ? "Completed" : "Draft"}
          </span>
        </div>
      </div>
      
      {/* Rich Text Editor Toolbar */}
      <div className="border-b border-gray-200 px-4 py-2 flex items-center space-x-1">
        <Toggle
          size="sm"
          pressed={editor?.isActive('bold')}
          onPressedChange={() => editor?.chain().focus().toggleBold().run()}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor?.isActive('italic')}
          onPressedChange={() => editor?.chain().focus().toggleItalic().run()}
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor?.isActive('bulletList')}
          onPressedChange={() => editor?.chain().focus().toggleBulletList().run()}
          aria-label="Bullet List"
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor?.isActive('orderedList')}
          onPressedChange={() => editor?.chain().focus().toggleOrderedList().run()}
          aria-label="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor?.isActive('blockquote')}
          onPressedChange={() => editor?.chain().focus().toggleBlockquote().run()}
          aria-label="Quote"
        >
          <Quote className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor?.isActive('code')}
          onPressedChange={() => editor?.chain().focus().toggleCode().run()}
          aria-label="Code"
        >
          <Code className="h-4 w-4" />
        </Toggle>
        <div className="h-6 mx-2 border-l border-gray-300"></div>
        <Toggle
          size="sm"
          onPressedChange={() => editor?.chain().focus().undo().run()}
          aria-label="Undo"
        >
          <Undo className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          onPressedChange={() => editor?.chain().focus().redo().run()}
          aria-label="Redo"
        >
          <Redo className="h-4 w-4" />
        </Toggle>
      </div>
      
      {/* Editor Content */}
      <div className="flex-grow overflow-auto p-4">
        <EditorContent editor={editor} className="prose max-w-none h-full" />
      </div>
    </div>
  );
}

// Helper function for conditional className joining
import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
