import { Link, useLocation } from "wouter";
import { Activity, Network, Users, Box, LayoutDashboard, Sparkles, Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "NEXUS Intelligence", href: "/connect", icon: Sparkles, highlight: true },
  { name: "2AG Agents", href: "/agents", icon: Activity },
  { name: "Networks", href: "/chains", icon: Network },
  { name: "Partnerships", href: "/partnerships", icon: Users },
  { name: "Ecosystem", href: "/ecosystem", icon: Box },
];

function NexusLogo() {
  return (
    <div className="px-6 mb-10 relative">
      {/* Decorative hex background */}
      <div
        className="absolute -top-2 -left-2 w-20 h-20 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52' viewBox='0 0 60 52'%3E%3Cpath d='M30 0 L60 17.3 L60 34.6 L30 52 L0 34.6 L0 17.3 Z' fill='none' stroke='%2300A8FF' stroke-width='1' stroke-opacity='0.8'/%3E%3C/svg%3E\")",
          backgroundSize: "30px 26px",
        }}
      />

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-1.5 relative">
        {/* Hex icon */}
        <div className="relative flex items-center justify-center w-8 h-8 shrink-0">
          <svg viewBox="0 0 32 32" className="w-8 h-8 absolute">
            <path
              d="M16 2 L29 9.5 L29 22.5 L16 30 L3 22.5 L3 9.5 Z"
              fill="none"
              stroke="hsl(201 100% 50%)"
              strokeWidth="1.5"
              style={{ filter: "drop-shadow(0 0 4px hsl(201 100% 50% / 0.8))" }}
            />
          </svg>
          <span
            className="text-[11px] font-display font-bold relative z-10"
            style={{ color: "hsl(201 100% 50%)", textShadow: "0 0 8px hsl(201 100% 50% / 0.9)" }}
          >
            N3
          </span>
        </div>

        <div>
          <h1
            className="text-[22px] font-display font-black tracking-widest leading-none"
            style={{
              color: "hsl(201 100% 50%)",
              textShadow: "0 0 12px hsl(201 100% 50% / 0.8), 0 0 30px hsl(201 100% 50% / 0.4)",
              letterSpacing: "0.15em",
            }}
          >
            NEXUS
          </h1>
          <p className="text-[8px] font-mono tracking-[0.25em] text-muted-foreground uppercase mt-0.5 leading-none">
            Hub de Agentes
          </p>
        </div>
      </div>

      {/* Tagline */}
      <div
        className="mt-3 pl-0.5"
        style={{
          borderLeft: "2px solid hsl(201 100% 50% / 0.4)",
          paddingLeft: "8px",
        }}
      >
        <p
          className="text-[9px] font-display font-bold tracking-[0.15em] leading-relaxed"
          style={{ color: "hsl(201 100% 50% / 0.7)" }}
        >
          CONECTAR.
          <br />
          ESCALAR.
          <br />
          IMPACTAR.
        </p>
      </div>

      {/* Decorative line */}
      <div className="mt-4 h-px bg-gradient-to-r from-primary/40 via-primary/10 to-transparent" />
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 border-r border-border/50 bg-sidebar/80 backdrop-blur-xl h-full flex flex-col pt-6 z-20 relative overflow-hidden">
      {/* Subtle hex grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52' viewBox='0 0 60 52'%3E%3Cpath d='M30 0 L60 17.3 L60 34.6 L30 52 L0 34.6 L0 17.3 Z' fill='none' stroke='%2300A8FF' stroke-width='0.5' stroke-opacity='0.15'/%3E%3C/svg%3E\")",
          backgroundSize: "40px 34px",
        }}
      />

      {/* Vertical glow line on left edge */}
      <div
        className="absolute left-0 top-0 bottom-0 w-px pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, hsl(201 100% 50% / 0.4), hsl(254 100% 58% / 0.3), transparent)" }}
      />

      <NexusLogo />

      <nav className="flex-1 px-4 space-y-1.5 relative">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const isHighlight = item.highlight;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 relative overflow-hidden group cursor-pointer",
                  isActive
                    ? "text-primary bg-primary/10 border border-primary/25"
                    : isHighlight
                    ? "text-primary/80 bg-primary/5 border border-primary/15 hover:bg-primary/10 hover:border-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                )}
                style={isActive ? { boxShadow: "inset 0 0 12px hsl(201 100% 50% / 0.08)" } : {}}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[2px]"
                    style={{
                      background: "hsl(201 100% 50%)",
                      boxShadow: "0 0 8px hsl(201 100% 50% / 0.9), 0 0 16px hsl(201 100% 50% / 0.5)",
                    }}
                  />
                )}

                <item.icon className={cn("w-4 h-4 shrink-0", (isActive || isHighlight) ? "text-primary" : "")} />
                <span className="tracking-wide font-sans text-[13px]">{item.name}</span>

                {isHighlight && !isActive && (
                  <span
                    className="ml-auto text-[8px] font-display font-bold px-1.5 py-0.5 rounded-full border"
                    style={{
                      color: "hsl(201 100% 50%)",
                      backgroundColor: "hsl(201 100% 50% / 0.1)",
                      borderColor: "hsl(201 100% 50% / 0.3)",
                    }}
                  >
                    AI
                  </span>
                )}

                {/* Hover shimmer */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-primary/8 to-transparent pointer-events-none" />
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom status */}
      <div className="p-6 border-t border-border/40 relative">
        {/* Purple accent dot line */}
        <div className="flex items-center gap-3 text-xs mb-3">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: "hsl(201 100% 50%)" }} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ backgroundColor: "hsl(201 100% 50%)", boxShadow: "0 0 6px hsl(201 100% 50%)" }} />
          </div>
          <span className="font-mono text-muted-foreground tracking-widest text-[10px] uppercase">System Online</span>
        </div>

        {/* Brand DNA tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {["Tecnológica", "Conectada", "Escalável"].map((tag) => (
            <span
              key={tag}
              className="text-[8px] font-mono px-1.5 py-0.5 rounded border"
              style={{
                color: "hsl(201 100% 50% / 0.5)",
                borderColor: "hsl(201 100% 50% / 0.15)",
                backgroundColor: "hsl(201 100% 50% / 0.05)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
