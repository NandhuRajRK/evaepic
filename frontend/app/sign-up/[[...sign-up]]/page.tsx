import { SignUp } from "@clerk/nextjs";
import { clerkEnabled } from "@/lib/auth-config";

export default function SignUpPage() {
  if (!clerkEnabled) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f7ecdf,transparent_45%),linear-gradient(180deg,#fff8f1_0%,#f3e5d5_100%)] p-6">
        <div className="max-w-md rounded-3xl border border-white/40 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl">
          <h1 className="text-2xl font-semibold text-[#5C4A3A]">Demo Mode</h1>
          <p className="mt-3 text-sm text-[#6B5B4F]">
            Clerk is not configured in this environment. Add the Clerk keys to enable sign-up.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#f7ecdf,transparent_45%),linear-gradient(180deg,#fff8f1_0%,#f3e5d5_100%)] p-6">
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/dashboard"
      />
    </main>
  );
}
