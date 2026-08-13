"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Flag } from "lucide-react";
import { useI18n } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Field, NativeSelect, TextArea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import {
  reportCategories,
  reportCategoryLabels,
  validateReport,
  type ReportCategory,
  type ReportTargetType
} from "@/lib/reports";

type SubmitState = "idle" | "submitting" | "done" | "error";

/**
 * Report entry point, attachable to any reportable entity. Reporting requires
 * a session so the moderation queue always has someone to follow up with.
 */
export function ReportButton({
  targetType,
  targetId,
  label,
  compact = false
}: {
  targetType: ReportTargetType;
  targetId: string;
  label?: string;
  compact?: boolean;
}) {
  const { language } = useI18n();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<ReportCategory>("copyright");
  const [description, setDescription] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  // Nothing to report against without a backing database.
  if (!isSupabaseConfigured()) return null;

  const tr = language === "tr";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting") return;

    const errors = validateReport({ targetType, targetId, category, description });
    if (errors.length > 0) {
      setState("error");
      setMessage(
        errors.includes("description_too_short")
          ? tr
            ? "Lütfen en az 10 karakterlik bir açıklama yaz."
            : "Please write at least 10 characters."
          : tr
            ? "Rapor bilgileri geçersiz."
            : "The report details are not valid."
      );
      return;
    }

    const client = getSupabaseBrowserClient();
    const { data } = (await client?.auth.getSession()) ?? { data: { session: null } };
    const token = data.session?.access_token;

    if (!token) {
      setState("error");
      setMessage(
        tr ? "Rapor göndermek için giriş yapmalısın." : "Please sign in to submit a report."
      );
      return;
    }

    setState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ targetType, targetId, category, description })
      });

      if (response.status === 429) {
        setState("error");
        setMessage(
          tr
            ? "Çok fazla rapor gönderdin. Lütfen daha sonra tekrar dene."
            : "You have sent too many reports. Please try again later."
        );
        return;
      }

      if (!response.ok) {
        setState("error");
        setMessage(tr ? "Rapor gönderilemedi." : "The report could not be sent.");
        return;
      }

      setState("done");
      setDescription("");
    } catch {
      setState("error");
      setMessage(tr ? "Bağlantı kurulamadı." : "We could not reach the server.");
    }
  }

  function close() {
    setOpen(false);
    // Reset so reopening does not show a stale success or error.
    window.setTimeout(() => {
      setState("idle");
      setMessage("");
    }, 200);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "focus-ring inline-flex items-center gap-1.5 rounded-md p-1.5 text-[12px] font-semibold text-white/40 transition hover:text-white/80"
            : "focus-ring inline-flex min-h-control-sm items-center gap-1.5 rounded-md border border-white/10 px-3 text-[13px] font-semibold text-white/56 transition hover:border-white/20 hover:text-white"
        }
      >
        <Flag size={14} aria-hidden />
        {label ?? (tr ? "Bildir" : "Report")}
      </button>

      <Modal
        open={open}
        onClose={close}
        busy={state === "submitting"}
        title={tr ? "İçeriği bildir" : "Report content"}
        description={
          tr
            ? "Bildirimin moderasyon ekibine iletilir. Durumunu hesabından takip edebilirsin."
            : "Your report goes to the moderation team. You can follow its status from your account."
        }
      >
        {state === "done" ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm leading-6 text-white/72">
              {tr
                ? "Bildirimin alındı. Ekibimiz inceleyip gerekli aksiyonu alacak."
                : "Your report was received. Our team will review it and take action."}
            </p>
            <Button onClick={close}>{tr ? "Kapat" : "Close"}</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Field label={tr ? "Sebep" : "Reason"} htmlFor="report-category" required>
              <NativeSelect
                id="report-category"
                value={category}
                onChange={(event) => setCategory(event.target.value as ReportCategory)}
              >
                {reportCategories.map((value) => (
                  <option key={value} value={value}>
                    {reportCategoryLabels[language][value]}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field
              label={tr ? "Açıklama" : "Description"}
              htmlFor="report-description"
              required
              hint={
                tr
                  ? "Ne olduğunu ve varsa kanıtı (link, zaman damgası) yaz."
                  : "Describe what happened and include evidence (links, timestamps) if you have it."
              }
              error={state === "error" ? message : null}
            >
              <TextArea
                id="report-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={2000}
                rows={5}
                invalid={state === "error"}
                placeholder={
                  tr ? "Bu içerik neden bildiriliyor?" : "Why are you reporting this content?"
                }
              />
            </Field>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={close} disabled={state === "submitting"}>
                {tr ? "Vazgeç" : "Cancel"}
              </Button>
              <Button type="submit" loading={state === "submitting"}>
                {tr ? "Bildir" : "Submit report"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
