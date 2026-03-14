// packages/email/src/DailyDigest.tsx - Daily digest to GP
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export interface DailyDigestProps {
  gpName: string;
  fundName?: string;
  pendingKycCount: number;
  newInvestorsToday: number;
  dashboardUrl?: string;
  unsubscribeUrl?: string;
}

export function DailyDigest({
  gpName = "there",
  fundName,
  pendingKycCount = 0,
  newInvestorsToday = 0,
  dashboardUrl = "https://app.onvest.com/dashboard",
  unsubscribeUrl,
}: DailyDigestProps) {
  const hasActivity = pendingKycCount > 0 || newInvestorsToday > 0;
  return (
    <Html>
      <Head />
      <Preview>
        {hasActivity
          ? `${pendingKycCount} pending KYC, ${newInvestorsToday} new investors today`
          : "Your daily digest"}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Daily digest</Heading>
          <Text style={text}>Hi {gpName},</Text>
          {fundName && (
            <Text style={text}>
              Summary for <strong>{fundName}</strong>:
            </Text>
          )}
          <Section style={stats}>
            <Text style={statRow}>
              <strong>Pending KYC review:</strong> {pendingKycCount}
            </Text>
            <Text style={statRow}>
              <strong>New investors today:</strong> {newInvestorsToday}
            </Text>
          </Section>
          {hasActivity && (
            <Section style={buttonContainer}>
              <Button href={dashboardUrl} style={button}>
                Open dashboard
              </Button>
            </Section>
          )}
          <Hr style={hr} />
          <Text style={footer}>You receive this digest because you are a fund manager on Onvest.</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

const h1 = { color: "#1a1a1a", fontSize: "24px", fontWeight: "600", margin: "0 0 16px" };
const text = { color: "#525252", fontSize: "16px", lineHeight: "24px", margin: "0 0 16px" };
const stats = { margin: "24px 0", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px" };
const statRow = { color: "#525252", fontSize: "16px", margin: "8px 0" };
const buttonContainer = { textAlign: "center" as const, margin: "32px 0" };
const button = {
  backgroundColor: "#1D4ED8",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  padding: "12px 24px",
};
const hr = { borderColor: "#e5e5e5", margin: "24px 0" };
const footer = { color: "#737373", fontSize: "12px", margin: "0" };
const unsubscribeLink = { color: "#1D4ED8", textDecoration: "underline" };
