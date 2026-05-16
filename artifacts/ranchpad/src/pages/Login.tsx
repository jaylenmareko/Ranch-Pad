import { AuthForm } from "@/components/AuthForm";
import { RanchPadLogo } from "@/components/RanchPadLogo";
import "./Login.css";

export default function Login() {
  const initialView = new URLSearchParams(window.location.search).get("signup") === "1" ? "signup" : "login";

  return (
    <div className="login-page">
      <div className="login-logo">
        <RanchPadLogo size="md" variant="light" />
      </div>

      <div className="login-card">
        <AuthForm initialView={initialView} onDone={() => {}} />
      </div>

      <footer className="login-footer">
        <a href="/terms" className="login-footer-link">Terms</a>
        <a href="/privacy" className="login-footer-link">Privacy</a>
      </footer>
    </div>
  );
}
