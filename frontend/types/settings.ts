export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface UserPreferences {
  theme: string;
  language: string;
  currency: string;
  timezone: string;
}

export interface UserProfile {
  fullName: string;
  email: string;
  jobTitle: string;
  notifications: NotificationSettings;
  preferences: UserPreferences;
}

export interface ProfileResponse {
  configured: boolean;
  profile: UserProfile;
  message?: string;
}

export const defaultNotifications: NotificationSettings = {
  email: true,
  push: false,
  sms: false,
};

export const defaultPreferences: UserPreferences = {
  theme: "system",
  language: "en",
  currency: "USD",
  timezone: "UTC",
};

export const emptyProfile: UserProfile = {
  fullName: "",
  email: "",
  jobTitle: "Procurement Lead",
  notifications: defaultNotifications,
  preferences: defaultPreferences,
};
