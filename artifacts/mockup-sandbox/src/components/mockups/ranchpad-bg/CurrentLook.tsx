import { AlertTriangle, CloudRain, Stethoscope, Users, ChevronRight } from "lucide-react";

export function CurrentLook() {
  return (
    <div className="flex min-h-screen bg-[#f0f2f5] font-sans">
      {/* Sidebar */}
      <aside className="w-[200px] shrink-0 bg-white border-r border-gray-200 flex flex-col py-4 px-3 gap-1">
        <div className="flex items-center gap-2 px-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#2d6a4f] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
          </div>
          <span className="font-bold text-sm text-gray-900">RanchPad</span>
        </div>
        {["Dashboard", "Animals", "Alerts", "Settings"].map((item, i) => (
          <div key={item} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${i === 0 ? "bg-[#2d6a4f]/10 text-[#2d6a4f]" : "text-gray-500 hover:bg-gray-100"}`}>
            {i === 0 && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
            {i === 1 && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
            {i === 2 && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
            {i === 3 && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
            {item}
          </div>
        ))}
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">Good morning, welcome back.</p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Animals", value: "47", icon: <Users className="w-5 h-5 text-[#2d6a4f]" />, bg: "bg-white" },
              { label: "Active Alerts", value: "3", icon: <AlertTriangle className="w-5 h-5 text-amber-500" />, bg: "bg-white" },
              { label: "Due This Week", value: "5", icon: <Stethoscope className="w-5 h-5 text-blue-500" />, bg: "bg-white" },
            ].map(card => (
              <div key={card.label} className={`${card.bg} rounded-2xl border border-gray-200 p-4 shadow-sm`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{card.label}</span>
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">{card.icon}</div>
                </div>
                <p className="text-3xl font-black text-gray-900">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Two column row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Alerts */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm text-gray-700 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />Recent Alerts</h2>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              <div className="space-y-2">
                {["Pink eye risk — hot & dry", "Footrot after rainfall", "Check water levels"].map((alert, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <p className="text-xs font-medium text-amber-800">{alert}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Weather */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm text-gray-700 flex items-center gap-2"><CloudRain className="w-4 h-4 text-blue-500" />Weather</h2>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div>
                  <p className="text-3xl font-black text-gray-900">78°F</p>
                  <p className="text-xs text-gray-500">Partly cloudy · Dodge City, KS</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[["Mon","82°","Sunny"],["Tue","75°","Cloudy"],["Wed","68°","Rain"]].map(([d,t,c]) => (
                  <div key={d} className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 font-semibold">{d}</p>
                    <p className="text-sm font-black text-gray-800">{t}</p>
                    <p className="text-xs text-gray-400">{c}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope className="w-4 h-4 text-blue-500" />
              <h2 className="font-bold text-sm text-gray-700">Upcoming Treatments</h2>
            </div>
            <div className="space-y-2">
              {[
                { name: "Bessie #1042", treatment: "Booster vaccine due", days: "2d" },
                { name: "Buck #307", treatment: "Dewormer follow-up", days: "5d" },
                { name: "Daisy #88", treatment: "Expected calving", days: "8d" },
              ].map(row => (
                <div key={row.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{row.name}</p>
                    <p className="text-xs text-gray-500">{row.treatment}</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{row.days}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
