"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  FileAudio,
  FolderKanban,
  Loader2,
  MessageSquare,
  Plus,
  UploadCloud,
  UsersRound
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  sendCollabInviteAction,
  updateCollabProjectStatusAction,
  updateRevenueShareAction
} from "@/app/collab/actions";
import { FileUploader } from "@/components/FileUploader";
import { WaveformPlayer } from "@/components/WaveformPlayer";
import type { CollabParticipantView, CollabProjectDetail, CollabRole } from "@/lib/collab-types";

type WorkspaceTab = "versions" | "participants" | "comments" | "upload";

const tabItems: { id: WorkspaceTab; label: string; icon: typeof FileAudio }[] = [
  { id: "versions", label: "Versiyonlar", icon: FileAudio },
  { id: "comments", label: "Yorumlar", icon: MessageSquare },
  { id: "participants", label: "Katılımcılar", icon: UsersRound },
  { id: "upload", label: "Dosya yükle", icon: UploadCloud }
];

const roleLabels: Record<CollabRole, string> = {
  producer: "Prodüktör",
  composer: "Besteci",
  mixing: "Mix mühendisi",
  mastering: "Mastering mühendisi",
  other: "Diğer"
};

export function CollabWorkspace({ project, currentUserId }: { project: CollabProjectDetail; currentUserId: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<WorkspaceTab>(project.versions.length ? "versions" : "upload");
  const [selectedVersionId, setSelectedVersionId] = useState(project.versions[0]?.id ?? null);
  const [busyStatus, setBusyStatus] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const selectedVersion = project.versions.find((version) => version.id === selectedVersionId) ?? project.versions[0] ?? null;
  const accepted = project.participants.filter((item) => item.inviteStatus === "accepted");
  const allocated = accepted.reduce((sum, item) => sum + item.revenueShare, 0);
  const authorHandles = useMemo(
    () => Object.fromEntries([
      [project.ownerId, project.ownerHandle],
      ...project.participants.map((item) => [item.userId, item.handle])
    ]),
    [project.ownerHandle, project.ownerId, project.participants]
  );

  async function completeProject() {
    if (busyStatus) return;
    setBusyStatus(true);
    setFeedback(null);
    const result = await updateCollabProjectStatusAction({ projectId: project.id, status: "completed" });
    setBusyStatus(false);
    setFeedback(result.message);
    if (result.ok) router.refresh();
  }

  return (
    <div>
      <section className="border-b border-white/[0.08] pb-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={project.status} />
              <span className="rounded-md border border-white/10 px-2.5 py-1 text-xs font-semibold text-white/48">
                {project.isOwner ? "Proje sahibi" : "Katılımcı"}
              </span>
              {project.listingId && project.listingTitle ? (
                <Link href={`/listing/${project.listingId}`} className="focus-ring rounded-md px-2.5 py-1 text-xs font-semibold text-jam-blue hover:bg-jam-blue/10">
                  {project.listingTitle}
                </Link>
              ) : null}
            </div>
            <h1 className="text-3xl font-bold tracking-normal text-white sm:text-4xl lg:text-5xl">{project.title}</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/55">{project.description || "Bu proje için henüz açıklama eklenmedi."}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-md border border-white/[0.09] bg-white/[0.025] px-4 py-3">
              {project.ownerAvatarUrl ? (
                <Image src={project.ownerAvatarUrl} alt="" width={36} height={36} className="h-9 w-9 rounded-md object-cover" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-jam-blue/12 text-sm font-bold text-jam-blue">{project.ownerName.slice(0, 1)}</span>
              )}
              <span>
                <span className="block text-xs text-white/38">Proje sahibi</span>
                <span className="block text-sm font-semibold text-white">@{project.ownerHandle}</span>
              </span>
            </div>
            {project.isOwner && project.status !== "completed" ? (
              <button
                type="button"
                onClick={() => void completeProject()}
                disabled={busyStatus}
                className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-md bg-white px-5 text-sm font-bold text-black transition hover:bg-jam-mint disabled:opacity-45"
              >
                {busyStatus ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
                Projeyi tamamla
              </button>
            ) : null}
          </div>
        </div>
        {feedback ? <p className="mt-4 text-sm text-white/58" role="status">{feedback}</p> : null}
      </section>

      <div className="mt-7 overflow-x-auto border-b border-white/[0.08]">
        <div className="flex min-w-max gap-1" role="tablist" aria-label="Proje çalışma alanı">
          {tabItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={`focus-ring relative inline-flex min-h-12 items-center gap-2 rounded-t-md px-4 text-sm font-semibold transition ${
                  tab === item.id ? "bg-white/[0.055] text-white" : "text-white/48 hover:bg-white/[0.03] hover:text-white/76"
                }`}
              >
                <Icon size={17} />
                {item.label}
                {tab === item.id ? <span className="absolute inset-x-3 bottom-0 h-0.5 bg-jam-mint" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <section className="py-7">
        {tab === "versions" ? (
          <VersionsPanel project={project} selectedVersionId={selectedVersion?.id ?? null} onSelect={setSelectedVersionId} />
        ) : null}
        {tab === "comments" ? (
          selectedVersion ? (
            <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
              <VersionRail project={project} selectedVersionId={selectedVersion.id} onSelect={setSelectedVersionId} />
              <WaveformPlayer
                projectId={project.id}
                versionId={selectedVersion.id}
                url={selectedVersion.signedUrl}
                initialComments={project.comments.filter((comment) => comment.versionId === selectedVersion.id)}
                currentUserId={currentUserId}
                authorHandles={authorHandles}
              />
            </div>
          ) : <EmptyPanel title="Yorum yapılacak versiyon yok" copy="Önce proje için bir ses dosyası yükleyin." />
        ) : null}
        {tab === "participants" ? (
          <ParticipantsPanel project={project} accepted={accepted} allocated={allocated} />
        ) : null}
        {tab === "upload" ? (
          project.status === "completed" ? <EmptyPanel title="Proje tamamlandı" copy="Tamamlanan projeye yeni versiyon yüklenemez." /> : <FileUploader projectId={project.id} userId={currentUserId} />
        ) : null}
      </section>
    </div>
  );
}

function VersionsPanel({ project, selectedVersionId, onSelect }: { project: CollabProjectDetail; selectedVersionId: string | null; onSelect: (id: string) => void }) {
  if (!project.versions.length) return <EmptyPanel title="Henüz versiyon yok" copy="Dosya yükle sekmesinden ilk çalışma dosyasını paylaşın." />;
  return (
    <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
      <VersionRail project={project} selectedVersionId={selectedVersionId} onSelect={onSelect} />
      <div className="rounded-lg border border-white/[0.09] bg-[#0d1118] p-6">
        <FolderKanban size={24} className="text-jam-blue" />
        <h2 className="mt-5 text-2xl font-bold">Versiyon geçmişi</h2>
        <p className="mt-2 text-sm leading-6 text-white/50">Bir versiyonu seçip Yorumlar sekmesinde ses dalgası üzerinde geri bildirim bırakabilirsiniz.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Metric label="Versiyon" value={String(project.versions.length)} />
          <Metric label="Yorum" value={String(project.comments.length)} />
          <Metric label="Katılımcı" value={String(project.participants.filter((item) => item.inviteStatus === "accepted").length + 1)} />
        </div>
      </div>
    </div>
  );
}

function VersionRail({ project, selectedVersionId, onSelect }: { project: CollabProjectDetail; selectedVersionId: string | null; onSelect: (id: string) => void }) {
  return (
    <div className="space-y-2">
      {project.versions.map((version, index) => (
        <button
          key={version.id}
          type="button"
          onClick={() => onSelect(version.id)}
          className={`focus-ring w-full rounded-md border p-4 text-left transition ${selectedVersionId === version.id ? "border-jam-blue/50 bg-jam-blue/[0.09]" : "border-white/[0.08] bg-white/[0.025] hover:border-white/16"}`}
        >
          <span className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-white">Versiyon {project.versions.length - index}</span>
            <span className="text-xs text-white/36">{formatDate(version.createdAt)}</span>
          </span>
          <span className="mt-2 block truncate text-xs text-white/48">{version.fileName}</span>
          <span className="mt-1 block text-xs text-jam-blue">@{version.uploaderHandle}</span>
        </button>
      ))}
    </div>
  );
}

function ParticipantsPanel({ project, accepted, allocated }: { project: CollabProjectDetail; accepted: CollabParticipantView[]; allocated: number }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 pb-2">
          <div>
            <h2 className="text-2xl font-bold">Ekip ve gelir dağılımı</h2>
            <p className="mt-1 text-sm text-white/48">Kabul edilmiş katılımcı payları satış teslim edildiğinde kayıt altına alınır.</p>
          </div>
          <span className={`rounded-md px-3 py-1.5 text-sm font-bold ${allocated > 100 ? "bg-red-500/15 text-red-300" : "bg-jam-blue/12 text-jam-blue"}`}>%{allocated} ayrıldı</span>
        </div>
        <ParticipantRow
          participant={{ id: "owner", userId: project.ownerId, handle: project.ownerHandle, fullName: project.ownerName, avatarUrl: project.ownerAvatarUrl, role: "producer", revenueShare: Math.max(0, 100 - allocated), inviteStatus: "accepted" }}
          owner
          editable={false}
          projectId={project.id}
          allParticipants={accepted}
        />
        {project.participants.map((participant) => (
          <ParticipantRow key={participant.id} participant={participant} editable={project.isOwner && project.status !== "completed"} projectId={project.id} allParticipants={project.participants.filter((item) => item.inviteStatus !== "declined")} />
        ))}
      </div>
      {project.isOwner && project.status !== "completed" ? <InvitePanel projectId={project.id} allocated={project.participants.filter((item) => item.inviteStatus !== "declined").reduce((sum, item) => sum + item.revenueShare, 0)} /> : (
        <div className="rounded-lg border border-white/[0.09] bg-[#0d1118] p-5">
          <Clock3 size={21} className="text-jam-blue" />
          <h3 className="mt-4 font-bold">Paylar sabitlendi</h3>
          <p className="mt-2 text-sm leading-6 text-white/48">Tamamlanan projelerde gelir dağılımı değiştirilemez.</p>
        </div>
      )}
    </div>
  );
}

function ParticipantRow({ participant, owner = false, editable, projectId, allParticipants }: { participant: CollabParticipantView; owner?: boolean; editable: boolean; projectId: string; allParticipants: CollabParticipantView[] }) {
  const router = useRouter();
  const [share, setShare] = useState(participant.revenueShare);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    const otherTotal = allParticipants.filter((item) => item.id !== participant.id).reduce((sum, item) => sum + item.revenueShare, 0);
    if (otherTotal + share > 100) {
      setMessage("Toplam gelir payı %100'ü geçemez.");
      return;
    }
    setBusy(true);
    const result = await updateRevenueShareAction({ participantId: participant.id, projectId, revenueShare: share });
    setBusy(false);
    setMessage(result.message);
    if (result.ok) router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-white/[0.08] bg-white/[0.025] p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {participant.avatarUrl ? <Image src={participant.avatarUrl} alt="" width={44} height={44} className="h-11 w-11 rounded-md object-cover" /> : <span className="flex h-11 w-11 items-center justify-center rounded-md bg-jam-blue/12 font-bold text-jam-blue">{participant.fullName.slice(0, 1)}</span>}
        <span className="min-w-0">
          <span className="block truncate font-semibold text-white">{participant.fullName}</span>
          <span className="block text-xs text-white/42">@{participant.handle} · {owner ? "Proje sahibi" : roleLabels[participant.role]} · {inviteLabel(participant.inviteStatus)}</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <label className="sr-only" htmlFor={`share-${participant.id}`}>Gelir payı</label>
        <div className="relative w-24">
          <input id={`share-${participant.id}`} type="number" min={0} max={100} step={0.01} value={share} onChange={(event) => setShare(Number(event.target.value))} disabled={!editable} className="focus-ring h-11 w-full rounded-md border border-white/10 bg-black/25 px-3 pr-7 text-sm font-bold text-white disabled:opacity-65" />
          <span className="pointer-events-none absolute right-3 top-3 text-sm text-white/38">%</span>
        </div>
        {editable ? <button type="button" onClick={() => void save()} disabled={busy || share === participant.revenueShare} className="focus-ring min-h-11 rounded-md border border-white/10 px-3 text-xs font-bold text-white/68 hover:border-jam-blue/35 hover:text-white disabled:opacity-35">{busy ? "..." : "Kaydet"}</button> : null}
      </div>
      {message ? <p className="text-xs text-white/48 sm:w-full">{message}</p> : null}
    </div>
  );
}

function InvitePanel({ projectId, allocated }: { projectId: string; allocated: number }) {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [role, setRole] = useState<CollabRole>("producer");
  const [share, setShare] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function invite() {
    if (!handle.trim()) return;
    if (allocated + share > 100) {
      setMessage(`Kalan pay en fazla %${Math.max(0, 100 - allocated)} olabilir.`);
      return;
    }
    setBusy(true);
    const result = await sendCollabInviteAction({ projectId, handle, role, revenueShare: share });
    setBusy(false);
    setMessage(result.message);
    if (result.ok) {
      setHandle("");
      setShare(0);
      router.refresh();
    }
  }

  return (
    <div className="h-fit rounded-lg border border-white/[0.09] bg-[#0d1118] p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-jam-blue/12 text-jam-blue"><Plus size={19} /></div>
      <h3 className="mt-4 text-lg font-bold">Katılımcı davet et</h3>
      <p className="mt-2 text-sm leading-6 text-white/48">Kullanıcı adıyla ekip arkadaşınızı ekleyin. Kalan dağıtılabilir pay: %{Math.max(0, 100 - allocated)}.</p>
      <div className="mt-5 space-y-3">
        <input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="@kullaniciadi" className="input-field" />
        <select value={role} onChange={(event) => setRole(event.target.value as CollabRole)} className="focus-ring h-12 w-full rounded-md border border-white/10 bg-[#121722] px-3 text-sm text-white">
          {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <div className="relative">
          <input type="number" min={0} max={Math.max(0, 100 - allocated)} step={0.01} value={share} onChange={(event) => setShare(Number(event.target.value))} className="input-field pr-9" />
          <span className="absolute right-4 top-3.5 text-sm text-white/38">%</span>
        </div>
        <button type="button" onClick={() => void invite()} disabled={!handle.trim() || busy} className="focus-ring inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-jam-mint px-4 text-sm font-bold text-[#071018] hover:bg-white disabled:opacity-40">{busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}Davet gönder</button>
        {message ? <p className="text-sm text-white/52" role="status">{message}</p> : null}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-white/[0.08] bg-white/[0.025] p-4"><span className="text-xs uppercase tracking-[0.14em] text-white/38">{label}</span><strong className="mt-2 block text-2xl text-white">{value}</strong></div>;
}

function StatusBadge({ status }: { status: CollabProjectDetail["status"] }) {
  const label = status === "completed" ? "Tamamlandı" : status === "active" ? "Aktif" : "Taslak";
  return <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${status === "completed" ? "bg-emerald-400/12 text-emerald-300" : status === "active" ? "bg-jam-blue/12 text-jam-blue" : "bg-white/[0.07] text-white/58"}`}>{label}</span>;
}

function EmptyPanel({ title, copy }: { title: string; copy: string }) {
  return <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center"><FolderKanban size={28} className="mx-auto text-jam-blue" /><h2 className="mt-4 text-xl font-bold">{title}</h2><p className="mt-2 text-sm text-white/48">{copy}</p></div>;
}

function inviteLabel(status: CollabParticipantView["inviteStatus"]) {
  if (status === "accepted") return "Kabul edildi";
  if (status === "declined") return "Reddedildi";
  return "Davet bekliyor";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short" }).format(new Date(value));
}
