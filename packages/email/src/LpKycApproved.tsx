// packages/email/src/LpKycApproved.tsx - To LP: KYC passed, awaiting GP approval
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

export interface LpKycApprovedProps {
  investorName: string;
  fundName: string;
}

export function LpKycApproved({
  investorName = "John",
  fundName = "Example Fund",
}: LpKycApprovedProps) {
  return (
    <Html>
      <Head />
      <Preview>Your identity is verified - application under review for {fundName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Identity verified</Heading>
          <Text style={text}>Hi {investorName},</Text>
          <Text style={text}>
            Your identity verification for <strong>{fundName}</strong> is complete. Your
            application is now with the fund manager for final approval.
          </Text>
          <Text style={text}>
            We&apos;ll notify you when your application has been reviewed. You can check your
            status anytime from the link in your previous email.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>Thank you for your interest in {fundName}.</Text>
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
const hr = { borderColor: "#e5e5e5", margin: "24px 0" };
const footer = { color: "#737373", fontSize: "12px", margin: "0" };
