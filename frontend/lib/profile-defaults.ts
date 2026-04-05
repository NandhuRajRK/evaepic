import {
  defaultNotifications,
  defaultPreferences,
  emptyProfile,
  type UserProfile,
} from "@/types/settings";

interface ProfileSeed {
  email?: string | null;
  fullName?: string | null;
}

export function createDefaultProfile(seed: ProfileSeed = {}): UserProfile {
  return {
    ...emptyProfile,
    email: seed.email ?? "",
    fullName: seed.fullName ?? "",
    notifications: { ...defaultNotifications },
    preferences: { ...defaultPreferences },
  };
}

export function mergeProfile(
  fallback: UserProfile,
  partial: Partial<UserProfile> | null | undefined,
): UserProfile {
  return {
    ...fallback,
    ...partial,
    notifications: {
      ...fallback.notifications,
      ...(partial?.notifications ?? {}),
    },
    preferences: {
      ...fallback.preferences,
      ...(partial?.preferences ?? {}),
    },
  };
}
