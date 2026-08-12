const HTML_PATTERN = /<\/?[a-z][\s\S]*>/i;
const BLOCK_TAGS = new Set(['address', 'article', 'aside', 'blockquote', 'br', 'div', 'figcaption', 'figure', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'li', 'ol', 'p', 'pre', 'section', 'ul']);
const INLINE_TAGS = new Set(['a', 'abbr', 'b', 'code', 'em', 'i', 'mark', 'small', 'span', 'strong', 'sub', 'sup', 'u']);
const MEDIA_TAGS = new Set(['img']);
const ALLOWED_TAGS = new Set([...BLOCK_TAGS, ...INLINE_TAGS, ...MEDIA_TAGS]);
const GLOBAL_ATTRIBUTES = new Set(['class', 'title', 'aria-label']);
const ATTRIBUTE_ALLOWLIST = {
  a: new Set(['href', 'target', 'rel']),
  figure: new Set(['data-album-photo-id']),
  img: new Set(['src', 'alt', 'loading'])
};

export const normalizeContent = (value) => {
  if (value == null) {
    return '';
  }
  if (Array.isArray(value)) {
    return value.join('\n\n');
  }
  return String(value);
};

export const isHtmlContent = (value) => HTML_PATTERN.test(normalizeContent(value));

const isSafeUrl = (value) => {
  if (!value) {
    return false;
  }
  return /^(https?:|\/|#)/i.test(value);
};

const unwrapElement = (element) => {
  const fragment = element.ownerDocument.createDocumentFragment();
  while (element.firstChild) {
    fragment.appendChild(element.firstChild);
  }
  element.replaceWith(fragment);
};

export const sanitizeHtml = (value) => {
  const html = normalizeContent(value).trim();
  if (!html || typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
    return html;
  }

  const parser = new window.DOMParser();
  const document = parser.parseFromString(html, 'text/html');
  const walker = document.createTreeWalker(document.body, window.NodeFilter.SHOW_ELEMENT);
  const elements = [];
  let current = walker.nextNode();

  while (current) {
    elements.push(current);
    current = walker.nextNode();
  }

  elements.forEach((element) => {
    const tagName = element.tagName.toLowerCase();

    if (['script', 'style', 'iframe', 'object', 'embed'].includes(tagName)) {
      element.remove();
      return;
    }

    if (!ALLOWED_TAGS.has(tagName)) {
      unwrapElement(element);
      return;
    }

    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const allowedForTag = ATTRIBUTE_ALLOWLIST[tagName];
      const isAllowed = GLOBAL_ATTRIBUTES.has(name) || allowedForTag?.has(name);

      if (!isAllowed || name.startsWith('on')) {
        element.removeAttribute(attribute.name);
        return;
      }

      if ((name === 'href' || name === 'src') && !isSafeUrl(attribute.value)) {
        element.removeAttribute(attribute.name);
      }
    });

    if (tagName === 'a' && element.hasAttribute('href')) {
      element.setAttribute('rel', 'noreferrer');
    }

    if (tagName === 'img') {
      element.setAttribute('loading', 'lazy');
      if (!element.getAttribute('alt')) {
        element.setAttribute('alt', '');
      }
    }
  });

  return document.body.innerHTML;
};

export const toPlainText = (value) => {
  if (value == null) {
    return '';
  }
  const text = normalizeContent(value);
  const withoutTags = HTML_PATTERN.test(text) ? text.replace(/<[^>]+>/g, ' ') : text;
  return withoutTags
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const formatYear = (value) => value || 'Ohne Jahr';

export const getImageSrc = (image) => {
  if (!image) {
    return '';
  }
  if (typeof image === 'string') {
    return image;
  }
  return image.src || image.preview || image.coverPhoto || image.original || '';
};

export const getImageOriginal = (image) => {
  if (!image) {
    return '';
  }
  if (typeof image === 'string') {
    return image;
  }
  return image.original || image.src || image.preview || image.coverPhoto || '';
};
