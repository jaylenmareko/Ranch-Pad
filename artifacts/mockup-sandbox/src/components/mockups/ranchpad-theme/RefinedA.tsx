import { Home, Warehouse, Bell, Settings, LogOut, AlertTriangle, CloudRain, Plus, Upload, Users, Calendar, Pill, ChevronRight } from "lucide-react";

const BG      = "#162E2A";
const SURFACE = "#1C3C37";
const CARD    = "#1F403B";
const BORDER  = "#2B5550";
const WHITE   = "#FFFFFF";
const DIM     = "rgba(255,255,255,0.5)";
const FAINT   = "rgba(255,255,255,0.06)";
const GREEN   = "#3D9E68";
const GREEN_B = "rgba(61,158,104,0.15)";
const RED     = "#D94F3D";
const RED_B   = "rgba(217,79,61,0.15)";
const AMBER   = "#E07C2C";

function Sidebar() {
  const nav = [
    { icon: Home, label: "Dashboard", active: true },
    { icon: Warehouse, label: "Animals" },
    { icon: Bell, label: "Alerts", badge: 3 },
    { icon: Settings, label: "Settings" },
  ];
  return (
    <div style={{ width: 210, background: SURFACE, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", height: "100%", flexShrink: 0 }}>
      {/* Brand */}
      <div style={{ padding: "18px 16px 14px", display: "flex", alignItems: "center", gap: 9, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ width: 30, height: 30, background: GREEN, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Warehouse size={15} color={WHITE} />
        </div>
        <div>
          <p style={{ color: WHITE, fontWeight: 800, fontSize: 14, margin: 0, letterSpacing: "-0.02em" }}>RanchPad</p>
          <p style={{ color: DIM, fontSize: 10, margin: 0, fontWeight: 500 }}>Herd Manager</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 10px" }}>
        {nav.map(({ icon: Icon, label, active, badge }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "8px 10px", borderRadius: 7, marginBottom: 2,
            background: active ? "rgba(255,255,255,0.1)" : "transparent",
            color: active ? WHITE : DIM,
            fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer",
            position: "relative"
          }}>
            {active && <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 18, background: GREEN, borderRadius: "0 3px 3px 0" }} />}
            <Icon size={15} />
            <span style={{ flex: 1 }}>{label}</span>
            {badge && <span style={{ background: RED, color: WHITE, fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 6px" }}>{badge}</span>}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 10px", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", color: DIM, fontSize: 13, cursor: "pointer", borderRadius: 7 }}>
          <LogOut size={14} /> Sign Out
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent: string }) {
  return (
    <div style={{
      background: CARD, borderRadius: 10, padding: "14px 16px",
      borderLeft: `3px solid ${accent}`, border: `1px solid ${BORDER}`,
      borderLeftColor: accent, borderLeftWidth: 3,
      display: "flex", flexDirection: "column", gap: 6
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Icon size={13} color={accent} />
        <span style={{ color: DIM, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      </div>
      <span style={{ color: WHITE, fontSize: 32, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em" }}>{value}</span>
    </div>
  );
}

export function RefinedA() {
  return (
    <div style={{ display: "flex", height: "100vh", background: BG, fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13 }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Banner */}
        <div style={{ background: GREEN, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h1 style={{ color: WHITE, fontWeight: 900, fontSize: 18, margin: 0, letterSpacing: "-0.02em" }}>Dashboard</h1>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, margin: "3px 0 0", fontWeight: 500 }}>Monday, March 24, 2026</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 7, padding: "7px 13px", color: WHITE, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <Upload size={12} /> Upload CSV
            </button>
            <button style={{ background: WHITE, border: "none", borderRadius: 7, padding: "7px 14px", color: "#1C3C37", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <Plus size={12} /> Add Animal
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            <StatCard icon={Users} label="Total Animals" value="42" accent={WHITE} />
            <StatCard icon={AlertTriangle} label="Active Alerts" value="3" accent={RED} />
            <StatCard icon={Pill} label="Overdue Meds" value="1" accent={RED} />
            <StatCard icon={Calendar} label="Due Soon" value="5" accent={GREEN} />
          </div>

          {/* Alerts + Weather */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                <AlertTriangle size={14} color={RED} />
                <span style={{ color: WHITE, fontWeight: 700, fontSize: 13 }}>Recent Alerts</span>
              </div>
              {[
                { text: "High humidity — elevated pneumonia risk for cattle", sev: RED },
                { text: "Dewormer due for 3 animals this week", sev: AMBER },
                { text: "Expected calving: Bessie (#A14) in 6 days", sev: GREEN },
              ].map(({ text, sev }) => (
                <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ width: 3, height: "100%", minHeight: 32, background: sev, borderRadius: 2, flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, lineHeight: 1.45 }}>{text}</span>
                  <ChevronRight size={12} color={DIM} style={{ flexShrink: 0, marginTop: 2 }} />
                </div>
              ))}
            </div>

            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                <CloudRain size={14} color="#6BB5E0" />
                <span style={{ color: WHITE, fontWeight: 700, fontSize: 13 }}>Ranch Weather</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                <span style={{ color: WHITE, fontSize: 48, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1 }}>61°</span>
                <div>
                  <p style={{ color: WHITE, fontWeight: 600, fontSize: 14, margin: 0 }}>Partly Cloudy</p>
                  <p style={{ color: DIM, fontSize: 11, margin: "3px 0 0" }}>Humidity 78% · Wind 12 mph NW</p>
                </div>
              </div>
              <div style={{ background: RED_B, border: `1px solid ${RED}44`, borderRadius: 6, padding: "8px 12px", display: "flex", alignItems: "center", gap: 7 }}>
                <AlertTriangle size={12} color={RED} />
                <span style={{ color: RED, fontSize: 11, fontWeight: 700 }}>High disease risk — monitor herd closely</span>
              </div>
            </div>
          </div>

          {/* Upcoming */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <Pill size={14} color={GREEN} />
              <span style={{ color: WHITE, fontWeight: 700, fontSize: 13 }}>Upcoming Treatments</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {[
                { name: "Bull #B7", treatment: "Ivermectin", due: "Today", urgent: true },
                { name: "Cow #A14", treatment: "Vitamin B12", due: "Mar 27", urgent: false },
                { name: "Goat #G3", treatment: "CDT Booster", due: "Mar 29", urgent: false },
              ].map(r => (
                <div key={r.name} style={{ background: r.urgent ? RED_B : FAINT, border: `1px solid ${r.urgent ? RED + "44" : BORDER}`, borderRadius: 8, padding: "12px 14px" }}>
                  <p style={{ color: WHITE, fontWeight: 700, fontSize: 13, margin: 0 }}>{r.name}</p>
                  <p style={{ color: DIM, fontSize: 11, margin: "3px 0 6px" }}>{r.treatment}</p>
                  <span style={{ color: r.urgent ? RED : GREEN, fontSize: 11, fontWeight: 700 }}>{r.due}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
