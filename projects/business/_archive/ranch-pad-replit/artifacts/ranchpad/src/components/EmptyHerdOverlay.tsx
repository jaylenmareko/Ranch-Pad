import React from "react";
import { Link } from "wouter";
import { FileSpreadsheet } from "lucide-react";

interface EmptyHerdOverlayProps {
  role?: string;
}

export function EmptyHerdOverlay({ role }: EmptyHerdOverlayProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[50vh] px-6 py-16 overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[400px] h-[400px] rounded-full bg-primary/8 blur-[80px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
          <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold text-foreground">No animals yet</h3>
        {role === "viewer" && (
          <p className="text-sm text-muted-foreground mt-2 mb-6 leading-relaxed">
            No animals have been added to this ranch yet. Contact the ranch owner to get started.
          </p>
        )}
        {role !== "viewer" && (
          <Link
            href="/import-export"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Import or Export Data
          </Link>
        )}
      </div>
    </div>
  );
}
