"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "cinemaos_active_project";

/**
 * If there is an in-progress project in localStorage, redirect to its generation page.
 * The backend is polled on the generation page to confirm the real status.
 */
export function useActiveProjectRecovery() {
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.projectId) {
        router.replace(`/generate?project_id=${encodeURIComponent(parsed.projectId)}`);
      }
    } catch {
      // ignore malformed storage
    }
  }, [router]);
}
