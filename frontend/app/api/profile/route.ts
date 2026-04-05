import { auth, currentUser } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { createDefaultProfile, mergeProfile } from "@/lib/profile-defaults";
import { clerkServerEnabled } from "@/lib/server-auth-config";
import {
  getSupabaseAdminClient,
  isSupabaseConfigured,
} from "@/lib/supabase-admin";
import { type ProfileResponse, type UserProfile } from "@/types/settings";

export const runtime = "nodejs";

interface ProfileRow {
  clerk_user_id: string;
  email: string | null;
  full_name: string | null;
  job_title: string | null;
  notifications: UserProfile["notifications"] | null;
  preferences: UserProfile["preferences"] | null;
}

function response(body: ProfileResponse, status = 200) {
  return NextResponse.json(body, { status });
}

function pickString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function sanitizeProfile(
  value: unknown,
  fallback: UserProfile,
): UserProfile {
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const input = value as Partial<UserProfile>;

  return mergeProfile(fallback, {
    fullName: pickString(input.fullName, fallback.fullName),
    email: pickString(input.email, fallback.email),
    jobTitle: pickString(input.jobTitle, fallback.jobTitle),
    notifications:
      input.notifications && typeof input.notifications === "object"
        ? {
            email:
              typeof input.notifications.email === "boolean"
                ? input.notifications.email
                : fallback.notifications.email,
            push:
              typeof input.notifications.push === "boolean"
                ? input.notifications.push
                : fallback.notifications.push,
            sms:
              typeof input.notifications.sms === "boolean"
                ? input.notifications.sms
                : fallback.notifications.sms,
          }
        : fallback.notifications,
    preferences:
      input.preferences && typeof input.preferences === "object"
        ? {
            theme: pickString(
              input.preferences.theme,
              fallback.preferences.theme,
            ),
            language: pickString(
              input.preferences.language,
              fallback.preferences.language,
            ),
            currency: pickString(
              input.preferences.currency,
              fallback.preferences.currency,
            ),
            timezone: pickString(
              input.preferences.timezone,
              fallback.preferences.timezone,
            ),
          }
        : fallback.preferences,
  });
}

async function getAuthenticatedUserProfile() {
  if (!clerkServerEnabled) {
    const fallback = createDefaultProfile({
      email: "demo@evaepic.local",
      fullName: "Portfolio Demo User",
    });

    return { userId: "demo-user", fallback, isGuestMode: true };
  }

  const { userId } = await auth();

  if (!userId) {
    return { userId: null, fallback: null, isGuestMode: false };
  }

  const user = await currentUser();
  const fallback = createDefaultProfile({
    email: user?.primaryEmailAddress?.emailAddress,
    fullName: user?.fullName ?? user?.username,
  });

  return { userId, fallback, isGuestMode: false };
}

export async function GET() {
  const { userId, fallback, isGuestMode } = await getAuthenticatedUserProfile();

  if (!userId || !fallback) {
    return response(
      {
        configured: false,
        message: "Authentication required.",
        profile: createDefaultProfile(),
      },
      401,
    );
  }

  if (!isSupabaseConfigured()) {
    return response({
      configured: false,
      message: isGuestMode
        ? "Running in guest demo mode. Supabase is optional."
        : "Supabase is not configured yet.",
      profile: fallback,
    });
  }

  try {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      return response({
        configured: false,
        message: "Supabase is not configured yet.",
        profile: fallback,
      });
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("clerk_user_id,email,full_name,job_title,notifications,preferences")
      .eq("clerk_user_id", userId)
      .maybeSingle<ProfileRow>();

    if (error) {
      throw error;
    }

    return response({
      configured: true,
      profile: mergeProfile(fallback, data
        ? {
            email: data.email ?? fallback.email,
            fullName: data.full_name ?? fallback.fullName,
            jobTitle: data.job_title ?? fallback.jobTitle,
            notifications: data.notifications ?? fallback.notifications,
            preferences: data.preferences ?? fallback.preferences,
          }
        : fallback),
    });
  } catch (error) {
    Sentry.captureException(error);
    return response(
      {
        configured: true,
        message: "Failed to load profile from Supabase.",
        profile: fallback,
      },
      500,
    );
  }
}

export async function PUT(request: Request) {
  const { userId, fallback, isGuestMode } = await getAuthenticatedUserProfile();

  if (!userId || !fallback) {
    return response(
      {
        configured: false,
        message: "Authentication required.",
        profile: createDefaultProfile(),
      },
      401,
    );
  }

  if (!isSupabaseConfigured()) {
    const payload = sanitizeProfile(await request.json(), fallback);
    return response({
      configured: false,
      message: isGuestMode
        ? "Saved in guest demo mode only. Add Supabase to persist across devices."
        : "Supabase is not configured yet.",
      profile: payload,
    });
  }

  try {
    const payload = sanitizeProfile(await request.json(), fallback);
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
      throw new Error("Supabase client unavailable");
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .upsert(
        {
          clerk_user_id: userId,
          email: payload.email,
          full_name: payload.fullName,
          job_title: payload.jobTitle,
          notifications: payload.notifications,
          preferences: payload.preferences,
        },
        { onConflict: "clerk_user_id" },
      )
      .select("clerk_user_id,email,full_name,job_title,notifications,preferences")
      .single<ProfileRow>();

    if (error) {
      throw error;
    }

    return response({
      configured: true,
      message: "Profile saved to Supabase.",
      profile: mergeProfile(fallback, {
        email: data.email ?? payload.email,
        fullName: data.full_name ?? payload.fullName,
        jobTitle: data.job_title ?? payload.jobTitle,
        notifications: data.notifications ?? payload.notifications,
        preferences: data.preferences ?? payload.preferences,
      }),
    });
  } catch (error) {
    Sentry.captureException(error);
    return response(
      {
        configured: true,
        message: "Failed to save profile to Supabase.",
        profile: fallback,
      },
      500,
    );
  }
}
