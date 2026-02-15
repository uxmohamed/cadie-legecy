import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";

export default function AuthPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-4 py-12">
      {/* Logo at top */}
      <div className="absolute top-8 left-0 right-0 z-10 flex justify-center">
        <Logo variant="neutral-200" className="h-6 w-auto text-[var(--fg-subtle)]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex w-full justify-center">
        <AuthForm />
      </div>
    </div>
  );
}

