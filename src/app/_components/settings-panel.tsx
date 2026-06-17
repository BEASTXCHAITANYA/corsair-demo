"use client";

import { useState } from "react";
import {
  User, Plug, Keyboard, Info, Mail, Calendar,
  CheckCircle, Zap, Code2, ExternalLink
} from "lucide-react";

const NAV_ITEMS = [
  { id: "account", label: "Account", icon: User },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "shortcuts", label: "Keyboard Shortcuts", icon: Keyboard },
  { id: "about", label: "About", icon: Info },
];

const SHORTCUTS = [
  { keys: ["⌘", "K"], description: "Open search overlay" },
  { keys: ["⌘", "/"], description: "Toggle AI assistant" },
  { keys: ["↑", "↓"], description: "Navigate search results" },
  { keys: ["↵"], description: "Select / open item" },
  { keys: ["Esc"], description: "Close overlay / dismiss" },
];

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: "#555",
      textTransform: "uppercase", letterSpacing: "0.08em",
      marginBottom: 12,
    }}>
      {title}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(12px) saturate(150%)",
      WebkitBackdropFilter: "blur(12px) saturate(150%)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 24,
      boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
      {children}
    </div>
  );
}

function Row({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      padding: "14px 20px",
      borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.06)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    }}>
      {children}
    </div>
  );
}

export function SettingsPanel() {
  const [active, setActive] = useState("account");

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Left Nav */}
      <div style={{
        width: 200,
        background: "rgba(16,16,16,0.8)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        padding: "24px 12px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: "#555",
          textTransform: "uppercase", letterSpacing: "0.08em",
          padding: "0 8px", marginBottom: 8,
        }}>
          Settings
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 10px",

                background: isActive ? "rgba(180,242,74,0.1)" : "transparent",
                borderWidth: "0 0 0 2px",
                borderStyle: "solid",
                borderColor: isActive ? "#B4F24A" : "transparent",
                borderRadius: 8,
                cursor: "pointer",
                color: isActive ? "#B4F24A" : "#8A8A8A",
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                fontFamily: "inherit",
                textAlign: "left",
                width: "100%",
                transition: "all 150ms",
              }}
            >
              <Icon size={15} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px" }}>

        {/* Account */}
        {active === "account" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F1F1F1", marginBottom: 4 }}>Account</h2>
            <p style={{ fontSize: 13, color: "#555", marginBottom: 24 }}>Your profile and account details</p>

            <SectionHeader title="Profile" />
            <Card>
              <Row>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: "linear-gradient(135deg, #B4F24A, #F28C28)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 700, color: "#fff",
                  }}>
                    C
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#F1F1F1" }}>Chaitanya Pal</div>
                    <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>palchaitanya098@gmail.com</div>
                  </div>
                </div>
                <span style={{
                  background: "rgba(180,242,74,0.1)", color: "#B4F24A",
                  border: "1px solid rgba(180,242,74,0.2)",
                  borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 500,
                }}>
                  Active
                </span>
              </Row>
              <Row last>
                <div>
                  <div style={{ fontSize: 13, color: "#F1F1F1" }}>Account type</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>Personal · Powered by Corsair</div>
                </div>
                <span style={{
                  background: "rgba(180,242,74,0.1)", color: "#B4F24A",
                  border: "1px solid rgba(180,242,74,0.2)",
                  borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 500,
                }}>
                  Free
                </span>
              </Row>
            </Card>
          </div>
        )}

        {/* Integrations */}
        {active === "integrations" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F1F1F1", marginBottom: 4 }}>Integrations</h2>
            <p style={{ fontSize: 13, color: "#555", marginBottom: 24 }}>Connected services powered by Corsair</p>

            <SectionHeader title="Connected" />
            <Card>
              <Row>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: "rgba(234,67,53,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Mail size={18} color="#EA4335" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#F1F1F1" }}>Gmail</div>
                    <div style={{ fontSize: 12, color: "#555" }}>Read, search, send emails</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle size={14} color="#B4F24A" />
                  <span style={{ fontSize: 12, color: "#B4F24A", fontWeight: 500 }}>Connected</span>
                </div>
              </Row>
              <Row last>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: "rgba(66,133,244,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Calendar size={18} color="#4285F4" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#F1F1F1" }}>Google Calendar</div>
                    <div style={{ fontSize: 12, color: "#555" }}>View, create, send invites</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle size={14} color="#B4F24A" />
                  <span style={{ fontSize: 12, color: "#B4F24A", fontWeight: 500 }}>Connected</span>
                </div>
              </Row>
            </Card>

            <SectionHeader title="Powered by" />
            <Card>
              <Row last>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: "linear-gradient(135deg, #B4F24A, #F28C28)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Zap size={18} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#F1F1F1" }}>Corsair</div>
                    <div style={{ fontSize: 12, color: "#555" }}>Integration layer · MCP · Webhooks</div>
                  </div>
                </div>
                <a
                  href="https://corsair.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    fontSize: 12, color: "#B4F24A", textDecoration: "none",
                  }}
                >
                  Visit <ExternalLink size={11} />
                </a>
              </Row>
            </Card>
          </div>
        )}

        {/* Shortcuts */}
        {active === "shortcuts" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F1F1F1", marginBottom: 4 }}>Keyboard Shortcuts</h2>
            <p style={{ fontSize: 13, color: "#555", marginBottom: 24 }}>Navigate FlowMail faster with keyboard shortcuts</p>

            <SectionHeader title="Global" />
            <Card>
              {SHORTCUTS.map((s, i) => (
                <Row key={i} last={i === SHORTCUTS.length - 1}>
                  <span style={{ fontSize: 13, color: "#8A8A8A" }}>{s.description}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {s.keys.map((k, ki) => (
                      <kbd key={ki} style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 4, padding: "2px 8px",
                        fontSize: 12, color: "#F1F1F1", fontFamily: "inherit",
                      }}>
                        {k}
                      </kbd>
                    ))}
                  </div>
                </Row>
              ))}
            </Card>
          </div>
        )}

        {/* About */}
        {active === "about" && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F1F1F1", marginBottom: 4 }}>About FlowMail</h2>
            <p style={{ fontSize: 13, color: "#555", marginBottom: 24 }}>Built for ChaiCode × Corsair Hackathon 2026</p>

            <SectionHeader title="App" />
            <Card>
              <Row>
                <span style={{ fontSize: 13, color: "#8A8A8A" }}>Version</span>
                <span style={{ fontSize: 13, color: "#F1F1F1", fontWeight: 500 }}>1.0.0</span>
              </Row>
              <Row>
                <span style={{ fontSize: 13, color: "#8A8A8A" }}>Built by</span>
                <span style={{ fontSize: 13, color: "#F1F1F1", fontWeight: 500 }}>Chaitanya Pal</span>
              </Row>
              <Row last>
                <span style={{ fontSize: 13, color: "#8A8A8A" }}>Hackathon</span>
                <span style={{ fontSize: 13, color: "#B4F24A", fontWeight: 500 }}>ChaiCode × Corsair 2026</span>
              </Row>
            </Card>

            <SectionHeader title="Tech Stack" />
            <Card>
              {["Next.js 15", "React 19", "tRPC 11", "Drizzle ORM", "PostgreSQL", "Corsair", "TypeScript", "OpenAI GPT-4o"].map((tech, i, arr) => (
                <Row key={tech} last={i === arr.length - 1}>
                  <span style={{ fontSize: 13, color: "#8A8A8A" }}>{tech}</span>
                  <CheckCircle size={14} color="#B4F24A" />
                </Row>
              ))}
            </Card>

            <SectionHeader title="Links" />
            <Card>
              <Row>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Code2 size={15} color="#8A8A8A" />
                  <span style={{ fontSize: 13, color: "#8A8A8A" }}>Source Code</span>
                </div>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "#B4F24A", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                  GitHub <ExternalLink size={11} />
                </a>
              </Row>
              <Row last>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Zap size={15} color="#8A8A8A" />
                  <span style={{ fontSize: 13, color: "#8A8A8A" }}>Powered by Corsair</span>
                </div>
                <a href="https://corsair.dev" target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: "#B4F24A", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                  corsair.dev <ExternalLink size={11} />
                </a>
              </Row>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
