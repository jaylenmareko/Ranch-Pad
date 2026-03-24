import { Home, Warehouse, Bell, Settings, LogOut, User, MapPin, BellRing, CreditCard, ChevronRight, Check } from "lucide-react";

const BG      = "#162E2A";
const SIDEBAR = "#112622";
const CARD    = "#1C3C37";
const BORDER  = "#2B5550";
const WHITE   = "#FFFFFF";
const DIM     = "rgba(255,255,255,0.45)";
const DIM2    = "rgba(255,255,255,0.7)";
const FAINT   = "rgba(255,255,255,0.05)";
const GREEN   = "#42A96E";
const GREEN_S = "#2D7B4F";
const RED     = "#D64B3A";

function Sidebar({ active }: { active: string }) {
  const nav = [
    { icon: Home, label: "Dashboard" },
    { icon: Warehouse, label: "Animals", count: "42" },
    { icon: Bell, label: "Alerts", count: "3", alert: true },
    { icon: Settings, label: "Settings" },
  ];
  return (
    <div style={{ width: 200, background: SIDEBAR, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", height: "100%", flexShrink: 0 }}>
      <div style={{ padding: "20px 14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_S} 100%)`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Warehouse size={16} color={WHITE} />
          </div>
          <div>
            <p style={{ color: WHITE, fontWeight: 800, fontSize: 13.5, margin: 0 }}>RanchPad</p>
            <p style={{ color: DIM, fontSize: 10, margin: 0 }}>Livestock Manager</p>
          </div>
        </div>
        <p style={{ color: DIM, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px 4px" }}>Menu</p>
        {nav.map(({ icon: Icon, label, count, alert }) => {
          const isActive = label === active;
          return (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "8px 10px", borderRadius: 8, marginBottom: 1,
              background: isActive ? "rgba(66,169,110,0.12)" : "transparent",
              color: isActive ? GREEN : DIM,
              fontSize: 12.5, fontWeight: isActive ? 700 : 400, cursor: "pointer"
            }}>
              <Icon size={14} />
              <span style={{ flex: 1 }}>{label}</span>
              {count && <span style={{ background: alert ? RED : "rgba(255,255,255,0.08)", color: alert ? WHITE : DIM, fontSize: 10, fontWeight: 700, borderRadius: 9, padding: "1px 6px" }}>{count}</span>}
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ padding: "12px 14px", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", color: DIM, fontSize: 12.5, cursor: "pointer", borderRadius: 8 }}>
          <LogOut size={13} /> Sign Out
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "12px 18px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={14} color={GREEN} />
        <span style={{ color: WHITE, fontWeight: 700, fontSize: 13 }}>{title}</span>
      </div>
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, placeholder }: { label: string; value?: string; placeholder?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ color: DIM2, fontSize: 12, fontWeight: 600 }}>{label}</label>
      <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 7, padding: "9px 12px", color: value ? WHITE : DIM, fontSize: 13, fontWeight: value ? 500 : 400 }}>
        {value || placeholder}
      </div>
    </div>
  );
}

function Toggle({ label, description, on }: { label: string; description: string; on: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <div>
        <p style={{ color: WHITE, fontSize: 13, fontWeight: 600, margin: 0 }}>{label}</p>
        <p style={{ color: DIM2, fontSize: 12, fontWeight: 500, margin: "2px 0 0" }}>{description}</p>
      </div>
      <div style={{ width: 40, height: 22, borderRadius: 11, background: on ? GREEN : "rgba(255,255,255,0.12)", position: "relative", cursor: "pointer", flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: WHITE, position: "absolute", top: 2, left: on ? 20 : 2, transition: "left 0.2s" }} />
      </div>
    </div>
  );
}

export function RefinedB_Settings() {
  return (
    <div style={{ display: "flex", height: "100vh", background: BG, fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13 }}>
      <Sidebar active="Settings" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "12px 22px", flexShrink: 0 }}>
          <h1 style={{ color: WHITE, fontWeight: 900, fontSize: 17, margin: 0, letterSpacing: "-0.02em" }}>Settings</h1>
          <p style={{ color: DIM, fontSize: 11, margin: "2px 0 0" }}>Manage your ranch and account</p>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignContent: "start" }}>

          {/* Profile */}
          <SettingsSection icon={User} title="Profile">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_S} 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: WHITE, fontWeight: 800, fontSize: 18 }}>J</span>
              </div>
              <div>
                <p style={{ color: WHITE, fontWeight: 700, fontSize: 14, margin: 0 }}>John Rancher</p>
                <p style={{ color: DIM2, fontSize: 12, fontWeight: 500, margin: "2px 0 0" }}>john@ranchpad.com</p>
              </div>
            </div>
            <Field label="Full Name" value="John Rancher" />
            <Field label="Email" value="john@ranchpad.com" />
            <button style={{ alignSelf: "flex-start", background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_S} 100%)`, border: "none", borderRadius: 7, padding: "8px 16px", color: WHITE, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Save Changes
            </button>
          </SettingsSection>

          {/* Ranch Info */}
          <SettingsSection icon={MapPin} title="Ranch Info">
            <Field label="Ranch Name" value="Circle J Ranch" />
            <Field label="Location" value="Amarillo, TX" />
            <Field label="Timezone" value="Central Time (CT)" />
            <button style={{ alignSelf: "flex-start", background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_S} 100%)`, border: "none", borderRadius: 7, padding: "8px 16px", color: WHITE, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Save Changes
            </button>
          </SettingsSection>

          {/* Notifications */}
          <SettingsSection icon={BellRing} title="Notifications">
            <Toggle label="Disease risk alerts" description="Weather-triggered herd health warnings" on={true} />
            <div style={{ borderTop: `1px solid ${BORDER}`, margin: "0 -2px" }} />
            <Toggle label="Medication reminders" description="Get reminded before treatments are due" on={true} />
            <div style={{ borderTop: `1px solid ${BORDER}`, margin: "0 -2px" }} />
            <Toggle label="Calving alerts" description="Notify when calving is within 7 days" on={true} />
            <div style={{ borderTop: `1px solid ${BORDER}`, margin: "0 -2px" }} />
            <Toggle label="Weekly digest email" description="Summary of herd health sent every Monday" on={false} />
          </SettingsSection>

          {/* Subscription */}
          <SettingsSection icon={CreditCard} title="Subscription">
            <div style={{ background: `rgba(66,169,110,0.1)`, border: `1px solid rgba(66,169,110,0.3)`, borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ color: WHITE, fontWeight: 700, fontSize: 14, margin: 0 }}>Pro Plan</p>
                <p style={{ color: DIM2, fontSize: 12, fontWeight: 500, margin: "3px 0 0" }}>$12/month · Renews Apr 24, 2026</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: GREEN, borderRadius: 6, padding: "4px 10px" }}>
                <Check size={12} color={WHITE} />
                <span style={{ color: WHITE, fontSize: 11, fontWeight: 700 }}>Active</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {["Unlimited animals", "Weather risk alerts", "Medication tracking", "CSV import & export", "Priority support"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Check size={12} color={GREEN} />
                  <span style={{ color: DIM2, fontSize: 13, fontWeight: 500 }}>{f}</span>
                </div>
              ))}
            </div>
            <button style={{ alignSelf: "flex-start", background: FAINT, border: `1px solid ${BORDER}`, borderRadius: 7, padding: "8px 16px", color: DIM2, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              Manage Billing →
            </button>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}
