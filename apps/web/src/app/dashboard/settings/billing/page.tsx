"use client";

// apps/web/src/app/dashboard/settings/billing/page.tsx
import { useQuery } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { useState } from "react";

const PLANS = [
  { id: "starter", name: "Starter", price: 499, description: "1 fund, 25 investors max" },
  { id: "growth", name: "Growth", price: 1499, description: "3 funds, 100 investors max" },
  { id: "pro", name: "Pro", price: 3499, description: "Unlimited funds & investors" },
];

export default function BillingPage() {
  const { getAccessToken } = usePrivy();
  const [loading, setLoading] = useState<string | null>(null);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["billing", "subscription"],
    queryFn: async () => {
      const token = await getAccessToken();
      const res = await fetch("/api/billing/subscription", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const handleCheckout = async (priceId: string) => {
    const token = await getAccessToken();
    if (!token) return;
    setLoading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
      else throw new Error(data.error ?? "Checkout failed");
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    const token = await getAccessToken();
    if (!token) return;
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error ?? "Failed to open billing portal");
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to open billing portal");
    } finally {
      setLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8">
        <p className="text-slate-500">Loading billing...</p>
      </div>
    );
  }

  const plan = subscription?.plan?.toString().charAt(0).toUpperCase() + subscription?.plan?.slice(1);
  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : null;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-slate-900">Billing</h1>

      {subscription?.hasSubscription ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-medium text-slate-900">Current Plan</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-slate-500">Plan:</span>{" "}
              <span className="font-medium">{plan ?? "—"}</span>
            </p>
            <p>
              <span className="text-slate-500">Status:</span>{" "}
              <span className="font-medium capitalize">{subscription.status ?? "—"}</span>
            </p>
            {periodEnd && (
              <p>
                <span className="text-slate-500">Next billing date:</span>{" "}
                <span className="font-medium">{periodEnd}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handlePortal}
            disabled={!!loading}
            className="mt-4 rounded-lg bg-[#1D4ED8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af] disabled:opacity-50"
          >
            {loading === "portal" ? "Opening..." : "Manage subscription"}
          </button>
          <p className="mt-2 text-xs text-slate-500">
            Upgrade, downgrade, update payment method, or cancel.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-medium text-slate-900">Subscribe to a plan</h2>
          <p className="mb-6 text-sm text-slate-600">
            Choose a plan to create funds and invite investors.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <h3 className="font-medium text-slate-900">{p.name}</h3>
                <p className="mt-1 text-2xl font-semibold text-slate-900">${p.price}/mo</p>
                <p className="mt-2 text-sm text-slate-500">{p.description}</p>
                <button
                  type="button"
                  onClick={() => handleCheckout(p.id)}
                  disabled={!!loading}
                  className="mt-4 w-full rounded-lg bg-[#1D4ED8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af] disabled:opacity-50"
                >
                  {loading === p.id ? "Redirecting..." : "Subscribe"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-slate-900">Invoice history</h2>
        <p className="text-sm text-slate-500">
          View and download invoices in the billing portal.
        </p>
        {subscription?.hasSubscription && (
          <button
            type="button"
            onClick={handlePortal}
            disabled={!!loading}
            className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Open billing portal
          </button>
        )}
      </div>
    </div>
  );
}
