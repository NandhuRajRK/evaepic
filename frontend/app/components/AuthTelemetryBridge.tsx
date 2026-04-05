"use client";

import { useUser } from "@clerk/nextjs";
import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import { useEffect } from "react";

export default function AuthTelemetryBridge() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (isSignedIn && user) {
      const traits = {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName ?? user.username ?? user.firstName ?? user.id,
      };

      if (posthog.__loaded) {
        posthog.identify(user.id, traits);
      }

      Sentry.setUser({
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? undefined,
        username: user.username ?? user.fullName ?? undefined,
      });

      return;
    }

    if (posthog.__loaded) {
      posthog.reset();
    }

    Sentry.setUser(null);
  }, [isLoaded, isSignedIn, user]);

  return null;
}
