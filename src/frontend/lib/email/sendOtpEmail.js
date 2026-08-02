import nodemailer from 'nodemailer';

/* === Gmail SMTP transporter === */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const SUBJECT_BY_PURPOSE = {
  register: 'Verify your WINDIA account',
  reset_password: 'Reset your WINDIA password',
};

const HEADING_BY_PURPOSE = {
  register: 'Welcome to WINDIA',
  reset_password: 'Reset your password',
};

/* === Sends a branded OTP email for register / reset_password === */
export async function sendOtpEmail({ to, otp, purpose }) {
  const subject = SUBJECT_BY_PURPOSE[purpose] || 'Your WINDIA verification code';
  const heading = HEADING_BY_PURPOSE[purpose] || 'Verify your identity';

  const html = `
    <div style="background:#F9F7F3;padding:40px 20px;font-family:Arial,sans-serif;">
      <div style="max-width:400px;margin:0 auto;background:#EFE8DE;border-radius:16px;padding:32px;text-align:center;">
        <h1 style="color:#7A5A44;font-family:Georgia,serif;font-weight:400;font-size:22px;margin:0 0 8px;">WINDIA</h1>
        <p style="color:#7A5A44;font-size:14px;margin:0 0 20px;">${heading}</p>

        <div style="background:#F9F7F3;border-radius:10px;padding:18px;margin-bottom:20px;">
          <span style="font-size:28px;letter-spacing:8px;color:#7A5A44;font-weight:bold;">${otp}</span>
        </div>

        <p style="color:#7A5A44;opacity:0.7;font-size:12px;margin:0;">
          This code expires in 10 minutes. If you didn't request this, you can ignore this email.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"WINDIA" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });
}