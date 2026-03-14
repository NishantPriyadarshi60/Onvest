// apps/web/src/app/layout.tsx
import type { Metadata } from "next";
import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Onvest",
  description: "Investor onboarding & compliance for real estate syndicators",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <NextTopLoader color="#1D4ED8" height={3} showSpinner={false} />
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
