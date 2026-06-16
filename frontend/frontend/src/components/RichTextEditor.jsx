import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TiptapImage from '@tiptap/extension-image';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Undo2, Redo2, Highlighter,
  Type, Palette, Image as ImageIcon
} from 'lucide-react';

const fontFamilies = [
  { label: 'Default', value: 'Inter' },
  { label: '🖋️ My Cursive Handwriting', value: 'Cedarville Cursive' },
  { label: 'Caveat', value: 'Caveat' },
  { label: 'Indie Flower', value: 'Indie Flower' },
  { label: 'Dancing Script', value: 'Dancing Script' },
  { label: 'Patrick Hand', value: 'Patrick Hand' },
  { label: 'Shadows Into Light', value: 'Shadows Into Light' },
  { label: 'Kalam', value: 'Kalam' },
];

const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '40px', '48px'];

const colors = [
  '#ffffff', '#f87171', '#fb923c', '#fbbf24', '#34d399',
  '#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#000000',
  '#1a1a2e', '#0f3460', '#16213e', '#533483', '#e94560',
];

export default function RichTextEditor({ content, onUpdate, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      TiptapImage.configure({
        allowBase64: true,
      }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      if (onUpdate) onUpdate(editor.getHTML());
    },
    editorProps: {
      attributes: {
        'data-placeholder': placeholder || 'Start typing or paste your text here...',
      },
      handlePaste(view, event) {
        const items = (event.clipboardData || event.originalEvent.clipboardData)?.items || [];
        for (const item of items) {
          if (item.type.indexOf('image') === 0) {
            const blob = item.getAsFile();
            const reader = new FileReader();
            reader.onload = (e) => {
              view.dispatch(view.state.tr.replaceSelectionWith(
                view.state.schema.nodes.image.create({ src: e.target.result })
              ));
            };
            reader.readAsDataURL(blob);
            return true; // handled image paste
          }
        }
        return false; // let default paste happen
      }
    },
  });

  if (!editor) return null;

  const triggerImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          editor.chain().focus().setImage({ src: event.target.result }).run();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const ToolBtn = ({ onClick, active, children, title }) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        ...styles.toolBtn,
        background: active ? 'rgba(255, 215, 0, 0.15)' : 'transparent',
        color: active ? 'var(--accent-gold)' : 'var(--text-secondary)',
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={styles.wrapper}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        {/* Font Family */}
        <select
          value={editor.getAttributes('textStyle').fontFamily || 'Inter'}
          onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
          style={styles.select}
          title="Font Family"
        >
          {fontFamilies.map(f => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Font Size */}
        <select
          onChange={(e) => {
            editor.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run();
          }}
          style={{ ...styles.select, width: '70px' }}
          title="Font Size"
          defaultValue="16px"
        >
          {fontSizes.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <div style={styles.divider} />

        {/* Text Formatting */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')} title="Bold">
          <Bold size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')} title="Italic">
          <Italic size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')} title="Underline">
          <UnderlineIcon size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')} title="Highlight">
          <Highlighter size={16} />
        </ToolBtn>
        <ToolBtn onClick={triggerImageUpload} title="Insert Image / Screenshot">
          <ImageIcon size={16} />
        </ToolBtn>

        <div style={styles.divider} />

        {/* Text Color */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <label title="Text Color" style={{ ...styles.toolBtn, position: 'relative', cursor: 'pointer' }}>
            <Palette size={16} />
            <input
              type="color"
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              style={styles.colorInput}
            />
          </label>
        </div>

        <div style={styles.divider} />

        {/* Alignment */}
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })} title="Align Left">
          <AlignLeft size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })} title="Align Center">
          <AlignCenter size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })} title="Align Right">
          <AlignRight size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          active={editor.isActive({ textAlign: 'justify' })} title="Justify">
          <AlignJustify size={16} />
        </ToolBtn>

        <div style={styles.divider} />

        {/* Lists */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')} title="Bullet List">
          <List size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')} title="Numbered List">
          <ListOrdered size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')} title="Quote">
          <Quote size={16} />
        </ToolBtn>

        <div style={styles.divider} />

        {/* Undo / Redo */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo2 size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo2 size={16} />
        </ToolBtn>
      </div>

      {/* Color presets */}
      <div style={styles.colorBar}>
        {colors.map(c => (
          <button
            key={c}
            onClick={() => editor.chain().focus().setColor(c).run()}
            style={{
              ...styles.colorDot,
              background: c,
              border: c === '#ffffff' ? '1px solid rgba(255,255,255,0.3)' : 'none',
              boxShadow: editor.getAttributes('textStyle').color === c ? `0 0 0 2px ${c}` : 'none',
            }}
            title={c}
          />
        ))}
      </div>

      {/* Editor */}
      <div style={styles.editorArea}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    background: 'var(--bg-card)',
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2px',
    padding: '8px 12px',
    borderBottom: '1px solid var(--border-subtle)',
    background: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
  },
  toolBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  select: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    padding: '4px 8px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    width: '130px',
  },
  divider: {
    width: '1px',
    height: '24px',
    background: 'var(--border-subtle)',
    margin: '0 4px',
  },
  colorBar: {
    display: 'flex',
    gap: '4px',
    padding: '6px 12px',
    borderBottom: '1px solid var(--border-subtle)',
    background: 'rgba(0,0,0,0.15)',
  },
  colorDot: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'transform 0.15s',
    flexShrink: 0,
  },
  colorInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    cursor: 'pointer',
  },
  editorArea: {
    minHeight: '300px',
    maxHeight: '600px',
    overflowY: 'auto',
  },
};
