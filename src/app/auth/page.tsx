import { AuthForm } from "@/features/auth/components/auth-form";

export default function AuthPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-12">
      {/* Content */}
      <div className="relative z-10 flex w-full justify-center">
        <AuthForm />
      </div>
    </div>
  );
}
