"use client";
import { useRouter } from "next/navigation";
import { Mail, Calendar, Zap, Search, Bot, ArrowRight, Star, Shield, Send } from "lucide-react";

export default function Landing() {
  const router = useRouter();
  return (
    <div style={{
      minHeight: "100vh", background: "#0A0A0A", color: "#F1F1F1", overflowY: "auto",
      fontFamily: "Inter, -apple-system, sans-serif", overflowX: "hidden",
      backgroundImage: "radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.1) 0%, transparent 60%)",
    }}>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(10,10,10,0.8)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #7C3AED, #06B6D4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={14} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>FlowMail</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginRight: "auto", marginLeft: 32 }}>
          <a href="#features" style={{ fontSize: 13, color: "#475569", textDecoration: "none", transition: "color 150ms" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#E2E8F0")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}>
            Features
          </a>
          <a href="https://github.com/BEASTXCHAITANYA/corsair-demo" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#475569", textDecoration: "none", transition: "color 150ms" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#E2E8F0")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}>
            GitHub
          </a>
          <a href="https://corsair.dev" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#475569", textDecoration: "none", transition: "color 150ms" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#E2E8F0")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}>
            Corsair
          </a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: "#555" }}>Powered by Corsair</span>
          <button onClick={() => router.push("/app")} style={{
            background: "linear-gradient(135deg, #7C3AED, #6D28D9)", color: "#fff",
            border: "none", borderRadius: 8, padding: "8px 20px", fontSize: 13,
            fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 6,
          }}>Open App <ArrowRight size={13} /></button>
        </div>
      </nav>

      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 999, padding: "6px 14px", fontSize: 12, fontWeight: 500, color: "#A78BFA", marginBottom: 32 }}>
          <Star size={12} /> ChaiCode x Corsair Hackathon 2026
        </div>
        <h1 style={{ fontSize: "clamp(40px, 7vw, 72px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: 24, maxWidth: 800, background: "linear-gradient(135deg, #F1F1F1 0%, #F1F1F1 40%, #7C3AED 70%, #06B6D4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          Email and Calendar,<br />the way you want it.
        </h1>
        <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "#8A8A8A", lineHeight: 1.6, maxWidth: 520, marginBottom: 40 }}>
          A Superhuman-style Gmail and Google Calendar workflow app powered by Corsair.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={() => router.push("/app")} style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)", color: "#fff", border: "none", borderRadius: 10, padding: "16px 36px", fontSize: 17, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 0 50px rgba(124,58,237,0.5)", letterSpacing: "-0.01em" }}>
            Open FlowMail <ArrowRight size={15} />
          </button>
          <a href="https://github.com/BEASTXCHAITANYA/corsair-demo" target="_blank" rel="noopener noreferrer" style={{ background: "rgba(255,255,255,0.05)", color: "#F1F1F1", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "14px 28px", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            View on GitHub
          </a>
        </div>


      </section>

      <section style={{ padding: "100px 24px", maxWidth: 1100, margin: "0 auto" }}>
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: 999, padding: "5px 14px",
            fontSize: 12, fontWeight: 500, color: "#A78BFA", marginBottom: 20,
          }}>
            <Zap size={11} /> Core Features
          </div>
          <h2 style={{
            fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800,
            letterSpacing: "-0.03em", marginBottom: 16,
            color: "#E2E8F0",
          }}>
            Built different. Works better.
          </h2>
          <p style={{ color: "#475569", fontSize: 17, maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
            Every feature powered by Corsair — real integrations, zero hardcoding, instant sync.
          </p>
        </div>

        {/* 3 Premium Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {[
            {
              icon: <Bot size={26} color="#fff" />,
              iconBg: "linear-gradient(135deg, #7C3AED, #06B6D4)",
              iconGlow: "rgba(124,58,237,0.4)",
              tag: "Corsair MCP",
              title: "AI Email Assistant",
              desc: "Chat naturally to send emails, schedule meetings, and search your inbox. Powered by Corsair MCP — one command does it all.",
              features: ["Send emails via natural language", "Create calendar invites instantly", "Search inbox with AI context"],
              borderGlow: "rgba(124,58,237,0.3)",
              topGlow: "rgba(124,58,237,0.08)",
            },
            {
              icon: <Mail size={26} color="#fff" />,
              iconBg: "linear-gradient(135deg, #06B6D4, #22C55E)",
              iconGlow: "rgba(6,182,212,0.4)",
              tag: "Unified Inbox",
              title: "Gmail + Calendar",
              desc: "Your email and calendar in one seamless interface. Real data from Google via Corsair — search, read, reply, and schedule without switching apps.",
              features: ["Real Gmail data, no hardcoding", "Week view calendar with events", "⌘K search across everything"],
              borderGlow: "rgba(6,182,212,0.3)",
              topGlow: "rgba(6,182,212,0.06)",
            },
            {
              icon: <Zap size={26} color="#fff" />,
              iconBg: "linear-gradient(135deg, #F59E0B, #EF4444)",
              iconGlow: "rgba(245,158,11,0.4)",
              tag: "Automation",
              title: "Smart Scheduling",
              desc: "Let FlowMail AI handle the logistics. Send invites, draft replies, and automate repetitive email tasks — all tracked in the live AI action feed.",
              features: ["Live AI action feed", "Auto-draft email replies", "Batch calendar invite sending"],
              borderGlow: "rgba(245,158,11,0.25)",
              topGlow: "rgba(245,158,11,0.06)",
            },
          ].map((card, i) => (
            <div
              key={i}
              style={{
                background: "rgba(13,17,23,0.8)",
                backdropFilter: "blur(20px) saturate(180%)",
                border: `1px solid rgba(255,255,255,0.07)`,
                borderRadius: 16, padding: 32,
                position: "relative", overflow: "hidden",
                transition: "border-color 250ms, box-shadow 250ms, transform 200ms",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = card.borderGlow;
                el.style.boxShadow = `0 0 40px ${card.borderGlow}, 0 20px 60px rgba(0,0,0,0.4)`;
                el.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "rgba(255,255,255,0.07)";
                el.style.boxShadow = "none";
                el.style.transform = "translateY(0)";
              }}
            >
              {/* Top glow ray */}
              <div style={{
                position: "absolute", top: 0, left: "50%",
                transform: "translateX(-50%)",
                width: "70%", height: 1,
                background: `linear-gradient(90deg, transparent, ${card.borderGlow}, transparent)`,
              }} />
              <div style={{
                position: "absolute", top: 0, left: "50%",
                transform: "translateX(-50%)",
                width: "40%", height: 60,
                background: `radial-gradient(ellipse at top, ${card.topGlow}, transparent)`,
                pointerEvents: "none",
              }} />

              {/* Tag */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 999, padding: "3px 10px",
                fontSize: 11, fontWeight: 500, color: "#475569",
                marginBottom: 24, letterSpacing: "0.02em",
              }}>
                {card.tag}
              </div>

              {/* Icon */}
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: card.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 20,
                boxShadow: `0 0 20px ${card.iconGlow}, 0 8px 24px rgba(0,0,0,0.3)`,
              }}>
                {card.icon}
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: 22, fontWeight: 700,
                letterSpacing: "-0.02em", color: "#E2E8F0",
                marginBottom: 12,
              }}>
                {card.title}
              </h3>

              {/* Description */}
              <p style={{
                fontSize: 14, color: "#475569",
                lineHeight: 1.7, marginBottom: 24,
              }}>
                {card.desc}
              </p>

              {/* Feature list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {card.features.map((feat, fi) => (
                  <div key={fi} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%",
                      background: card.iconBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                        <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 13, color: "#94A3B8" }}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "60px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 24 }}>Built with</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
          {["Next.js 15", "React 19", "tRPC 11", "Drizzle ORM", "PostgreSQL", "Corsair", "TypeScript", "OpenAI"].map((tech) => (
            <span key={tech} style={{ fontSize: 14, fontWeight: 500, color: "#8A8A8A" }}>{tech}</span>
          ))}
        </div>
      </section>

      <section style={{ padding: "100px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 16, background: "linear-gradient(135deg, #F1F1F1, #7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          Ready to flow?
        </h2>
        <p style={{ color: "#8A8A8A", fontSize: 16, marginBottom: 32 }}>Your email and calendar, finally working the way you want.</p>
        <button onClick={() => router.push("/app")} style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)", color: "#fff", border: "none", borderRadius: 10, padding: "16px 36px", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 0 60px rgba(124,58,237,0.4)" }}>
          Launch FlowMail <ArrowRight size={16} />
        </button>
      </section>

      <footer style={{ padding: "24px 40px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 20, height: 20, background: "linear-gradient(135deg, #7C3AED, #06B6D4)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}><Zap size={10} color="#fff" /></div>
          <span style={{ fontSize: 13, fontWeight: 600 }}>FlowMail</span>
        </div>
        <span style={{ fontSize: 12, color: "#555" }}>Built for ChaiCode x Corsair Hackathon 2026 · Powered by Corsair</span>
      </footer>
    </div>
  );
}
