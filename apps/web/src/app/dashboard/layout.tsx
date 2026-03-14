// apps/web/src/app/dashboard/layout.tsx
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireRole="gp">
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
