import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CloudUpload, Trash2, Clock } from "lucide-react";
import { useBoardStore } from "@/hooks/useBoardStore";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function MigrationDialog() {
    const { user } = useAuth();
    const { checkMigration, migrateLocalBoards, clearLocalBoards } = useBoardStore();

    const [isOpen, setIsOpen] = useState(false);
    const [boardCount, setBoardCount] = useState(0);
    const [isMigrating, setIsMigrating] = useState(false);
    const [progress, setProgress] = useState(0);

    // Show whenever user logs in and has local boards
    useEffect(() => {
        if (!user) return;

        const check = async () => {
            try {
                const { hasLocalBoards, count } = await checkMigration();
                if (hasLocalBoards) {
                    setBoardCount(count);
                    setIsOpen(true);
                }
            } catch {
                // Non-critical — silently ignore
            }
        };
        check();
    }, [user, checkMigration]);

    const handleMigrate = async () => {
        setIsMigrating(true);
        setProgress(0);
        try {
            await migrateLocalBoards((completed, total) => {
                setProgress((completed / total) * 100);
            });
            toast.success("Boards moved to cloud!");
            setIsOpen(false);
        } catch {
            toast.error("Migration failed — your local boards are untouched");
        } finally {
            setIsMigrating(false);
        }
    };

    const handleDiscard = async () => {
        const confirmed = confirm(
            `Delete all ${boardCount} local board${boardCount > 1 ? 's' : ''} permanently? This cannot be undone.`
        );
        if (!confirmed) return;
        try {
            await clearLocalBoards();
            toast.info("Local boards removed");
        } catch {
            toast.error("Failed to remove local boards");
        }
        setIsOpen(false);
    };

    const handleDismiss = () => {
        if (!isMigrating) setIsOpen(false);
    };

    return (
        // isMigrating (not setIsMigrating) — the STATE value, not the setter
        <Dialog open={isOpen} onOpenChange={isMigrating ? undefined : setIsOpen}>
            <DialogContent className="sm:max-w-[440px] bg-neutral-900 border border-white/10 text-neutral-200">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <CloudUpload className="w-5 h-5 text-indigo-400" />
                        Upload local boards to cloud?
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400 mt-1">
                        Found <span className="text-white font-medium">
                            {boardCount} local board{boardCount > 1 ? 's' : ''}
                        </span> on this device.
                        Move {boardCount > 1 ? 'them' : 'it'} to your account to access from anywhere.
                    </DialogDescription>
                </DialogHeader>

                {isMigrating && (
                    <div className="py-4 space-y-2">
                        <div className="flex justify-between text-xs text-neutral-400">
                            <span>Uploading boards...</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                )}

                <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                    {/* Maybe Later — left-aligned dismiss */}
                    <Button
                        variant="ghost"
                        onClick={handleDismiss}
                        disabled={isMigrating}
                        className="text-neutral-400 hover:text-neutral-200 hover:bg-white/5 sm:mr-auto"
                    >
                        <Clock className="w-4 h-4 mr-2" />
                        Maybe Later
                    </Button>

                    {/* Discard — destructive */}
                    <Button
                        variant="ghost"
                        onClick={handleDiscard}
                        disabled={isMigrating}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/10"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Discard Local
                    </Button>

                    {/* Primary action */}
                    <Button
                        onClick={handleMigrate}
                        disabled={isMigrating}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white"
                    >
                        {isMigrating ? "Uploading..." : "Move to Cloud"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
