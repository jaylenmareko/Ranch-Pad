import React from "react";
import { Link } from "wouter";
import { ScanLine, PlusCircle, FileSpreadsheet } from "lucide-react";

interface EmptyHerdOverlayProps {
  onScan: () => void;
  onImportClick: () => void;
}

export function EmptyHerdOverlay({ onScan, onImportClick }: EmptyHerdOverlayProps) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-3 backdrop-blur-md bg-[#162E2A]/60">

      <button
        onClick={onScan}
        className="inline-flex items-center gap-2 h-10 px-5 rounded-xl font-semibold text-sm bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 transition-all whitespace-nowrap"
      >
        <ScanLine className="w-4 h-4 shrink-0" />
        Scan Paper Records
      </button>

      <Link
        href="/animals/new"
        className="inline-flex items-center gap-2 h-10 px-5 rounded-xl font-semibold text-sm bg-card border border-border text-foreground hover:bg-accent hover:-translate-y-0.5 transition-all whitespace-nowrap"
      >
        <PlusCircle className="w-4 h-4 shrink-0" />
        Add Animal
      </Link>

      <button
        onClick={onImportClick}
        className="inline-flex items-center gap-2 h-10 px-5 rounded-xl font-semibold text-sm bg-card border border-border text-foreground hover:bg-accent hover:-translate-y-0.5 transition-all whitespace-nowrap"
      >
        <FileSpreadsheet className="w-4 h-4 shrink-0" />
        Import from Spreadsheet
      </button>

    </div>
  );
}
