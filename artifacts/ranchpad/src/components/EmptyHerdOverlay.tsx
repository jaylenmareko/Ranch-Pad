import React from "react";
import { Link } from "wouter";
import { ScanLine, PlusCircle, FileSpreadsheet } from "lucide-react";

interface EmptyHerdOverlayProps {
  onScan: () => void;
  onImportClick: () => void;
}

export function EmptyHerdOverlay({ onScan, onImportClick }: EmptyHerdOverlayProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-background/75 backdrop-blur-md">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl font-black text-foreground tracking-tight">Welcome to RanchPad</h2>
          <p className="text-muted-foreground text-sm">Add your animals to get started — choose how below.</p>
        </div>

        <div className="space-y-3">

          {/* Primary — Scan Paper Records */}
          <button
            onClick={onScan}
            className="w-full flex items-center gap-4 p-5 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 hover:-translate-y-0.5 transition-all text-left"
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
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-background hover:bg-accent transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <PlusCircle className="w-5 h-5 text-muted-foreground" />
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
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-background hover:bg-accent transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground leading-tight">Import from Spreadsheet</p>
              <p className="text-muted-foreground text-xs mt-0.5 leading-snug">
                Already tracking in Excel or Google Sheets? Upload your file directly
              </p>
            </div>
          </button>

        </div>
      </div>
    </div>
  );
}
