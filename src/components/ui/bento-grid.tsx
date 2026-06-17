"use client";

import { cn } from "@/lib/utils";
import { Bot, Mail, Calendar as CalendarIcon, Search, Zap, Shield } from "lucide-react";

export interface BentoItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  colSpan?: number;
  hasPersistentHover?: boolean;
}

interface BentoGridProps {
  items?: BentoItem[];
}

const itemsSample: BentoItem[] = [
  {
    title: "AI Agent Chat",
    description: "Natural language commands that read and act on your inbox and calendar in real time",
    icon: <Bot className="w-4 h-4" color="#B4F24A" />,
    hasPersistentHover: true,
  },
  {
    title: "Smart Inbox",
    description: "Real Gmail data, zero hardcoding",
    icon: <Mail className="w-4 h-4" color="#B4F24A" />,
  },
  {
    title: "Calendar",
    description: "Events, invites, and scheduling via Corsair",
    icon: <CalendarIcon className="w-4 h-4" color="#F28C28" />,
  },
  {
    title: "Search",
    description: "Command palette and semantic search across mail",
    icon: <Search className="w-4 h-4" color="#F28C28" />,
  },
  {
    title: "Action Feed",
    description: "Live AI action log, color-coded by integration",
    icon: <Zap className="w-4 h-4" color="#B4F24A" />,
  },
  {
    title: "Webhooks",
    description: "Real-time Corsair events persisted straight to the DB",
    icon: <Shield className="w-4 h-4" color="#F28C28" />,
  },
];

function BentoGrid({ items = itemsSample }: BentoGridProps) {
  return (
    <>
      <style>{`
        .bento-card {
          box-shadow: 0 0 0 1px rgba(180,242,74,0.15), 0 0 20px rgba(180,242,74,0.1);
          transition: box-shadow 400ms ease, transform 300ms ease;
        }
        .bento-card:hover {
          box-shadow: 0 0 0 1px rgba(180,242,74,0.4), 0 0 30px rgba(180,242,74,0.25);
        }
        .bento-card-persistent {
          box-shadow: 0 0 0 1px rgba(180,242,74,0.4), 0 0 30px rgba(180,242,74,0.25);
        }
      `}</style>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-7xl mx-auto items-stretch">
        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
              "group relative h-full",
              item.colSpan === 2 ? "md:col-span-2" : "col-span-1",
            )}
          >
            <div
              className={cn(
                "bento-card",
                item.hasPersistentHover && "bento-card-persistent",
                "relative flex flex-col rounded-xl overflow-hidden h-full min-h-[160px]",
                "bg-[#0D0D0D]",
                "group-hover:-translate-y-0.5 will-change-transform",
                item.hasPersistentHover && "-translate-y-0.5"
              )}
              style={{ padding: "24px 28px" }}
            >
              {/* Dot texture — always visible on all cards, behind content */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:4px_4px]" />
              </div>

              {/* Content */}
              <div className="relative flex flex-col flex-1">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/10"
                  style={{ marginBottom: 12 }}
                >
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-medium text-white tracking-tight text-[15px]" style={{ marginBottom: 6 }}>
                    {item.title}
                  </h3>
                  <p className="text-sm text-white/60 leading-snug">{item.description}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export { BentoGrid };
