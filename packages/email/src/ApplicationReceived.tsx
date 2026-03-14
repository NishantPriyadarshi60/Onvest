// packages/email/src/ApplicationReceived.tsx
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

export interface ApplicationReceivedProps {
  investorName: string;
  fundName: string;
  statusUrl: string;
}

export function ApplicationReceived({
  investorName = "John",
  fundName = "Example Fund",
  statusUrl = "https://app.onvest.com/investor/123/status",
}: ApplicationReceivedProps) {
  return (
    <Html>
      <Head />
      <Preview>We received your application for {fundName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>We got your application</Heading>
          <Text style={text}>Hi {investorName},</Text>
          <Text style={text}>
            Thank you for applying to invest in <strong>{fundName}</strong>. We have
            received your application and it is now under review.
          </Text>
          <Section style={buttonContainer}>
            <Button href={statusUrl} style={button}>
              View application status
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            You can check your status anytime. The fund manager will contact you
            when your application has been reviewed.
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
  margin: "0 0 16px",
};

const text = {
  color: "#525252",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
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
