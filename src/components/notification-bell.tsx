"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Database, Json } from "@/lib/database.types";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export function NotificationBell({ userId }: { userId: string }) {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const unread = items.filter((item) => !item.is_read).length;

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const supabase = client;
    let active = true;
    async function loadNotifications() {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("id,user_id,type,payload,is_read,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);
        if (error) {
          console.warn("Jamly notifications could not be loaded", error.message);
          return;
        }
        if (active) setItems(data ?? []);
      } catch (error) {
        console.warn("Jamly notifications request failed", error);
      }
    }
    void loadNotifications();

    const channel = supabase
      .channel(`notifications:user_id=eq.${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as NotificationRow;
          setItems((current) => [row, ...current.filter((item) => item.id !== row.id)].slice(0, 20));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as NotificationRow;
          setItems((current) => current.map((item) => item.id === row.id ? row : item));
        }
      )
      .subscribe((status, error) => {
        if (error) console.warn("Jamly notifications realtime unavailable", status, error.message);
      });
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    function close(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  async function markAllRead() {
    const client = getSupabaseBrowserClient();
    if (!client || !unread) return;
    const unreadIds = items.filter((item) => !item.is_read).map((item) => item.id);
    setItems((current) => current.map((item) => ({ ...item, is_read: true })));
    await client.from("notifications").update({ is_read: true }).in("id", unreadIds).eq("user_id", userId);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="focus-ring relative flex h-10 w-10 items-center justify-center rounded-md border border-white/[0.09] text-white/62 transition hover:border-jam-blue/40 hover:bg-jam-blue/10 hover:text-white"
        aria-label={unread ? `${unread} okunmamış bildirim` : "Bildirimler"}
        aria-expanded={open}
      >
        <Bell size={18} />
        {unread ? <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-jam-mint px-1 text-[10px] font-bold text-[#071018]">{unread > 9 ? "9+" : unread}</span> : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-[70] w-[min(23rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-white/10 bg-[#10151f] shadow-[0_24px_70px_rgba(0,0,0,0.48)]">
          <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
            <strong className="text-sm text-white">Bildirimler</strong>
            <button type="button" onClick={() => void markAllRead()} disabled={!unread} className="focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-jam-blue disabled:opacity-35">
              <CheckCheck size={15} /> Tümünü oku
            </button>
          </div>
          <div className="max-h-[min(30rem,70vh)] overflow-y-auto p-2">
            {items.length ? items.map((item) => {
              const projectId = payloadString(item.payload, "project_id");
              return (
                <Link
                  key={item.id}
                  href={projectId ? `/collab/${projectId}` : "/collab"}
                  onClick={() => {
                    setOpen(false);
                    if (!item.is_read) {
                      const client = getSupabaseBrowserClient();
                      setItems((current) => current.map((row) => row.id === item.id ? { ...row, is_read: true } : row));
                      void client?.from("notifications").update({ is_read: true }).eq("id", item.id).eq("user_id", userId);
                    }
                  }}
                  className={`focus-ring block rounded-md px-3 py-3 transition hover:bg-white/[0.055] ${item.is_read ? "text-white/48" : "bg-jam-blue/[0.06] text-white/78"}`}
                >
                  <span className="block text-sm font-semibold">{notificationTitle(item.type)}</span>
                  <span className="mt-1 block text-xs text-white/38">{formatRelative(item.created_at)}</span>
                </Link>
              );
            }) : <p className="px-3 py-8 text-center text-sm text-white/42">Henüz bildirim yok.</p>}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function payloadString(payload: Json, key: string) {
  if (!payload || Array.isArray(payload) || typeof payload !== "object") return null;
  const value = payload[key];
  return typeof value === "string" ? value : null;
}

function notificationTitle(type: NotificationRow["type"]) {
  if (type === "collab_invite") return "Yeni bir Collab davetin var";
  if (type === "new_version") return "Projeye yeni versiyon yüklendi";
  return "Projeye yeni yorum bırakıldı";
}

function formatRelative(value: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Az önce";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} dk önce`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} sa önce`;
  return `${Math.floor(seconds / 86400)} gün önce`;
}
