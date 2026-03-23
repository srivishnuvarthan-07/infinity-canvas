import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SHORTCUTS = [
  { key: 'V', label: 'Select' },
  { key: 'H', label: 'Hand / Pan' },
  { key: 'M', label: 'Move' },
  { key: 'R', label: 'Rectangle' },
  { key: 'O', label: 'Oval' },
  { key: 'T', label: 'Text' },
  { key: 'L', label: 'Line' },
  { key: 'A', label: 'Arrow' },
  { key: 'P', label: 'Pencil' },
  { key: 'D', label: 'Delete selected' },
  { key: 'Esc', label: 'Cancel' },
];

export function KeyboardShortcutsModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-white border border-black/5 shadow-xl rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-semibold text-neutral-900 mb-4">Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between py-1.5 border-b border-black/[0.03] last:border-0">
              <span className="text-[13px] text-neutral-600 font-medium">{s.label}</span>
              <kbd className="px-2 py-0.5 min-w-[24px] text-center bg-neutral-100 border border-black/5 rounded text-[11px] font-mono text-neutral-500 shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
