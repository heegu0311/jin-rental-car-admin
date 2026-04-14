'use client'

import { useEffect, useState } from 'react'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import CharacterCount from '@tiptap/extension-character-count'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Link as LinkIcon,
  Code
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

const ToolbarButton = ({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title
}: {
  onClick: () => void,
  isActive?: boolean,
  disabled?: boolean,
  children: React.ReactNode,
  title?: string
}) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    disabled={disabled}
    title={title}
    className={cn(
      "p-2 rounded-md transition-all hover:bg-slate-100",
      isActive ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600",
      disabled && "opacity-50 cursor-not-allowed"
    )}
  >
    {children}
  </button>
)

export function RichEditor({ content, onChange, placeholder = "내용을 입력하세요..." }: RichEditorProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      CharacterCount,
    ],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none min-h-[300px] max-h-[600px] overflow-y-auto p-4 bg-white rounded-b-xl border-x border-b border-slate-200',
      },
    },
  })

  // Do not render anything until the component has mounted on the client
  if (!isMounted || !editor) {
    return null
  }

  const addImage = () => {
    const url = window.prompt('이미지 URL을 입력하세요:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL을 입력하세요:', previousUrl)

    // cancelled
    if (url === null) {
      return
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="w-full border border-slate-200 rounded-xl overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="굵게"
          >
            <Bold size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="기울임"
          >
            <Italic size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="밑줄"
          >
            <UnderlineIcon size={18} />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5 px-2 border-r border-slate-200">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="제목 1"
          >
            <Heading1 size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="제목 2"
          >
            <Heading2 size={18} />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5 px-2 border-r border-slate-200">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="글머리 기호"
          >
            <List size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="번호 매기기"
          >
            <ListOrdered size={18} />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5 px-2 border-r border-slate-200">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="왼쪽 정렬"
          >
            <AlignLeft size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="가운데 정렬"
          >
            <AlignCenter size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="오른쪽 정렬"
          >
            <AlignRight size={18} />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5 px-2 border-r border-slate-200">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="인용구"
          >
            <Quote size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            isActive={editor.isActive('code')}
            title="코드"
          >
            <Code size={18} />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5 px-2 border-r border-slate-200">
          <ToolbarButton onClick={setLink} isActive={editor.isActive('link')} title="링크">
            <LinkIcon size={18} />
          </ToolbarButton>
          <ToolbarButton onClick={addImage} title="이미지">
            <ImageIcon size={18} />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-0.5 pl-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="되돌리기"
          >
            <Undo size={18} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="다시 실행"
          >
            <Redo size={18} />
          </ToolbarButton>
        </div>
      </div>
      <EditorContent editor={editor} />

      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span>{editor.storage.characterCount?.characters?.() || 0} 자</span>
          <span>{editor.storage.characterCount?.words?.() || 0} 단어</span>
        </div>
        <div>
          <span>TipTap 기반 리치 에디터</span>
        </div>
      </div>
    </div>
  )
}
