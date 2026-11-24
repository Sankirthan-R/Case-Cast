# CaseCast: Legal Risk Assessment & Predictive Modeling Platform

An explainable legal AI platform that evaluates recidivism risk, conviction probability, and charge severity. Built with FastAPI, scikit-learn, MySQL 8.4, and React (Vite + Tailwind CSS).

## System Architecture

```text
├── docker-compose.yml            # Local MySQL 8.4 container configuration
├── court-ai-backend/             # FastAPI backend service
│   ├── artifacts/                # Serialized model pipelines (.joblib)
│   ├── sql/                      # Database DDL, stored objects, and demo queries
│   │   ├── 01_schema.sql         # Tables: users, cases, predictions, audit_logs
│   │   ├── 02_objects.sql        # View v_user_history, trg_case_audit, sp_user_summary
│   │   └── demo/queries.sql      # Analytical queries
│   ├── scripts/seed.py           # Demo dataset seeder (~20 users, ~300 cases)
│   ├── auth.py                   # bcrypt hashing & PyJWT authentication
│   ├── db.py                     # SQLAlchemy 2.0 Engine & raw connection management
│   ├── history_service.py        # Parameterised SQL operations for cases & history
│   ├── model_service.py          # Multi-task ML inference service
│   ├── schemas.py                # Pydantic request/response validation schemas
│   ├── settings.py               # Application configuration
│   └── fastapi_app.py            # FastAPI route handlers & lifecycle
└── court-ai-frontend/            # React 19 single-page application
    ├── src/
    │   ├── api/predict.js        # API client for predictions and history
    │   ├── hooks/                # React state & history hooks
    │   ├── components/           # UI components & frosted glass shell
    │   ├── pages/                # Landing, Login, and Portal views
    │   └── App.jsx               # Application routing & JWT auth state
    └── package.json
```

## Tech Stack

- **Backend:** Python 3.12, FastAPI, Uvicorn, SQLAlchemy 2.0 (raw SQL via `text()`), PyMySQL, PyJWT, bcrypt
- **Machine Learning:** Scikit-learn, Pandas, NumPy, Joblib (trained on COMPAS dataset)
- **Database:** MySQL 8.4 in Docker (InnoDB, transactions, foreign key cascades, triggers, stored procedures)
- **Frontend:** React 19, Vite, Tailwind CSS, Lucide React

## Getting Started

### 1. Database Setup (Docker)

Copy root environment template and start MySQL:

```bash
cp .env.example .env
# Edit .env with your chosen passwords
docker compose up -d
```

MySQL initialization scripts in `court-ai-backend/sql/` execute automatically upon first container boot.

To rebuild the database from scratch:
```bash
docker compose down -v
docker compose up -d
```

### 2. Backend Setup

```bash
cd court-ai-backend
cp .env.example .env
# Update DB_PASSWORD and JWT_SECRET in court-ai-backend/.env

# Activate virtual environment
source ../.venv/Scripts/activate  # On Windows: ..\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# (Optional) Seed demo users and cases
python scripts/seed.py

# Start backend server
uvicorn fastapi_app:app --port 8000 --reload
```

### 3. Frontend Setup

```bash
cd court-ai-frontend
npm install
npm run dev
```

The application will be accessible at `http://localhost:5173`.

## Demo Credentials

If you ran `python scripts/seed.py`:
- **Default password:** `CaseCast2026!`
- **Sample accounts:**
  - Citizen: `aarav.sharma@casecast.demo`
  - Lawyer: `priya.patel@casecast.demo`
  - Judge: `rohan.mehta@casecast.demo`
  - Researcher: `ananya.iyer@casecast.demo`

## Core API Endpoints

- `POST /api/auth/signup` - Register with email, password, full_name, role
- `POST /api/auth/login` - Authenticate and receive JWT Bearer token
- `POST /api/auth/logout` - Revoke current user session
- `GET /api/auth/sessions` - List active and historical user sessions
- `DELETE /api/auth/sessions/{session_id}` - Revoke a specific user session
- `GET /api/users/me` - Current authenticated user profile
- `PUT /api/users/me` - Update profile information
- `DELETE /api/users/me` - Remove account
- `PUT /api/users/me/password` - Update password and revoke all other user sessions
- `POST /api/predict` - Run 3-task ML inference; logs case & predictions transactionally
- `GET /api/history` - Paginated prediction history
- `GET /api/history/{case_id}` - Case details with full prediction records
- `DELETE /api/history/{case_id}` - Delete case
- `GET /api/analytics/summary` - Aggregate metrics via stored procedure and queries
- `GET /api/model-info` - Model metrics and metadata
- `GET /api/health` - Service and database status probe

## Ethical & Legal Notice

This software is for research and educational purposes. Criminal justice risk assessment algorithms can reflect and amplify systemic biases present in historical arrest records. Outputs from this system should not be used as sole or primary determinants in bail, sentencing, or parole decisions.
