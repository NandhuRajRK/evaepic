import { NextResponse } from "next/server";
import { clerkServerEnabled } from "@/lib/server-auth-config";
import { isSupabaseConfigured } from "@/lib/supabase-admin";

export async function GET() {
  return NextResponse.json({
    mode: clerkServerEnabled ? "live" : "demo",
    services: {
      clerk: clerkServerEnabled,
      supabase: isSupabaseConfigured(),
      posthog: Boolean(
        process.env.NEXT_PUBLIC_POSTHOG_TOKEN &&
          process.env.NEXT_PUBLIC_POSTHOG_HOST,
      ),
      sentry: Boolean(
        process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
      ),
      backend: Boolean(process.env.NEXT_PUBLIC_API_BASE_URL),
    },
  });
}
