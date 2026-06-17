"use client";

import React from "react";

interface HighlightCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  accentColor?: string;
  onClick?: () => void;
}

export function HighlightCard({
  title,
  value,
  description,
  icon,
  accentColor = "#B4F24A",
  onClick,
}: HighlightCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative w-full cursor-pointer rounded-2xl border border-white/10 bg-gradient-to-br from-[#0A0A0A] via-[#0F0F0F] to-[#0A0A0A] transition-all duration-300 hover:scale-105"
      style={{
        padding: "28px 24px 24px",
        overflow: "hidden",
        boxShadow: "0 0 0 0 transparent",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px 2px ${accentColor}22, 0 0 0 1px ${accentColor}33`;
        (e.currentTarget as HTMLDivElement).style.borderColor = `${accentColor}44`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 0 transparent";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.1)";
      }}
    >
      {/* Icon container — h-12 gives the ping a positioned parent; -inset-2 keeps it within 8px of the icon edge; card overflow:hidden clips any further expansion */}
      <div className="relative mb-4 h-12 w-12">
        <div
          className="absolute -inset-2 animate-ping rounded-full opacity-20"
          style={{ backgroundColor: accentColor }}
        />
        <div
          className="relative flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: `${accentColor}1A` }}
        >
          <span style={{ color: accentColor }}>{icon}</span>
        </div>
      </div>

      {/* Title */}
      <p className="mb-1 text-lg font-bold text-white">{title}</p>

      {/* Value */}
      <p className="text-3xl font-bold" style={{ color: accentColor }}>
        {value}
      </p>

      {/* Description */}
      <p className="mt-1 text-xs text-gray-400">{description}</p>
    </div>
  );
}
