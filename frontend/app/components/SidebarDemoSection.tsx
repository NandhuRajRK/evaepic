import Link from "next/link";

interface SidebarDemoSectionProps {
  isCollapsed: boolean;
}

export default function SidebarDemoSection({
  isCollapsed,
}: SidebarDemoSectionProps) {
  return (
    <>
      <Link
        href="/settings"
        className={`flex items-center ${isCollapsed ? "justify-center w-12 h-12 mx-auto" : "justify-start w-full px-3 h-12"} rounded-2xl border border-white/10 bg-white/10 text-[#FAF0E6]/90 transition-all hover:bg-white/20`}
        title={isCollapsed ? "Demo mode" : undefined}
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
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {!isCollapsed && (
          <span className="ml-3 text-sm font-medium">Demo Mode</span>
        )}
      </Link>

      {!isCollapsed && (
        <div className="pt-4 border-t border-slate-700 text-center">
          <div className="font-medium text-white text-sm truncate px-2">
            Portfolio Demo
          </div>
          <div className="text-xs text-[#FAF0E6]/70 px-2 mt-1">
            Clerk is optional. Add keys later to enable sign-in.
          </div>
        </div>
      )}
      {isCollapsed && (
        <div className="pt-4 border-t border-[#DEB887]/30 flex justify-center">
          <div className="h-10 w-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white font-medium text-sm shadow-md">
            DM
          </div>
        </div>
      )}
    </>
  );
}
