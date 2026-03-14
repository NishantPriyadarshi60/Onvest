"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  usePrivy,
  useWallets,
  useConnectWallet,
  useCreateWallet,
} from "@privy-io/react-auth";
import { useApplicationState } from "@/hooks/useApplicationState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isAddress } from "ethers";

interface ApplyStep6Props {
  fundSlug: string;
}

function truncateAddress(addr: string) {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function ApplyStep6({ fundSlug }: ApplyStep6Props) {
  const router = useRouter();
  const { getAccessToken } = usePrivy();
  const { stepData, updateStep } = useApplicationState(fundSlug);
  const investorId = stepData().step1?.investorId;

  const { wallets } = useWallets();
  const { connectWallet } = useConnectWallet();
  const { createWallet } = useCreateWallet();
  const [isCreating, setIsCreating] = useState(false);

  const [selectedOption, setSelectedOption] = useState<"connect" | "create" | "manual" | null>(null);
  const [manualAddress, setManualAddress] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [alreadyWhitelisted, setAlreadyWhitelisted] = useState(false);

  const embeddedWallets = wallets.filter((w) => w.walletClientType === "privy");
  const externalWallets = wallets.filter((w) => w.walletClientType !== "privy");
  const hasConnectedWallet = externalWallets.length > 0;
  const hasEmbeddedWallet = embeddedWallets.length > 0;

  const getSelectedAddress = (): string | null => {
    if (selectedOption === "connect" && externalWallets[0]) {
      return externalWallets[0].address;
    }
    if (selectedOption === "create" && embeddedWallets[0]) {
      return embeddedWallets[0].address;
    }
    if (selectedOption === "manual" && manualAddress.trim()) {
      return isAddress(manualAddress.trim()) ? manualAddress.trim() : null;
    }
    return null;
  };

  const handleSaveAndContinue = async () => {
    const address = getSelectedAddress();
    setFieldErrors({});
    if (!investorId) {
      setFieldErrors({ form: "Session expired. Please start over from Step 1." });
      return;
    }
    if (!address) {
      setFieldErrors({ option: "Please select or enter a wallet address." });
      return;
    }

    setLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/apply/save-wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ investorId, walletAddress: address }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to save wallet");

      if (data.alreadyWhitelisted) {
        setAlreadyWhitelisted(true);
      }

      updateStep("step6", { completed: true, walletAddress: address });
      router.push(`/apply/${fundSlug}/step/7`);
    } catch (e) {
      setFieldErrors({ form: e instanceof Error ? e.message : "Failed to save wallet" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    setFieldErrors({});
    setIsCreating(true);
    try {
      await createWallet();
    } catch (e) {
      setFieldErrors({ form: e instanceof Error ? e.message : "Failed to create wallet" });
    } finally {
      setIsCreating(false);
    }
  };

  if (!investorId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">Session expired. Please start from Step 1.</p>
        <Button className="mt-4" onClick={() => router.push(`/apply/${fundSlug}/step/1`)}>
          Start over
        </Button>
      </div>
    );
  }

  const address = getSelectedAddress();
  const canContinue = !!address;
  const manualValid = manualAddress.trim() === "" || isAddress(manualAddress.trim());
  const manualInvalid = manualAddress.trim() !== "" && !manualValid;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Connect Your Wallet</h1>
      <p className="mt-1 text-sm text-slate-600">
        Your wallet will be used to receive tokens after approval. Choose how you want to connect.
      </p>

      {Object.keys(fieldErrors).length > 0 && !fieldErrors.form?.includes("Session expired") && (
        <div
          className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          Please fix the errors below before continuing.
        </div>
      )}
      <div className="mt-6 space-y-4">
        {/* Option 1: Connect Existing Wallet */}
        <button
          type="button"
          onClick={() => setSelectedOption("connect")}
          className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
            selectedOption === "connect"
              ? "border-slate-900 bg-slate-50"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-slate-900">Connect Existing Wallet</span>
              <p className="mt-1 text-sm text-slate-600">
                MetaMask, WalletConnect, or other wallet
              </p>
            </div>
            {!hasConnectedWallet ? (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedOption("connect");
                  connectWallet();
                }}
              >
                Connect
              </Button>
            ) : (
              <div className="text-right">
                <p className="text-sm font-mono text-slate-900">
                  {truncateAddress(externalWallets[0].address)}
                </p>
                <p className="text-xs text-slate-500">
                  {externalWallets[0].connectorType ?? "Connected"}
                </p>
              </div>
            )}
          </div>
        </button>

        {/* Option 2: Create New Wallet (Privy Embedded) */}
        <button
          type="button"
          onClick={() => setSelectedOption("create")}
          className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
            selectedOption === "create"
              ? "border-slate-900 bg-slate-50"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-slate-900">Create New Wallet</span>
              <p className="mt-1 text-sm text-slate-600">
                Don&apos;t have a wallet? We&apos;ll create one for you.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Your wallet is secured by your email. No seed phrase needed.
              </p>
            </div>
            {!hasEmbeddedWallet ? (
              <Button
                variant="outline"
                size="sm"
                disabled={isCreating}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedOption("create");
                  handleCreateWallet();
                }}
              >
                {isCreating ? "Creating…" : "Create"}
              </Button>
            ) : (
              <div className="text-right">
                <p className="text-sm font-mono text-slate-900">
                  {truncateAddress(embeddedWallets[0].address)}
                </p>
                <p className="text-xs text-slate-500">Embedded wallet</p>
              </div>
            )}
          </div>
        </button>

        {/* Option 3: Enter Address Manually */}
        <button
          type="button"
          onClick={() => setSelectedOption("manual")}
          className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
            selectedOption === "manual"
              ? "border-slate-900 bg-slate-50"
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div>
            <span className="font-medium text-slate-900">Enter Address Manually</span>
            <p className="mt-1 text-sm text-slate-600">
              Paste your Ethereum wallet address
            </p>
            {selectedOption === "manual" && (
              <div className="mt-3">
                <Input
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="0x..."
                  className={`font-mono ${manualInvalid ? "border-red-500" : ""}`}
                />
                <p className="mt-2 text-xs text-amber-600">
                  Make sure you control this wallet. Tokens sent here are non-recoverable.
                </p>
                {manualInvalid && (
                  <p className="mt-1 text-xs text-red-600">Invalid Ethereum address</p>
                )}
              </div>
            )}
          </div>
        </button>
      </div>

      {alreadyWhitelisted && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          This address is already in our system.
        </div>
      )}

      {fieldErrors.option && <p className="mt-2 text-sm text-red-600">{fieldErrors.option}</p>}
      {fieldErrors.form && <p className="mt-4 text-sm text-red-600">{fieldErrors.form}</p>}

      <Button
        className="mt-6"
        loading={loading}
        onClick={handleSaveAndContinue}
        disabled={!canContinue || loading || manualInvalid}
      >
        {loading ? "Saving…" : "Use this wallet & Continue"}
      </Button>
    </div>
  );
}
