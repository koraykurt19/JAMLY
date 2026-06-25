"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { getCurrentProfile } from "@/lib/supabase-data";
import { roleLabel } from "@/lib/labels";
import type { Role } from "@/lib/types";
import { useI18n } from "@/components/language-provider";

type AuthFormProps = {
  mode: "sign-in" | "sign-up";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { language, t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [handle, setHandle] = useState("");
  const [role, setRole] = useState<Role>("buyer");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const configured = isSupabaseConfigured();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setLoading(false);
      setMessage(t("liveAuthMissing"));
      return;
    }

    const result =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                handle,
                role
              }
            }
          });

    if (result.error) {
      setLoading(false);
      setMessage(`${t("authError")}: ${result.error.message}`);
      return;
    }

    if (!result.data.session) {
      setLoading(false);
      setMessage(t("accountCreated"));
      return;
    }

    try {
      const { profile } = await getCurrentProfile(supabase);
      const destinationRole = profile?.role ?? (mode === "sign-up" ? role : null);

      if (!destinationRole) {
        throw new Error(t("profileMissing"));
      }

      router.replace(`/dashboard/${destinationRole}`);
      router.refresh();
    } catch (error) {
      setLoading(false);
      setMessage(
        `${t("authError")}: ${error instanceof Error ? error.message : t("unknownError")}`
      );
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {!configured ? (
        <div className="rounded-lg border border-jam-gold/30 bg-jam-gold/10 p-4 text-sm leading-6 text-jam-gold">
          {t("supabaseMissing")}
        </div>
      ) : null}

      {mode === "sign-up" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm text-white/64">{t("fullName")}</span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              className="focus-ring h-12 w-full rounded-lg border border-white/10 bg-black/35 px-4 text-white"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-white/64">{t("handle")}</span>
            <input
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              required
              className="focus-ring h-12 w-full rounded-lg border border-white/10 bg-black/35 px-4 text-white"
            />
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-sm text-white/64">{t("role")}</span>
            <div className="grid grid-cols-2 rounded-lg border border-white/10 bg-black/35 p-1">
              {(["buyer", "creator"] as Role[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRole(item)}
                  className={`focus-ring rounded-md px-4 py-3 text-sm font-semibold transition ${
                    role === item
                      ? "bg-white text-black"
                      : "text-white/58 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  {roleLabel(item, language)}
                </button>
              ))}
            </div>
          </label>
        </div>
      ) : null}

      <label className="space-y-2">
        <span className="text-sm text-white/64">{t("email")}</span>
        <input
          value={email}
          type="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          className="focus-ring h-12 w-full rounded-lg border border-white/10 bg-black/35 px-4 text-white"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm text-white/64">{t("password")}</span>
        <input
          value={password}
          type="password"
          minLength={6}
          onChange={(event) => setPassword(event.target.value)}
          required
          className="focus-ring h-12 w-full rounded-lg border border-white/10 bg-black/35 px-4 text-white"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="focus-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-jam-mint px-5 text-sm font-bold text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : null}
        {mode === "sign-in" ? t("navSignIn") : t("createAccount")}
      </button>

      {message ? <p className="text-sm text-jam-mint">{message}</p> : null}

      <p className="text-center text-sm text-white/52">
        {mode === "sign-in" ? t("newToJamly") : t("alreadyAccount")}{" "}
        <Link
          href={mode === "sign-in" ? "/auth/sign-up" : "/auth/sign-in"}
          className="font-semibold text-white transition hover:text-jam-mint"
        >
          {mode === "sign-in" ? t("createAccount") : t("navSignIn")}
        </Link>
      </p>
    </form>
  );
}
