import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PlusCircle, RefreshCw } from "lucide-react";

interface ImportModeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: () => void;
  onReplace: () => void;
}

export function ImportModeDialog({
  open,
  onOpenChange,
  onAdd,
  onReplace,
}: ImportModeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import CSV</DialogTitle>
          <DialogDescription>
            You already have animals in your herd. How would you like to import this file?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-1">
          <button
            onClick={onAdd}
            className="flex items-start gap-4 rounded-xl border border-border p-4 text-left hover:bg-muted transition-colors"
          >
            <PlusCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm text-foreground">Add to my herd</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Keep your existing animals and add any new ones from this file.
              </p>
            </div>
          </button>

          <button
            onClick={onReplace}
            className="flex items-start gap-4 rounded-xl border border-red-200 p-4 text-left hover:bg-red-50 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm text-red-700">Replace my herd</p>
              <p className="text-xs text-red-500 mt-0.5 leading-relaxed">
                Remove all current animals and start fresh with this file. This cannot be undone.
              </p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
