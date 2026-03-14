"use client";

import { useCallback, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

const MAX_SIZE = 10 * 1024 * 1024;

interface AccreditationUploadProps {
  investorId: string;
  onUploaded: (path: string, filename: string) => void;
  currentPath?: string | null;
  currentFilename?: string;
}

export function AccreditationUpload({
  investorId,
  onUploaded,
  currentPath,
  currentFilename,
}: AccreditationUploadProps) {
  const { getAccessToken } = usePrivy();
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setError("");
      setUploading(true);
      setProgress(0);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("investorId", investorId);

        const token = await getAccessToken();
        const res = await fetch("/api/apply/upload-accreditation", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Upload failed");

        setProgress(100);
        onUploaded(data.path, data.filename ?? file.name);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [investorId, onUploaded, getAccessToken]
  );

  const validateFile = (file: File): boolean => {
    const ok = ["application/pdf", "image/jpeg", "image/png", "image/jpg"].includes(file.type);
    return ok && file.size <= MAX_SIZE;
  };

  const processFiles = (files: File[]) => {
    const file = files[0];
    if (!file || !validateFile(file)) {
      setError("Invalid file. Use PDF, JPG, or PNG (max 10MB).");
      return;
    }
    setError("");
    onDrop([file]);
  };

  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png";
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files?.length) processFiles(Array.from(files));
    };
    input.click();
  };

  const [isDragActive, setIsDragActive] = useState(false);

  const handleDropZone = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    processFiles(Array.from(e.dataTransfer?.files ?? []));
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDropZone}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragActive ? "border-slate-400 bg-slate-50" : "border-slate-200 hover:border-slate-300"
        } ${uploading ? "pointer-events-none opacity-70" : ""}`}
      >
        {uploading ? (
          <p className="text-sm text-slate-600">Uploading…</p>
        ) : (
          <p className="text-sm text-slate-600">
            {isDragActive ? "Drop file here" : "Drag and drop PDF, JPG, or PNG (max 10MB), or click to browse"}
          </p>
        )}
      </div>
      {progress > 0 && progress < 100 && (
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full bg-slate-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {currentPath && currentFilename && (
        <p className="text-sm text-green-600">✓ {currentFilename}</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
