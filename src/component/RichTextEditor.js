import React, { useEffect, useRef } from 'react';
import Quill from 'quill';

const EMPTY_EDITOR_HTML = '<p><br></p>';
const ALLOWED_TAGS = new Set([
  'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'BLOCKQUOTE', 'PRE', 'CODE',
  'UL', 'OL', 'LI', 'A', 'IMG', 'H1', 'H2', 'H3', 'SPAN'
]);
const ALLOWED_ATTRIBUTES = {
  A: new Set(['href', 'target', 'rel']),
  IMG: new Set(['src', 'alt']),
  SPAN: new Set(['class'])
};

const sanitizeHtml = (html = '') => {
  if (!html || typeof window === 'undefined') {
    return '';
  }

  const parser = new window.DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const sanitizeNode = (node) => {
    if (node.nodeType === window.Node.TEXT_NODE) {
      return;
    }

    if (node.nodeType !== window.Node.ELEMENT_NODE) {
      node.remove();
      return;
    }

    const tagName = node.tagName.toUpperCase();
    if (!ALLOWED_TAGS.has(tagName)) {
      const fragment = document.createDocumentFragment();
      while (node.firstChild) {
        fragment.appendChild(node.firstChild);
      }
      node.replaceWith(fragment);
      return;
    }

    Array.from(node.attributes).forEach((attribute) => {
      const attributeName = attribute.name.toLowerCase();
      const allowedAttributes = ALLOWED_ATTRIBUTES[tagName] || new Set();

      if (!allowedAttributes.has(attribute.name)) {
        node.removeAttribute(attribute.name);
      }

      if (tagName === 'A' && attributeName === 'href') {
        const hrefValue = node.getAttribute('href') || '';
        if (!/^https?:\/\//i.test(hrefValue) && !hrefValue.startsWith('mailto:')) {
          node.removeAttribute('href');
        } else {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      }

      if (tagName === 'IMG' && attributeName === 'src') {
        const srcValue = node.getAttribute('src') || '';
        if (!/^https?:\/\//i.test(srcValue) && !srcValue.startsWith('data:image/')) {
          node.removeAttribute('src');
        }
      }
    });

    Array.from(node.childNodes).forEach(sanitizeNode);
  };

  Array.from(doc.body.childNodes).forEach(sanitizeNode);
  return doc.body.innerHTML;
};

const normalizeEditorHtml = (html = '') => {
  const sanitizedHtml = sanitizeHtml(html);
  return sanitizedHtml && sanitizedHtml !== '<p></p>' ? sanitizedHtml : '';
};

const RichTextEditor = ({ value, onChange, placeholder, className = '' }) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const latestOnChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);
  const syncFrameRef = useRef(null);

  useEffect(() => {
    latestOnChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!editorRef.current || quillRef.current) {
      return undefined;
    }

    const editorElement = editorRef.current;
    editorElement.innerHTML = '';

    const toolbarOptions = [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ];

    const quill = new Quill(editorElement, {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: {
          container: toolbarOptions,
          handlers: {
            image: () => {
              const input = document.createElement('input');
              input.setAttribute('type', 'file');
              input.setAttribute('accept', 'image/*');
              input.click();

              input.onchange = () => {
                const file = input.files?.[0];
                if (!file) {
                  return;
                }

                const reader = new FileReader();
                reader.onload = () => {
                  const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
                  quill.insertEmbed(range.index, 'image', reader.result);
                  quill.setSelection(range.index + 1, 0);
                };
                reader.readAsDataURL(file);
              };
            }
          }
        }
      }
    });

    const initialHtml = normalizeEditorHtml(initialValueRef.current);
    quill.clipboard.dangerouslyPasteHTML(initialHtml || EMPTY_EDITOR_HTML);

    const emitChange = () => {
      const nextHtml = normalizeEditorHtml(quill.root.innerHTML);
      latestOnChangeRef.current?.(nextHtml);
    };

    const handleTextChange = () => {
      if (syncFrameRef.current) {
        cancelAnimationFrame(syncFrameRef.current);
      }

      syncFrameRef.current = requestAnimationFrame(emitChange);
    };

    const handlePaste = (event) => {
      const html = event.clipboardData?.getData('text/html');
      const plainText = event.clipboardData?.getData('text/plain');

      if (!html && !plainText) {
        return;
      }

      event.preventDefault();

      const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
      const safeHtml = normalizeEditorHtml(html);

      if (safeHtml) {
        quill.clipboard.dangerouslyPasteHTML(range.index, safeHtml, 'user');
      } else {
        quill.insertText(range.index, plainText || '', 'user');
      }
    };

    quill.on('text-change', handleTextChange);
    quill.root.addEventListener('paste', handlePaste);
    quillRef.current = quill;

    return () => {
      if (syncFrameRef.current) {
        cancelAnimationFrame(syncFrameRef.current);
        syncFrameRef.current = null;
      }

      quill.off('text-change', handleTextChange);
      quill.root.removeEventListener('paste', handlePaste);
      editorElement.innerHTML = '';
      quillRef.current = null;
    };
  }, [placeholder]);

  useEffect(() => {
    if (!quillRef.current) {
      return;
    }

    const nextHtml = normalizeEditorHtml(value);
    const currentHtml = normalizeEditorHtml(quillRef.current.root.innerHTML);

    if (currentHtml === nextHtml) {
      return;
    }

    const selection = quillRef.current.getSelection();
    quillRef.current.clipboard.dangerouslyPasteHTML(nextHtml || EMPTY_EDITOR_HTML);

    if (selection) {
      const editorLength = quillRef.current.getLength();
      const safeIndex = Math.min(selection.index, Math.max(editorLength - 1, 0));
      quillRef.current.setSelection(safeIndex, selection.length);
    }
  }, [value]);

  return (
    <div className={className}>
      <div ref={editorRef} />
    </div>
  );
};

export default React.memo(RichTextEditor);
