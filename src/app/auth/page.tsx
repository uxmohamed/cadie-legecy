import { AuthForm } from "@/components/auth-form";

export default function AuthPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Subtle background pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(148,163,184,0.05),transparent_50%)]" />
      
      {/* Decorative circles */}
      <div className="pointer-events-none absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
        <div className="size-96 rounded-full bg-gradient-to-br from-blue-100/30 to-purple-100/30 blur-3xl dark:from-blue-950/20 dark:to-purple-950/20" />
      </div>
      <div className="pointer-events-none absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2">
        <div className="size-96 rounded-full bg-gradient-to-br from-purple-100/30 to-pink-100/30 blur-3xl dark:from-purple-950/20 dark:to-pink-950/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex w-full justify-center">
        <AuthForm />
      </div>
    </div>
  );
}

