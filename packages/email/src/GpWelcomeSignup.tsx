// packages/email/src/GpWelcomeSignup.tsx - GP welcome after signup
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export interface GpWelcomeSignupProps {
  gpName: string;
  platformName?: string;
  dashboardUrl?: string;
  logoUrl?: string;
}

export function GpWelcomeSignup({
  gpName = "there",
  platformName = "Onvest",
  dashboardUrl = "https://app.onvest.com/dashboard",
  logoUrl,
}: GpWelcomeSignupProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {platformName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {logoUrl && (
            <Section style={logoSection}>
              <Img src={logoUrl} alt={platformName} width="120" height="40" style={logo} />
            </Section>
          )}
          <Heading style={h1}>Welcome to {platformName}</Heading>
          <Text style={text}>Hi {gpName},</Text>
          <Text style={text}>
            Thanks for signing up. You can now create funds, invite investors, and manage
            KYC and compliance from one place.
          </Text>
          <Section style={buttonContainer}>
            <Button href={dashboardUrl} style={button}>
              Go to dashboard
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            If you have questions, reach out to our team. Transactional emails from {platformName}.
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

const logoSection = { textAlign: "center" as const, marginBottom: "24px" };
const logo = { maxWidth: "120px", height: "auto" };

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
