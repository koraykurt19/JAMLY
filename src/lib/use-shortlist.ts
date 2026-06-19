"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "jamly-shortlist";
const CHANGE_EVENT = "jamly-shortlist-change";

export function useShortlist(defaultIds: string[] = []) {
  const [ids, setIds] = useState<string[]>(defaultIds);

  useEffect(() => {
    function syncFromStorage() {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      setIds(stored ? parseShortlist(stored) : defaultIds);
    }

    syncFromStorage();
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(CHANGE_EVENT, syncFromStorage);

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(CHANGE_EVENT, syncFromStorage);
    };
  }, [defaultIds]);

  const save = useCallback((nextIds: string[]) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
    window.dispatchEvent(new Event(CHANGE_EVENT));
    setIds(nextIds);
  }, []);

  const toggle = useCallback(
    (listingId: string) => {
      const nextIds = ids.includes(listingId)
        ? ids.filter((id) => id !== listingId)
        : [...ids, listingId];

      save(nextIds);
    },
    [ids, save]
  );

  const contains = useCallback((listingId: string) => ids.includes(listingId), [ids]);

  return useMemo(
    () => ({
      ids,
      contains,
      toggle
    }),
    [contains, ids, toggle]
  );
}

function parseShortlist(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}
