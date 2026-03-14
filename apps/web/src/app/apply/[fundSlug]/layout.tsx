// apps/web/src/app/apply/[fundSlug]/layout.tsx
import { notFound } from "next/navigation";
import { getFundBySlug, getProfileById } from "@onvest/db";
import { ApplyProgressBar } from "@/components/apply/ApplyProgressBar";
import { ApplyHeader } from "@/components/apply/ApplyHeader";

type Props = {
  children: React.ReactNode;
  params: Promise<{ fundSlug: string }>;
};

export default async function ApplyLayout({ children, params }: Props) {
  const { fundSlug } = await params;
  const fund = await getFundBySlug(fundSlug);
  if (!fund) notFound();

  const gp = fund.gp_id ? await getProfileById(fund.gp_id) : null;
  const logoUrl = (fund.branding as { logo_url?: string })?.logo_url ?? null;

  return (
    <div className="min-h-screen bg-slate-50">
      <ApplyHeader fundName={fund.name} logoUrl={logoUrl} gpName={gp?.full_name ?? "Fund Manager"} />
      <ApplyProgressBar />
      <main className="mx-auto max-w-2xl px-4 pb-12 pt-4">{children}</main>
    </div>
  );
}
