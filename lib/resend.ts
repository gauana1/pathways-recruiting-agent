import { Resend } from "resend";

const DEFAULT_FROM = "Recruiting Agent <noreply@recruiting.example.com>";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendEmail({
  to,
  subject,
  html,
  from = DEFAULT_FROM,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  return getResend().emails.send({ from, to, subject, html });
}
