// packages/email/src/GpWelcome.tsx
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

export interface GpWelcomeProps {
  gpName: string;
  planName?: string;
}

export function GpWelcome({
  gpName = "there",
  planName = "Starter",
}: GpWelcomeProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Onvest</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to Onvest</Heading>
          <Text style={text}>Hi {gpName},</Text>
          <Text style={text}>
            Thank you for subscribing to the <strong>{planName}</strong> plan.
            You're all set to create funds and manage investors.
          </Text>
          <Text style={text}>
            If you have any questions, reach out to our team anytime.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>Thank you for your business.</Text>
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
