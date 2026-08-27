"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/language-provider";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  isSupabaseRecoverableError
} from "@/lib/supabase";

type Status = { kind: "idle" | "success" | "error"; message: string };
type PasswordFormMode = "recovery" | "settings";

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle", message: "" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client) {
      setStatus({ kind: "error", message: t("liveAuthMissing") });
      return;
    }

    setLoading(true);
    setStatus({ kind: "idle", message: "" });
    const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    setLoading(false);
    if (error) {
      setStatus({
        kind: "error",
        message: isSupabaseRecoverableError(error)
          ? t("supabaseInvalidConfig")
          : `${t("authError")}: ${error.message}`
      });
      return;
    }

    setStatus({ kind: "success", message: t("resetLinkSentCopy") });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {!isSupabaseConfigured() ? (
        <Notice kind="error" message={t("liveAuthMissing")} />
      ) : null}
      <label className="block space-y-2">
        <span className="text-sm text-white/64">{t("email")}</span>
        <input
          value={email}
          type="email"
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          className="focus-ring h-12 w-full rounded-lg border border-white/10 bg-black/35 px-4 text-white"
        />
      </label>
      <button
        type="submit"
        disabled={loading || !isSupabaseConfigured()}
        className="focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-jam-blue px-5 text-sm font-bold text-[#071018] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <LockKeyhole size={18} />}
        {t("sendResetLink")}
      </button>
      {status.message ? <Notice kind={status.kind} message={status.message} /> : null}
      <p className="text-center text-sm text-white/52">
        <Link href="/auth/sign-in" className="focus-ring rounded-sm font-semibold text-white transition hover:text-jam-blue">
          {t("backToSignIn")}
        </Link>
      </p>
    </form>
  );
}

export function PasswordUpdateForm({ mode }: { mode: PasswordFormMode }) {
  const { t } = useI18n();
  const router = useRouter();
  const [availability, setAvailability] = useState<"checking" | "ready" | "missing" | "unavailable">(
    "checking"
  );
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle", message: "" });

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setAvailability("unavailable");
      return;
    }

    let active = true;
    const applySession = (hasSession: boolean) => {
      if (active) setAvailability(hasSession ? "ready" : "missing");
    };

    void establishPasswordSession(client, mode)
      .then(applySession)
      .catch((error) => {
        console.error("password_recovery_session_failed", error);
        applySession(false);
      });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      applySession(Boolean(session));
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      setStatus({ kind: "error", message: t("passwordMinLength") });
      return;
    }
    if (password !== confirmation) {
      setStatus({ kind: "error", message: t("passwordMismatch") });
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setStatus({ kind: "error", message: t("liveAuthMissing") });
      return;
    }

    setLoading(true);
    setStatus({ kind: "idle", message: "" });
    const { error } = await client.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setStatus({
        kind: "error",
        message: isSupabaseRecoverableError(error)
          ? t("supabaseInvalidConfig")
          : `${t("passwordUpdateError")} ${error.message}`
      });
      return;
    }

    setPassword("");
    setConfirmation("");

    if (mode === "recovery") {
      await client.auth.signOut();
    }

    setStatus({ kind: "success", message: t("passwordUpdated") });
    if (mode === "recovery") {
      window.setTimeout(() => router.replace("/"), 1400);
    }
  }

  if (availability === "checking") {
    return (
      <div className="flex min-h-40 items-center justify-center text-sm text-white/54">
        <Loader2 size={18} className="mr-2 animate-spin text-jam-blue" />
        {t("checkingAccount")}
      </div>
    );
  }

  if (availability === "unavailable") {
    return <Notice kind="error" message={t("liveAuthMissing")} />;
  }

  if (availability === "missing") {
    const recovery = mode === "recovery";
    return (
      <div className="space-y-5">
        <Notice
          kind="error"
          message={
            recovery
              ? `${t("resetLinkInvalid")} ${t("resetLinkInvalidCopy")}`
              : t("sessionRequiredForPassword")
          }
        />
        <Link
          href={recovery ? "/auth/forgot-password" : "/auth/sign-in"}
          className="focus-ring inline-flex min-h-11 items-center rounded-md border border-white/12 px-4 text-sm font-semibold text-white/76 transition hover:border-jam-blue/40 hover:bg-jam-blue/10 hover:text-white"
        >
          {recovery ? t("forgotPassword") : t("navSignIn")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block space-y-2">
        <span className="text-sm text-white/64">{t("newPassword")}</span>
        <input
          value={password}
          type="password"
          autoComplete="new-password"
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          required
          className="focus-ring h-12 w-full rounded-lg border border-white/10 bg-black/35 px-4 text-white"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-white/64">{t("confirmPassword")}</span>
        <input
          value={confirmation}
          type="password"
          autoComplete="new-password"
          minLength={8}
          onChange={(event) => setConfirmation(event.target.value)}
          required
          className="focus-ring h-12 w-full rounded-lg border border-white/10 bg-black/35 px-4 text-white"
        />
      </label>
      <p className="text-xs leading-5 text-white/42">{t("passwordMinLength")}</p>
      <button
        type="submit"
        disabled={loading}
        className="focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-jam-blue px-5 text-sm font-bold text-[#071018] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <LockKeyhole size={18} />}
        {t("changePassword")}
      </button>
      {status.message ? <Notice kind={status.kind} message={status.message} /> : null}
    </form>
  );
}

async function establishPasswordSession(client: JamlyPasswordClient, mode: PasswordFormMode) {
  return withTimeout(establishPasswordSessionUnsafe(client, mode), 8000);
}

async function establishPasswordSessionUnsafe(client: JamlyPasswordClient, mode: PasswordFormMode) {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");

  if (accessToken && refreshToken) {
    const { error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    if (!error) {
      window.history.replaceState(null, "", window.location.pathname);
      return true;
    }
  }

  if (mode === "recovery") {
    return false;
  }

  const { data } = await client.auth.getSession();
  return Boolean(data.session);
}

type JamlyPasswordClient = NonNullable<ReturnType<typeof getSupabaseBrowserClient>>;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      window.setTimeout(() => resolve(false as T), timeoutMs);
    })
  ]);
}

function Notice({ kind, message }: { kind: Status["kind"]; message: string }) {
  if (kind === "idle") return null;
  const success = kind === "success";
  return (
    <p
      role={success ? "status" : "alert"}
      className={`flex items-start gap-2 rounded-lg border p-3 text-sm leading-6 ${
        success
          ? "border-jam-blue/25 bg-jam-blue/10 text-jam-blue"
          : "border-jam-coral/25 bg-jam-coral/10 text-jam-coral"
      }`}
    >
      {success ? <CheckCircle2 size={17} className="mt-0.5 shrink-0" /> : <AlertCircle size={17} className="mt-0.5 shrink-0" />}
      {message}
    </p>
  );
}
