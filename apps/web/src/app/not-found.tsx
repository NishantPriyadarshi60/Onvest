// apps/web/src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-6xl font-bold text-slate-200">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-slate-900">Page not found</h2>
        <p className="mt-2 text-slate-600">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-lg bg-[#1D4ED8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af]"
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
