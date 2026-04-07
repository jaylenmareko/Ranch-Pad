import React from "react";
import { Link } from "wouter";
import { PlusCircle, FileSpreadsheet, Users } from "lucide-react";

interface EmptyHerdOverlayProps {
  onImportClick: () => void;
  role?: string;
}

export function EmptyHerdOverlay({ onImportClick, role }: EmptyHerdOverlayProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh] px-6 py-16 overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[480px] h-[480px] rounded-full bg-primary/8 blur-[80px]" />
      </div>
      <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-emerald-500/5 blur-[60px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-teal-500/5 blur-[60px] pointer-events-none" />

      {role === "viewer" ? (
        <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No animals yet</h3>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            No animals have been added to this ranch yet. Contact the ranch owner to get started.
          </p>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground text-sm mb-8 relative z-10">Add your first animal to get started</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl relative z-10">

            {/* Add Animal */}
            <Link
              href="/animals/new"
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border hover:bg-accent hover:-translate-y-1 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3 group-hover:bg-border transition-colors">
                <PlusCircle className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-bold text-sm text-foreground">Add Animal</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Manually add an animal and start tracking health and treatments
              </p>
            </Link>

            {/* Import from Spreadsheet */}
            <button
              onClick={onImportClick}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border hover:bg-accent hover:-translate-y-1 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3 group-hover:bg-border transition-colors">
                <FileSpreadsheet className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-bold text-sm text-foreground">Import from Spreadsheet</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Already tracking in Excel or Google Sheets? Upload your file directly
              </p>
            </button>

          </div>
        </>
      )}
    </div>
  );
}
