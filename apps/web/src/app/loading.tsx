// apps/web/src/app/loading.tsx
export default function Loading() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#1D4ED8]" />
    </div>
  );
}
