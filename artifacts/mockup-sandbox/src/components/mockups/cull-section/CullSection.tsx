import { Tag, AlertTriangle, ChevronDown, Scissors } from "lucide-react";

const colors = {
  bg: "#162E2A",
  sidebar: "#112622",
  card: "#1C3C37",
  border: "#2B5550",
  green: "#42A96E",
  amber: "#D97706",
  amberBg: "rgba(217,119,6,0.10)",
  amberBorder: "rgba(217,119,6,0.25)",
  red: "#EF4444",
};

interface Animal {
  tag: string;
  name?: string;
  species: string;
  breed: string;
  sex: string;
  age: string;
  health: "healthy" | "watch" | "urgent";
  cullReason?: string;
}

const herdAnimals: Animal[] = [
  { tag: "A-101", name: "Bessie", species: "Cattle", breed: "Angus", sex: "Cow", age: "4y", health: "healthy" },
  { tag: "A-102", species: "Cattle", breed: "Hereford", sex: "Bull", age: "3y", health: "watch" },
  { tag: "A-104", name: "Clover", species: "Cattle", breed: "Angus", sex: "Heifer", age: "2y", health: "healthy" },
  { tag: "A-107", species: "Cattle", breed: "Angus", sex: "Steer", age: "1y", health: "healthy" },
];

const cullAnimals: Animal[] = [
  { tag: "A-103", species: "Cattle", breed: "Hereford", sex: "Cow", age: "9y", health: "watch", cullReason: "Age — past prime production" },
  { tag: "A-106", species: "Cattle", breed: "Angus", sex: "Steer", age: "18mo", health: "healthy", cullReason: "Market weight reached" },
  { tag: "A-108", species: "Cattle", breed: "Brangus", sex: "Cow", age: "6y", health: "urgent", cullReason: "Chronic health issues" },
];

function animalLabel(a: Animal) {
  return a.name ? `#${a.tag} (${a.name})` : `#${a.tag}`;
}

function HealthDot({ health }: { health: Animal["health"] }) {
  const color = health === "urgent" ? colors.red : health === "watch" ? "#EAB308" : colors.green;
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />;
}

function AnimalCard({ animal, isCull = false }: { animal: Animal; isCull?: boolean }) {
  return (
    <div style={{
      background: colors.card,
      border: `1.5px solid ${isCull ? colors.amberBorder : colors.border}`,
      borderRadius: 14,
      padding: "12px 14px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      position: "relative",
      overflow: "hidden",
    }}>
      {isCull && (
        <div style={{
          position: "absolute",
          top: 0, left: 0,
          width: 3,
          height: "100%",
          background: colors.amber,
          borderRadius: "3px 0 0 3px",
        }} />
      )}
      <div style={{ paddingLeft: isCull ? 4 : 0, flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <HealthDot health={animal.health} />
          <span style={{ fontWeight: 700, fontSize: 14, color: "#fff", letterSpacing: 0.1 }}>
            {animalLabel(animal)}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[animal.species, animal.breed, animal.sex, animal.age].map((v, i) => (
            <span key={i} style={{
              fontSize: 11,
              fontWeight: 600,
              color: "rgba(255,255,255,0.45)",
              background: "rgba(255,255,255,0.05)",
              borderRadius: 6,
              padding: "2px 7px",
            }}>{v}</span>
          ))}
        </div>
        {isCull && animal.cullReason && (
          <div style={{
            marginTop: 6,
            fontSize: 11,
            color: colors.amber,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}>
            <Scissors size={10} />
            {animal.cullReason}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ label, count, isCull = false }: { label: string; count: number; isCull?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      {isCull ? (
        <Scissors size={13} color={colors.amber} />
      ) : (
        <Tag size={13} color={colors.green} />
      )}
      <span style={{
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: isCull ? colors.amber : "rgba(255,255,255,0.45)",
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        background: isCull ? colors.amberBg : "rgba(255,255,255,0.07)",
        color: isCull ? colors.amber : "rgba(255,255,255,0.4)",
        border: `1px solid ${isCull ? colors.amberBorder : "rgba(255,255,255,0.08)"}`,
        borderRadius: 20,
        padding: "1px 8px",
      }}>
        {count}
      </span>
      <ChevronDown size={13} color={isCull ? colors.amber : "rgba(255,255,255,0.3)"} style={{ marginLeft: "auto" }} />
    </div>
  );
}

export function CullSection() {
  return (
    <div style={{
      background: colors.bg,
      minHeight: "100vh",
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: "0 0 40px 0",
      maxWidth: 440,
      margin: "0 auto",
    }}>
      {/* Top bar */}
      <div style={{
        background: colors.sidebar,
        padding: "16px 18px 12px",
        borderBottom: `1px solid ${colors.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>Herd Directory</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>Sunrise Ranch · 7 head</div>
        </div>
        <div style={{
          fontSize: 12, fontWeight: 700,
          color: colors.green,
          background: "rgba(66,169,110,0.12)",
          border: `1px solid rgba(66,169,110,0.25)`,
          borderRadius: 8, padding: "4px 10px",
        }}>
          + Add
        </div>
      </div>

      {/* Search bar */}
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{
          background: colors.card,
          border: `1.5px solid ${colors.border}`,
          borderRadius: 12,
          padding: "9px 14px",
          fontSize: 13,
          color: "rgba(255,255,255,0.25)",
          fontWeight: 500,
        }}>
          🔍 Search by tag or name…
        </div>
      </div>

      {/* Active herd */}
      <div style={{ padding: "18px 16px 0" }}>
        <SectionHeader label="Active Herd" count={herdAnimals.length} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {herdAnimals.map(a => <AnimalCard key={a.tag} animal={a} />)}
        </div>
      </div>

      {/* Divider */}
      <div style={{
        margin: "20px 16px 0",
        borderTop: `1.5px dashed ${colors.amberBorder}`,
      }} />

      {/* Cull section */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{
          background: colors.amberBg,
          border: `1.5px solid ${colors.amberBorder}`,
          borderRadius: 10,
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}>
          <AlertTriangle size={13} color={colors.amber} />
          <span style={{ fontSize: 12, fontWeight: 600, color: colors.amber }}>
            {cullAnimals.length} head marked for cull — sale barn pending
          </span>
        </div>

        <SectionHeader label="Cull" count={cullAnimals.length} isCull />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {cullAnimals.map(a => <AnimalCard key={a.tag} animal={a} isCull />)}
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <div style={{
            flex: 1,
            border: `1.5px solid ${colors.amberBorder}`,
            borderRadius: 10,
            padding: "9px 0",
            textAlign: "center",
            fontSize: 12,
            fontWeight: 700,
            color: colors.amber,
          }}>
            Archive All as Sold
          </div>
          <div style={{
            border: `1.5px solid ${colors.border}`,
            borderRadius: 10,
            padding: "9px 14px",
            fontSize: 12,
            fontWeight: 700,
            color: "rgba(255,255,255,0.4)",
          }}>
            Clear List
          </div>
        </div>
      </div>
    </div>
  );
}
