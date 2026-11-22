# CaseCast Backend (FastAPI + MySQL)

FastAPI-powered judicial intelligence service providing risk assessments across conviction, charge severity, and recidivism using scikit-learn models, backed by MySQL 8.4 and JWT authentication.

## Architecture & Tech Stack

- **API Framework:** FastAPI with Uvicorn
- **Database:** MySQL 8.4 (InnoDB) running via Docker
- **Query Layer:** Raw SQL executed via SQLAlchemy 2.0 Engine & PyMySQL (`text()` parameterised queries, no ORM)
- **Authentication:** Custom bcrypt password hashing + PyJWT (HS256 Bearer tokens, 12h expiry)
- **Machine Learning:** Scikit-learn pipelines with Joblib serialized models trained on COMPAS dataset

## Database Schema

- `users`: ID, full_name, email, password_hash, role (Citizen, Lawyer, Judge, Researcher), phone, address, created_at
- `cases`: case_id, user_id, age, sex, priors_count, jail_days, juvenile offenses, screening delays, created_at
- `predictions`: case_id, task (conviction, severity, recidivism), probability, predicted_label, latency_ms (PK: `case_id` + `task`)
- `audit_logs`: log_id, user_id, action, details, logged_at
- `v_user_history`: View joining cases with their three task predictions
- `trg_case_audit`: Trigger auditing new case predictions
- `sp_user_summary`: Stored procedure summarizing user case metrics

## Environment Setup

Create `.env` in `court-ai-backend/` (refer to `.env.example`):

```bash
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=casecast
DB_USER=casecast_app
DB_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE_HOURS=12
SLOW_QUERY_MS=250
```

## Running the Backend

```bash
# Activate virtual environment
source ../.venv/Scripts/activate  # or .venv\Scripts\Activate.ps1 on Windows

# Install dependencies
pip install -r requirements.txt

# Run server with reload
uvicorn fastapi_app:app --port 8000 --reload
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register user (`email`, `password`, `full_name`, `role`) -> returns Bearer JWT + profile
- `POST /api/auth/login` - Authenticate (`email`, `password`) -> returns Bearer JWT + profile

### User Profile
- `GET /api/users/me` - Current user profile
- `PUT /api/users/me` - Update profile (`full_name`, `role`, `phone`, `address`)
- `DELETE /api/users/me` - Delete account
- `PUT /api/users/me/password` - Change password (`current_password`, `new_password`)

### Predictions & History
- `POST /api/predict` - Run 3-task ML inference; auto-saves case & predictions in one transaction if authenticated
- `GET /api/history` - Paginated prediction history (`page`, `page_size`)
- `GET /api/history/{case_id}` - Fetch single case details
- `DELETE /api/history/{case_id}` - Delete case (cascades to predictions)

### Analytics & System
- `GET /api/analytics/summary` - Stored procedure summary, recidivism risk by age band, latency by task
- `GET /api/model-info` - Metadata & metrics on trained models
- `GET /api/health` - Check API and MySQL connectivity

## Database Seeding

To seed ~20 demo users (password: `CaseCast2026!`) and ~300 cases:

```bash
python scripts/seed.py
```
