import React, { useMemo } from 'react';
import clsx from 'clsx';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';

const HTML_PATTERN = /<\/?[a-z][\s\S]*>/i;

const normalizeValue = (value) => {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.join('\n');
  }
  try {
    return String(value);
  } catch {
    return '';
  }
};

const RichTextContent = ({
  content,
  className,
  emptyFallback = 'Keine Inhalte verfügbar.',
}) => {
  const resolved = useMemo(() => normalizeValue(content).trim(), [content]);

  if (!resolved) {
    return <p className={clsx('text-sm text-ink/50', className)}>{emptyFallback}</p>;
  }

  if (HTML_PATTERN.test(resolved)) {
    const sanitized = DOMPurify.sanitize(resolved, { USE_PROFILES: { html: true } });
    return (
      <div
        className={clsx(
          'prose prose-sm max-w-none text-ink/80 prose-headings:font-serif prose-strong:text-accent prose-a:text-accent',
          className,
        )}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  return (
    <div
      className={clsx(
        'prose prose-sm max-w-none text-ink/80 prose-headings:font-serif prose-strong:text-accent prose-a:text-accent',
        className,
      )}
    >
      <ReactMarkdown>{resolved}</ReactMarkdown>
    </div>
  );
};

export default RichTextContent;
