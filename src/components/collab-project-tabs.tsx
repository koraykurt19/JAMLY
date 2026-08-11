"use client";

import Link from "next/link";
import { CalendarClock, Check, ChevronRight, Clock3, FolderKanban, X } from "lucide-react";
import { startTransition, useMemo, useState } from "react";
import { updateInviteStatusAction } from "@/app/collab/actions";
import type { CollabInvitation, CollabProjectSummary } from "@/lib/collab-types";

type TabKey = "active" | "invites" | "completed";

export function CollabProjectTabs({
  projects,
  invitations
}: {
  projects: CollabProjectSummary[];
  invitations: CollabInvitation[];
}) {
  const [tab, setTab] = useState<TabKey>("active");
  const [feedback, setFeedback] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const active = useMemo(() => projects.filter((project) => project.status !== "completed"), [projects]);
  const completed = useMemo(() => projects.filter((project) => project.status === "completed"), [projects]);

  function respond(invitation: CollabInvitation, status: "accepted" | "declined") {
    setPendingId(invitation.participantId);
    setFeedback("");
    startTransition(async () => {
      const result = await updateInviteStatusAction({
        participantId: invitation.participantId,
        projectId: invitation.projectId,
        status
      });
      setPendingId(null);
      setFeedback(result.message);
      if (result.ok) window.location.reload();
    });
  }

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "active", label: "Aktif", count: active.length },
    { key: "invites", label: "Bekleyen davetler", count: invitations.length },
    { key: "completed", label: "Tamamlanan", count: completed.length }
  ];

  return (
    <div className="pt-8">
      <div className="flex gap-1 overflow-x-auto border-b border-white/10" role="tablist" aria-label="Proje filtreleri">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key)}
            className={`focus-ring min-h-11 shrink-0 border-b-2 px-4 text-sm font-semibold transition ${
              tab === item.key ? "border-jam-blue text-white" : "border-transparent text-white/48 hover:text-white"
            }`}
          >
            {item.label} <span className="ml-1 text-xs text-white/36">{item.count}</span>
          </button>
        ))}
      </div>

      {feedback ? <p className="mt-5 border border-jam-blue/20 bg-jam-blue/8 px-4 py-3 text-sm text-jam-blue">{feedback}</p> : null}

      {tab === "invites" ? (
        invitations.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {invitations.map((invitation) => (
              <article key={invitation.participantId} className="border border-white/10 bg-[#10151f] p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-jam-blue">@{invitation.ownerHandle ?? "jamly"}</span>
                  <span className="text-xs text-white/38">%{invitation.revenueShare}</span>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-white">{invitation.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/50">{invitation.description ?? "Proje açıklaması eklenmedi."}</p>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    disabled={pendingId === invitation.participantId}
                    onClick={() => respond(invitation, "accepted")}
                    className="focus-ring inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md bg-jam-mint px-4 text-sm font-bold text-black disabled:opacity-50"
                  >
                    <Check size={16} /> Kabul et
                  </button>
                  <button
                    type="button"
                    disabled={pendingId === invitation.participantId}
                    onClick={() => respond(invitation, "declined")}
                    className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/12 px-4 text-sm font-semibold text-white/65 disabled:opacity-50"
                  >
                    <X size={16} /> Reddet
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : <EmptyState icon={CalendarClock} title="Bekleyen davet yok" body="Yeni bir proje daveti geldiğinde burada görünecek." />
      ) : (
        <ProjectGrid projects={tab === "active" ? active : completed} completed={tab === "completed"} />
      )}
    </div>
  );
}

function ProjectGrid({ projects, completed }: { projects: CollabProjectSummary[]; completed: boolean }) {
  if (!projects.length) {
    return <EmptyState icon={completed ? Check : FolderKanban} title={completed ? "Tamamlanan proje yok" : "Aktif proje yok"} body={completed ? "Bitirdiğiniz projeler burada arşivlenir." : "Yeni bir ortak çalışma başlatarak ilk projeyi oluşturun."} />;
  }
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <Link key={project.id} href={`/collab/${project.id}`} className="focus-ring group border border-white/10 bg-[#10151f] p-5 transition hover:-translate-y-0.5 hover:border-jam-blue/40">
          <div className="flex items-center justify-between gap-3">
            <span className={`text-xs font-bold uppercase tracking-[0.16em] ${project.status === "completed" ? "text-emerald-300" : "text-jam-blue"}`}>{project.status === "draft" ? "Taslak" : project.status === "completed" ? "Tamamlandı" : "Aktif"}</span>
            <span className="text-xs text-white/35">{project.isOwner ? "Sahibi sizsiniz" : "Katılımcı"}</span>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-white transition group-hover:text-jam-blue">{project.title}</h2>
          <p className="mt-2 min-h-12 line-clamp-2 text-sm leading-6 text-white/48">{project.description ?? "Proje açıklaması eklenmedi."}</p>
          <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4 text-xs text-white/38">
            <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> {formatDate(project.updatedAt)}</span>
            <ChevronRight size={17} className="transition group-hover:translate-x-0.5 group-hover:text-jam-blue" />
          </div>
        </Link>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, body }: { icon: typeof FolderKanban; title: string; body: string }) {
  return (
    <div className="mt-6 border border-dashed border-white/12 px-6 py-14 text-center">
      <Icon className="mx-auto text-white/24" />
      <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-white/45">{body}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
