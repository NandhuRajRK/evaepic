"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function HeaderAuthControls() {
  const { user } = useUser();

  return (
    <>
      {user ? (
        <Link
          href="/dashboard"
          className="hidden rounded-xl border border-white/50 bg-white/60 px-3 py-2 text-sm font-medium text-[#6B5B4F] shadow-sm transition hover:bg-white/80 md:inline-flex"
        >
          Dashboard
        </Link>
      ) : null}
      {!user ? (
        <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
          <button className="rounded-xl bg-gradient-to-br from-[#8B7355] to-[#6B5B4F] px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:opacity-95">
            Sign In
          </button>
        </SignInButton>
      ) : null}
      {user ? <UserButton /> : null}
    </>
  );
}
