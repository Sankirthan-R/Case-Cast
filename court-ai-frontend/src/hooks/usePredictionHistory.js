import { useCallback, useEffect, useState } from "react";
import { fetchHistory } from "../api/predict";
import { supabase } from "../supabaseClient";

/**
 * Custom hook to manage prediction history state.
 * Fetches from backend API (which uses service-role client, bypassing RLS).
 * Falls back to localStorage when user is not authenticated.
 */
export function usePredictionHistory(user) {
  const [historyItems, setHistoryItems] = useState([]);

  const refreshHistory = useCallback(async () => {
    try {
      if (!supabase || !user?.id) {
        const stored = localStorage.getItem("casecast-history");
        if (stored) setHistoryItems(JSON.parse(stored));
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return;
      const rows = await fetchHistory(token);
      setHistoryItems(rows);
    } catch (e) {
      console.error("Failed to load history:", e);
      // Fallback to localStorage on any error
      const stored = localStorage.getItem("casecast-history");
      if (stored) {
        try { setHistoryItems(JSON.parse(stored)); } catch {}
      }
    }
  }, [user]);

  // Initial load on mount / user change
  useEffect(() => {
    let active = true;
    refreshHistory().then(() => {}).catch(() => {});
    return () => { active = false; };
  }, [refreshHistory]);

  // Persist to localStorage when no auth
  useEffect(() => {
    if (!supabase || !user?.id) {
      localStorage.setItem("casecast-history", JSON.stringify(historyItems));
    }
  }, [historyItems, user]);

  return { historyItems, setHistoryItems, refreshHistory };
}
