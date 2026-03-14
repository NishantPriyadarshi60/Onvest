// packages/email/src/InvestorWhitelistedGp.tsx - To GP when investor whitelisted
import {
  Body,
  Button,
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

export interface InvestorWhitelistedGpProps {
  investorName: string;
  fundName: string;
  dashboardUrl?: string;
  polygonscanUrl?: string;
}

export function InvestorWhitelistedGp({
  investorName = "John Doe",
  fundName = "Example Fund",
  dashboardUrl = "https://app.onvest.com/dashboard/investors",
  polygonscanUrl,
}: InvestorWhitelistedGpProps) {
  return (
    <Html>
      <Head />
      <Preview>{investorName} has been whitelisted for {fundName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Investor Whitelisted</Heading>
          <Text style={text}>
            <strong>{investorName}</strong> has been successfully whitelisted on-chain for{" "}
            <strong>{fundName}</strong>.
          </Text>
          {polygonscanUrl && (
            <Text style={text}>
              <Link href={polygonscanUrl} style={link}>
                View transaction on Polygonscan
              </Link>
            </Text>
          )}
          <Section style={buttonContainer}>
            <Button href={dashboardUrl} style={button}>
              View investors
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>Transactional notification from Onvest.</Text>
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
const link = { color: "#1D4ED8", fontSize: "14px", textDecoration: "underline" };
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
