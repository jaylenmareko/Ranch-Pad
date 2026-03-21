import { Link } from "wouter";
import { HoofIcon } from "@/components/HoofIcon";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Back + Logo */}
        <div className="flex items-center gap-3 mb-12">
          <Link href="/login" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-sans">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
            <HoofIcon className="w-5 h-5 text-primary" />
          </div>
          <span className="font-display font-bold text-xl text-primary tracking-tight">RanchPad</span>
        </div>

        <h1 className="font-display font-bold text-4xl text-foreground mb-2 tracking-tight">Terms of Service</h1>
        <p className="text-sm text-muted-foreground font-sans mb-10">Last updated March 2026</p>

        <div className="prose prose-neutral max-w-none font-sans text-foreground/85 leading-relaxed space-y-5 text-base">
          <p>
            By using this app you agree to use it for lawful purposes only. We provide disease risk
            alerts and treatment reminders as informational tools — they do not replace professional
            veterinary advice. We are not liable for livestock loss or health outcomes.
          </p>
          <p>
            You own your data. We reserve the right to suspend accounts that misuse the service.
            Terms may be updated with notice.
          </p>
        </div>

        <div className="mt-14 pt-6 border-t border-border/50 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-sans">© {new Date().getFullYear()} RanchPad</span>
          <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-sans">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
