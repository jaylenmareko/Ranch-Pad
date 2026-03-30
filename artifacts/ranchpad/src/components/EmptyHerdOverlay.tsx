import React from "react";
import { Link } from "wouter";
import { ScanLine, PlusCircle, FileSpreadsheet } from "lucide-react";

interface EmptyHerdOverlayProps {
  onScan: () => void;
  onImportClick: () => void;
}

export function EmptyHerdOverlay({ onScan, onImportClick }: EmptyHerdOverlayProps) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-3 backdrop-blur-md bg-[#162E2A]/60 p-6">

      {/* Primary — Scan Paper Records */}
      <button
        onClick={onScan}
        className="w-full max-w-sm flex items-center gap-4 p-5 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40 hover:bg-primary/90 active:scale-[0.98] transition-all text-left"
      >
        <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <ScanLine className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-base leading-tight">Scan Paper Records</p>
          <p className="text-primary-foreground/75 text-sm mt-1 leading-snug">
            Snap a photo of your records and we'll convert them automatically
          </p>
        </div>
      </button>

      {/* Add Animal */}
      <Link
        href="/animals/new"
        className="w-full max-w-sm flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <PlusCircle className="w-5 h-5 text-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground leading-tight">Add Animal</p>
          <p className="text-muted-foreground text-xs mt-0.5 leading-snug">
            Manually add an animal and start tracking health and treatments
          </p>
        </div>
      </Link>

      {/* Import from Spreadsheet */}
      <button
        onClick={onImportClick}
        className="w-full max-w-sm flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
          <FileSpreadsheet className="w-5 h-5 text-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground leading-tight">Import from Spreadsheet</p>
          <p className="text-muted-foreground text-xs mt-0.5 leading-snug">
            Already tracking in Excel or Google Sheets? Upload your file directly
          </p>
        </div>
      </button>

    </div>
  );
}
