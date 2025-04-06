import { useState, useEffect, useCallback } from "react";
import { Document } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered, Quote, Undo, Redo, Link as LinkIcon, Code, FileCode, FileText } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { DOCUMENT_TYPE_INFO } from "@/lib/database";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface DocumentEditorProps {
  document: Document | null | undefined;
  isLoading: boolean;
  onChange: (content: string) => void;
}

export default function DocumentEditor({ document, isLoading, onChange }: DocumentEditorProps) {
  const [content, setContent] = useState("");
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  const [markdownContent, setMarkdownContent] = useState("");
  
  // Update local state when document changes
  useEffect(() => {
    if (document) {
      setContent(document.content);
      setMarkdownContent(document.content);
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
    if (editor && document && !isMarkdownMode) {
      // Only update if the content is different to avoid cursor jumps during typing
      if (editor.getHTML() !== document.content) {
        // Process content to make sure Markdown is properly handled
        const processedContent = processMarkdownForEditor(document.content);
        editor.commands.setContent(processedContent);
      }
    }
  }, [editor, document, isMarkdownMode]);
  
  // Handle markdown content changes
  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMarkdown = e.target.value;
    setMarkdownContent(newMarkdown);
    onChange(newMarkdown);
  };
  
  // Process markdown content to preserve line breaks and formatting
  const processMarkdownForEditor = (markdownText: string) => {
    // First, process multiline elements like lists
    let processedText = markdownText;
    
    // Process bullet lists
    const bulletListPattern = /(?:^|\n)((?:- .*(?:\n|$))+)/g;
    processedText = processedText.replace(bulletListPattern, (match, listContent) => {
      const listItems = listContent
        .split('\n')
        .filter(line => line.trim().startsWith('- '))
        .map(line => `<li>${line.replace(/^- /, '')}</li>`)
        .join('');
      return `<ul>${listItems}</ul>`;
    });
    
    // Process numbered lists
    const numberedListPattern = /(?:^|\n)((?:\d+\. .*(?:\n|$))+)/g;
    processedText = processedText.replace(numberedListPattern, (match, listContent) => {
      const listItems = listContent
        .split('\n')
        .filter(line => /^\d+\. /.test(line.trim()))
        .map(line => `<li>${line.replace(/^\d+\. /, '')}</li>`)
        .join('');
      return `<ol>${listItems}</ol>`;
    });
    
    // Replace other markdown elements
    return processedText
      // Format headings
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      // Format bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Format code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Format inline code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Preserve remaining line breaks by converting them to <br> tags
      // Do this last to avoid interfering with other patterns
      .replace(/\n/g, '<br />');
  };

  // Handle toggle between rich text and markdown modes
  const toggleEditMode = () => {
    if (isMarkdownMode) {
      // Switch from Markdown to Rich Text
      if (editor) {
        const processedContent = processMarkdownForEditor(markdownContent);
        editor.commands.setContent(processedContent);
      }
    } else {
      // Switch from Rich Text to Markdown
      setMarkdownContent(content);
    }
    setIsMarkdownMode(!isMarkdownMode);
  };
  
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
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleEditMode}
            className="flex items-center gap-1"
          >
            {isMarkdownMode ? (
              <>
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Rich Text</span>
              </>
            ) : (
              <>
                <FileCode className="h-4 w-4" />
                <span className="hidden sm:inline">Markdown</span>
              </>
            )}
          </Button>
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
      
      {/* Rich Text Editor Toolbar - Only show in rich text mode */}
      {!isMarkdownMode && (
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
      )}
      
      {/* Editor Content - Show either rich text editor or markdown textarea */}
      <div className="flex-grow overflow-auto p-4">
        {isMarkdownMode ? (
          <Textarea 
            value={markdownContent}
            onChange={handleMarkdownChange}
            className="h-full w-full resize-none font-mono text-sm leading-relaxed"
            placeholder="Type or paste Markdown here..."
          />
        ) : (
          <EditorContent editor={editor} className="prose max-w-none h-full" />
        )}
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
