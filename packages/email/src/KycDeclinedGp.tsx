// packages/email/src/KycDeclinedGp.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

export interface KycDeclinedGpProps {
  investorName: string;
  fundName: string;
  reason: string;
}

export function KycDeclinedGp({
  investorName = "Applicant",
  fundName = "Example Fund",
  reason = "Identity verification could not be completed.",
}: KycDeclinedGpProps) {
  return (
    <Html>
      <Head />
      <Preview>KYC declined: {investorName} - {fundName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>KYC Declined</Heading>
          <Text style={text}>
            <strong>{investorName}</strong> did not pass identity verification for{" "}
            <strong>{fundName}</strong>.
          </Text>
          <Text style={reasonText}>{reason}</Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
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

const reasonText = {
  color: "#525252",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
  padding: "12px",
  backgroundColor: "#fef2f2",
  borderRadius: "6px",
};
