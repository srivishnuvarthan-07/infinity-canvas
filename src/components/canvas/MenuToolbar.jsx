
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu, FolderOpen, Save, Download, RotateCcw } from "lucide-react";

export function MenuToolbar({
    onOpen,
    onSaveAs,
    onExport,
    onReset
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={onOpen} className="cursor-pointer">
                    <FolderOpen className="mr-2 h-4 w-4" />
                    <span>Open</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSaveAs} className="cursor-pointer">
                    <Save className="mr-2 h-4 w-4" />
                    <span>Save As</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onExport} className="cursor-pointer">
                    <Download className="mr-2 h-4 w-4" />
                    <span>Export as PNG</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onReset} className="cursor-pointer text-destructive focus:text-destructive">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    <span>Reset Canvas</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
