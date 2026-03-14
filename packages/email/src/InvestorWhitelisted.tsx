// packages/email/src/InvestorWhitelisted.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export interface InvestorWhitelistedProps {
  investorName: string;
  fundName: string;
  polygonscanUrl?: string;
}

export function InvestorWhitelisted({
  investorName = "John",
  fundName = "Example Fund",
  polygonscanUrl,
}: InvestorWhitelistedProps) {
  return (
    <Html>
      <Head />
      <Preview>You are now whitelisted for {fundName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You Are Now Whitelisted</Heading>
          <Text style={text}>Hi {investorName},</Text>
          <Text style={text}>
            Your wallet has been whitelisted on-chain for <strong>{fundName}</strong>.
            You can now receive and hold tokens for this fund.
          </Text>
          {polygonscanUrl && (
            <Section style={linkSection}>
              <Link href={polygonscanUrl} style={link}>
                View transaction on Polygonscan
              </Link>
            </Section>
          )}
          <Hr style={hr} />
          <Text style={footer}>Thank you for your interest.</Text>
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
  margin: "0 0 16px",
};

const text = {
  color: "#525252",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const linkSection = {
  margin: "16px 0",
};

const link = {
  color: "#1D4ED8",
  fontSize: "14px",
  textDecoration: "underline",
};

const hr = {
  borderColor: "#e5e5e5",
  margin: "24px 0",
};

const footer = {
  color: "#737373",
  fontSize: "12px",
  margin: "0",
};
