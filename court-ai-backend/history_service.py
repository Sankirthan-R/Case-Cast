from __future__ import annotations

import logging
import time
from datetime import datetime
from typing import Any, Dict, Optional

from supabase_clients import SupabaseClients


logger = logging.getLogger("casecast.history")


class HistoryService:
    def __init__(self, clients: SupabaseClients, table_name: str, slow_query_ms: int = 250) -> None:
        self.clients = clients
        self.table_name = table_name
        self.slow_query_ms = slow_query_ms

    def record_interaction(
        self,
        user_id: str,
        input_payload: Dict[str, Any],
        output_payload: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None,
        source: str = "model",
    ) -> None:
        started = time.perf_counter()
        metadata = metadata or {}

        row = {
            "user_id": user_id,
            "input_payload": input_payload,
            "output_payload": output_payload,
            "metadata": metadata,
            "source": source,
            "outcome": output_payload.get("summary", {}).get("outcome", "Unknown"),
            "confidence": float(output_payload.get("summary", {}).get("confidence", 0.0)),
        }

        try:
            self.clients.service.from_(self.table_name).insert(row).execute()
        except Exception:
            logger.exception("history.record.failed")
            return

        elapsed_ms = (time.perf_counter() - started) * 1000
        if elapsed_ms > self.slow_query_ms:
            logger.warning("history.record.slow elapsed_ms=%.2f", elapsed_ms)

    def fetch_history(
        self,
        user_id: str,
        page: int,
        page_size: int,
        model_used: str | None,
        from_ts: datetime | None,
        to_ts: datetime | None,
    ) -> Dict[str, Any]:
        started = time.perf_counter()
        page = max(1, page)
        page_size = max(1, min(100, page_size))
        start = (page - 1) * page_size
        end = start + page_size - 1

        query = (
            self.clients.service.from_(self.table_name)
            .select("id,user_id,input_payload,output_payload,metadata,source,outcome,confidence,created_at", count="exact")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
        )

        if model_used:
            query = query.eq("metadata->>model_used", model_used)
        if from_ts:
            query = query.gte("created_at", from_ts.isoformat())
        if to_ts:
            query = query.lte("created_at", to_ts.isoformat())

        result = query.range(start, end).execute()
        elapsed_ms = (time.perf_counter() - started) * 1000
        if elapsed_ms > self.slow_query_ms:
            logger.warning("history.fetch.slow elapsed_ms=%.2f user_id=%s", elapsed_ms, user_id)

        rows = result.data or []
        total = result.count or 0

        return {
            "items": rows,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": (total + page_size - 1) // page_size if total else 0,
            },
        }
