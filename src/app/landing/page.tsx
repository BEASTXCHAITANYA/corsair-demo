"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight, Zap } from "lucide-react";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { BentoGrid } from "@/components/ui/bento-grid";

function Marquee() {
  const items = ["Next.js 15", "React 19", "tRPC 11", "Corsair MCP", "PostgreSQL", "TypeScript", "OpenAI", "Drizzle ORM", "Vercel", "Neon DB", "Gmail API", "Google Calendar"];
  return (
    <div style={{ overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "12px 0", background: "rgba(12,12,12,0.6)", backdropFilter: "blur(10px)" }}>
      <div style={{ display: "flex", gap: 48, animation: "marquee 20s linear infinite", width: "max-content" }}>
        {[...items, ...items].map((item, i) => (
          <span key={i} style={{ fontSize: 12, fontWeight: 500, color: "#8A8A8A", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#B4F24A", fontSize: 10 }}>+</span>
            {item}
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

export default function Landing() {
  const router = useRouter();

  const navLinks = [
    { label: "Features", href: "#features", external: false },
    { label: "GitHub", href: "https://github.com/BEASTXCHAITANYA/corsair-demo", external: true },
    { label: "Corsair", href: "https://corsair.dev", external: true },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "#E2E8F0", fontFamily: "Inter, -apple-system, sans-serif", overflowX: "hidden", overflowY: "auto", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(180,242,74,0.07) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "10%", width: 400, height: 300, background: "radial-gradient(ellipse, rgba(245,140,40,0.06) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "0 40px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(10,10,10,0.85)", backdropFilter: "blur(20px) saturate(180%)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #B4F24A, #F28C28)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 12px rgba(180,242,74,0.5)" }}>
            <Zap size={13} color="#0A0A0A" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>FlowMail</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel="noopener noreferrer"
              style={{ fontSize: 13, color: "#8A8A8A", textDecoration: "none", transition: "color 150ms" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#E2E8F0"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#8A8A8A"; }}
            >
              {link.label}
            </a>
          ))}
        </div>
        <button
          onClick={() => router.push("/app")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 500, color: "#E2E8F0", cursor: "pointer", fontFamily: "inherit", transition: "all 150ms" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(180,242,74,0.1)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(180,242,74,0.4)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
        >
          Open App <ArrowUpRight size={13} />
        </button>
      </nav>
      <div style={{ position: "relative", zIndex: 1 }}>
        <HeroGeometric />
      </div>
      <div style={{ position: "relative", zIndex: 1 }}><Marquee /></div>
      <section id="features" style={{ padding: "100px 24px", maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid rgba(180,242,74,0.2)", borderRadius: 999, padding: "4px 12px", fontSize: 11, fontWeight: 500, color: "#B4F24A", marginBottom: 20, background: "rgba(180,242,74,0.05)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Core Features
          </div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.04em", color: "#E2E8F0", marginBottom: 14 }}>Built different. Works better.</h2>
          <p style={{ fontSize: 16, color: "#8A8A8A", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>Every feature powered by Corsair. Real integrations, zero hardcoding.</p>
        </div>
        <BentoGrid />
      </section>
      <footer style={{ padding: "24px 40px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: "linear-gradient(135deg, #B4F24A, #F28C28)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={10} color="#0A0A0A" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#E2E8F0" }}>FlowMail</span>
        </div>
        <span style={{ fontSize: 12, color: "#666666" }}>Built for ChaiCode x Corsair Hackathon 2026. Powered by Corsair</span>
        <a href="https://github.com/BEASTXCHAITANYA/corsair-demo" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#8A8A8A", textDecoration: "none", flexShrink: 0 }}>
          GitHub
        </a>
      </footer>
    </div>
  );
}
