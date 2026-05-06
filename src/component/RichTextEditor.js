import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const RichTextEditor = ({ value, onChange, placeholder, className = '' }) => {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const latestOnChangeRef = useRef(onChange);

  useEffect(() => {
    latestOnChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!editorRef.current || quillRef.current) {
      return undefined;
    }

    const toolbarOptions = [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ];

    const quill = new Quill(editorRef.current, {
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

    quill.root.innerHTML = value || '';

    const handleTextChange = () => {
      latestOnChangeRef.current?.(quill.root.innerHTML);
    };

    quill.on('text-change', handleTextChange);
    quillRef.current = quill;

    return () => {
      quill.off('text-change', handleTextChange);
      quillRef.current = null;
    };
  }, [placeholder, value]);

  useEffect(() => {
    if (!quillRef.current) {
      return;
    }

    const currentHtml = quillRef.current.root.innerHTML;
    const nextHtml = value || '';

    if (currentHtml !== nextHtml) {
      const selection = quillRef.current.getSelection();
      quillRef.current.root.innerHTML = nextHtml;

      if (selection) {
        quillRef.current.setSelection(selection.index, selection.length);
      }
    }
  }, [value]);

  return (
    <div ref={containerRef} className={className}>
      <div ref={editorRef} />
    </div>
  );
};

export default RichTextEditor;
