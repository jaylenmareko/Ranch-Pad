import { Home, Warehouse, Bell, Settings, LogOut, AlertTriangle, ChevronDown, ChevronRight, Search, SlidersHorizontal, Plus, Heart, Pill } from "lucide-react";

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

function StatusDot({ status }: { status: "healthy" | "alert" | "watch" }) {
  const c = status === "healthy" ? GREEN : status === "alert" ? RED : "#D98A2E";
  return <div style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }} />;
}

function AnimalRow({ tag, name, species, age, sex, status, note }: { tag: string; name?: string; species: string; age: string; sex: string; status: "healthy" | "alert" | "watch"; note?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "10px 16px", borderBottom: `1px solid rgba(43,85,80,0.4)`, cursor: "pointer" }}
      onMouseEnter={e => (e.currentTarget.style.background = FAINT)}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
      <div style={{ width: 80, color: GREEN, fontSize: 12, fontWeight: 700 }}>{tag}</div>
      <div style={{ flex: 1 }}>
        <p style={{ color: WHITE, fontSize: 13, fontWeight: 600, margin: 0 }}>{name || "—"}</p>
        {note && <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, margin: "1px 0 0" }}>{note}</p>}
      </div>
      <div style={{ width: 90, color: DIM2, fontSize: 12, fontWeight: 500 }}>{species}</div>
      <div style={{ width: 60, color: DIM2, fontSize: 12, fontWeight: 500 }}>{age}</div>
      <div style={{ width: 50, color: DIM2, fontSize: 12, fontWeight: 500 }}>{sex}</div>
      <div style={{ width: 80, display: "flex", alignItems: "center", gap: 6 }}>
        <StatusDot status={status} />
        <span style={{ color: status === "healthy" ? GREEN : status === "alert" ? RED : "#D98A2E", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{status}</span>
      </div>
      <div style={{ width: 60, display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <Heart size={13} color={DIM} style={{ cursor: "pointer" }} />
        <Pill size={13} color={DIM} style={{ cursor: "pointer" }} />
      </div>
    </div>
  );
}

function FolderGroup({ label, count, open, children }: { label: string; count: number; open: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "rgba(255,255,255,0.03)", borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }}>
        {open ? <ChevronDown size={14} color={DIM2} /> : <ChevronRight size={14} color={DIM2} />}
        <span style={{ color: WHITE, fontSize: 13, fontWeight: 700 }}>{label}</span>
        <span style={{ background: "rgba(255,255,255,0.08)", color: DIM2, fontSize: 11, fontWeight: 600, borderRadius: 9, padding: "1px 7px", marginLeft: 2 }}>{count}</span>
      </div>
      {open && children}
    </div>
  );
}

export function RefinedB_Animals() {
  return (
    <div style={{ display: "flex", height: "100vh", background: BG, fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13 }}>
      <Sidebar active="Animals" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: "12px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h1 style={{ color: WHITE, fontWeight: 900, fontSize: 17, margin: 0, letterSpacing: "-0.02em" }}>Herd Directory</h1>
            <p style={{ color: DIM, fontSize: 11, margin: "2px 0 0" }}>42 animals across 3 species</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, background: FAINT, border: `1px solid ${BORDER}`, borderRadius: 7, padding: "7px 12px" }}>
              <Search size={12} color={DIM} />
              <span style={{ color: DIM, fontSize: 12 }}>Search animals…</span>
            </div>
            <button style={{ background: FAINT, border: `1px solid ${BORDER}`, borderRadius: 7, padding: "7px 12px", color: DIM2, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <SlidersHorizontal size={12} /> Filter
            </button>
            <button style={{ background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_S} 100%)`, border: "none", borderRadius: 7, padding: "7px 14px", color: WHITE, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, boxShadow: `0 2px 8px rgba(66,169,110,0.3)` }}>
              <Plus size={12} /> Add Animal
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Table header */}
          <div style={{ display: "flex", alignItems: "center", padding: "8px 16px", borderBottom: `1px solid ${BORDER}`, background: "rgba(0,0,0,0.15)", position: "sticky", top: 0 }}>
            <div style={{ width: 80, color: DIM, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tag</div>
            <div style={{ flex: 1, color: DIM, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Name / Notes</div>
            <div style={{ width: 90, color: DIM, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Species</div>
            <div style={{ width: 60, color: DIM, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Age</div>
            <div style={{ width: 50, color: DIM, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Sex</div>
            <div style={{ width: 80, color: DIM, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Status</div>
            <div style={{ width: 60 }} />
          </div>

          <FolderGroup label="Cattle" count={24} open={true}>
            <AnimalRow tag="#A01" name="Bessie" species="Cattle" age="4y" sex="F" status="watch" note="Calving expected Mar 30" />
            <AnimalRow tag="#A04" name="Ranger" species="Cattle" age="6y" sex="M" status="healthy" />
            <AnimalRow tag="#B7" name="Duke" species="Cattle" age="3y" sex="M" status="alert" note="Ivermectin overdue" />
            <AnimalRow tag="#A09" species="Cattle" age="2y" sex="F" status="healthy" />
            <AnimalRow tag="#A12" name="Rosie" species="Cattle" age="5y" sex="F" status="healthy" />
          </FolderGroup>

          <FolderGroup label="Goats" count={11} open={true}>
            <AnimalRow tag="#G1" name="Billy" species="Goat" age="3y" sex="M" status="healthy" />
            <AnimalRow tag="#G3" species="Goat" age="1y" sex="F" status="watch" note="CDT Booster due Mar 29" />
            <AnimalRow tag="#G5" name="Nanny" species="Goat" age="4y" sex="F" status="healthy" />
          </FolderGroup>

          <FolderGroup label="Sheep" count={7} open={false}>
            {null}
          </FolderGroup>
        </div>
      </div>
    </div>
  );
}
