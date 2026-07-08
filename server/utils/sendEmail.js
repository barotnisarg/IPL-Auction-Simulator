// server/utils/sendEmail.js

const nodemailer = require('nodemailer');

// Lazy-initialised transport — created once on first use so the app starts
// even if EMAIL_USER/EMAIL_PASS are not configured yet (e.g. local dev
// without email). Missing credentials will surface as a clear error on the
// first actual send attempt, not at boot time.
let _transport = null;

const getTransport = () => {
  if (_transport) return _transport;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      'Email credentials not configured. Set EMAIL_USER and EMAIL_PASS in your environment.'
    );
  }

  _transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return _transport;
};

// Branded HTML email template — minimal, readable in every email client.
// Dark + amber matches the app's palette; plain-text fallback included.
const buildResetEmail = ({ recipientName, resetUrl, expiresMinutes }) => {
  const subject = 'Reset your CricBid password';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0"
               style="max-width:480px;background:#1e293b;border-radius:12px;
                      border:1px solid #334155;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:24px 32px;border-bottom:1px solid #334155;">
              <p style="margin:0;font-size:18px;font-weight:800;color:#f1f5f9;letter-spacing:-0.3px;">
                Cric<span style="color:#d97706;">Bid</span>
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#f1f5f9;">
                Reset your password
              </h1>
              <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6;">
                Hi ${recipientName}, we received a request to reset the password
                for your CricBid account. Click the button below to choose a new one.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:#d97706;border-radius:8px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:12px 28px;
                              font-size:14px;font-weight:700;color:#000;
                              text-decoration:none;border-radius:8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:12px;color:#64748b;line-height:1.6;">
                This link expires in <strong style="color:#94a3b8;">${expiresMinutes} minutes</strong>.
                If you didn&apos;t request a password reset, you can safely ignore this email —
                your password will not change.
              </p>

              <!-- Raw link fallback -->
              <p style="margin:16px 0 0;font-size:11px;color:#475569;">
                If the button doesn&apos;t work, copy and paste this URL into your browser:
              </p>
              <p style="margin:4px 0 0;font-size:11px;
                        color:#d97706;word-break:break-all;">
                ${resetUrl}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #334155;">
              <p style="margin:0;font-size:11px;color:#475569;text-align:center;">
                CricBid &mdash; Real-time IPL Auction Simulator
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = [
    `Hi ${recipientName},`,
    '',
    'We received a request to reset your CricBid password.',
    `Reset link (expires in ${expiresMinutes} minutes):`,
    resetUrl,
    '',
    "If you didn't request this, ignore this email.",
    '',
    '— CricBid',
  ].join('\n');

  return { subject, html, text };
};

// Send a password-reset email.
// Throws if the transport is misconfigured or SMTP delivery fails.
const sendPasswordResetEmail = async ({ toEmail, recipientName, resetUrl }) => {
  const expiresMinutes = parseInt(
    process.env.RESET_TOKEN_EXPIRES_MINUTES || '30',
    10
  );

  const { subject, html, text } = buildResetEmail({
    recipientName,
    resetUrl,
    expiresMinutes,
  });

  await getTransport().sendMail({
    from: `"CricBid" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject,
    text,
    html,
  });
};

module.exports = { sendPasswordResetEmail };