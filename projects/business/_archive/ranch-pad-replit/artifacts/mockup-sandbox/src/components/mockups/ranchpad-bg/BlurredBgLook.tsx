import { AlertTriangle, CloudRain, Stethoscope, Users, ChevronRight } from "lucide-react";

export function BlurredBgLook() {
  return (
    <div className="flex min-h-screen font-sans" style={{ backgroundColor: "#1a2e1a" }}>
      {/* Sidebar */}
      <aside className="w-[200px] shrink-0 flex flex-col py-4 px-3 gap-1 relative z-10" style={{ backgroundColor: "rgba(255,255,255,0.12)", backdropFilter: "blur(20px)", borderRight: "1px solid rgba(255,255,255,0.15)" }}>
        <div className="flex items-center gap-2 px-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center border border-white/30">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
          </div>
          <span className="font-bold text-sm text-white">RanchPad</span>
        </div>
        {["Dashboard", "Animals", "Alerts", "Settings"].map((item, i) => (
          <div key={item} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${i === 0 ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>
            {i === 0 && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
            {i === 1 && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
            {i === 2 && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
            {i === 3 && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            {item}
          </div>
        ))}
      </aside>

      {/* Main area with blurred background */}
      <div className="flex-1 relative overflow-hidden">
        {/* Blurred background layer */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url(/__mockup/images/pasture-bg.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(6px)",
            transform: "scale(1.06)",
          }}
        />
        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Content */}
        <main className="relative z-10 p-6 overflow-auto h-full">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-black text-white drop-shadow">Dashboard</h1>
              <p className="text-white/70 text-sm mt-0.5 drop-shadow">Good morning, welcome back.</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Animals", value: "47", icon: <Users className="w-5 h-5 text-emerald-400" /> },
                { label: "Active Alerts", value: "3", icon: <AlertTriangle className="w-5 h-5 text-amber-400" /> },
                { label: "Due This Week", value: "5", icon: <Stethoscope className="w-5 h-5 text-blue-400" /> },
              ].map(card => (
                <div key={card.label} className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">{card.label}</span>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>{card.icon}</div>
                  </div>
                  <p className="text-3xl font-black text-white">{card.value}</p>
                </div>
              ))}
            </div>

            {/* Two column row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Alerts */}
              <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.14)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.18)" }}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-sm text-white flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" />Recent Alerts</h2>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </div>
                <div className="space-y-2">
                  {["Pink eye risk — hot & dry", "Footrot after rainfall", "Check water levels"].map((alert, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl" style={{ backgroundColor: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.25)" }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <p className="text-xs font-medium text-amber-200">{alert}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weather */}
              <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.14)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.18)" }}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-sm text-white flex items-center gap-2"><CloudRain className="w-4 h-4 text-blue-400" />Weather</h2>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div>
                    <p className="text-3xl font-black text-white">78°F</p>
                    <p className="text-xs text-white/60">Partly cloudy · Dodge City, KS</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[["Mon","82°","Sunny"],["Tue","75°","Cloudy"],["Wed","68°","Rain"]].map(([d,t,c]) => (
                    <div key={d} className="text-center p-2 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                      <p className="text-xs text-white/50 font-semibold">{d}</p>
                      <p className="text-sm font-black text-white">{t}</p>
                      <p className="text-xs text-white/40">{c}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming */}
            <div className="rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.14)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.18)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope className="w-4 h-4 text-blue-400" />
                <h2 className="font-bold text-sm text-white">Upcoming Treatments</h2>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Bessie #1042", treatment: "Booster vaccine due", days: "2d" },
                  { name: "Buck #307", treatment: "Dewormer follow-up", days: "5d" },
                  { name: "Daisy #88", treatment: "Expected calving", days: "8d" },
                ].map(row => (
                  <div key={row.name} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                    <div>
                      <p className="text-sm font-semibold text-white">{row.name}</p>
                      <p className="text-xs text-white/50">{row.treatment}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(96,165,250,0.25)", color: "#93c5fd" }}>{row.days}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
