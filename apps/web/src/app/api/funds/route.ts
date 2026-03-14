// apps/web/src/app/api/funds/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "@/lib/auth";
import { createFund, getFundsByGpId, getInvestorsByFundId } from "@onvest/db";
import { insertActivityLog } from "@onvest/db";
import { checkFundLimit } from "@/lib/stripe/limits";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  fund_type: z.enum(["llc", "lp", "reit", "506b", "506c"]).optional().nullable(),
  description: z.string().optional().nullable(),
  target_raise_cents: z.number().int().positive(),
  min_investment_cents: z.number().int().nonnegative(),
  jurisdiction: z.string().default("US"),
});

/** GET /api/funds - List funds for authenticated GP. */
export async function GET() {
  const session = await getServerSession();
  if (!session || session.profile.role !== "gp") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const funds = await getFundsByGpId(session.profile.id);
  const withCounts = await Promise.all(
    funds.map(async (f) => {
      const investors = await getInvestorsByFundId(f.id);
      return { ...f, _investorCount: investors.length };
    })
  );
  return NextResponse.json(withCounts);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** POST /api/funds - Create a new fund. */
export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session || session.profile.role !== "gp") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await checkFundLimit(session.profile.id);
  } catch (e) {
    const err = e as Error & { statusCode?: number };
    return NextResponse.json(
      { error: err.message, upgradeRequired: true },
      { status: err.statusCode ?? 403 }
    );
  }

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await request.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message : "Invalid body";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const baseSlug = slugify(body.name);
  let slug = baseSlug;
  let suffix = 0;
  const existingFunds = await getFundsByGpId(session.profile.id);
  const existingSlugs = new Set(existingFunds.map((f) => f.slug));
  while (existingSlugs.has(slug)) {
    suffix++;
    slug = `${baseSlug}-${suffix}`;
  }

  const fund = await createFund({
    gp_id: session.profile.id,
    name: body.name,
    slug,
    description: body.description ?? null,
    fund_type: body.fund_type ?? null,
    target_raise_cents: body.target_raise_cents,
    min_investment_cents: body.min_investment_cents,
    jurisdiction: body.jurisdiction,
    status: "draft",
    branding: {},
    token_config: {},
  });

  await insertActivityLog({
    fund_id: fund.id,
    actor_id: session.profile.id,
    action: "fund_created",
    metadata: { fund_name: fund.name },
  });

  return NextResponse.json(fund);
}
