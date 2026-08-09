"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "jamly-saved-searches";
const CHANGE_EVENT = "jamly-saved-searches-change";

export type SavedSearch = {
  id: string;
  label: string;
  query: string;
  category: string;
  genre: string;
  mood: string;
  useCase: string;
  maxPrice: string;
  createdAt: string;
};

export function useSavedSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    function sync() {
      setSearches(readSavedSearches());
    }

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CHANGE_EVENT, sync);
    };
  }, []);

  const save = useCallback((search: Omit<SavedSearch, "id" | "createdAt">) => {
    const nextSearch: SavedSearch = {
      ...search,
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString()
    };
    const current = readSavedSearches();
    const withoutDuplicate = current.filter(
      (item) =>
        !(
          item.query === search.query &&
          item.category === search.category &&
          item.genre === search.genre &&
          item.mood === search.mood &&
          item.useCase === search.useCase &&
          item.maxPrice === search.maxPrice
        )
    );
    const next = [nextSearch, ...withoutDuplicate].slice(0, 12);
    writeSavedSearches(next);
    setSearches(next);
  }, []);

  const remove = useCallback((id: string) => {
    const next = readSavedSearches().filter((item) => item.id !== id);
    writeSavedSearches(next);
    setSearches(next);
  }, []);

  return useMemo(() => ({ searches, save, remove }), [remove, save, searches]);
}

function readSavedSearches(): SavedSearch[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedSearch).slice(0, 12);
  } catch {
    return [];
  }
}

function writeSavedSearches(searches: SavedSearch[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function isSavedSearch(value: unknown): value is SavedSearch {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SavedSearch>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.label === "string" &&
    typeof candidate.query === "string" &&
    typeof candidate.category === "string" &&
    typeof candidate.genre === "string" &&
    typeof candidate.mood === "string" &&
    typeof candidate.useCase === "string" &&
    typeof candidate.maxPrice === "string" &&
    typeof candidate.createdAt === "string"
  );
}
