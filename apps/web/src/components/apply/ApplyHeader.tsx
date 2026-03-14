"use client";

interface ApplyHeaderProps {
  fundName: string;
  logoUrl: string | null;
  gpName: string;
}

export function ApplyHeader({ fundName, logoUrl, gpName }: ApplyHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={fundName}
              width={40}
              height={40}
              className="h-10 w-10 rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-lg font-semibold text-slate-600">
              {fundName.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="font-semibold text-slate-900">{fundName}</h1>
            <p className="text-xs text-slate-500">{gpName}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
