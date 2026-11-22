import { useCallback, useEffect, useState } from "react";
import { fetchHistory } from "../api/predict";

/**
 * Custom hook to manage prediction history state.
 * Fetches from backend API using stored JWT.
 * Falls back to localStorage when user is not authenticated.
 */
export function usePredictionHistory(user) {
  const [historyItems, setHistoryItems] = useState([]);

  const refreshHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem("casecast-token");
      if (!token || !user?.id) {
        const stored = localStorage.getItem("casecast-history");
        if (stored) setHistoryItems(JSON.parse(stored));
        return;
      }
      const rows = await fetchHistory(token);
      setHistoryItems(rows);
    } catch (e) {
      console.error("Failed to load history:", e);
      const stored = localStorage.getItem("casecast-history");
      if (stored) {
        try {
          setHistoryItems(JSON.parse(stored));
        } catch (parseErr) {
          console.debug(parseErr);
        }
      }
    }
  }, [user]);

  // Initial load on mount / user change
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const token = localStorage.getItem("casecast-token");
        if (!token || !user?.id) {
          const stored = localStorage.getItem("casecast-history");
          if (stored && active) setHistoryItems(JSON.parse(stored));
          return;
        }
        const rows = await fetchHistory(token);
        if (active) setHistoryItems(rows);
      } catch (e) {
        console.error("Failed to load history:", e);
        const stored = localStorage.getItem("casecast-history");
        if (stored && active) {
          try {
            setHistoryItems(JSON.parse(stored));
          } catch (parseErr) {
            console.debug(parseErr);
          }
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [user]);

  // Persist to localStorage when no auth
  useEffect(() => {
    if (!user?.id) {
      localStorage.setItem("casecast-history", JSON.stringify(historyItems));
    }
  }, [historyItems, user]);

  return { historyItems, setHistoryItems, refreshHistory };
}
