"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useButton } from "@react-aria/button";
import { useRef } from "react";
import SidebarAuthSection from "./SidebarAuthSection";
import SidebarDemoSection from "./SidebarDemoSection";
import { clerkEnabled } from "@/lib/auth-config";

const navigation = [
  {
    name: "Home",
    href: "/",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: "Orders",
    href: "/orders",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    name: "Quotes",
    href: "/quotes",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    name: "Vendors",
    href: "/vendors",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    name: "Negotiations",
    href: "/negotiations",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  
  const { buttonProps } = useButton(
    {
      onPress: onToggle,
      "aria-label": isCollapsed ? "Expand sidebar" : "Collapse sidebar",
      "aria-expanded": !isCollapsed,
    },
    toggleButtonRef
  );

  return (
    <div
      className={`
        relative flex h-screen flex-col bg-gradient-to-b from-[#8B7355]/80 via-[#6B5B4F]/75 to-[#8B7355]/80 backdrop-blur-2xl border-r border-white/30 shadow-2xl transition-all duration-300 ease-in-out group
        ${isCollapsed ? "w-20" : "w-64"}
      `}
    >
      {/* Logo at Top - Centered */}
      <div className={`flex h-20 items-center ${isCollapsed ? "justify-center" : "justify-between"} border-b border-white/30 px-4`}>
        {isCollapsed ? (
          <div className="flex items-center justify-center w-full">
            <Image
              src="/WhatsApp Image 2025-12-13 at 23.30.36.jpeg"
              alt="EvaEpic Logo"
              width={40}
              height={40}
              className="rounded-lg object-contain drop-shadow-md"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Image
              src="/WhatsApp Image 2025-12-13 at 23.30.36.jpeg"
              alt="EvaEpic Logo"
              width={40}
              height={40}
              className="rounded-lg object-contain drop-shadow-md"
            />
            <h1 className="text-lg font-semibold text-white drop-shadow-md">EvaEpic</h1>
          </div>
        )}
        {!isCollapsed && (
          <button
            {...buttonProps}
            ref={toggleButtonRef}
            className="ml-auto rounded-2xl p-1.5 text-[#FAF0E6] hover:bg-white/30 backdrop-blur-md hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-[#FAF0E6]/50 focus:ring-offset-2"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}
        {isCollapsed && (
          <button
            {...buttonProps}
            ref={toggleButtonRef}
            className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 rounded-2xl p-1.5 text-[#FAF0E6] hover:bg-white/30 backdrop-blur-md hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-[#FAF0E6]/50 focus:ring-offset-2 bg-gradient-to-br from-[#8B7355]/80 to-[#6B5B4F]/80 shadow-xl z-10"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation Buttons - Centered in Middle */}
      <nav className={`flex-1 flex flex-col ${isCollapsed ? "items-center justify-center" : "items-start"} gap-4 py-8 ${isCollapsed ? "px-0" : "px-4"}`}>
        {navigation.map((item, index) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const hasNotification = item.name === "Orders"; // Add notification dot to Orders (optional)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group relative flex items-center ${isCollapsed ? "justify-center w-12 h-12" : "justify-start w-full px-3 h-12"} rounded-2xl transition-all
                ${
                  isActive
                    ? "bg-slate-700 dark:bg-slate-600"
                    : "hover:bg-slate-700/50 dark:hover:bg-slate-700/50"
                }
              `}
              title={isCollapsed ? item.name : undefined}
            >
              <span
                className={`
                  transition-colors relative flex-shrink-0
                ${
                  isActive
                      ? "text-white drop-shadow-sm"
                      : "text-[#FAF0E6]/80 group-hover:text-white"
                }
              `}
            >
                {item.icon}
                {hasNotification && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-[#DEB887] rounded-full border-2 border-white/40" />
                )}
              </span>
              {!isCollapsed && (
                <span className={`ml-3 text-sm font-medium ${isActive ? "text-white drop-shadow-sm" : "text-[#FAF0E6]/90"}`}>
                  {item.name}
                </span>
              )}
              {isActive && isCollapsed && (
                <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#FAF0E6] rounded-l-full shadow-sm" />
              )}
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FAF0E6] rounded-r-full shadow-sm" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section - Settings and User Info */}
      <div className="p-4 border-t border-white/30 space-y-3">
        {/* Settings Button */}
        <Link
          href="/settings"
          className={`
            flex items-center ${isCollapsed ? "justify-center w-12 h-12 mx-auto" : "justify-start w-full px-3 h-12"} rounded-2xl transition-all
            ${
              pathname === "/settings"
                ? "bg-slate-700 dark:bg-slate-600"
                : "hover:bg-slate-700/50 dark:hover:bg-slate-700/50"
            }
          `}
          title={isCollapsed ? "Settings" : undefined}
        >
          <svg
            className={`h-5 w-5 flex-shrink-0 ${
              pathname === "/settings"
                ? "text-white drop-shadow-sm"
                : "text-[#FAF0E6]/80 hover:text-white"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {!isCollapsed && (
            <span className={`ml-3 text-sm font-medium ${pathname === "/settings" ? "text-white drop-shadow-sm" : "text-[#FAF0E6]/90"}`}>
              Settings
            </span>
          )}
        </Link>

        {clerkEnabled ? (
          <SidebarAuthSection isCollapsed={isCollapsed} />
        ) : (
          <SidebarDemoSection isCollapsed={isCollapsed} />
        )}
      </div>
    </div>
  );
}

