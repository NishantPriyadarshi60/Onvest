// packages/email/src/LpRejected.tsx - To LP when GP rejects application
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

export interface LpRejectedProps {
  investorName: string;
  fundName: string;
  reason?: string;
}

export function LpRejected({
  investorName = "John",
  fundName = "Example Fund",
  reason,
}: LpRejectedProps) {
  return (
    <Html>
      <Head />
      <Preview>Update on your application for {fundName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Application update</Heading>
          <Text style={text}>Hi {investorName},</Text>
          <Text style={text}>
            Thank you for your interest in <strong>{fundName}</strong>. After review, we
            are unable to move forward with your application at this time.
          </Text>
          {reason && (
            <Section style={reasonSection}>
              <Text style={reasonLabel}>Reason:</Text>
              <Text style={reasonText}>{reason}</Text>
            </Section>
          )}
          <Text style={text}>
            If you have questions or believe this was an error, please contact the fund
            manager directly.
          </Text>
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

const h1 = { color: "#1a1a1a", fontSize: "24px", fontWeight: "600", margin: "0 0 16px" };
const text = { color: "#525252", fontSize: "16px", lineHeight: "24px", margin: "0 0 16px" };
const reasonSection = {
  margin: "24px 0",
  padding: "16px",
  backgroundColor: "#fef2f2",
  borderRadius: "6px",
  borderLeft: "4px solid #ef4444",
};
const reasonLabel = { color: "#991b1b", fontSize: "12px", fontWeight: "600", margin: "0 0 4px" };
const reasonText = { color: "#525252", fontSize: "14px", margin: "0" };
const hr = { borderColor: "#e5e5e5", margin: "24px 0" };
const footer = { color: "#737373", fontSize: "12px", margin: "0" };
