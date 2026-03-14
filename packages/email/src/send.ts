// packages/email/src/send.ts
import type React from "react";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
  from?: string;
  /** Template name for logging (e.g. "investor_invite"). */
  template?: string;
  /** Called after successful send. Use to log messageId to activity_log. */
  onSent?: (opts: { messageId: string | null; to: string; subject: string; template?: string }) => void | Promise<void>;
}

export interface SendEmailResult {
  success: boolean;
  messageId: string | null;
  error: string | null;
}

/**
 * Renders React Email template (HTML + plain text fallback), sends via Resend.
 * Returns { success, messageId, error }. Call onSent to log messageId to DB.
 */
export async function sendEmail({
  to,
  subject,
  react,
  from = "Onvest <onboarding@resend.dev>",
  template,
  onSent,
}: SendEmailOptions): Promise<SendEmailResult> {
  const { render } = await import("@react-email/render");
  const html = await render(react);
  const text = await render(react, { plainText: true });
  const { data, error } = await resend.emails.send({ from, to, subject, html, text });
  if (error) throw new Error(error.message);
  const messageId = data?.id ?? null;
  await onSent?.({ messageId, to, subject, template });
  return { success: true, messageId, error: null };
}
