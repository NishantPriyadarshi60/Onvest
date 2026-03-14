// apps/web/src/app/dashboard/settings/page.tsx
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-medium text-slate-900">Billing</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage your subscription, payment method, and invoices.
        </p>
        <Link
          href="/dashboard/settings/billing"
          className="mt-4 inline-block rounded-lg bg-[#1D4ED8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af]"
        >
          Billing & subscription
        </Link>
      </div>
    </div>
  );
}
