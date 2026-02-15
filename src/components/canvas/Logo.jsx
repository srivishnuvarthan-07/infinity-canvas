import { Sparkles } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2 animate-fade-in">
      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-button">
        <Sparkles className="w-5 h-5 text-primary-foreground" />
      </div>

      <div className="hidden flex-col">
        {/* Hidden for narrow sidebar layout */}
        <span className="text-lg font-semibold text-foreground leading-tight">SketchFlow</span>
        <span className="text-xs text-muted-foreground">Collaborative Canvas</span>
      </div>
    </div>
  );
}
