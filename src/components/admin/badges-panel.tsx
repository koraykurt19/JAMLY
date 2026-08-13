"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/language-provider";
import { AdminCell, AdminRow, AdminTable, StatusPill } from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";
import { Field, NativeSelect, TextArea, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Card, CardHeader, Pill } from "@/components/ui/surface";
import { adminFetch, AdminRequestError } from "@/lib/admin-client";
import { shortDate } from "@/lib/format";

type Definition = {
  key: string;
  name_tr: string;
  name_en: string;
  category: string;
  rarity: string;
  award_source: string;
  revocable: boolean;
  permanent: boolean;
  is_active: boolean;
};

type Award = {
  id: string;
  profile_id: string;
  badge_key: string;
  source: string;
  award_reason: string | null;
  awarded_at: string;
  revoked_at: string | null;
};

type Response = { definitions: Definition[]; recentAwards: Award[] };

export function BadgesPanel() {
  const { language } = useI18n();
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grantOpen, setGrantOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminFetch<Response>("/api/admin/badges"));
    } catch (requestError) {
      setError(
        requestError instanceof AdminRequestError
          ? requestError.message
          : language === "tr"
            ? "Rozetler yüklenemedi."
            : "Badges could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    void load();
  }, [load]);

  const tr = language === "tr";
  const manualBadges = data?.definitions.filter((item) => item.award_source === "manual") ?? [];

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader
          title={tr ? "Rozet tanımları" : "Badge definitions"}
          description={
            tr
              ? "Otomatik rozetler kurala bağlıdır ve elle verilmez. Doğrulama rozetleri yalnızca gerçek doğrulama sonrası verilir."
              : "Automatic badges are rule-driven and cannot be granted by hand. Verification badges are only granted after real verification."
          }
          action={
            <Button onClick={() => setGrantOpen(true)} disabled={manualBadges.length === 0}>
              {tr ? "Rozet ver" : "Grant badge"}
            </Button>
          }
        />
      </Card>

      <AdminTable
        columns={[
          tr ? "Rozet" : "Badge",
          tr ? "Kategori" : "Category",
          tr ? "Nadirlik" : "Rarity",
          tr ? "Veriliş" : "Source",
          tr ? "Geri alınabilir" : "Revocable",
          tr ? "Durum" : "State"
        ]}
        loading={loading}
        error={error}
        empty={!loading && (data?.definitions.length ?? 0) === 0}
      >
        {data?.definitions.map((definition) => (
          <AdminRow key={definition.key}>
            <AdminCell>
              <span className="font-semibold text-white">
                {tr ? definition.name_tr : definition.name_en}
              </span>
              <span className="ml-2 text-white/38">{definition.key}</span>
            </AdminCell>
            <AdminCell nowrap>{definition.category}</AdminCell>
            <AdminCell nowrap>{definition.rarity}</AdminCell>
            <AdminCell nowrap>
              <Pill tone={definition.award_source === "automatic" ? "brand" : "neutral"}>
                {definition.award_source === "automatic"
                  ? tr
                    ? "Otomatik"
                    : "Automatic"
                  : tr
                    ? "Manuel"
                    : "Manual"}
              </Pill>
            </AdminCell>
            <AdminCell nowrap>
              {definition.revocable ? (tr ? "Evet" : "Yes") : tr ? "Hayır" : "No"}
            </AdminCell>
            <AdminCell nowrap>
              <StatusPill value={definition.is_active ? "active" : "suppressed"} />
            </AdminCell>
          </AdminRow>
        ))}
      </AdminTable>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-white">
          {tr ? "Son verilen rozetler" : "Recent awards"}
        </h2>
        <AdminTable
          columns={[
            tr ? "Profil" : "Profile",
            tr ? "Rozet" : "Badge",
            tr ? "Kaynak" : "Source",
            tr ? "Gerekçe" : "Reason",
            tr ? "Tarih" : "Date"
          ]}
          loading={loading}
          empty={!loading && (data?.recentAwards.length ?? 0) === 0}
          minWidth={680}
        >
          {data?.recentAwards.map((award) => (
            <AdminRow key={award.id}>
              <AdminCell nowrap className="text-white/56">
                {award.profile_id.slice(0, 8)}…
              </AdminCell>
              <AdminCell nowrap className="font-semibold text-white/86">
                {award.badge_key}
              </AdminCell>
              <AdminCell nowrap>{award.source}</AdminCell>
              <AdminCell className="max-w-[20rem]">
                <span className="line-clamp-1 block">{award.award_reason ?? "—"}</span>
              </AdminCell>
              <AdminCell nowrap>
                {award.revoked_at ? (
                  <StatusPill value="banned" label={tr ? "Geri alındı" : "Revoked"} />
                ) : (
                  shortDate(award.awarded_at, language)
                )}
              </AdminCell>
            </AdminRow>
          ))}
        </AdminTable>
      </div>

      <GrantBadgeModal
        open={grantOpen}
        badges={manualBadges}
        onClose={() => setGrantOpen(false)}
        onGranted={() => {
          setGrantOpen(false);
          void load();
        }}
      />
    </div>
  );
}

function GrantBadgeModal({
  open,
  badges,
  onClose,
  onGranted
}: {
  open: boolean;
  badges: Definition[];
  onClose: () => void;
  onGranted: () => void;
}) {
  const { language } = useI18n();
  const [profileId, setProfileId] = useState("");
  const [badgeKey, setBadgeKey] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setProfileId("");
      setBadgeKey(badges[0]?.key ?? "");
      setReason("");
      setError(null);
    }
  }, [open, badges]);

  const tr = language === "tr";

  async function submit() {
    if (busy) return;
    if (!/^[0-9a-f-]{36}$/i.test(profileId)) {
      setError(tr ? "Geçerli bir profil ID gerekli." : "A valid profile ID is required.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await adminFetch("/api/admin/badges", {
        method: "POST",
        body: JSON.stringify({ action: "grant", profileId, badgeKey, reason: reason.trim() || null })
      });
      onGranted();
    } catch (requestError) {
      setError(
        requestError instanceof AdminRequestError
          ? requestError.message
          : tr
            ? "Rozet verilemedi."
            : "The badge could not be granted."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      title={tr ? "Rozet ver" : "Grant badge"}
      description={
        tr
          ? "Bu işlem aktör ve gerekçeyle birlikte denetim kaydına yazılır."
          : "This action is written to the audit log with the actor and reason."
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            {tr ? "Vazgeç" : "Cancel"}
          </Button>
          <Button onClick={submit} loading={busy}>
            {tr ? "Ver" : "Grant"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field
          label={tr ? "Profil ID" : "Profile ID"}
          htmlFor="grant-profile"
          required
          error={error}
        >
          <TextInput
            id="grant-profile"
            value={profileId}
            invalid={Boolean(error)}
            onChange={(event) => setProfileId(event.target.value.trim())}
            placeholder="00000000-0000-0000-0000-000000000000"
          />
        </Field>

        <Field label={tr ? "Rozet" : "Badge"} htmlFor="grant-badge" required>
          <NativeSelect
            id="grant-badge"
            value={badgeKey}
            onChange={(event) => setBadgeKey(event.target.value)}
          >
            {badges.map((badge) => (
              <option key={badge.key} value={badge.key}>
                {tr ? badge.name_tr : badge.name_en}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field label={tr ? "Gerekçe" : "Reason"} htmlFor="grant-reason">
          <TextArea
            id="grant-reason"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
