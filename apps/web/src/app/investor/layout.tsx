// apps/web/src/app/investor/layout.tsx
import { AuthGuard } from "@/components/AuthGuard";
import { InvestorShell } from "@/components/investor/InvestorShell";

export default function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireRole="lp">
      <InvestorShell>{children}</InvestorShell>
    </AuthGuard>
  );
}
