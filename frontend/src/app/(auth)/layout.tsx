/**
 * Auth route group layout: centered card, no app shell.
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg bg-surface p-8">{children}</div>
    </div>
  );
}
