"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Check, Copy, Loader2, PartyPopper } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { CheckboxField, Field, TextInput } from "@/components/ui/field";
import { Card, Pill } from "@/components/ui/surface";
import { getEarlyAccessCopy } from "@/lib/early-access-copy";
import { cn } from "@/lib/format";
import {
  buildReferralUrl,
  extractUtm,
  normalizeReferralCode,
  validateWaitlistSubmission,
  waitlistInterests,
  type WaitlistInterest,
  type WaitlistPersona
} from "@/lib/waitlist";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string; fields: Record<string, string> }
  | { status: "success"; queuePosition: number; referralCode: string; alreadyRegistered: boolean };

export function EarlyAccessForm() {
  const { language } = useI18n();
  const copy = getEarlyAccessCopy(language);
  const formId = useId();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [persona, setPersona] = useState<WaitlistPersona>("both");
  const [interests, setInterests] = useState<WaitlistInterest[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const [referralCode, setReferralCode] = useState<string>();
  const [utm, setUtm] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // Referral + attribution come from the URL the visitor arrived on.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setReferralCode(normalizeReferralCode(params.get("ref")));
    setUtm(extractUtm(params));
  }, []);

  const referralUrl = useMemo(() => {
    if (state.status !== "success" || typeof window === "undefined") return "";
    return buildReferralUrl(window.location.origin, state.referralCode);
  }, [state]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.status === "submitting") return;

    const submission = {
      email,
      displayName: displayName || undefined,
      reservedUsername: username || undefined,
      persona,
      interests,
      locale: language,
      referralCode,
      acceptedTerms,
      marketingOptIn,
      utm
    };

    const localErrors = validateWaitlistSubmission(submission);
    if (localErrors.length > 0) {
      setState({
        status: "error",
        message: "",
        fields: Object.fromEntries(localErrors.map((item) => [item.field, item.code]))
      });
      return;
    }

    setState({ status: "submitting" });

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission)
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 422 || response.status === 409) {
          const fields = Array.isArray(body.fields)
            ? Object.fromEntries(
                (body.fields as { field: string; code: string }[]).map((item) => [
                  item.field,
                  item.code
                ])
              )
            : {};
          setState({ status: "error", message: "", fields });
          return;
        }
        if (response.status === 429) {
          setState({
            status: "error",
            message:
              language === "tr"
                ? "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar dene."
                : "Too many attempts. Please try again shortly.",
            fields: {}
          });
          return;
        }
        setState({
          status: "error",
          message:
            language === "tr"
              ? "Kayıt tamamlanamadı. Lütfen tekrar dene."
              : "We could not complete your signup. Please try again.",
          fields: {}
        });
        return;
      }

      setState({
        status: "success",
        queuePosition: Number(body.queuePosition ?? 0),
        referralCode: String(body.referralCode ?? ""),
        alreadyRegistered: Boolean(body.alreadyRegistered)
      });
    } catch {
      setState({
        status: "error",
        message:
          language === "tr"
            ? "Bağlantı kurulamadı. İnternet bağlantını kontrol et."
            : "We could not reach the server. Check your connection.",
        fields: {}
      });
    }
  }

  async function copyReferral() {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (state.status === "success") {
    return (
      <Card className="border-jam-blue/24 bg-jam-blue/[0.07]" padded={false}>
        <div className="flex flex-col gap-5 p-6 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-jam-blue/16 text-jam-mint">
              <PartyPopper size={20} />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-white">{copy.successTitle}</h3>
              <p className="mt-1.5 text-sm leading-6 text-white/70">
                {state.alreadyRegistered ? copy.successExisting : copy.successBody}
              </p>
            </div>
          </div>

          {state.queuePosition > 0 ? (
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/24 px-4 py-3">
              <span className="text-[13px] font-semibold text-white/56">{copy.positionLabel}</span>
              <span className="text-2xl font-bold tabular-nums text-jam-mint">
                #{state.queuePosition.toLocaleString(language === "tr" ? "tr-TR" : "en-US")}
              </span>
            </div>
          ) : null}

          <div>
            <p className="text-sm font-semibold text-white">{copy.referralTitle}</p>
            <p className="mt-1 text-[13px] leading-6 text-white/60">{copy.referralBody}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                readOnly
                value={referralUrl}
                aria-label={copy.referralTitle}
                onFocus={(event) => event.currentTarget.select()}
                className="input-field flex-1 text-[13px]"
              />
              <Button variant="secondary" onClick={copyReferral} className="shrink-0">
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? copy.copied : copy.copyLink}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const fieldErrors = state.status === "error" ? state.fields : {};
  const submitting = state.status === "submitting";

  return (
    <Card padded={false}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5 p-6 sm:p-7">
        <div>
          <h3 className="text-lg font-semibold text-white">{copy.formTitle}</h3>
          <p className="mt-1 text-[13px] leading-6 text-content-muted">{copy.formSubtitle}</p>
        </div>

        <Field
          label={copy.fieldEmail}
          htmlFor={`${formId}-email`}
          required
          hint={copy.fieldEmailHint}
          error={
            fieldErrors.email
              ? language === "tr"
                ? "Geçerli bir e-posta adresi gir."
                : "Enter a valid email address."
              : null
          }
        >
          <TextInput
            id={`${formId}-email`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            invalid={Boolean(fieldErrors.email)}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy.fieldName} htmlFor={`${formId}-name`} hint={copy.fieldNameHint}>
            <TextInput
              id={`${formId}-name`}
              name="displayName"
              autoComplete="nickname"
              maxLength={80}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </Field>

          <Field
            label={copy.fieldUsername}
            htmlFor={`${formId}-username`}
            hint={copy.fieldUsernameHint}
            error={
              fieldErrors.reservedUsername
                ? fieldErrors.reservedUsername === "taken"
                  ? language === "tr"
                    ? "Bu kullanıcı adı alınmış."
                    : "That username is taken."
                  : language === "tr"
                    ? "Sadece küçük harf, rakam ve tire."
                    : "Lowercase letters, numbers and hyphens only."
                : null
            }
          >
            <TextInput
              id={`${formId}-username`}
              name="reservedUsername"
              maxLength={32}
              value={username}
              invalid={Boolean(fieldErrors.reservedUsername)}
              onChange={(event) =>
                setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              placeholder="jamly-producer"
            />
          </Field>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold text-white/82">{copy.fieldPersona}</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ["creator", copy.personaCreator],
                ["buyer", copy.personaBuyer],
                ["both", copy.personaBoth]
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={cn(
                  "focus-within:ring-2 focus-within:ring-jam-blue/38",
                  "flex min-h-control cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-[13px] font-semibold transition",
                  persona === value
                    ? "border-jam-blue/48 bg-jam-blue/12 text-white"
                    : "border-white/10 bg-black/24 text-white/62 hover:border-white/20"
                )}
              >
                <input
                  type="radio"
                  name="persona"
                  value={value}
                  checked={persona === value}
                  onChange={() => setPersona(value)}
                  className="size-4 accent-jam-blue"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-white/82">
            {copy.fieldInterests}
          </legend>
          <div className="flex flex-wrap gap-2">
            {waitlistInterests.map((interest) => {
              const active = interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setInterests((current) =>
                      current.includes(interest)
                        ? current.filter((item) => item !== interest)
                        : [...current, interest]
                    )
                  }
                  className={cn(
                    "focus-ring min-h-control-sm rounded-pill border px-3.5 py-1.5 text-[13px] font-semibold transition",
                    active
                      ? "border-jam-blue/48 bg-jam-blue/14 text-jam-mint"
                      : "border-white/10 bg-black/24 text-white/60 hover:border-white/20 hover:text-white"
                  )}
                >
                  {copy.interestLabels[interest]}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2 border-t border-white/8 pt-4">
          <CheckboxField
            label={copy.consentTerms}
            checked={acceptedTerms}
            onChange={setAcceptedTerms}
            error={
              fieldErrors.acceptedTerms
                ? language === "tr"
                  ? "Devam etmek için şartları kabul etmelisin."
                  : "You must accept the terms to continue."
                : null
            }
          />
          <CheckboxField
            label={copy.consentMarketing}
            checked={marketingOptIn}
            onChange={setMarketingOptIn}
          />
        </div>

        {state.status === "error" && state.message ? (
          <p role="alert" className="text-[13px] leading-6 text-jam-danger">
            {state.message}
          </p>
        ) : null}

        <Button type="submit" size="lg" fullWidth loading={submitting}>
          {submitting ? copy.submitting : copy.submit}
        </Button>

        {referralCode ? (
          <Pill tone="brand" className="self-start">
            {language === "tr" ? "Davetle geldin" : "Joined via invite"}: {referralCode}
          </Pill>
        ) : null}

        <p className="text-[12px] leading-5 text-content-muted">{copy.legalNote}</p>
      </form>
    </Card>
  );
}

export function EarlyAccessSubmitFallback() {
  return (
    <Card className="flex items-center justify-center py-16">
      <Loader2 className="animate-spin text-white/40" />
    </Card>
  );
}
