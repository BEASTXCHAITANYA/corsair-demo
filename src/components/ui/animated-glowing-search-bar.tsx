"use client";

import React from "react";
import { Search } from "lucide-react";

interface AnimatedGlowingSearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClick?: () => void;
}

export function AnimatedGlowingSearchBar({
  placeholder = "Search emails and events...",
  value,
  onChange,
  onClick,
}: AnimatedGlowingSearchBarProps) {
  return (
    <div className="group relative w-full" style={{ height: 56 }}>
      <style>{`
        @keyframes rotate-glow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .glow-rotate {
          animation: rotate-glow 4s linear infinite;
        }
      `}</style>

      {/* Sharp border glow — opacity-25 at rest, full on hover/focus */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[14px] opacity-25 transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100">
        <div
          className="glow-rotate absolute left-1/2 top-1/2 h-[300%] w-[300%] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 330deg, #B4F24A 345deg, #F28C28 355deg, transparent 360deg, transparent 150deg, #B4F24A 170deg, #F28C28 180deg, transparent 195deg)",
          }}
        />
      </div>

      {/* Blurred spread glow — opacity-20 at rest, stronger on hover/focus */}
      <div className="pointer-events-none absolute -inset-[3px] overflow-hidden rounded-[17px] opacity-20 blur-md transition-opacity duration-500 group-hover:opacity-50 group-focus-within:opacity-50">
        <div
          className="glow-rotate absolute left-1/2 top-1/2 h-[300%] w-[300%] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, #B4F24A 70deg, #F28C28 140deg, transparent 210deg, #B4F24A 280deg, #F28C28 330deg, transparent 360deg)",
          }}
        />
      </div>

      {/* Dark fill — inset 1.5px to expose the glow rim as a border */}
      <div className="absolute inset-[1.5px] rounded-[12.5px] bg-[#0B0B0B]" />

      {/* Search icon — absolutely centered on the left */}
      <Search
        size={18}
        className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 shrink-0"
        style={{
          color: "#B4F24A",
          opacity: 0.75,
          filter: "drop-shadow(0 0 4px rgba(180,242,74,0.4))",
        }}
      />

      {/* Input — fills the dark inset area, left padding makes room for the icon */}
      <input
        type="text"
        value={value}
        onChange={onChange}
        onClick={onClick}
        placeholder={placeholder}
        className="absolute inset-[1.5px] rounded-[12.5px] bg-transparent text-[#E2E8F0] outline-none placeholder:text-[#4A4A4A]"
        style={{
          padding: "16px 20px 16px 52px",
          fontSize: 15,
          fontFamily: "inherit",
          caretColor: "#B4F24A",
          lineHeight: "24px",
        }}
      />
    </div>
  );
}
