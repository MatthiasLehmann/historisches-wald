import React, { useEffect, useId, useMemo } from 'react';
import clsx from 'clsx';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';

const HTML_PATTERN = /<\/?[a-z][\s\S]*>/i;

marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: false,
  mangle: false,
});

const normalizeValue = (input) => {
  if (input == null) {
    return '';
  }
  if (typeof input === 'string') {
    return input;
  }
  if (Array.isArray(input)) {
    return input.join('\n');
  }
  try {
    return String(input);
  } catch {
    return '';
  }
};

const toHtml = (input) => {
  const normalized = normalizeValue(input);
  if (!normalized.trim()) {
    return '';
  }
  if (HTML_PATTERN.test(normalized)) {
    return normalized;
  }
  return marked.parse(normalized);
};

const sanitize = (input) => DOMPurify.sanitize(input || '', { USE_PROFILES: { html: true } });
const stripHtml = (input) => normalizeValue(input).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const ToolbarButton = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={clsx(
      'p-1.5 rounded-sm transition-colors text-sm',
      active ? 'bg-accent text-white' : 'text-ink/70 hover:bg-parchment-dark/80',
      disabled && 'opacity-50 cursor-not-allowed',
    )}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-parchment-dark/80 mx-1" />;

const MarkdownEditor = ({
  id,
  label,
  helperText,
  value = '',
  onChange,
  placeholder = 'Text mit Formatierungen hinzufügen…',
  required = false,
  minRows = 6,
  minHeight,
  readOnly = false,
}) => {
  const generatedId = useId();
  const editorId = id || generatedId;
  const helperId = helperText ? `${editorId}-helper` : undefined;

  const computedMinHeight = useMemo(() => {
    if (minHeight) {
      return typeof minHeight === 'number' ? `${minHeight}px` : String(minHeight);
    }
    if (minRows) {
      return `${Math.max(minRows, 4) * 24}px`;
    }
    return '240px';
  }, [minRows, minHeight]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ codeBlock: false }),
        Underline,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Highlight.configure({ multicolor: false }),
        Placeholder.configure({ placeholder }),
        Link.configure({
          openOnClick: false,
          linkOnPaste: true,
          HTMLAttributes: { class: 'text-accent underline font-semibold' },
        }),
        CharacterCount,
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
      ],
      content: sanitize(toHtml(value)),
      editable: !readOnly,
      onUpdate: ({ editor: instance }) => {
        if (!onChange) {
          return;
        }
        const html = sanitize(instance.getHTML());
        onChange(html);
      },
    },
    [placeholder, readOnly],
  );

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const incoming = sanitize(toHtml(value));
    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming || '<p></p>', false);
    }
  }, [editor, value]);

  const handleSetLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes('link')?.href ?? '';
    const url = window.prompt('URL eingeben:', previous);
    if (url === null) {
      return;
    }
    if (url.trim() === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url.trim() }).run();
  };

  if (!editor) {
    return (
      <div className="space-y-1 text-sm text-ink/60">
        {label && (
          <label className="text-sm font-medium text-ink/80">
            {label}
          </label>
        )}
        <div className="border border-parchment-dark rounded-sm bg-white px-3 py-6 text-ink/40">
          Editor wird geladen…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between text-sm font-medium text-ink/80">
          <label htmlFor={editorId} className="flex items-center gap-1">
            {label}
            {required && <span className="text-red-600" aria-hidden="true">*</span>}
          </label>
          {!readOnly && (
            <span className="text-xs uppercase tracking-wide text-ink/40">WYSIWYG</span>
          )}
        </div>
      )}

      {helperText && (
        <p id={helperId} className="text-xs text-ink/60">
          {helperText}
        </p>
      )}

      <div className={clsx('wysiwyg-editor', readOnly && 'opacity-70')}>
        {!readOnly && (
          <div className="wysiwyg-editor__toolbar" role="toolbar" aria-label="Textformatierung">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Rückgängig (Strg+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Wiederholen (Strg+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </ToolbarButton>

            <Divider />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive('heading', { level: 1 })}
              title="Überschrift 1"
            >
              <Heading1 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive('heading', { level: 2 })}
              title="Überschrift 2"
            >
              <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive('heading', { level: 3 })}
              title="Überschrift 3"
            >
              <Heading3 className="w-4 h-4" />
            </ToolbarButton>

            <Divider />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              title="Fett (Strg+B)"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              title="Kursiv (Strg+I)"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive('underline')}
              title="Unterstrichen (Strg+U)"
            >
              <UnderlineIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive('strike')}
              title="Durchgestrichen"
            >
              <Strikethrough className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              active={editor.isActive('highlight')}
              title="Hervorheben"
            >
              <Highlighter className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              active={editor.isActive('code')}
              title="Code"
            >
              <Code className="w-4 h-4" />
            </ToolbarButton>

            <Divider />

            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              active={editor.isActive({ textAlign: 'left' })}
              title="Links ausrichten"
            >
              <AlignLeft className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              active={editor.isActive({ textAlign: 'center' })}
              title="Zentriert"
            >
              <AlignCenter className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              active={editor.isActive({ textAlign: 'right' })}
              title="Rechts ausrichten"
            >
              <AlignRight className="w-4 h-4" />
            </ToolbarButton>

            <Divider />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
              title="Aufzählungsliste"
            >
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
              title="Nummerierte Liste"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive('blockquote')}
              title="Zitat"
            >
              <Quote className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Trennlinie"
            >
              <Minus className="w-4 h-4" />
            </ToolbarButton>

            <Divider />

            <ToolbarButton
              onClick={handleSetLink}
              active={editor.isActive('link')}
              title="Link einfügen"
            >
              <LinkIcon className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              title="Tabelle einfügen"
            >
              <TableIcon className="w-4 h-4" />
            </ToolbarButton>
          </div>
        )}

        <EditorContent
          editor={editor}
          id={editorId}
          aria-describedby={helperId}
          aria-required={required}
          className="wysiwyg-editor__content"
          style={{ minHeight: computedMinHeight }}
        />

        {!readOnly && (
          <div className="wysiwyg-editor__footer">
            {editor.storage.characterCount?.characters() ?? 0} Zeichen
          </div>
        )}
      </div>

      <textarea
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        readOnly
        value={stripHtml(value)}
        required={required}
      />
    </div>
  );
};

export default MarkdownEditor;
