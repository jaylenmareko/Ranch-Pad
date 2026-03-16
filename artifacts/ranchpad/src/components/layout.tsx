import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/lib/auth';
import { PawPrint, LayoutDashboard, AlertTriangle, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Layout({ children }: { children: React.ReactNode }) {
  const { ranch, logout } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/animals', label: 'Animals', icon: PawPrint },
    { href: '/alerts', label: 'Alerts', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-64 flex flex-col">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 border-r border-border bg-card flex-col z-20 shadow-xl shadow-black/5">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-primary">
            <PawPrint className="w-6 h-6" />
            <span className="font-display font-bold text-xl tracking-tight">RanchPad</span>
          </div>
        </div>
        
        <div className="p-4 flex-1">
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const active = location === item.href || (item.href !== '/' && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                  active 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}>
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-border">
          <div className="px-4 py-3 mb-2 rounded-xl bg-secondary/50">
            <p className="text-sm font-semibold text-foreground truncate">{ranch?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{ranch?.locationCity || 'No location set'}</p>
          </div>
          <button 
            onClick={() => logout()}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Header (Mobile) */}
      <header className="md:hidden sticky top-0 z-10 bg-card/90 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-primary">
          <PawPrint className="w-6 h-6" />
          <span className="font-display font-bold text-lg">RanchPad</span>
        </div>
        <button onClick={() => logout()} className="p-2 text-muted-foreground hover:bg-secondary rounded-full">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 animate-in fade-in duration-300">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-card border-t border-border flex items-center justify-around z-50 px-2 pb-safe">
        {navItems.map((item) => {
          const active = location === item.href || (item.href !== '/' && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}>
              <item.icon className={cn("w-6 h-6 transition-transform", active && "scale-110")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
