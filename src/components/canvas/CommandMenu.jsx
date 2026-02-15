import { useEffect, useState } from "react";
import { Command } from "cmdk";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut
} from "@/components/ui/command";
import {
    Undo2,
    Redo2,
    Download,
    Trash2,
    Image as ImageIcon,
    Maximize,
    Minimize,
    RotateCcw
} from "lucide-react";

export function CommandMenu({
    onUndo,
    onRedo,
    onClear,
    onExport,
    onAddImage,
    onZoomIn,
    onZoomOut,
    onResetZoom
}) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const down = (e) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command) => {
        setOpen(false);
        command();
    };

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Actions">
                    <CommandItem onSelect={() => runCommand(onUndo)}>
                        <Undo2 className="mr-2 h-4 w-4" />
                        <span>Undo</span>
                        <CommandShortcut>⌘Z</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(onRedo)}>
                        <Redo2 className="mr-2 h-4 w-4" />
                        <span>Redo</span>
                        <CommandShortcut>⌘⇧Z</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(onClear)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Clear Canvas</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(onExport)}>
                        <Download className="mr-2 h-4 w-4" />
                        <span>Export to PNG</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(onAddImage)}>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        <span>Insert Image</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="View">
                    <CommandItem onSelect={() => runCommand(onZoomIn)}>
                        <Maximize className="mr-2 h-4 w-4" />
                        <span>Zoom In</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(onZoomOut)}>
                        <Minimize className="mr-2 h-4 w-4" />
                        <span>Zoom Out</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(onResetZoom)}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        <span>Reset Zoom</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
