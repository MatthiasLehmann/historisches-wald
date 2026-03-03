import React, { useId, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';

const TOOLBAR_BUTTONS = [
  { key: 'bold', label: 'B', title: 'Fett', type: 'wrap', start: '**', end: '**', fallback: 'Fetter Text' },
  { key: 'italic', label: 'I', title: 'Kursiv', type: 'wrap', start: '*', end: '*', fallback: 'Kursiver Text' },
  { key: 'heading', label: 'H3', title: 'Überschrift', type: 'prefix-line', prefix: '### ', fallback: 'Überschrift' },
  { key: 'ul', label: '-', title: 'Liste', type: 'prefix-line', prefix: '- ', fallback: 'Listeneintrag' },
  { key: 'ol', label: '1.', title: 'Nummeriert', type: 'prefix-line', prefix: '1. ', fallback: 'Erster Punkt' },
  { key: 'quote', label: '>', title: 'Zitat', type: 'prefix-line', prefix: '> ', fallback: 'Zitat' },
  { key: 'inline-code', label: '`', title: 'Inline-Code', type: 'wrap', start: '`', end: '`', fallback: 'code' },
  { key: 'code', label: '{}', title: 'Codeblock', type: 'wrap', start: '```\n', end: '\n```', fallback: 'Code' },
  { key: 'link', label: 'Link', title: 'Link', type: 'wrap', start: '[', end: '](https://)', fallback: 'Linktext' },
  { key: 'rule', label: 'HR', title: 'Horizontale Linie', type: 'insert', text: '\n\n---\n\n' },
];

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

const MarkdownEditor = ({
  id,
  label,
  helperText,
  value = '',
  onChange,
  placeholder,
  required = false,
  minRows = 6,
}) => {
  const generatedId = useId();
  const editorId = id || generatedId;
  const textareaRef = useRef(null);
  const [viewMode, setViewMode] = useState('split');
  const safeValue = useMemo(() => normalizeValue(value), [value]);

  const handleToolbarClick = (button) => {
    if (!onChange) {
      return;
    }
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    textarea.focus();
    const selectionStart = textarea.selectionStart ?? 0;
    const selectionEnd = textarea.selectionEnd ?? 0;
    const selection = safeValue.slice(selectionStart, selectionEnd);
    const fallbackContent = button.fallback ?? 'Text';
    let nextValue = safeValue;
    let nextSelectionStart = selectionStart;
    let nextSelectionEnd = selectionEnd;

    if (button.type === 'wrap') {
      const inner = selection || fallbackContent;
      nextValue = `${safeValue.slice(0, selectionStart)}${button.start}${inner}${button.end}${safeValue.slice(selectionEnd)}`;
      nextSelectionStart = selectionStart + button.start.length;
      nextSelectionEnd = nextSelectionStart + inner.length;
    } else if (button.type === 'prefix-line') {
      if (selection) {
        const block = selection
          .split('\n')
          .map((line) => `${button.prefix}${line}`)
          .join('\n');
        nextValue = `${safeValue.slice(0, selectionStart)}${block}${safeValue.slice(selectionEnd)}`;
        nextSelectionStart = selectionStart;
        nextSelectionEnd = selectionStart + block.length;
      } else {
        const block = `${button.prefix}${fallbackContent}`;
        nextValue = `${safeValue.slice(0, selectionStart)}${block}${safeValue.slice(selectionEnd)}`;
        nextSelectionStart = selectionStart + button.prefix.length;
        nextSelectionEnd = nextSelectionStart + fallbackContent.length;
      }
    } else if (button.type === 'insert') {
      nextValue = `${safeValue.slice(0, selectionStart)}${button.text}${safeValue.slice(selectionEnd)}`;
      nextSelectionStart = selectionStart + button.text.length;
      nextSelectionEnd = nextSelectionStart;
    }

    onChange(nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextSelectionStart, nextSelectionEnd);
    });
  };

  const handleTextareaChange = (event) => {
    onChange?.(event.target.value);
  };

  const showEditor = viewMode !== 'preview';
  const showPreview = viewMode !== 'editor';

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between text-sm font-medium text-ink/80">
          <label htmlFor={editorId}>{label}</label>
          <div className="flex rounded-sm border border-parchment-dark overflow-hidden text-xs">
            {['split', 'editor', 'preview'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={clsx(
                  'px-2 py-1 uppercase tracking-wide',
                  viewMode === mode ? 'bg-ink text-white' : 'bg-parchment/40 text-ink/70',
                )}
              >
                {mode === 'split' ? 'Beides' : mode === 'editor' ? 'Editor' : 'Vorschau'}
              </button>
            ))}
          </div>
        </div>
      )}

      {helperText && <p className="text-xs text-ink/60">{helperText}</p>}

      <div className="flex flex-wrap gap-2 border border-parchment-dark rounded-sm bg-parchment/30 p-2 text-xs">
        {TOOLBAR_BUTTONS.map((button) => (
          <button
            key={button.key}
            type="button"
            onClick={() => handleToolbarClick(button)}
            className="px-2 py-1 border border-parchment-dark/60 rounded-sm bg-white hover:bg-parchment/60"
          >
            {button.label}
          </button>
        ))}
      </div>

      <div className={clsx('grid gap-4', showEditor && showPreview ? 'md:grid-cols-2' : 'grid-cols-1')}>
        <textarea
          id={editorId}
          ref={textareaRef}
          value={safeValue}
          onChange={handleTextareaChange}
          placeholder={placeholder}
          required={required}
          rows={minRows}
          className={clsx(
            'w-full border border-parchment-dark rounded-sm px-3 py-2 font-mono text-sm bg-white focus:outline-none focus:ring-1 focus:ring-accent',
            !showEditor && 'sr-only',
          )}
        />

        {showPreview && (
          <div className="border border-parchment-dark rounded-sm bg-white p-3 text-sm text-ink/80 overflow-auto min-h-[150px]">
            {safeValue.trim() ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>
                  {safeValue}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-ink/40">Noch kein Inhalt.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;
