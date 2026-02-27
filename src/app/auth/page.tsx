import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";

function sanitizeNextPath(path: string | undefined): string | null {
  if (!path) return null;
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

export default async function AuthPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const rawNext = searchParams.next ?? searchParams.redirect;
  const nextValue = Array.isArray(rawNext) ? rawNext[0] : rawNext;
  const nextPath = sanitizeNextPath(nextValue);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-4 py-12">
      {/* Logo at top */}
      <div className="absolute top-8 left-0 right-0 z-10 flex justify-center">
        <Logo variant="neutral-200" className="h-6 w-auto text-[var(--fg-subtle)]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex w-full justify-center">
        <AuthForm nextPath={nextPath} />
      </div>
    </div>
  );
}
