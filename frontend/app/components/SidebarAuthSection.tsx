"use client";

import { SignOutButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

interface SidebarAuthSectionProps {
  isCollapsed: boolean;
}

export default function SidebarAuthSection({
  isCollapsed,
}: SidebarAuthSectionProps) {
  const { user } = useUser();

  const userName =
    user?.fullName ?? user?.username ?? user?.firstName ?? "Portfolio User";
  const userEmail =
    user?.primaryEmailAddress?.emailAddress ??
    "Sign in to save your demo profile";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <>
      {user ? (
        <SignOutButton>
          <button
            className={`flex items-center ${isCollapsed ? "justify-center w-12 h-12 mx-auto" : "justify-start w-full px-3 h-12"} rounded-2xl transition-all hover:bg-white/20 backdrop-blur-sm text-[#FAF0E6]/80 hover:text-white`}
            title={isCollapsed ? "Logout" : undefined}
          >
            <svg
              className="h-5 w-5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            {!isCollapsed && (
              <span className="ml-3 text-sm font-medium text-[#FAF0E6]/90">
                Logout
              </span>
            )}
          </button>
        </SignOutButton>
      ) : (
        <Link
          href="/sign-in"
          className={`flex items-center ${isCollapsed ? "justify-center w-12 h-12 mx-auto" : "justify-start w-full px-3 h-12"} rounded-2xl transition-all hover:bg-white/20 backdrop-blur-sm text-[#FAF0E6]/80 hover:text-white`}
          title={isCollapsed ? "Sign in" : undefined}
        >
          <svg
            className="h-5 w-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4m-4-4l4-4m0 0l-4-4m4 4H3"
            />
          </svg>
          {!isCollapsed && (
            <span className="ml-3 text-sm font-medium text-[#FAF0E6]/90">
              Sign In
            </span>
          )}
        </Link>
      )}

      {!isCollapsed && (
        <div className="pt-4 border-t border-slate-700">
          <div className="text-center">
            <div className="font-medium text-white text-sm truncate px-2">
              {userName}
            </div>
            <div className="text-xs text-[#FAF0E6]/70 truncate px-2 mt-1">
              {userEmail}
            </div>
          </div>
        </div>
      )}
      {isCollapsed && (
        <div className="pt-4 border-t border-[#DEB887]/30 flex justify-center">
          <div className="h-10 w-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white font-medium text-sm shadow-md">
            {userInitials}
          </div>
        </div>
      )}
    </>
  );
}
