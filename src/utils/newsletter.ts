import { Resend } from 'resend';
import type { Core } from '@strapi/strapi';

const SITE_URL = process.env.FRONTEND_SITE_URL || 'https://nationalfortificationalliance.org.ng';
const FROM_EMAIL = process.env.NEWSLETTER_FROM_EMAIL || 'info@nationalfortificationalliance.org.ng';

function wrapEmail(preheader: string, bodyHtml: string): string {
    return `
    <div style="font-family:sans-serif;max-width:620px;margin:0 auto;background:#fff;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden">
      <div style="background:#003366;padding:28px 32px">
        <h1 style="color:#fff;margin:0;font-size:1.3rem;font-weight:800">National Fortification Alliance</h1>
        <p style="color:rgba(255,255,255,.6);margin:4px 0 0;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.1em">${preheader}</p>
      </div>
      <div style="padding:32px;color:#333;line-height:1.75">
        ${bodyHtml}
      </div>
      <div style="background:#f5f5f5;padding:20px 32px;text-align:center;font-size:0.8rem;color:#999;border-top:1px solid #e5e5e5">
        National Fortification Alliance Nigeria<br/>
        <span style="font-size:0.75rem">You're receiving this because you subscribed for updates at ${SITE_URL}.</span>
      </div>
    </div>
  `;
}

async function getActiveSubscriberEmails(strapi: Core.Strapi): Promise<string[]> {
    const subscribers = await strapi.db.query('api::subscriber.subscriber').findMany({
        where: { isActive: true },
        select: ['email'],
    });
    return subscribers.map((s: { email: string }) => s.email).filter(Boolean);
}

async function sendToSubscribers(strapi: Core.Strapi, subject: string, html: string): Promise<number> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        strapi.log.warn('Newsletter send skipped: RESEND_API_KEY is not configured.');
        return 0;
    }

    const emails = await getActiveSubscriberEmails(strapi);
    if (emails.length === 0) return 0;

    const resend = new Resend(apiKey);
    // Resend's batch send caps at 100 recipients per call.
    const BATCH_SIZE = 100;
    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
        const batch = emails.slice(i, i + BATCH_SIZE);
        const { error } = await resend.emails.send({
            from: `National Fortification Alliance <${FROM_EMAIL}>`,
            to: FROM_EMAIL,
            bcc: batch,
            subject,
            html,
        });
        if (error) {
            strapi.log.error(`Newsletter send failed for batch starting at ${i}: ${error.message}`);
        }
    }
    return emails.length;
}

export async function sendNewsItemNotification(
    strapi: Core.Strapi,
    item: { title: string; excerpt?: string; slug: string; category: string }
): Promise<number> {
    const url = `${SITE_URL}/en/news/${item.slug}`;
    const html = wrapEmail('New Update', `
        <p style="margin:0 0 16px;font-size:1.1rem;font-weight:700;color:#111">${item.title}</p>
        ${item.excerpt ? `<p style="margin:0 0 20px">${item.excerpt}</p>` : ''}
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#007DBC;color:#fff;font-weight:700;border-radius:4px;text-decoration:none">Read more</a>
    `);
    return sendToSubscribers(strapi, `${item.title}`, html);
}

export async function sendReportNotification(
    strapi: Core.Strapi,
    item: { title: string; description?: string }
): Promise<number> {
    const url = `${SITE_URL}/en/resources/reports`;
    const html = wrapEmail('New Report Published', `
        <p style="margin:0 0 16px;font-size:1.1rem;font-weight:700;color:#111">${item.title}</p>
        ${item.description ? `<p style="margin:0 0 20px">${item.description}</p>` : ''}
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#007DBC;color:#fff;font-weight:700;border-radius:4px;text-decoration:none">View Reports &amp; Data</a>
    `);
    return sendToSubscribers(strapi, `New Report: ${item.title}`, html);
}

export async function sendBroadcast(
    strapi: Core.Strapi,
    item: { subject: string; body: string }
): Promise<number> {
    const html = wrapEmail('Newsletter', item.body);
    return sendToSubscribers(strapi, item.subject, html);
}
