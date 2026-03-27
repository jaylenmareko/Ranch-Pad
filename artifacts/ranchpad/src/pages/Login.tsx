import { HoofIcon } from "@/components/HoofIcon";
import { AuthForm } from "@/components/AuthForm";

export default function Login() {
  const initialView = new URLSearchParams(window.location.search).get("signup") === "1" ? "signup" : "login";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
          <HoofIcon className="w-4.5 h-4.5" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-foreground">RanchPad</span>
      </div>

      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-sm p-7">
        <AuthForm initialView={initialView} onDone={() => {}} />
      </div>

      <footer className="mt-8 flex items-center gap-6">
        <a href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</a>
        <a href="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
      </footer>
    </div>
  );
}
