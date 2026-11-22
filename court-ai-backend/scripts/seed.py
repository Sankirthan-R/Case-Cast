"""CaseCast Database Seeder Script.

Inserts ~20 demo users, ~300 cases spread over 60 days, and 3 prediction rows
per case.
Idempotent: skips seeding if the `users` table already contains rows.
Demo credentials for all seeded users: Password = "CaseCast2026!"
"""

import os
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import text
from auth import hash_password
from db import init_engine
from settings import get_settings

DEMO_PASSWORD = "CaseCast2026!"

USERS_DATA = [
    ("Aarav Sharma", "aarav.sharma@casecast.demo", "Citizen", "+1-555-0101", "124 Park Ave, New York, NY"),
    ("Priya Patel", "priya.patel@casecast.demo", "Lawyer", "+1-555-0102", "456 Market St, San Francisco, CA"),
    ("Rohan Mehta", "rohan.mehta@casecast.demo", "Judge", "+1-555-0103", "789 Supreme Ct, Chicago, IL"),
    ("Ananya Iyer", "ananya.iyer@casecast.demo", "Researcher", "+1-555-0104", "101 University Way, Boston, MA"),
    ("Vikram Singh", "vikram.singh@casecast.demo", "Citizen", "+1-555-0105", "202 Elm St, Austin, TX"),
    ("Sneha Rao", "sneha.rao@casecast.demo", "Lawyer", "+1-555-0106", "303 Law Plaza, Seattle, WA"),
    ("Rajesh Verma", "rajesh.verma@casecast.demo", "Judge", "+1-555-0107", "404 Judicial Rd, Denver, CO"),
    ("Neha Gupta", "neha.gupta@casecast.demo", "Researcher", "+1-555-0108", "505 Research Blvd, Atlanta, GA"),
    ("Arjun Nair", "arjun.nair@casecast.demo", "Citizen", "+1-555-0109", "606 Pine Ln, Miami, FL"),
    ("Meera Joshi", "meera.joshi@casecast.demo", "Citizen", "+1-555-0110", "707 Maple St, Portland, OR"),
    ("Sanjay Kulkarni", "sanjay.kulkarni@casecast.demo", "Lawyer", "+1-555-0111", "808 Oak Dr, Philadelphia, PA"),
    ("Pooja Desai", "pooja.desai@casecast.demo", "Citizen", "+1-555-0112", "909 Cedar Ave, Phoenix, AZ"),
    ("Amit Choudhury", "amit.choudhury@casecast.demo", "Judge", "+1-555-0113", "110 Bench St, Minneapolis, MN"),
    ("Divya Menon", "divya.menon@casecast.demo", "Researcher", "+1-555-0114", "220 Science Cir, San Diego, CA"),
    ("Rahul Bhat", "rahul.bhat@casecast.demo", "Citizen", "+1-555-0115", "330 Sunset Blvd, Los Angeles, CA"),
    ("Kavita Pillai", "kavita.pillai@casecast.demo", "Lawyer", "+1-555-0116", "440 Justice Way, Columbus, OH"),
    ("Sunita Reddy", "sunita.reddy@casecast.demo", "Citizen", "+1-555-0117", "550 Broad St, Newark, NJ"),
    ("Manoj Saxena", "manoj.saxena@casecast.demo", "Judge", "+1-555-0118", "660 Court St, Indianapolis, IN"),
    ("Ritu Agarwal", "ritu.agarwal@casecast.demo", "Lawyer", "+1-555-0119", "770 Legal Row, Charlotte, NC"),
    ("Suresh Kumar", "suresh.kumar@casecast.demo", "Citizen", "+1-555-0120", "880 Valley Rd, Salt Lake City, UT"),
]


def seed():
    settings = get_settings()
    engine = init_engine(settings)

    print("Checking existing database contents...")
    with engine.connect() as conn:
        user_count = conn.execute(text("SELECT COUNT(*) AS total FROM users")).fetchone().total
        if user_count > 0:
            print(f"Users table already has {user_count} records. Skipping seed.")
            return

    print(f"Seeding {len(USERS_DATA)} users (password: {DEMO_PASSWORD})...")
    hashed_pwd = hash_password(DEMO_PASSWORD)

    user_ids = []
    with engine.begin() as conn:
        for full_name, email, role, phone, address in USERS_DATA:
            res = conn.execute(
                text("""
                    INSERT INTO users (full_name, email, password_hash, role, phone, address)
                    VALUES (:full_name, :email, :password_hash, :role, :phone, :address)
                """),
                {
                    "full_name": full_name,
                    "email": email,
                    "password_hash": hashed_pwd,
                    "role": role,
                    "phone": phone,
                    "address": address,
                },
            )
            user_ids.append(res.lastrowid)

    print(f"Inserted {len(user_ids)} users.")

    print("Seeding ~300 cases with 3 predictions each...")
    now = datetime.utcnow()
    total_cases = 300

    random.seed(42)  # Deterministic seed

    with engine.begin() as conn:
        for i in range(total_cases):
            uid = random.choice(user_ids)
            days_ago = random.uniform(0, 60)
            created_at = now - timedelta(days=days_ago, minutes=random.randint(0, 1440))

            age = random.randint(18, 75)
            sex = random.choice(["M", "F", "M", "M"])  # ~75% M
            priors = random.choices([0, 1, 2, 3, 5, 8, 12], weights=[30, 25, 18, 12, 8, 5, 2])[0]
            jail_days = random.choices([1, 5, 14, 30, 60, 120, 240], weights=[25, 30, 20, 12, 7, 4, 2])[0]
            juv_fel = random.choices([0, 1, 2], weights=[85, 12, 3])[0]
            juv_misd = random.choices([0, 1, 2, 3], weights=[75, 15, 7, 3])[0]
            juv_oth = random.choices([0, 1, 2], weights=[80, 15, 5])[0]
            days_arrest = random.randint(-5, 45)
            days_offense = random.randint(0, 180)

            res = conn.execute(
                text("""
                    INSERT INTO cases (
                        user_id, age, sex, priors_count, jail_days,
                        juv_felony, juv_misdemeanor, juv_other,
                        days_arrest_screen, days_offense_screen, created_at
                    ) VALUES (
                        :user_id, :age, :sex, :priors_count, :jail_days,
                        :juv_felony, :juv_misdemeanor, :juv_other,
                        :days_arrest_screen, :days_offense_screen, :created_at
                    )
                """),
                {
                    "user_id": uid,
                    "age": age,
                    "sex": sex,
                    "priors_count": priors,
                    "jail_days": jail_days,
                    "juv_felony": juv_fel,
                    "juv_misdemeanor": juv_misd,
                    "juv_other": juv_oth,
                    "days_arrest_screen": days_arrest,
                    "days_offense_screen": days_offense,
                    "created_at": created_at,
                },
            )
            case_id = res.lastrowid

            # Conviction task
            conv_prob = round(random.uniform(0.25, 0.95), 4)
            conv_label = "Guilty" if conv_prob >= 0.50 else "Acquitted"

            # Severity task
            sev_prob = round(random.uniform(0.15, 0.88), 4)
            sev_label = "Non-Bailable" if sev_prob >= 0.50 else "Bailable"

            # Recidivism task
            recid_prob = round(random.uniform(0.10, 0.92), 4)
            recid_label = "Likely" if recid_prob >= 0.50 else "Unlikely"

            lat = random.randint(8, 48)

            preds = [
                ("conviction", conv_prob, conv_label),
                ("severity", sev_prob, sev_label),
                ("recidivism", recid_prob, recid_label),
            ]

            for task, prob, label in preds:
                conn.execute(
                    text("""
                        INSERT INTO predictions (
                            case_id, task, probability, predicted_label, latency_ms, predicted_at
                        ) VALUES (
                            :case_id, :task, :probability, :predicted_label, :latency_ms, :predicted_at
                        )
                    """),
                    {
                        "case_id": case_id,
                        "task": task,
                        "probability": prob,
                        "predicted_label": label,
                        "latency_ms": lat,
                        "predicted_at": created_at,
                    },
                )

    print(f"Successfully seeded {total_cases} cases and {total_cases * 3} prediction records.")
    print("Database seeding completed.")


if __name__ == "__main__":
    seed()
