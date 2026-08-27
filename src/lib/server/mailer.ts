import nodemailer from "nodemailer";
import { createServiceClient } from "@/lib/server/rate-limit";
import { createServiceRoleClient } from "@/lib/server/supabase-service";
import { JAMLY_EMAILS } from "@/lib/jamly-contacts";

/**
 * Outbound email.
 *
 * Messages are rendered, written to `email_outbox`, then delivered immediately
 * when SMTP credentials are configured. If delivery fails, the queued outbox row
 * keeps the failure state so it can be retried by an admin job later.
 *
 * In development the rendered message is logged so the verification link is
 * reachable without a mail server.
 */

export type EmailTemplate =
  | "waitlist_verification"
  | "waitlist_welcome"
  | "waitlist_invite"
  | "badge_earned";

type EnqueueInput = {
  template: EmailTemplate;
  to: string;
  locale: "tr" | "en";
  subject: string;
  payload: Record<string, unknown>;
  kind?: "transactional" | "marketing";
};

export function siteOrigin() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim().replace(/^/, "https://") ||
    "http://localhost:3000"
  );
}

export function preRegisterOrigin() {
  return (
    process.env.NEXT_PUBLIC_PRE_REGISTER_SITE_URL?.trim().replace(/\/$/, "") ||
    process.env.PRE_REGISTER_SITE_URL?.trim().replace(/\/$/, "") ||
    siteOrigin()
  );
}

export function emailSender() {
  const address = process.env.EMAIL_FROM_ADDRESS?.trim() || JAMLY_EMAILS.noreply;
  const name = process.env.EMAIL_FROM_NAME?.trim() || "Jamly";
  return `${name} <${address}>`;
}

export function emailReplyTo() {
  return process.env.EMAIL_REPLY_TO_ADDRESS?.trim() || JAMLY_EMAILS.support;
}

export async function enqueueEmail(input: EnqueueInput) {
  const client = createServiceClient();

  if (!client) {
    logRenderedEmail(input);
    return { queued: false as const, reason: "not_configured" as const };
  }

  const { data, error } = await client.rpc("enqueue_email", {
    p_template: input.template,
    p_to_email: input.to,
    p_subject: input.subject,
    p_payload: input.payload,
    p_locale: input.locale,
    p_kind: input.kind ?? "transactional"
  });

  if (error) {
    // A failed notification must never fail the user's action.
    console.error("email_enqueue_failed", { template: input.template, message: error.message });
    logRenderedEmail(input);
    return { queued: false as const, reason: "enqueue_failed" as const };
  }

  const id = data as unknown as string;
  const rendered = renderEmail(input);
  const delivery = await deliverEmail({ ...input, ...rendered });

  if (!delivery.configured) {
    logRenderedEmail(input);
    return { queued: true as const, id, delivery: "not_configured" as const };
  }

  await markEmailDelivery(id, delivery);
  return { queued: true as const, id, delivery: delivery.ok ? "sent" as const : "failed" as const };
}

const verificationCopy = {
  tr: {
    subject: "Jamly erken kaydini dogrula",
    heading: "Erken kaydini dogrula"
  },
  en: {
    subject: "Confirm your Jamly early access",
    heading: "Confirm your early access"
  }
} as const;

export async function queueWaitlistVerificationEmail(input: {
  email: string;
  locale: "tr" | "en";
  token: string;
  queuePosition: number;
  referralCode: string;
}) {
  const copy = verificationCopy[input.locale];
  const verifyUrl = `${preRegisterOrigin()}/verify?token=${encodeURIComponent(input.token)}`;

  return enqueueEmail({
    template: "waitlist_verification",
    to: input.email,
    locale: input.locale,
    subject: copy.subject,
    payload: {
      heading: copy.heading,
      verifyUrl,
      queuePosition: input.queuePosition,
      referralCode: input.referralCode
    }
  });
}

type RenderedEmail = {
  html: string;
  text: string;
};

function renderEmail(input: EnqueueInput): RenderedEmail {
  if (input.template === "waitlist_verification") {
    const verifyUrl = String(input.payload.verifyUrl ?? "");
    const queuePosition = String(input.payload.queuePosition ?? "");
    const referralCode = String(input.payload.referralCode ?? "");
    const tr = input.locale === "tr";
    const title = tr ? "Jamly erken kaydini dogrula" : "Confirm your Jamly early access";
    const lead = tr
      ? "Kurucu uye sirani ayirmak icin e-posta adresini dogrula."
      : "Confirm your email address to keep your founding member spot.";
    const position = tr ? `Sira numaran: #${queuePosition}` : `Your queue position: #${queuePosition}`;
    const referral = tr ? `Davet kodun: ${referralCode}` : `Your invite code: ${referralCode}`;
    const cta = tr ? "E-postami dogrula" : "Confirm my email";
    const footer = tr
      ? "Bu istegi sen baslatmadiysan bu e-postayi yok sayabilirsin."
      : "If you did not request this, you can ignore this email.";

    return {
      text: [title, lead, position, referral, verifyUrl, footer].join("\n\n"),
      html: baseEmailHtml({
        title,
        preheader: lead,
        body: `
          <p>${escapeHtml(lead)}</p>
          <p><strong>${escapeHtml(position)}</strong><br>${escapeHtml(referral)}</p>
          <p><a class="button" href="${escapeAttribute(verifyUrl)}">${escapeHtml(cta)}</a></p>
          <p class="muted">${escapeHtml(footer)}</p>
        `
      })
    };
  }

  const fallback = JSON.stringify(input.payload, null, 2);
  return {
    text: fallback,
    html: baseEmailHtml({
      title: input.subject,
      preheader: input.subject,
      body: `<pre>${escapeHtml(fallback)}</pre>`
    })
  };
}

function baseEmailHtml(input: { title: string; preheader: string; body: string }) {
  return `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(input.title)}</title>
    <style>
      body { margin: 0; background: #080b12; color: #f8fafc; font-family: Arial, sans-serif; }
      .wrap { max-width: 560px; margin: 0 auto; padding: 32px 20px; }
      .panel { border: 1px solid rgba(255,255,255,.12); border-radius: 12px; background: #101624; padding: 28px; }
      h1 { margin: 0 0 18px; font-size: 24px; line-height: 1.25; }
      p { margin: 0 0 18px; color: rgba(248,250,252,.78); font-size: 15px; line-height: 1.65; }
      strong { color: #ffffff; }
      .button { display: inline-block; background: #7dd3fc; color: #071018; padding: 12px 18px; border-radius: 8px; font-weight: 700; text-decoration: none; }
      .muted { color: rgba(248,250,252,.48); font-size: 13px; }
      .preheader { display: none; max-height: 0; overflow: hidden; opacity: 0; }
    </style>
  </head>
  <body>
    <div class="preheader">${escapeHtml(input.preheader)}</div>
    <div class="wrap">
      <div class="panel">
        <h1>${escapeHtml(input.title)}</h1>
        ${input.body}
      </div>
    </div>
  </body>
</html>`;
}

type DeliveryResult =
  | { configured: false }
  | { configured: true; ok: true; providerMessageId: string | null }
  | { configured: true; ok: false; error: string };

async function deliverEmail(input: EnqueueInput & RenderedEmail): Promise<DeliveryResult> {
  const host = process.env.EMAIL_SMTP_HOST?.trim();
  const port = Number(process.env.EMAIL_SMTP_PORT?.trim() || "587");
  const user = process.env.EMAIL_SMTP_USER?.trim();
  const pass = process.env.EMAIL_SMTP_PASSWORD?.trim();
  if (!host || !user || !pass) return { configured: false };

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: parseBoolean(process.env.EMAIL_SMTP_SECURE) ?? port === 465,
      auth: { user, pass }
    });

    const result = await transporter.sendMail({
      from: emailSender(),
      to: input.to,
      replyTo: emailReplyTo(),
      subject: input.subject,
      text: input.text,
      html: input.html
    });

    return {
      configured: true,
      ok: true,
      providerMessageId: typeof result.messageId === "string" ? result.messageId : null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error ?? "unknown_error");
    console.error("email_delivery_failed", { template: input.template, message });
    return { configured: true, ok: false, error: message };
  }
}

async function markEmailDelivery(
  id: string,
  delivery: Exclude<DeliveryResult, { configured: false }>
) {
  const client = createServiceRoleClient();
  if (!client) return;

  const update = delivery.ok
    ? {
        status: "sent",
        attempts: 1,
        last_error: null,
        provider_message_id: delivery.providerMessageId,
        sent_at: new Date().toISOString()
      }
    : {
        status: "failed",
        attempts: 1,
        last_error: delivery.error.slice(0, 500),
        provider_message_id: null,
        sent_at: null
      };

  const { error } = await (client as never as {
    from(table: "email_outbox"): {
      update(values: typeof update): { eq(column: "id", value: string): Promise<{ error: Error | null }> };
    };
  })
    .from("email_outbox")
    .update(update)
    .eq("id", id);
  if (error) {
    console.error("email_outbox_update_failed", { id, message: error.message });
  }
}

function parseBoolean(value: string | undefined) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes"].includes(normalized)) return true;
  if (["0", "false", "no"].includes(normalized)) return false;
  return null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function logRenderedEmail(input: EnqueueInput) {
  if (process.env.NODE_ENV === "production") return;
  console.info(
    `\n[email:${input.template}] -> ${input.to}\n  subject: ${input.subject}\n  payload: ${JSON.stringify(
      input.payload,
      null,
      2
    )}\n`
  );
}
