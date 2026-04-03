# court-ai-backend

Production-oriented FastAPI backend for CaseCast with Supabase Auth + interaction history.

## Architecture
- Stateless API (`fastapi_app.py`) with clear service boundaries.
- Auth service (`auth.py`) handles signup/login and JWT validation.
- ML service (`model_service.py`) remains isolated from auth/data concerns.
- History service (`history_service.py`) persists ML interaction logs asynchronously.
- Supabase clients (`supabase_clients.py`) provide separate anon/service-role usage.

## Security model
- Secrets are loaded from `court-ai-backend/.env` only.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only; never exposed to frontend.
- Protected routes require bearer JWT validation using Supabase Auth.

## Environment setup
1. Copy/edit `court-ai-backend/.env`.
2. Set values for:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Optional overrides:
   - `COMPAS_CSV_PATH`
   - `ARTIFACT_PATH`
   - `HISTORY_TABLE`
   - `SLOW_QUERY_MS`

## Database setup
Run SQL in `court-ai-backend/sql/001_prediction_history.sql`.

It creates:
- `prediction_history` table linked to `auth.users(id)`
- indexes on `user_id`, `created_at`, and `metadata->>'model_used'`
- RLS policies for per-user read/insert

## Install and run
```bash
pip install -r requirements.txt
uvicorn fastapi_app:app --host 127.0.0.1 --port 8000 --reload
```

## API overview

### Public routes
- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`

### Protected routes (Bearer token required)
- `GET /api/auth/me`
- `POST /api/predict`
- `GET /api/history?page=1&page_size=20&model_used=...&from_ts=...&to_ts=...`
- `GET /api/model-info`

## Async ML interaction logging
- `POST /api/predict` returns prediction immediately.
- History insert runs in `BackgroundTasks` (non-blocking).
- Insert failures are logged and do not fail prediction responses.

## Observability hooks
- Structured logger namespaces (`casecast.api`, `casecast.history`).
- Slow-query warnings for history writes/reads using `SLOW_QUERY_MS`.
- Error logs for failed prediction/history operations.
