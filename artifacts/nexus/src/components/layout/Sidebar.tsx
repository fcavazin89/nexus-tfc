import { Link, useLocation } from "wouter";
import { Activity, Network, Users, Box, LayoutDashboard, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "NEXUS Intelligence", href: "/connect", icon: Sparkles, highlight: true },
  { name: "2AG Agents", href: "/agents", icon: Activity },
  { name: "Networks", href: "/chains", icon: Network },
  { name: "Partnerships", href: "/partnerships", icon: Users },
  { name: "Ecosystem", href: "/ecosystem", icon: Box },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 border-r border-border/50 bg-background/50 backdrop-blur-xl h-full flex flex-col pt-6 z-20 relative">
      <div className="px-6 mb-10">
        <h1 className="text-2xl font-display font-bold text-primary tracking-widest drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">
          NEXUS
        </h1>
        <p className="text-xs text-muted-foreground mt-2 font-mono tracking-tight uppercase">
          Mission Control
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const isHighlight = item.highlight;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden group cursor-pointer",
                  isActive
                    ? "text-primary bg-primary/10 border border-primary/20"
                    : isHighlight
                    ? "text-primary/80 bg-primary/5 border border-primary/15 hover:bg-primary/10 hover:border-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
                )}
                <item.icon className={cn("w-5 h-5", (isActive || isHighlight) ? "text-primary" : "")} />
                <span className="tracking-wide">{item.name}</span>
                {isHighlight && !isActive && (
                  <span className="ml-auto text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                    AI
                  </span>
                )}
                {/* Hover glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-border/50">
        <div className="flex items-center gap-3 text-sm">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </div>
          <span className="text-muted-foreground font-mono">SYSTEM ONLINE</span>
        </div>
      </div>
    </div>
  );
}
