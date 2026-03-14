"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

export function InvestorShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { logout } = usePrivy();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4">
        <Link href="/investor/status" className="font-semibold text-[#1D4ED8]">
          Onvest
        </Link>
        <button
          type="button"
          onClick={async () => {
            await logout();
            router.replace("/login");
          }}
          className="text-sm text-slate-500 underline hover:text-slate-700"
        >
          Log out
        </button>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
