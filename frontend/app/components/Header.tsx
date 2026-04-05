"use client";

import { useState, useRef, useEffect } from "react";
import { useButton } from "@react-aria/button";
import { clerkEnabled } from "@/lib/auth-config";
import HeaderAuthControls from "./HeaderAuthControls";

interface HeaderProps {
  onToggle?: () => void;
  isCollapsed?: boolean;
  pageTitle?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "New Quote Received",
    message: "ABC Corp has submitted a quote for Office Supplies",
    time: "2 minutes ago",
    read: false,
  },
  {
    id: "2",
    title: "Order Status Updated",
    message: "Order #1001 has been marked as completed",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "3",
    title: "Negotiation Started",
    message: "Tech Solutions has initiated a negotiation",
    time: "3 hours ago",
    read: true,
  },
  {
    id: "4",
    title: "Vendor Added",
    message: "New vendor Furniture Plus has been added to the system",
    time: "1 day ago",
    read: true,
  },
];

export default function Header({ onToggle, isCollapsed, pageTitle }: HeaderProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsButtonRef = useRef<HTMLButtonElement>(null);
  const notificationsPanelRef = useRef<HTMLDivElement>(null);

  const { buttonProps: notificationsButtonProps } = useButton(
    {
      onPress: () => {
        setIsNotificationsOpen(!isNotificationsOpen);
      },
      "aria-label": "View notifications",
      "aria-expanded": isNotificationsOpen,
    },
    notificationsButtonRef
  );

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsPanelRef.current &&
        !notificationsPanelRef.current.contains(event.target as Node) &&
        notificationsButtonRef.current &&
        !notificationsButtonRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    if (isNotificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationsOpen]);

  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/30 bg-white/50 backdrop-blur-2xl px-6 shadow-lg">
      <div className="flex items-center gap-4">
        {pageTitle && (
          <h2 className="text-base font-semibold text-[#5C4A3A] drop-shadow-sm">
            {pageTitle}
          </h2>
        )}
      </div>
      <div className="flex items-center gap-3 relative">
        {clerkEnabled ? <HeaderAuthControls /> : null}
        <button
          {...notificationsButtonProps}
          ref={notificationsButtonRef}
          className="relative rounded-lg p-2 text-[#8B7355] hover:bg-white/40 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:ring-offset-2 transition-all shadow-sm"
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
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
          )}
        </button>

        {/* Notifications Modal */}
        {isNotificationsOpen && (
          <div
            ref={notificationsPanelRef}
            className="absolute right-0 top-full mt-2 w-80 bg-gradient-to-br from-white/70 via-[#FAF8F3]/60 to-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 z-50 max-h-96 overflow-hidden flex flex-col"
          >
            <div className="px-4 py-3 border-b border-[#DEB887]/30 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#5C4A3A]">
          Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-xs font-medium text-[#8B7355]">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="overflow-y-auto">
              {mockNotifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-white/30">
                  {mockNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-white/50 backdrop-blur-md cursor-pointer transition-all rounded-xl ${
                        !notification.read
                          ? "bg-[#FAF0E6]/50 backdrop-blur-md"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[#5C4A3A]">
                            {notification.title}
                          </div>
                          <div className="text-xs text-[#8B7355] mt-1">
                            {notification.message}
                          </div>
                          <div className="text-xs text-[#8B7355]/70 mt-1">
                            {notification.time}
                          </div>
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-[#8B7355] mt-1 flex-shrink-0 shadow-sm"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {mockNotifications.length > 0 && (
              <div className="px-4 py-3 border-t border-white/30">
                <button className="w-full text-sm font-medium text-[#8B7355] hover:text-[#6B5B4F] text-center transition-colors">
                  Mark all as read
        </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

