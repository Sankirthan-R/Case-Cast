from __future__ import annotations

import math
import time
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import Engine, text


def derive_outcome_and_confidence(recid_prob: float) -> tuple[str, float]:
    """
    Single shared function to derive (outcome, confidence) strictly from the 2-year recidivism risk probability.
    recid_prob: float between 0.0 and 1.0 (or 0 and 100).
    - probability >= 0.67: 'High Risk'
    - probability >= 0.45: 'Moderate Risk'
    - probability < 0.45: 'Low Risk'
    """
    prob = float(recid_prob)
    if prob > 1.0:
        prob = prob / 100.0

    if prob >= 0.67:
        outcome = "High Risk"
        confidence = round(prob * 100.0, 1)
    elif prob >= 0.45:
        outcome = "Moderate Risk"
        confidence = round(prob * 100.0, 1)
    else:
        outcome = "Low Risk"
        confidence = round((1.0 - prob) * 100.0, 1)

    return outcome, confidence


class HistoryService:
    def __init__(self, engine: Engine, slow_query_ms: int = 250):
        self.engine = engine
        self.slow_query_ms = slow_query_ms

    def save_prediction(
        self,
        user_id: int,
        input_payload: Dict[str, Any],
        prediction: Dict[str, Any],
        latency_ms: Optional[int] = None,
    ) -> int:
        start_time = time.monotonic()

        age = int(max(18, min(100, round(float(input_payload.get("age", 18))))))
        sex_raw = str(input_payload.get("sex", "M")).strip().upper()
        sex = "M" if sex_raw.startswith("M") else "F"
        priors_count = int(max(0, round(float(input_payload.get("priorOffenses", 0)))))
        jail_days = int(max(0, round(float(input_payload.get("jailDurationDays", 0)))))
        juv_felony = int(max(0, round(float(input_payload.get("juvenileFelonyCount", 0)))))
        juv_misdemeanor = int(max(0, round(float(input_payload.get("juvenileMisdemeanorCount", 0)))))
        juv_other = int(max(0, round(float(input_payload.get("juvenileOtherCount", 0)))))
        days_arrest_screen = int(round(float(input_payload.get("daysBetweenArrestAndScreening", 0))))
        days_offense_screen = int(round(float(input_payload.get("daysFromOffenseToScreen", 0))))

        # Extract tasks
        conv_info = prediction.get("conviction", {})
        conv_prob = round(float(conv_info.get("pConvicted", 0.0)) / 100.0, 4)
        conv_label = str(conv_info.get("prediction", "Guilty"))

        sev_info = prediction.get("chargeSeverity", {})
        sev_prob = round(float(sev_info.get("pNonBailable", 0.0)) / 100.0, 4)
        sev_label = str(sev_info.get("prediction", "Bailable"))

        recid_info = prediction.get("recidivism", {})
        recid_prob = round(float(recid_info.get("pWillReoffend", 0.0)) / 100.0, 4)
        recid_label = str(recid_info.get("prediction", "Unlikely"))

        pred_rows = [
            {"task": "conviction", "probability": conv_prob, "predicted_label": conv_label},
            {"task": "severity", "probability": sev_prob, "predicted_label": sev_label},
            {"task": "recidivism", "probability": recid_prob, "predicted_label": recid_label},
        ]

        with self.engine.begin() as conn:
            insert_case = text("""
                INSERT INTO cases (
                    user_id, age, sex, priors_count, jail_days,
                    juv_felony, juv_misdemeanor, juv_other,
                    days_arrest_screen, days_offense_screen
                ) VALUES (
                    :user_id, :age, :sex, :priors_count, :jail_days,
                    :juv_felony, :juv_misdemeanor, :juv_other,
                    :days_arrest_screen, :days_offense_screen
                )
            """)
            res = conn.execute(
                insert_case,
                {
                    "user_id": user_id,
                    "age": age,
                    "sex": sex,
                    "priors_count": priors_count,
                    "jail_days": jail_days,
                    "juv_felony": juv_felony,
                    "juv_misdemeanor": juv_misdemeanor,
                    "juv_other": juv_other,
                    "days_arrest_screen": days_arrest_screen,
                    "days_offense_screen": days_offense_screen,
                },
            )
            case_id = res.lastrowid

            insert_pred = text("""
                INSERT INTO predictions (
                    case_id, task, probability, predicted_label, latency_ms
                ) VALUES (
                    :case_id, :task, :probability, :predicted_label, :latency_ms
                )
            """)
            for p in pred_rows:
                conn.execute(
                    insert_pred,
                    {
                        "case_id": case_id,
                        "task": p["task"],
                        "probability": p["probability"],
                        "predicted_label": p["predicted_label"],
                        "latency_ms": latency_ms,
                    },
                )

        duration_ms = (time.monotonic() - start_time) * 1000
        if duration_ms > self.slow_query_ms:
            print(f"[SLOW QUERY] save_prediction took {duration_ms:.1f}ms")

        return case_id

    def fetch_history(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        start_time = time.monotonic()
        page = max(1, page)
        page_size = max(1, min(100, page_size))
        offset = (page - 1) * page_size

        with self.engine.connect() as conn:
            count_res = conn.execute(
                text("SELECT COUNT(*) AS total FROM cases WHERE user_id = :uid"),
                {"uid": user_id},
            ).fetchone()
            total_records = count_res.total if count_res else 0

            if total_records == 0:
                return {
                    "items": [],
                    "pagination": {
                        "page": page,
                        "page_size": page_size,
                        "total_records": 0,
                        "total_pages": 0,
                    },
                }

            cases_res = conn.execute(
                text("""
                    SELECT case_id, user_id, age, sex, priors_count, jail_days,
                           juv_felony, juv_misdemeanor, juv_other,
                           days_arrest_screen, days_offense_screen, created_at
                    FROM cases
                    WHERE user_id = :uid
                    ORDER BY created_at DESC, case_id DESC
                    LIMIT :limit OFFSET :offset
                """),
                {"uid": user_id, "limit": page_size, "offset": offset},
            ).fetchall()

            case_ids = [row.case_id for row in cases_res]
            if not case_ids:
                return {
                    "items": [],
                    "pagination": {
                        "page": page,
                        "page_size": page_size,
                        "total_records": total_records,
                        "total_pages": math.ceil(total_records / page_size),
                    },
                }

            in_params = {f"cid_{i}": cid for i, cid in enumerate(case_ids)}
            in_clause = ", ".join(f":cid_{i}" for i in range(len(case_ids)))
            preds_res = conn.execute(
                text(f"""
                    SELECT case_id, task, probability, predicted_label, latency_ms
                    FROM predictions
                    WHERE case_id IN ({in_clause})
                    ORDER BY case_id
                """),
                in_params,
            ).fetchall()

        pred_map: Dict[int, Dict[str, Dict[str, Any]]] = {}
        latency_map: Dict[int, Optional[int]] = {}
        for pr in preds_res:
            cid = pr.case_id
            if cid not in pred_map:
                pred_map[cid] = {}
            pred_map[cid][pr.task] = {
                "probability": float(pr.probability),
                "predicted_label": pr.predicted_label,
            }
            if pr.latency_ms is not None:
                latency_map[cid] = pr.latency_ms

        items: List[Dict[str, Any]] = []
        for c in cases_res:
            cid = c.case_id
            tasks = pred_map.get(cid, {})
            recid_prob = float(tasks.get("recidivism", {}).get("probability", 0.0))
            outcome, confidence = derive_outcome_and_confidence(recid_prob)

            input_payload = {
                "age": c.age,
                "sex": c.sex,
                "priorOffenses": c.priors_count,
                "juvenileFelonyCount": c.juv_felony,
                "juvenileMisdemeanorCount": c.juv_misdemeanor,
                "juvenileOtherCount": c.juv_other,
                "daysBetweenArrestAndScreening": c.days_arrest_screen,
                "daysFromOffenseToScreen": c.days_offense_screen,
                "jailDurationDays": c.jail_days,
            }

            output_payload = {
                "conviction": {
                    "pConvicted": round(tasks.get("conviction", {}).get("probability", 0.0) * 100.0, 1),
                    "prediction": tasks.get("conviction", {}).get("predicted_label", "Guilty"),
                },
                "chargeSeverity": {
                    "pNonBailable": round(tasks.get("severity", {}).get("probability", 0.0) * 100.0, 1),
                    "prediction": tasks.get("severity", {}).get("predicted_label", "Bailable"),
                },
                "recidivism": {
                    "pWillReoffend": round(tasks.get("recidivism", {}).get("probability", 0.0) * 100.0, 1),
                    "prediction": tasks.get("recidivism", {}).get("predicted_label", "Unlikely"),
                },
            }

            created_at_val = c.created_at.isoformat() if isinstance(c.created_at, datetime) else str(c.created_at)

            items.append({
                "id": cid,
                "user_id": c.user_id,
                "input_payload": input_payload,
                "output_payload": output_payload,
                "metadata": {"latency_ms": latency_map.get(cid)},
                "source": "api",
                "outcome": outcome,
                "confidence": confidence,
                "created_at": created_at_val,
            })

        duration_ms = (time.monotonic() - start_time) * 1000
        if duration_ms > self.slow_query_ms:
            print(f"[SLOW QUERY] fetch_history took {duration_ms:.1f}ms")

        return {
            "items": items,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_records": total_records,
                "total_pages": math.ceil(total_records / page_size),
            },
        }

    def get_case(self, case_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        with self.engine.connect() as conn:
            c = conn.execute(
                text("""
                    SELECT case_id, user_id, age, sex, priors_count, jail_days,
                           juv_felony, juv_misdemeanor, juv_other,
                           days_arrest_screen, days_offense_screen, created_at
                    FROM cases
                    WHERE case_id = :cid AND user_id = :uid
                """),
                {"cid": case_id, "uid": user_id},
            ).fetchone()

            if not c:
                return None

            preds = conn.execute(
                text("""
                    SELECT task, probability, predicted_label, latency_ms
                    FROM predictions
                    WHERE case_id = :cid
                """),
                {"cid": case_id},
            ).fetchall()

        tasks = {
            p.task: {"probability": float(p.probability), "predicted_label": p.predicted_label}
            for p in preds
        }
        recid_prob = float(tasks.get("recidivism", {}).get("probability", 0.0))
        outcome, confidence = derive_outcome_and_confidence(recid_prob)
        latency_ms = next((p.latency_ms for p in preds if p.latency_ms is not None), None)

        input_payload = {
            "age": c.age,
            "sex": c.sex,
            "priorOffenses": c.priors_count,
            "juvenileFelonyCount": c.juv_felony,
            "juvenileMisdemeanorCount": c.juv_misdemeanor,
            "juvenileOtherCount": c.juv_other,
            "daysBetweenArrestAndScreening": c.days_arrest_screen,
            "daysFromOffenseToScreen": c.days_offense_screen,
            "jailDurationDays": c.jail_days,
        }

        output_payload = {
            "conviction": {
                "pConvicted": round(tasks.get("conviction", {}).get("probability", 0.0) * 100.0, 1),
                "prediction": tasks.get("conviction", {}).get("predicted_label", "Guilty"),
            },
            "chargeSeverity": {
                "pNonBailable": round(tasks.get("severity", {}).get("probability", 0.0) * 100.0, 1),
                "prediction": tasks.get("severity", {}).get("predicted_label", "Bailable"),
            },
            "recidivism": {
                "pWillReoffend": round(tasks.get("recidivism", {}).get("probability", 0.0) * 100.0, 1),
                "prediction": tasks.get("recidivism", {}).get("predicted_label", "Unlikely"),
            },
        }

        created_at_val = c.created_at.isoformat() if isinstance(c.created_at, datetime) else str(c.created_at)

        return {
            "id": c.case_id,
            "user_id": c.user_id,
            "input_payload": input_payload,
            "output_payload": output_payload,
            "metadata": {"latency_ms": latency_ms},
            "source": "api",
            "outcome": outcome,
            "confidence": confidence,
            "created_at": created_at_val,
        }

    def delete_case(self, case_id: int, user_id: int) -> str:
        """Returns 'ok', 'not_found', or 'forbidden'."""
        with self.engine.begin() as conn:
            row = conn.execute(
                text("SELECT user_id FROM cases WHERE case_id = :cid"),
                {"cid": case_id},
            ).fetchone()
            if not row:
                return "not_found"
            if row.user_id != user_id:
                return "forbidden"
            conn.execute(
                text("DELETE FROM cases WHERE case_id = :cid"),
                {"cid": case_id},
            )
        return "ok"
