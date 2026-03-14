// apps/web/src/app/apply/[fundSlug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFundBySlug, getProfileById } from "@onvest/db";
import { verifyInviteToken } from "@/lib/invite-jwt";

type Props = {
  params: Promise<{ fundSlug: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function ApplyWelcomePage({ params, searchParams }: Props) {
  const { fundSlug } = await params;
  const { token } = await searchParams;
  const fund = await getFundBySlug(fundSlug);
  if (!fund) notFound();

  const gp = fund.gp_id ? await getProfileById(fund.gp_id) : null;
  const logoUrl = (fund.branding as { logo_url?: string })?.logo_url ?? null;

  let expired = false;
  let prefillEmail: string | undefined;
  if (token) {
    const payload = await verifyInviteToken(token);
    if (!payload) {
      expired = true;
    } else {
      prefillEmail = payload.email;
    }
  }

  if (expired) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Link expired</h1>
        <p className="mt-2 text-slate-600">
          This invite link has expired. Please request a new invite from the fund manager.
        </p>
      </div>
    );
  }

  const step1Url = token
    ? `/apply/${fundSlug}/step/1?token=${encodeURIComponent(token)}`
    : `/apply/${fundSlug}/step/1`;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col items-center text-center">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={fund.name}
            className="mb-6 h-16 w-auto object-contain"
          />
        ) : (
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-2xl font-semibold text-slate-600">
            {fund.name.charAt(0)}
          </div>
        )}
        <h1 className="text-2xl font-semibold text-slate-900">{fund.name}</h1>
        {gp && <p className="mt-1 text-sm text-slate-500">{gp.full_name}</p>}
        <p className="mt-4 max-w-md text-slate-600">
          {fund.description ||
            "You've been invited to apply as an investor. Complete the application to join this fund."}
        </p>
        <Link
          href={step1Url}
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-slate-900 px-8 py-3 text-base font-medium text-white hover:bg-slate-800"
        >
          Begin Application
        </Link>
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-slate-500">
          <span>KYC Secured by Persona</span>
          <span>Documents via DocuSign</span>
          <span>Blockchain-verified on Polygon</span>
        </div>
        <p className="mt-4 text-sm text-slate-500">~15 minutes to complete</p>
      </div>
    </div>
  );
}
