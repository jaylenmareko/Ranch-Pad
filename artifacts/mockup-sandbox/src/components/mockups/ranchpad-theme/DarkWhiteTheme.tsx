import { Home, Warehouse, Bell, Settings, LogOut, AlertTriangle, CloudRain, Plus, Upload, Users, Calendar, Pill } from "lucide-react";

const BG = "#1C3F3A";
const SURFACE = "#1E4440";
const BORDER = "#2A5550";
const WHITE = "#FFFFFF";
const WHITE_DIM = "rgba(255,255,255,0.55)";
const WHITE_FAINT = "rgba(255,255,255,0.08)";
const GREEN = "#3A8C5C";
const GREEN_DIM = "rgba(58,140,92,0.18)";
const RED = "#C0392B";
const RED_DIM = "rgba(192,57,43,0.18)";

function Sidebar() {
  const items = [
    { icon: Home, label: "Dashboard", active: true },
    { icon: Warehouse, label: "Animals" },
    { icon: Bell, label: "Alerts" },
    { icon: Settings, label: "Settings" },
  ];
  return (
    <div style={{ width: 200, background: SURFACE, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "20px 16px 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, background: GREEN, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Warehouse size={16} color={WHITE} />
        </div>
        <span style={{ color: WHITE, fontWeight: 800, fontSize: 16, fontFamily: "system-ui" }}>RanchPad</span>
      </div>
      <nav style={{ flex: 1, padding: "0 10px" }}>
        {items.map(({ icon: Icon, label, active }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 12px", borderRadius: 6, marginBottom: 2,
            background: active ? "rgba(255,255,255,0.12)" : "transparent",
            color: active ? WHITE : WHITE_DIM,
            fontSize: 13, fontWeight: active ? 600 : 400, cursor: "pointer"
          }}>
            <Icon size={15} />
            {label}
          </div>
        ))}
      </nav>
      <div style={{ padding: "12px 10px", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", color: WHITE_DIM, fontSize: 13, cursor: "pointer" }}>
          <LogOut size={15} /> Sign Out
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 8, background: color ? `${color}22` : WHITE_FAINT, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={18} color={color || WHITE} />
      </div>
      <div>
        <p style={{ color: WHITE_DIM, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{label}</p>
        <p style={{ color: WHITE, fontSize: 26, fontWeight: 900, margin: 0, lineHeight: 1.1 }}>{value}</p>
      </div>
    </div>
  );
}

function AlertRow({ label, sev }: { label: string; sev: "high" | "medium" | "low" }) {
  const dot = sev === "high" ? RED : sev === "medium" ? "#E67E22" : GREEN;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: dot, marginTop: 3, flexShrink: 0 }} />
      <span style={{ color: WHITE, fontSize: 13 }}>{label}</span>
    </div>
  );
}

export function DarkWhiteTheme() {
  return (
    <div style={{ display: "flex", height: "100vh", background: BG, fontFamily: "system-ui, sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, overflowY: "auto", padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Banner */}
        <div style={{ background: GREEN, borderRadius: 10, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ color: WHITE, fontWeight: 900, fontSize: 20, margin: 0 }}>Dashboard</h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: "2px 0 0" }}>Monday, March 24, 2026</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "8px 14px", color: WHITE, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Upload size={13} /> Upload CSV
            </button>
            <button style={{ background: WHITE, border: "none", borderRadius: 6, padding: "8px 16px", color: GREEN, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={13} /> Add Animal
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
          <StatCard icon={Users} label="Total Animals" value="42" color={WHITE} />
          <StatCard icon={AlertTriangle} label="Active Alerts" value="3" color={RED} />
          <StatCard icon={Pill} label="Overdue Meds" value="1" color={RED} />
          <StatCard icon={Calendar} label="Due Soon" value="5" color={GREEN} />
        </div>

        {/* Alerts + Weather */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Alerts */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
              <AlertTriangle size={16} color={RED} />
              <span style={{ color: WHITE, fontWeight: 700, fontSize: 14 }}>Recent Alerts</span>
            </div>
            <AlertRow label="High humidity — elevated pneumonia risk for cattle" sev="high" />
            <AlertRow label="Dewormer due for 3 animals this week" sev="medium" />
            <AlertRow label="Expected calving: Bessie (#A14) in 6 days" sev="low" />
          </div>

          {/* Weather */}
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
              <CloudRain size={16} color="#5BA4CF" />
              <span style={{ color: WHITE, fontWeight: 700, fontSize: 14 }}>Ranch Weather</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
              <span style={{ color: WHITE, fontSize: 42, fontWeight: 900 }}>61°</span>
              <div>
                <p style={{ color: WHITE, fontWeight: 600, fontSize: 14, margin: 0 }}>Partly Cloudy</p>
                <p style={{ color: WHITE_DIM, fontSize: 12, margin: "2px 0 0" }}>Humidity 78% · Wind 12 mph NW</p>
              </div>
            </div>
            <div style={{ background: RED_DIM, border: `1px solid ${RED}55`, borderRadius: 6, padding: "8px 12px" }}>
              <span style={{ color: RED, fontSize: 12, fontWeight: 700 }}>⚠ High disease risk — monitor herd closely</span>
            </div>
          </div>
        </div>

        {/* Upcoming */}
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
            <Pill size={16} color={GREEN} />
            <span style={{ color: WHITE, fontWeight: 700, fontSize: 14 }}>Upcoming Treatments</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[
              { name: "Bull #B7", treatment: "Ivermectin", due: "Today", urgent: true },
              { name: "Cow #A14", treatment: "Vitamin B12", due: "Mar 27" },
              { name: "Goat #G3", treatment: "CDT Booster", due: "Mar 29" },
            ].map(r => (
              <div key={r.name} style={{ background: r.urgent ? RED_DIM : WHITE_FAINT, border: `1px solid ${r.urgent ? RED + "55" : BORDER}`, borderRadius: 8, padding: "12px 14px" }}>
                <p style={{ color: WHITE, fontWeight: 700, fontSize: 13, margin: 0 }}>{r.name}</p>
                <p style={{ color: WHITE_DIM, fontSize: 12, margin: "2px 0 4px" }}>{r.treatment}</p>
                <span style={{ color: r.urgent ? RED : GREEN, fontSize: 11, fontWeight: 700 }}>{r.due}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
