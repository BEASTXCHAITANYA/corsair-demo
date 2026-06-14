"use client";

import { Bell, Search, Zap } from "lucide-react";

interface TopHeaderProps {
  onSearchClick: () => void;
}

export function TopHeader({ onSearchClick }: TopHeaderProps) {
  return (
    <header className="top-header">
      {/* Logo */}
      <div className="header-logo">
        <div className="header-logo-icon">
          <Zap size={14} color="#fff" />
        </div>
        <span className="header-logo-text">FlowMail</span>
      </div>

      {/* Search */}
      <div className="header-search" onClick={onSearchClick} role="button" aria-label="Search (⌘K)">
        <Search size={14} color="#475569" />
        <span className="header-search-text">Search emails and events...</span>
        <div className="header-search-kbd">
          <kbd>⌘</kbd>
          <kbd>K</kbd>
        </div>
      </div>

      {/* Right section */}
      <div className="header-right">
        {/* Notification bell */}
        <button className="header-bell" aria-label="Notifications">
          <Bell size={17} />
          <div className="header-bell-badge" />
        </button>

        {/* Avatar */}
        <div className="header-avatar" title="Chaitanya Pal">
          CP
        </div>
      </div>
    </header>
  );
}
