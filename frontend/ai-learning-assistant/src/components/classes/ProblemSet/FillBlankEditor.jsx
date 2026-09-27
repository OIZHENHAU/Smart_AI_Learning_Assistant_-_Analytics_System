import React, { useRef, useState } from 'react';
import { useEditor, EditorContent, Mark, mergeAttributes } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Underline, Brackets, X, ArrowRight } from 'lucide-react';
import { getBlanks } from './questionTypes';

//A blank is a mark on the selected text, saved as <span data-blank="">answer</span>. The numbers are drawn by CSS
//counters (.blank-passage in index.css), so they always follow reading order without any extra bookkeeping.
//priority 1000 keeps it the outermost mark, so a blank with bold text inside still saves as one <span>.
const Blank = Mark.create({
    name: 'blank',
    priority: 1000,
    inclusive: false,
    parseHTML() {
        return [{ tag: 'span[data-blank]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { 'data-blank': '' }), 0];
    }
});

const STEPS = ['Select a word or phrase below', 'Click “Turn into Blank”', 'It’s added to the Blanks list, in order'];

const ToolbarButton = ({ onClick, active, label, children }) => (
    <button
        type='button'
        onMouseDown={(e) => e.preventDefault()} //keep the text selection while clicking
        onClick={onClick}
        aria-label={label}
        title={label}
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            active ? 'bg-purple-100 text-purple-700' : 'text-slate-600 hover:bg-slate-100'}`}
    >
        {children}
    </button>
);

const FillBlankEditor = ({ value, onChange }) => {
    const wrapperRef = useRef(null);
    const [bubble, setBubble] = useState(null); // { top, left } while some text is selected

    //Places the floating "Turn into Blank" button just above the middle of the selection.
    const updateBubble = (editor) => {
        const { from, to, empty } = editor.state.selection;
        if (empty || !wrapperRef.current) {
            setBubble(null);
            return;
        }
        try {
            const start = editor.view.coordsAtPos(from);
            const end = editor.view.coordsAtPos(to);
            const box = wrapperRef.current.getBoundingClientRect();
            setBubble({ top: start.top - box.top, left: (start.left + end.right) / 2 - box.left });
        } catch {
            setBubble(null);
        }
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: false, bulletList: false, orderedList: false, blockquote: false, codeBlock: false, horizontalRule: false }),
            Blank
        ],
        content: value,
        shouldRerenderOnTransaction: true, //keeps the toolbar highlights in sync
        editorProps: {
            attributes: { class: 'blank-passage min-h-36 px-5 py-4 text-base leading-9 text-slate-800 focus:outline-none' }
        },
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
        onSelectionUpdate: ({ editor }) => updateBubble(editor),
        onBlur: () => setBubble(null)
    });

    if (!editor) return null;

    const inBlank = editor.isActive('blank');
    const toggleBlank = () => {
        editor.chain().focus().toggleMark('blank').run();
        setBubble(null);
    };

    //Removes the index-th blank (0-based, reading order) but keeps its text in the passage.
    const removeBlank = (index) => {
        const ranges = [];
        editor.state.doc.descendants((node, pos) => {
            if (!node.isText || !node.marks.some((m) => m.type.name === 'blank')) return;
            const last = ranges[ranges.length - 1];
            if (last && last.to === pos) last.to = pos + node.nodeSize;
            else ranges.push({ from: pos, to: pos + node.nodeSize });
        });
        const range = ranges[index];
        if (range) editor.chain().focus().setTextSelection(range).unsetMark('blank').run();
    };

    const blanks = getBlanks(value);
    const blankLabel = inBlank ? 'Remove Blank' : 'Turn into Blank';

    return (
        <div className='space-y-5'>
            <div className='flex flex-wrap items-center gap-3 bg-purple-50 border border-purple-100 rounded-2xl px-5 py-4'>
                {STEPS.map((step, index) => (
                    <React.Fragment key={step}>
                        {index > 0 && <ArrowRight className='w-4 h-4 text-purple-300' />}
                        <div className='flex items-center gap-2'>
                            <span className='w-7 h-7 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0'>{index + 1}</span>
                            <span className='text-sm text-slate-700'>{step}</span>
                        </div>
                    </React.Fragment>
                ))}
            </div>

            <div>
                <label className='text-sm font-semibold text-slate-700 mb-1.5 block'>Passage</label>
                <div ref={wrapperRef} className='relative border border-slate-300 rounded-2xl focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100'>
                    <div className='flex items-center gap-1 px-3 py-2 border-b border-slate-200 bg-slate-50 rounded-t-2xl'>
                        <ToolbarButton label='Bold' active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
                            <Bold className='w-4 h-4' />
                        </ToolbarButton>
                        <ToolbarButton label='Italic' active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
                            <Italic className='w-4 h-4' />
                        </ToolbarButton>
                        <ToolbarButton label='Underline' active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
                            <Underline className='w-4 h-4' />
                        </ToolbarButton>
                        <span className='w-px h-5 bg-slate-200 mx-1' />
                        <button
                            type='button'
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={toggleBlank}
                            disabled={editor.state.selection.empty && !inBlank}
                            className='flex items-center gap-1.5 px-3 h-8 rounded-lg bg-purple-100 text-purple-700 text-sm font-medium hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:hover:bg-purple-100'
                        >
                            <Brackets className='w-4 h-4' /> {blankLabel}
                        </button>
                    </div>

                    <EditorContent editor={editor} />

                    {bubble && (
                        <button
                            type='button'
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={toggleBlank}
                            style={{ top: bubble.top - 48, left: bubble.left }}
                            className='absolute z-10 -translate-x-1/2 flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold shadow-lg whitespace-nowrap'
                        >
                            <Brackets className='w-4 h-4' /> {blankLabel}
                            <span className='absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-transparent border-t-slate-900' />
                        </button>
                    )}
                </div>
            </div>

            <div>
                <span className='text-xs font-bold text-slate-400 tracking-wide mb-2 block'>BLANKS</span>
                {blanks.length === 0 ? (
                    <p className='text-sm text-slate-400'>No blanks yet. Highlight a word or phrase in the passage and click &ldquo;Turn into Blank&rdquo;.</p>
                ) : (
                    <div className='flex flex-wrap gap-2'>
                        {blanks.map((text, index) => (
                            <span key={index} className='inline-flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-lg border border-purple-200 bg-purple-50 text-sm text-purple-700'>
                                <span className='w-5 h-5 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center'>{index + 1}</span>
                                {text || <em className='text-slate-400'>empty</em>}
                                <button type='button' onClick={() => removeBlank(index)} aria-label={`Remove blank ${index + 1}`} className='text-purple-300 hover:text-red-500'>
                                    <X className='w-3.5 h-3.5' />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
                <p className='text-xs text-slate-400 mt-2'>Students see each blank as an empty box and type the answer.</p>
            </div>
        </div>
    );
};

export default FillBlankEditor;
