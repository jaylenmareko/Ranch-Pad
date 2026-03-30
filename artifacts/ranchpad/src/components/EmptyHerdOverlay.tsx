import React from "react";
import { Link } from "wouter";
import { ScanLine, PlusCircle, FileSpreadsheet } from "lucide-react";

interface EmptyHerdOverlayProps {
  onScan: () => void;
  onImportClick: () => void;
}

export function EmptyHerdOverlay({ onScan, onImportClick }: EmptyHerdOverlayProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh] px-6 py-16 overflow-hidden">

      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[480px] h-[480px] rounded-full bg-primary/8 blur-[80px]" />
      </div>
      <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-emerald-500/5 blur-[60px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-teal-500/5 blur-[60px] pointer-events-none" />

      <p className="text-muted-foreground text-sm mb-8 relative z-10">Add your first animal to get started</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl relative z-10">

        {/* Scan Paper Records */}
        <button
          onClick={onScan}
          className="flex flex-col items-center text-center p-6 rounded-2xl bg-primary/10 border border-primary/25 hover:bg-primary/15 hover:-translate-y-1 active:scale-[0.98] transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-3 group-hover:bg-primary/30 transition-colors">
            <ScanLine className="w-6 h-6 text-primary" />
          </div>
          <p className="font-bold text-sm text-foreground">Snap a Photo</p>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Snap a photo of your records and we'll convert them automatically
          </p>
        </button>

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
    </div>
  );
}
