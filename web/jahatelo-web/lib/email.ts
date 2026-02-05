import nodemailer from 'nodemailer';

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure =
    process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465;

  if (!host || !user || !pass) {
    throw new Error('SMTP not configured');
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return cachedTransporter;
}

export async function sendEmail({ to, subject, html, text }: SendEmailArgs) {
  const fromName = process.env.EMAIL_FROM_NAME || 'Jahatelo';
  const fromEmail = process.env.EMAIL_FROM_ADDRESS;
  if (!fromEmail) {
    throw new Error('EMAIL_FROM_ADDRESS not configured');
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
    text,
  });
}
