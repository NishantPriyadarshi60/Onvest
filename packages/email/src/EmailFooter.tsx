// packages/email/src/EmailFooter.tsx
import { Hr, Section, Text } from "@react-email/components";
import * as React from "react";

export interface EmailFooterProps {
  /** Legal or informational footer text. */
  text?: string;
  /** Unsubscribe URL for transactional emails (best practice). */
  unsubscribeUrl?: string;
}

export function EmailFooter({ text, unsubscribeUrl }: EmailFooterProps) {
  return (
    <>
      <Hr style={hr} />
      <Section>
        <Text style={footer}>
          {text}
          {unsubscribeUrl && (
            <>
              {" "}
              <a href={unsubscribeUrl} style={unsubscribeLink}>
                Unsubscribe
              </a>
              {" from these emails."}
            </>
          )}
        </Text>
      </Section>
    </>
  );
}

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

const unsubscribeLink = {
  color: "#1D4ED8",
  textDecoration: "underline",
};
