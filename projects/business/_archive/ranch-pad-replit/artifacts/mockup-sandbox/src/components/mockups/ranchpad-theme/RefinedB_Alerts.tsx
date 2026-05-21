import { Home, Warehouse, Bell, Settings, LogOut, AlertTriangle, CloudRain, Pill, CalendarClock, CheckCircle, ChevronRight } from "lucide-react";

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
const AMBER   = "#D98A2E";

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

type AlertSev = "high" | "medium" | "low";

function AlertCard({ icon: Icon, title, description, animal, time, sev, resolved }: {
  icon: any; title: string; description: string; animal?: string; time: string; sev: AlertSev; resolved?: boolean;
}) {
  const colors: Record<AlertSev, { bg: string; border: string; badge: string; icon: string }> = {
    high:   { bg: "rgba(214,75,58,0.1)",  border: "rgba(214,75,58,0.35)",  badge: RED,   icon: RED },
    medium: { bg: "rgba(217,138,46,0.1)", border: "rgba(217,138,46,0.35)", badge: AMBER, icon: AMBER },
    low:    { bg: "rgba(66,169,110,0.08)", border: "rgba(66,169,110,0.3)", badge: GREEN, icon: GREEN },
  };
  const c = colors[sev];
  const labels: Record<AlertSev, string> = { high: "High", medium: "Medium", low: "Low" };
  return (
    <div style={{ background: resolved ? FAINT : c.bg, border: `1px solid ${resolved ? BORDER : c.border}`, borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 14, opacity: resolved ? 0.6 : 1 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${c.icon}18`, border: `1px solid ${c.icon}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
        <Icon size={16} color={c.icon} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ color: WHITE, fontSize: 14, fontWeight: 700 }}>{title}</span>
          <span style={{ background: c.badge, color: WHITE, fontSize: 10, fontWeight: 800, borderRadius: 5, padding: "2px 7px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{labels[sev]}</span>
          {resolved && <span style={{ background: "rgba(66,169,110,0.15)", color: GREEN, fontSize: 10, fontWeight: 700, borderRadius: 5, padding: "2px 7px" }}>Resolved</span>}
        </div>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 500, margin: "0 0 6px" }}>{description}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {animal && <span style={{ color: GREEN, fontSize: 12, fontWeight: 600 }}>{animal}</span>}
          <span style={{ color: DIM, fontSize: 12 }}>{time}</span>
        </div>
      </div>
      <ChevronRight size={16} color={DIM} style={{ marginTop: 10, flexShrink: 0 }} />
    </div>
  );
}

export function RefinedB_Alerts() {
  return (
    <div style={{ display: "flex", height: "100vh", background: BG, fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13 }}>
      <Sidebar active="Alerts" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "12px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h1 style={{ color: WHITE, fontWeight: 900, fontSize: 17, margin: 0, letterSpacing: "-0.02em" }}>Alerts</h1>
            <p style={{ color: DIM, fontSize: 11, margin: "2px 0 0" }}>3 active · 1 resolved today</p>
          </div>
          {/* Summary chips */}
          <div style={{ display: "flex", gap: 8 }}>
            {[{ label: "High", count: 1, color: RED }, { label: "Medium", count: 1, color: AMBER }, { label: "Low", count: 1, color: GREEN }].map(c => (
              <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 6, background: FAINT, border: `1px solid ${BORDER}`, borderRadius: 7, padding: "6px 12px" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.color }} />
                <span style={{ color: DIM2, fontSize: 12, fontWeight: 600 }}>{c.count} {c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alert list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ color: DIM, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>Active</p>
          <AlertCard icon={AlertTriangle} title="High disease risk" description="Humidity at 78% — elevated pneumonia risk for cattle. Check ventilation and limit exposure." animal="Entire herd" time="2 hours ago" sev="high" />
          <AlertCard icon={Pill} title="Medication overdue" description="Ivermectin treatment is overdue. Animal has not received scheduled dose." animal="Bull #B7 (Duke)" time="1 day ago" sev="high" />
          <AlertCard icon={CalendarClock} title="Dewormer due this week" description="3 animals are due for deworming within the next 7 days." animal="Cattle group" time="1 day ago" sev="medium" />
          <AlertCard icon={CalendarClock} title="Expected calving" description="Bessie (#A01) is due to calve within the next 6 days. Prepare birthing area." animal="Bessie #A01" time="2 days ago" sev="low" />

          <p style={{ color: DIM, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "8px 0 4px" }}>Recently Resolved</p>
          <AlertCard icon={CheckCircle} title="CDT Booster administered" description="Goat #G2 received CDT Booster vaccination on schedule." animal="Goat #G2" time="Yesterday" sev="low" resolved />
        </div>
      </div>
    </div>
  );
}
