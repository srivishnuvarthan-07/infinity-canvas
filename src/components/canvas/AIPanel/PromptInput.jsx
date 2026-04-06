import { useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

export function PromptInput({ value, onChange, onSubmit, isGenerating, placeholder }) {
    const textareaRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }, [value]);

    // Focus on mount
    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <div className="flex items-end gap-2 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={2}
                disabled={isGenerating}
                className="flex-1 bg-transparent border-none outline-none resize-none text-[13px] text-neutral-800 placeholder:text-neutral-400 leading-relaxed min-h-[40px] max-h-[120px] py-0.5"
                style={{ scrollbarWidth: 'none' }}
            />
            <button
                onClick={onSubmit}
                disabled={isGenerating || !value.trim()}
                className="shrink-0 w-9 h-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-40 transition-all active:scale-90"
                title="Generate (Ctrl+Enter)"
            >
                {isGenerating
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />
                }
            </button>
        </div>
    );
}
