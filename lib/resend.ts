import { Resend } from 'resend';

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@foundit.app';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface MatchNotificationData {
  lostItemTitle: string;
  foundItemTitle: string;
  matchScore: number;
  matchUrl: string;
  recipientName: string;
}

interface ClaimUpdateData {
  itemTitle: string;
  claimStatus: 'APPROVED' | 'REJECTED';
  adminNote?: string;
  claimUrl: string;
  recipientName: string;
}

/** Send match notification email */
export async function sendMatchNotificationEmail(
  to: string,
  data: MatchNotificationData
) {
  const pct = Math.round(data.matchScore * 100);

  if (!resend) {
    console.log(`[Email Mock] Match found email to ${to}: ${pct}% match for ${data.lostItemTitle}`);
    return { id: 'mock_match_email' };
  }

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `🎯 ${pct}% Match Found — ${data.lostItemTitle}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <div style="background:#4F46E5;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;">🎯 We Found a Match!</h1>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
          <p style="color:#374151;">Hi ${data.recipientName},</p>
          <p style="color:#374151;">Great news! We found a <strong>${pct}% match</strong> for your item.</p>
          <div style="background:white;padding:16px;border-radius:8px;border-left:4px solid #4F46E5;margin:16px 0;">
            <p style="margin:4px 0;color:#6b7280;font-size:14px;">Lost:</p>
            <p style="margin:4px 0;font-weight:600;color:#111827;">${data.lostItemTitle}</p>
            <p style="margin:12px 0 4px;color:#6b7280;font-size:14px;">Matched with Found:</p>
            <p style="margin:4px 0;font-weight:600;color:#111827;">${data.foundItemTitle}</p>
          </div>
          <a href="${data.matchUrl}" style="display:inline-block;background:#4F46E5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px;">View Match →</a>
        </div>
      </div>
    `,
  });
}

/** Send claim status update email */
export async function sendClaimUpdateEmail(to: string, data: ClaimUpdateData) {
  const isApproved = data.claimStatus === 'APPROVED';
  const emoji = isApproved ? '✅' : '❌';
  const color = isApproved ? '#10b981' : '#ef4444';
  const statusText = isApproved ? 'Approved' : 'Rejected';

  if (!resend) {
    console.log(`[Email Mock] Claim update to ${to}: ${statusText} for ${data.itemTitle}`);
    return { id: 'mock_claim_email' };
  }

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${emoji} Your claim was ${statusText} — ${data.itemTitle}`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <div style="background:${color};padding:24px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;">${emoji} Claim ${statusText}</h1>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
          <p style="color:#374151;">Hi ${data.recipientName},</p>
          <p style="color:#374151;">Your claim for <strong>${data.itemTitle}</strong> has been <strong>${statusText.toLowerCase()}</strong>.</p>
          ${data.adminNote ? `<div style="background:white;padding:16px;border-radius:8px;border-left:4px solid ${color};margin:16px 0;"><p style="margin:0;color:#374151;"><strong>Admin note:</strong> ${data.adminNote}</p></div>` : ''}
          ${isApproved ? '<p style="color:#374151;">The finder will contact you with pickup instructions. Check your profile for their contact details.</p>' : ''}
          <a href="${data.claimUrl}" style="display:inline-block;background:${color};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px;">View Claim →</a>
        </div>
      </div>
    `,
  });
}
