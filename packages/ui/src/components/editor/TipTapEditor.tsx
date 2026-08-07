import * as React from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Placeholder from '@tiptap/extension-placeholder';
import { Node, mergeAttributes } from '@tiptap/core';

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Table as TableIcon,
  ImageIcon,
  Youtube as YoutubeIcon,
  Code,
  Quote,
  AlertTriangle,
  Smile,
  CheckCircle2,
  Save,
  Loader2,
  Plus,
  Trash2,
  Columns,
  Rows,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

// Custom TipTap Callout Node Extension
export const CalloutNode = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
        getAttrs: (element) => ({
          type: (element as HTMLElement).getAttribute('data-callout-type') || 'info',
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'callout',
        'data-callout-type': HTMLAttributes.type,
        class: cn(
          'my-3 rounded-lg border p-4 text-xs font-medium transition-all flex items-start gap-3 shadow-2xs',
          HTMLAttributes.type === 'warning' && 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200',
          HTMLAttributes.type === 'tip' && 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200',
          HTMLAttributes.type === 'info' && 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200',
        ),
      }),
      0,
    ];
  },
});

export interface TipTapEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  onAutoSave?: (html: string) => Promise<void> | void;
  placeholder?: string;
  readOnly?: boolean;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  content = '',
  onChange,
  onAutoSave,
  placeholder = "Write content or type '/' for slash commands...",
  readOnly = false,
}) => {
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedAt, setLastSavedAt] = React.useState<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = React.useState(false);
  const [imageUrlInput, setImageUrlInput] = React.useState('');
  const [youtubeUrlInput, setYoutubeUrlInput] = React.useState('');
  const [showImageModal, setShowImageModal] = React.useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = React.useState(false);

  const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    editable: !readOnly,
    content,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ inline: false, allowBase64: true }),
      Youtube.configure({ width: 640, height: 360 }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CalloutNode,
      Placeholder.configure({ placeholder }),
    ],
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onChange) onChange(html);

      // Check for Slash Command trigger "/"
      const selection = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, selection.from - 1),
        selection.from,
      );
      if (textBefore === '/') {
        setShowSlashMenu(true);
      } else {
        setShowSlashMenu(false);
      }

      // Auto save trigger with 1500ms debounce
      if (onAutoSave) {
        setSaveStatus('saving');
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(async () => {
          await onAutoSave(html);
          setSaveStatus('saved');
          setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }, 1500);
      }
    },
  });

  if (!editor) return null;

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        if (src) {
          editor.chain().focus().setImage({ src }).run();
          setShowImageModal(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const insertImageUrl = () => {
    if (imageUrlInput) {
      editor.chain().focus().setImage({ src: imageUrlInput }).run();
      setImageUrlInput('');
      setShowImageModal(false);
    }
  };

  const insertYoutubeUrl = () => {
    if (youtubeUrlInput) {
      editor.chain().focus().setYoutubeVideo({ src: youtubeUrlInput }).run();
      setYoutubeUrlInput('');
      setShowYoutubeModal(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    editor.chain().focus().insertContent(emoji).run();
  };

  return (
    <div className="rounded-xl border bg-card shadow-xs overflow-hidden flex flex-col">
      {/* Top Auto Save Status Bar */}
      <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/30 text-xs">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px]">
            TipTap Engine v2.11
          </Badge>
          <span className="text-muted-foreground hidden sm:inline">
            Press <kbd className="px-1 py-0.5 rounded border bg-muted font-sans text-[9px]">/</kbd> for Slash Commands
          </span>
        </div>

        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving draft...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="h-3 w-3" /> Saved {lastSavedAt && `at ${lastSavedAt}`}
            </span>
          )}
        </div>
      </div>

      {/* Main Sticky Formatting Toolbar */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1 border-b bg-card p-2 sticky top-0 z-10">
          {/* Headings */}
          <Button
            variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Inline Text Formatting */}
          <Button
            variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('highlight') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            title="Highlight Text"
          >
            <Highlighter className="h-4 w-4 text-amber-500" />
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Lists */}
          <Button
            variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('taskList') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            title="Checklist"
          >
            <ListTodo className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Table Insertion & Controls */}
          <Button
            variant={editor.isActive('table') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
            title="Insert Table"
          >
            <TableIcon className="h-4 w-4" />
          </Button>

          {editor.isActive('table') && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => editor.chain().focus().addRowAfter().run()}
              >
                <Rows className="h-3 w-3 mr-1" /> +Row
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
              >
                <Columns className="h-3 w-3 mr-1" /> +Column
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs text-destructive"
                onClick={() => editor.chain().focus().deleteTable().run()}
              >
                <Trash2 className="h-3 w-3 mr-1" /> Delete Table
              </Button>
            </>
          )}

          <div className="h-4 w-px bg-border mx-1" />

          {/* Media & Embeds */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setShowImageModal(true)}
            title="Upload / Insert Image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setShowYoutubeModal(true)}
            title="Embed YouTube Video"
          >
            <YoutubeIcon className="h-4 w-4 text-red-500" />
          </Button>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Blocks & Callouts */}
          <Button
            variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive('codeBlock') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Code Block"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-semibold gap-1 text-blue-600"
            onClick={() => editor.chain().focus().insertContent({ type: 'callout', attrs: { type: 'info' } }).run()}
            title="Callout Box"
          >
            <AlertTriangle className="h-3.5 w-3.5" /> Callout
          </Button>

          {/* Emoji Shortcuts */}
          <div className="flex items-center gap-1 pl-2">
            {['🇵🇭', '🏛️', '📢', '✅', '⚠️', '💡'].map((e) => (
              <button
                key={e}
                type="button"
                className="hover:bg-accent rounded px-1 text-sm"
                onClick={() => insertEmoji(e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Bubble Menu on Text Selection */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="flex items-center gap-1 rounded-lg border bg-popover p-1 shadow-lg text-popover-foreground">
          <Button
            variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={editor.isActive('highlight') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => editor.chain().focus().toggleHighlight().run()}
          >
            <Highlighter className="h-3.5 w-3.5 text-amber-500" />
          </Button>
        </BubbleMenu>
      )}

      {/* TipTap Document Editing Canvas */}
      <div className="p-4 min-h-[250px] relative prose dark:prose-invert max-w-none focus:outline-none">
        <EditorContent editor={editor} className="min-h-[200px]" />

        {/* Slash Command Quick insertion Popup Menu */}
        {showSlashMenu && (
          <div className="absolute top-12 left-6 z-30 w-64 rounded-lg border bg-popover p-2 shadow-xl animate-in fade-in-50 space-y-1 text-xs">
            <div className="px-2 py-1 font-bold text-muted-foreground border-b text-[10px] uppercase tracking-wider">
              Slash Commands
            </div>
            <button
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-accent text-left font-semibold"
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
                setShowSlashMenu(false);
              }}
            >
              <Heading1 className="h-4 w-4 text-primary" /> Heading 1
            </button>
            <button
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-accent text-left font-semibold"
              onClick={() => {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
                setShowSlashMenu(false);
              }}
            >
              <Heading2 className="h-4 w-4 text-primary" /> Heading 2
            </button>
            <button
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-accent text-left font-semibold"
              onClick={() => {
                editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run();
                setShowSlashMenu(false);
              }}
            >
              <TableIcon className="h-4 w-4 text-primary" /> Insert Table
            </button>
            <button
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-accent text-left font-semibold"
              onClick={() => {
                editor.chain().focus().insertContent({ type: 'callout', attrs: { type: 'info' } }).run();
                setShowSlashMenu(false);
              }}
            >
              <AlertTriangle className="h-4 w-4 text-blue-500" /> Callout Alert
            </button>
            <button
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-accent text-left font-semibold"
              onClick={() => {
                setShowImageModal(true);
                setShowSlashMenu(false);
              }}
            >
              <ImageIcon className="h-4 w-4 text-emerald-500" /> Upload Image
            </button>
          </div>
        )}
      </div>

      {/* Image Upload Modal Dialog */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border bg-card p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" /> Upload / Insert Image
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">Select Local Image File</label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-xs text-muted-foreground border rounded p-2"
                onChange={handleImageFileUpload}
              />
            </div>

            <div className="relative flex items-center justify-center text-xs my-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <span className="relative bg-card px-2 text-muted-foreground">OR URL</span>
            </div>

            <div className="space-y-2">
              <input
                placeholder="https://example.gov.ph/images/banner.png"
                className="w-full text-xs border rounded p-2"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setShowImageModal(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={insertImageUrl} disabled={!imageUrlInput}>
                Insert Image
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* YouTube Embed Modal Dialog */}
      {showYoutubeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border bg-card p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2 text-red-600">
              <YoutubeIcon className="h-5 w-5" /> Embed YouTube Video
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">YouTube Video URL</label>
              <input
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full text-xs border rounded p-2"
                value={youtubeUrlInput}
                onChange={(e) => setYoutubeUrlInput(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setShowYoutubeModal(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={insertYoutubeUrl} disabled={!youtubeUrlInput}>
                Embed Video
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
