"use client";

import { useEffect, useRef, useState } from "react";
import Card from "../components/Card";
import { useButton } from "@react-aria/button";
import { emptyProfile, type UserProfile } from "@/types/settings";

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(true);
  const [serviceStatus, setServiceStatus] = useState<{
    mode: "demo" | "live";
    services: Record<string, boolean>;
  } | null>(null);
  const isGuestDemoMode = serviceStatus?.mode === "demo";

  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const { buttonProps: saveButtonProps } = useButton(
    {
      onPress: async () => {
        setIsSaving(true);
        setStatusMessage(null);

        try {
          const response = await fetch("/api/profile", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(profile),
          });

          const payload = await response.json();

          if (!response.ok) {
            throw new Error(payload.message || "Failed to save profile");
          }

          setProfile(payload.profile);
          setIsSupabaseConfigured(payload.configured);
          if (!payload.configured && isGuestDemoMode && typeof window !== "undefined") {
            window.localStorage.setItem(
              "evaepic-demo-profile",
              JSON.stringify(payload.profile),
            );
          }
          setStatusMessage(payload.message || "Settings saved.");
        } catch (error) {
          setStatusMessage(
            error instanceof Error ? error.message : "Failed to save settings.",
          );
        } finally {
          setIsSaving(false);
        }
      },
      "aria-label": "Save settings",
    },
    saveButtonRef
  );

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const statusResponse = await fetch("/api/status", {
          cache: "no-store",
        });
        const statusPayload = await statusResponse.json();
        if (isMounted) {
          setServiceStatus(statusPayload);
        }

        const response = await fetch("/api/profile", {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || "Failed to load profile");
        }

        if (isMounted) {
          let nextProfile = payload.profile;

          if (statusPayload.mode === "demo" && typeof window !== "undefined") {
            const localProfile = window.localStorage.getItem("evaepic-demo-profile");
            if (localProfile) {
              try {
                nextProfile = JSON.parse(localProfile) as UserProfile;
              } catch {
                window.localStorage.removeItem("evaepic-demo-profile");
              }
            }
          }

          setProfile(nextProfile);
          setIsSupabaseConfigured(payload.configured);
          setStatusMessage(payload.message ?? null);
        }
      } catch (error) {
        if (isMounted) {
          setStatusMessage(
            error instanceof Error ? error.message : "Failed to load profile.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/40 bg-white/60 px-4 py-3 text-sm text-[#6B5B4F] shadow-md backdrop-blur-xl">
        {isSupabaseConfigured
          ? "This page is backed by Supabase and scoped to the signed-in Clerk user."
          : "Supabase is not configured yet, so this page is showing local fallback data only."}
      </div>

      {statusMessage && (
        <div className="rounded-2xl border border-[#DEB887]/40 bg-[#FAF0E6]/80 px-4 py-3 text-sm text-[#6B5B4F] shadow-sm">
          {statusMessage}
        </div>
      )}

      {serviceStatus && (
        <Card title="Service Status">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-white/60 p-4 shadow-sm">
              <div className="text-xs uppercase tracking-[0.18em] text-[#8B7355]">
                App Mode
              </div>
              <div className="mt-2 text-lg font-semibold text-[#5C4A3A]">
                {serviceStatus.mode === "demo" ? "Demo-ready" : "Connected"}
              </div>
            </div>
            {Object.entries(serviceStatus.services).map(([name, enabled]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-2xl bg-white/60 p-4 shadow-sm"
              >
                <span className="text-sm font-medium capitalize text-[#5C4A3A]">
                  {name}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    enabled
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {enabled ? "Configured" : "Optional"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex items-center justify-end">
        <button
          {...saveButtonProps}
          ref={saveButtonRef}
          disabled={isLoading || isSaving}
          className="px-4 py-2 bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] text-white rounded-2xl hover:from-[#6B5B4F] hover:to-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:ring-offset-2 transition-all text-sm font-medium shadow-xl hover:shadow-2xl backdrop-blur-md"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Profile Settings */}
      <Card title="Profile">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={profile.fullName}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, fullName: e.target.value }))
              }
              className="w-full px-3 py-2 border border-white/40 rounded-2xl bg-white/60 backdrop-blur-xl text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:border-[#8B7355]/60 shadow-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, email: e.target.value }))
              }
              className="w-full px-3 py-2 border border-white/40 rounded-2xl bg-white/60 backdrop-blur-xl text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:border-[#8B7355]/60 shadow-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
              Job Title
            </label>
            <input
              type="text"
              value={profile.jobTitle}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, jobTitle: e.target.value }))
              }
              className="w-full px-3 py-2 border border-white/40 rounded-2xl bg-white/60 backdrop-blur-xl text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:border-[#8B7355]/60 shadow-md"
            />
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card title="Notifications">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#5C4A3A]">
                Email Notifications
              </div>
              <div className="text-sm text-[#8B7355]">
                Receive email updates about your orders and quotes
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile.notifications.email}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      email: e.target.checked,
                    },
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/60 backdrop-blur-md peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#8B7355]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/40 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r from-[#8B7355] to-[#6B5B4F] shadow-md"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#5C4A3A]">
                Push Notifications
              </div>
              <div className="text-sm text-[#8B7355]">
                Receive browser push notifications
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile.notifications.push}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      push: e.target.checked,
                    },
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/60 backdrop-blur-md peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#8B7355]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/40 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r from-[#8B7355] to-[#6B5B4F] shadow-md"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#5C4A3A]">
                SMS Notifications
              </div>
              <div className="text-sm text-[#8B7355]">
                Receive SMS alerts for critical updates
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={profile.notifications.sms}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    notifications: {
                      ...prev.notifications,
                      sms: e.target.checked,
                    },
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/60 backdrop-blur-md peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#8B7355]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/40 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r from-[#8B7355] to-[#6B5B4F] shadow-md"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card title="Preferences">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
              Theme
            </label>
            <select
              value={profile.preferences.theme}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    theme: e.target.value,
                  },
                }))
              }
              className="w-full px-3 py-2 border border-white/40 rounded-2xl bg-white/60 backdrop-blur-xl text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:border-[#8B7355]/60 shadow-md"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
              Language
            </label>
            <select
              value={profile.preferences.language}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    language: e.target.value,
                  },
                }))
              }
              className="w-full px-3 py-2 border border-white/40 rounded-2xl bg-white/60 backdrop-blur-xl text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:border-[#8B7355]/60 shadow-md"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
              Currency
            </label>
            <select
              value={profile.preferences.currency}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    currency: e.target.value,
                  },
                }))
              }
              className="w-full px-3 py-2 border border-white/40 rounded-2xl bg-white/60 backdrop-blur-xl text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:border-[#8B7355]/60 shadow-md"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="JPY">JPY - Japanese Yen</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5C4A3A] mb-1">
              Timezone
            </label>
            <select
              value={profile.preferences.timezone}
              onChange={(e) =>
                setProfile((prev) => ({
                  ...prev,
                  preferences: {
                    ...prev.preferences,
                    timezone: e.target.value,
                  },
                }))
              }
              className="w-full px-3 py-2 border border-white/40 rounded-2xl bg-white/60 backdrop-blur-xl text-[#5C4A3A] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 focus:border-[#8B7355]/60 shadow-md"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card title="Security">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#5C4A3A]">
                Two-Factor Authentication
              </div>
              <div className="text-sm text-[#8B7355]">
                Add an extra layer of security to your account
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg">
              Enable
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#5C4A3A]">
                Change Password
              </div>
              <div className="text-sm text-[#8B7355]">
                Update your account password
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg">
              Change
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
