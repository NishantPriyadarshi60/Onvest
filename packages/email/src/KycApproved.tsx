// packages/email/src/KycApproved.tsx
import {
  Body,
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

export interface KycApprovedProps {
  investorName: string;
  fundName: string;
  fundSlug: string;
}

export function KycApproved({
  investorName = "John Doe",
  fundName = "Example Fund",
  fundSlug = "example-fund",
}: KycApprovedProps) {
  const baseUrl = process.env.APP_URL ?? "https://app.onvest.com";
  const dashboardUrl = `${baseUrl}/dashboard/investors`;

  return (
    <Html>
      <Head />
      <Preview>{investorName} completed KYC - ready for review</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>KYC Completed</Heading>
          <Text style={text}>
            <strong>{investorName}</strong> has completed identity verification and is
            ready for your review in <strong>{fundName}</strong>.
          </Text>
          <Section style={buttonContainer}>
            <a href={dashboardUrl} style={button}>
              View Investors
            </a>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Review their application and approve or reject from your dashboard.
          </Text>
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

const h1 = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "32px",
  margin: "0 0 16px",
};

const text = {
  color: "#525252",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 24px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#1D4ED8",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  padding: "12px 24px",
  display: "inline-block",
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "24px 0",
};

const footer = {
  color: "#737373",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0",
};
