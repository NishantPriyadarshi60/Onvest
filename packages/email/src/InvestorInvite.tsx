// packages/email/src/InvestorInvite.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { EmailFooter } from "./EmailFooter";
import * as React from "react";

export interface InvestorInviteProps {
  fundName: string;
  gpName: string;
  inviteUrl: string;
  logoUrl?: string;
  accentColor?: string;
  unsubscribeUrl?: string;
}

export function InvestorInvite({
  fundName = "Example Fund",
  gpName = "Fund Manager",
  inviteUrl = "https://example.com/apply/example-fund",
  logoUrl,
  accentColor = "#1D4ED8",
  unsubscribeUrl,
}: InvestorInviteProps) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;re invited to invest in {fundName}</Preview>
      <Body style={main}>
        <Container style={container}>
          {logoUrl && (
            <Section style={logoSection}>
              <Img src={logoUrl} alt={fundName} width="120" height="60" style={logo} />
            </Section>
          )}
          <Heading style={h1}>You&apos;re invited</Heading>
          <Text style={text}>
            {gpName} has invited you to apply as an investor in <strong>{fundName}</strong>.
          </Text>
          <Section style={buttonContainer}>
            <Button style={{ ...button, backgroundColor: accentColor }} href={inviteUrl}>
              Start Your Application
            </Button>
          </Section>
          <EmailFooter
            text="This offer is only available to accredited investors. By applying, you confirm you meet applicable accreditation requirements. Past performance does not guarantee future results."
            unsubscribeUrl={unsubscribeUrl}
          />
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
};

const logoSection = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const logo = {
  maxWidth: "120px",
  height: "auto",
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
  display: "inline-block",
};
