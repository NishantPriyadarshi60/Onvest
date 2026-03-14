// packages/email/src/KycRejected.tsx
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

export interface KycRejectedProps {
  investorName: string;
  fundName: string;
  reason: string;
  resubmitUrl: string;
}

export function KycRejected({
  investorName = "John",
  fundName = "Example Fund",
  reason = "We were unable to verify your identity. This can happen if your ID was unclear, expired, or didn't match the information provided.",
  resubmitUrl = "https://app.onvest.com/apply/example-fund/step/4",
}: KycRejectedProps) {
  return (
    <Html>
      <Head />
      <Preview>Identity verification for {fundName} was not completed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Identity Verification Incomplete</Heading>
          <Text style={text}>
            Hi {investorName},
          </Text>
          <Text style={text}>
            Unfortunately, we were unable to complete your identity verification for{" "}
            <strong>{fundName}</strong>.
          </Text>
          <Text style={reasonText}>{reason}</Text>
          <Text style={text}>
            You can try again at any time. Have your government-issued ID ready and
            ensure the photo is clear and all details are visible.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={resubmitUrl}>
              Try Again
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            If you believe this is an error, please contact the fund manager directly.
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

const reasonText = {
  color: "#525252",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 24px",
  padding: "16px",
  backgroundColor: "#fef2f2",
  borderRadius: "6px",
  borderLeft: "4px solid #ef4444",
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
