import { AuthForm } from "@/components/auth-form";
import { AuthNavigation } from "@/components/auth-navigation";
import { Logo } from "@/components/logo";

export default function AuthPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-l0-solid)] px-4 py-12">
      {/* Logo at top */}
      <div className="absolute top-8 left-0 right-0 z-10 flex justify-center">
        <Logo variant="neutral-200" className="h-6 w-auto text-[#d4d4d4]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex w-full justify-center">
        <AuthForm />
      </div>
      
      {/* TEMPORARY: Development navigation - positioned at bottom */}
      <div className="fixed bottom-8 left-0 right-0 z-20 flex justify-center">
        <AuthNavigation />
      </div>
    </div>
  );
}

