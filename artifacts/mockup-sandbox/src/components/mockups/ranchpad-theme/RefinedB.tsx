import { Home, Warehouse, Bell, Settings, LogOut, AlertTriangle, CloudRain, Plus, Upload, Users, Calendar, Pill, Thermometer, Wind } from "lucide-react";

const BG      = "#162E2A";
const SIDEBAR = "#112622";
const CARD    = "#1C3C37";
const CARD2   = "#1F4040";
const BORDER  = "#2B5550";
const BORDER2 = "#305550";
const WHITE   = "#FFFFFF";
const DIM     = "rgba(255,255,255,0.45)";
const DIM2    = "rgba(255,255,255,0.7)";
const FAINT   = "rgba(255,255,255,0.05)";
const GREEN   = "#42A96E";
const GREEN_S = "#2D7B4F";
const RED     = "#D64B3A";
const AMBER   = "#D98A2E";

function Sidebar() {
  const nav = [
    { icon: Home, label: "Dashboard", active: true },
    { icon: Warehouse, label: "Animals", count: "42" },
    { icon: Bell, label: "Alerts", count: "3", alert: true },
    { icon: Settings, label: "Settings" },
  ];
  return (
    <div style={{ width: 200, background: SIDEBAR, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", height: "100%", flexShrink: 0 }}>
      <div style={{ padding: "20px 14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_S} 100%)`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 1px rgba(66,169,110,0.3)` }}>
            <Warehouse size={16} color={WHITE} />
          </div>
          <div>
            <p style={{ color: WHITE, fontWeight: 800, fontSize: 13.5, margin: 0, letterSpacing: "-0.02em" }}>RanchPad</p>
            <p style={{ color: DIM, fontSize: 10, margin: 0 }}>Livestock Manager</p>
          </div>
        </div>
        <p style={{ color: DIM, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px 4px" }}>Menu</p>
        {nav.map(({ icon: Icon, label, active, count, alert }) => (
          <div key={label} style={{
            display: "flex", alignItems: "center", gap: 9,
            padding: "8px 10px", borderRadius: 8, marginBottom: 1,
            background: active ? "rgba(66,169,110,0.12)" : "transparent",
            color: active ? GREEN : DIM,
            fontSize: 12.5, fontWeight: active ? 700 : 400, cursor: "pointer"
          }}>
            <Icon size={14} />
            <span style={{ flex: 1 }}>{label}</span>
            {count && (
              <span style={{ background: alert ? RED : "rgba(255,255,255,0.08)", color: alert ? WHITE : DIM, fontSize: 10, fontWeight: 700, borderRadius: 9, padding: "1px 6px" }}>
                {count}
              </span>
            )}
          </div>
        ))}
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

function StatCard({ icon: Icon, label, value, sub, accentColor }: { icon: any; label: string; value: string; sub?: string; accentColor: string }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "16px", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accentColor, opacity: 0.8 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ color: DIM, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{label}</p>
          <p style={{ color: WHITE, fontSize: 36, fontWeight: 900, margin: "4px 0 0", letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</p>
          {sub && <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500, margin: "5px 0 0" }}>{sub}</p>}
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: `${accentColor}18`, border: `1px solid ${accentColor}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={accentColor} />
        </div>
      </div>
    </div>
  );
}

export function RefinedB() {
  return (
    <div style={{ display: "flex", height: "100vh", background: BG, fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13 }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "12px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h1 style={{ color: WHITE, fontWeight: 900, fontSize: 17, margin: 0, letterSpacing: "-0.02em" }}>Dashboard</h1>
            <p style={{ color: DIM, fontSize: 11, margin: "2px 0 0" }}>Monday, March 24, 2026</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ background: FAINT, border: `1px solid ${BORDER2}`, borderRadius: 7, padding: "7px 13px", color: DIM2, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <Upload size={12} /> Upload CSV
            </button>
            <button style={{ background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_S} 100%)`, border: "none", borderRadius: 7, padding: "7px 14px", color: WHITE, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, boxShadow: `0 2px 8px rgba(66,169,110,0.3)` }}>
              <Plus size={12} /> Add Animal
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            <StatCard icon={Users} label="Total Animals" value="42" sub="across 3 species" accentColor={WHITE} />
            <StatCard icon={AlertTriangle} label="Active Alerts" value="3" sub="2 high priority" accentColor={RED} />
            <StatCard icon={Pill} label="Overdue Meds" value="1" sub="Bull #B7" accentColor={RED} />
            <StatCard icon={Calendar} label="Due Soon" value="5" sub="next 7 days" accentColor={GREEN} />
          </div>

          {/* Main panels */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {/* Alerts */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 7 }}>
                <AlertTriangle size={13} color={RED} />
                <span style={{ color: WHITE, fontWeight: 700, fontSize: 12.5 }}>Recent Alerts</span>
              </div>
              <div style={{ padding: "4px 0" }}>
                {[
                  { text: "High humidity — elevated pneumonia risk for cattle", sev: RED, time: "2h ago" },
                  { text: "Dewormer due for 3 animals this week", sev: AMBER, time: "1d ago" },
                  { text: "Expected calving: Bessie (#A14) in 6 days", sev: GREEN, time: "2d ago" },
                ].map(({ text, sev, time }) => (
                  <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 16px", borderBottom: `1px solid rgba(43,85,80,0.5)` }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: sev, flexShrink: 0, marginTop: 5 }} />
                    <span style={{ color: "rgba(255,255,255,0.92)", fontSize: 13, fontWeight: 500, flex: 1, lineHeight: 1.45 }}>{text}</span>
                    <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, flexShrink: 0, marginTop: 2 }}>{time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weather */}
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 7 }}>
                <CloudRain size={13} color="#6BB5E0" />
                <span style={{ color: WHITE, fontWeight: 700, fontSize: 12.5 }}>Ranch Weather</span>
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 14 }}>
                  <span style={{ color: WHITE, fontSize: 56, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>61°</span>
                  <div style={{ paddingTop: 6 }}>
                    <p style={{ color: WHITE, fontWeight: 600, fontSize: 14, margin: 0 }}>Partly Cloudy</p>
                    <div style={{ display: "flex", gap: 12, marginTop: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500 }}>
                        <Thermometer size={12} /> 78% humidity
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500 }}>
                        <Wind size={12} /> 12 mph NW
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ background: `rgba(214,75,58,0.18)`, border: `1px solid rgba(214,75,58,0.45)`, borderRadius: 7, padding: "10px 14px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <AlertTriangle size={15} color={RED} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ color: WHITE, fontSize: 14, fontWeight: 700, margin: 0 }}>High disease risk</p>
                    <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 500, margin: "3px 0 0" }}>Monitor herd closely — humidity above threshold</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Treatments */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Pill size={13} color={GREEN} />
                <span style={{ color: WHITE, fontWeight: 700, fontSize: 12.5 }}>Upcoming Treatments</span>
              </div>
              <span style={{ color: GREEN, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>View all →</span>
            </div>
            <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {[
                { name: "Bull #B7", treatment: "Ivermectin", due: "Today", urgent: true },
                { name: "Cow #A14", treatment: "Vitamin B12", due: "Mar 27", urgent: false },
                { name: "Goat #G3", treatment: "CDT Booster", due: "Mar 29", urgent: false },
              ].map(r => (
                <div key={r.name} style={{
                  background: r.urgent ? "rgba(214,75,58,0.1)" : FAINT,
                  border: `1px solid ${r.urgent ? "rgba(214,75,58,0.35)" : BORDER}`,
                  borderRadius: 8, padding: "12px 14px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <p style={{ color: WHITE, fontWeight: 700, fontSize: 13, margin: 0 }}>{r.name}</p>
                    <span style={{
                      background: r.urgent ? RED : GREEN_S,
                      color: WHITE, fontSize: 9, fontWeight: 800, borderRadius: 5, padding: "2px 6px", textTransform: "uppercase", letterSpacing: "0.05em"
                    }}>{r.due}</span>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 13, fontWeight: 500, margin: "4px 0 0" }}>{r.treatment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
