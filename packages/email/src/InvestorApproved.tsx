// packages/email/src/InvestorApproved.tsx
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

export interface InvestorApprovedProps {
  investorName: string;
  fundName: string;
}

export function InvestorApproved({
  investorName = "John",
  fundName = "Example Fund",
}: InvestorApprovedProps) {
  return (
    <Html>
      <Head />
      <Preview>You have been approved for {fundName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Application Approved</Heading>
          <Text style={text}>Hi {investorName},</Text>
          <Text style={text}>
            Great news! Your application to invest in <strong>{fundName}</strong> has
            been approved.
          </Text>
          <Text style={text}>
            Next steps will be shared by the fund manager. If you have any questions,
            please reach out to them directly.
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

const hr = {
  borderColor: "#e5e5e5",
  margin: "24px 0",
};

const footer = {
  color: "#737373",
  fontSize: "12px",
  margin: "0",
};
