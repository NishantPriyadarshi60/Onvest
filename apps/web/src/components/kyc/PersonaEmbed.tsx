"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Persona?: {
      Client: new (config: PersonaClientConfig) => PersonaClient;
    };
  }
}

interface PersonaClientConfig {
  inquiryId?: string;
  templateId?: string;
  referenceId?: string;
  sessionToken: string;
  onReady?: () => void;
  onComplete?: (payload: { inquiryId: string }) => void;
  onCancel?: (payload: { inquiryId?: string; sessionToken?: string }) => void;
  onError?: (error: unknown) => void;
  environmentId?: string;
}

interface PersonaClient {
  open: () => void;
  destroy: () => void;
}

const PERSONA_SCRIPT = "https://cdn.withpersona.com/dist/persona-v4.16.0.js";

interface PersonaEmbedProps {
  sessionToken: string;
  inquiryId: string;
  templateId?: string;
  referenceId?: string;
  onComplete: () => void;
}

export function PersonaEmbed({
  sessionToken,
  inquiryId,
  templateId,
  referenceId,
  onComplete,
}: PersonaEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<PersonaClient | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "complete" | "error" | "canceled"
  >("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!sessionToken || !inquiryId) return;

    let mounted = true;

    const loadPersona = () => {
      if (typeof window.Persona !== "undefined") {
        initClient();
        return;
      }

      const script = document.createElement("script");
      script.src = PERSONA_SCRIPT;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => {
        if (mounted) initClient();
      };
      script.onerror = () => {
        if (mounted) {
          setStatus("error");
          setErrorMessage("Failed to load identity verification. Please refresh and try again.");
        }
      };
      document.head.appendChild(script);
    };

    const initClient = () => {
      if (!window.Persona || !containerRef.current || !mounted) return;

      const config: PersonaClientConfig = {
        sessionToken,
        inquiryId,
        ...(templateId && { templateId }),
        ...(referenceId && { referenceId }),
        onReady: () => {
          if (mounted) {
            setStatus("ready");
            clientRef.current?.open();
          }
        },
        onComplete: () => {
          if (mounted) {
            setStatus("complete");
            onComplete();
          }
        },
        onCancel: () => {
          if (mounted) setStatus("canceled");
        },
        onError: (err) => {
          if (mounted) {
            setStatus("error");
            setErrorMessage(
              err instanceof Error ? err.message : "Something went wrong. Please try again."
            );
          }
        },
      };

      clientRef.current = new window.Persona.Client(config);
    };

    loadPersona();

    return () => {
      mounted = false;
      clientRef.current?.destroy();
      clientRef.current = null;
    };
  }, [sessionToken, inquiryId, templateId, referenceId, onComplete]);

  if (status === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{errorMessage}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (status === "canceled") {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-slate-700">Come back anytime to continue.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Resume verification
        </button>
      </div>
    );
  }

  if (status === "complete") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <p className="font-medium text-green-800">Identity verification complete.</p>
        <p className="mt-1 text-sm text-green-700">Redirecting...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-[400px] w-full">
      {(status === "loading" || status === "ready") && status === "loading" && (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
        </div>
      )}
    </div>
  );
}
