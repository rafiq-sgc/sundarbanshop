'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
  </div>
})

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: string
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Start writing your content...',
  height = '400px'
}: RichTextEditorProps) {
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean']
    ],
    clipboard: {
      matchVisual: false
    }
  }), [])

  const formats = useMemo(() => [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'align',
    'blockquote', 'code-block',
    'link', 'image'
  ], [])

  return (
    <div className="rich-text-editor-wrapper">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{ height }}
      />
      <style jsx global>{`
        .rich-text-editor-wrapper .quill {
          background: white;
          border-radius: 0.75rem;
          border: none;
          position: relative;
          z-index: 1;
          box-shadow: none;
          transition: all 0.3s ease-in-out;
        }
        
        .rich-text-editor-wrapper .ql-toolbar {
          border-radius: 0.75rem 0.75rem 0 0;
          border: none;
          border-bottom: 1px solid #e5e7eb;
          background: #f8fafc;
          padding: 16px;
          position: relative;
          z-index: 2;
        }
        
        .rich-text-editor-wrapper .ql-container {
          border: none;
          font-size: 16px;
          font-family: system-ui, -apple-system, sans-serif;
          height: ${height};
          border-radius: 0 0 0.75rem 0.75rem;
          overflow-y: auto;
        }
        
        .rich-text-editor-wrapper .ql-editor {
          min-height: calc(${height} - 42px);
          max-height: calc(${height} - 42px);
          padding: 20px;
          overflow-y: auto;
        }
        
        .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        
        .rich-text-editor-wrapper .ql-editor::-webkit-scrollbar {
          width: 8px;
        }
        
        .rich-text-editor-wrapper .ql-editor::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .rich-text-editor-wrapper .ql-editor::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        .rich-text-editor-wrapper .ql-editor::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        .rich-text-editor-wrapper .ql-container::-webkit-scrollbar {
          width: 8px;
        }
        
        .rich-text-editor-wrapper .ql-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .rich-text-editor-wrapper .ql-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        
        .rich-text-editor-wrapper .ql-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        .rich-text-editor-wrapper .ql-snow .ql-stroke {
          stroke: #4b5563;
        }
        
        .rich-text-editor-wrapper .ql-snow .ql-fill {
          fill: #4b5563;
        }
        
        .rich-text-editor-wrapper .ql-snow .ql-picker-label {
          color: #4b5563;
        }
        
        .rich-text-editor-wrapper .ql-toolbar button:hover,
        .rich-text-editor-wrapper .ql-toolbar button:focus,
        .rich-text-editor-wrapper .ql-toolbar .ql-picker-label:hover,
        .rich-text-editor-wrapper .ql-toolbar .ql-picker-item:hover {
          color: #059669;
        }
        
        .rich-text-editor-wrapper .ql-toolbar button:hover .ql-stroke,
        .rich-text-editor-wrapper .ql-toolbar button:focus .ql-stroke,
        .rich-text-editor-wrapper .ql-toolbar .ql-picker-label:hover .ql-stroke {
          stroke: #059669;
        }
        
        .rich-text-editor-wrapper .ql-toolbar button:hover .ql-fill,
        .rich-text-editor-wrapper .ql-toolbar button:focus .ql-fill {
          fill: #059669;
        }
        
        .rich-text-editor-wrapper .ql-snow.ql-toolbar button.ql-active,
        .rich-text-editor-wrapper .ql-snow .ql-toolbar button.ql-active .ql-stroke {
          stroke: #059669;
        }
        
        .rich-text-editor-wrapper .ql-snow.ql-toolbar button.ql-active .ql-fill {
          fill: #059669;
        }
        
        .rich-text-editor-wrapper .ql-editor h1 {
          font-size: 2em;
          font-weight: bold;
          margin-top: 0.67em;
          margin-bottom: 0.67em;
        }
        
        .rich-text-editor-wrapper .ql-editor h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 0.83em;
          margin-bottom: 0.83em;
        }
        
        .rich-text-editor-wrapper .ql-editor h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 1em;
        }
        
        .rich-text-editor-wrapper .ql-editor p {
          margin-bottom: 1em;
        }
        
        .rich-text-editor-wrapper .ql-editor ul,
        .rich-text-editor-wrapper .ql-editor ol {
          margin-bottom: 1em;
          padding-left: 1.5em;
        }
        
        .rich-text-editor-wrapper .ql-editor blockquote {
          border-left: 4px solid #d1d5db;
          padding-left: 16px;
          margin: 1em 0;
          color: #6b7280;
        }
        
        .rich-text-editor-wrapper .ql-editor code {
          background-color: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.9em;
        }
        
        .rich-text-editor-wrapper .ql-editor pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 1em 0;
        }
        
        .rich-text-editor-wrapper .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1em 0;
        }
        
        .rich-text-editor-wrapper .ql-editor a {
          color: #059669;
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}

