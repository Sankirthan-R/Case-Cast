# ⚖️ CaseCast — Legal Intelligence System

> **AI-powered criminal case outcome prediction platform** built on the COMPAS dataset. CaseCast leverages ensemble machine learning to predict conviction likelihood, charge severity (bailable vs. non-bailable), and two-year recidivism risk — delivered through a premium, dark-themed web interface.

---

## 📸 Overview

CaseCast is a full-stack web application that combines a **FastAPI Python backend** with a **React + Vite frontend** to provide legal professionals and researchers with structured, data-driven predictions based on defendant profile inputs.

The system trains multiple ML models at startup, selects the best performer per prediction task, and surfaces results with confidence scores, risk tiers, and detailed model telemetry.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔮 **Case Outcome Prediction** | Predicts conviction, charge severity (B/NB), and 2-year recidivism |
| 🤖 **Auto Model Selection** | Trains Logistic Regression, Decision Tree, Random Forest, and GBM — picks best by F1 |
| 📊 **Risk Scoring** | Computes COMPAS-style decile & violent decile scores automatically |
| 🧾 **Prediction History** | Full paginated log of past predictions stored in Supabase |
| 🔐 **Auth System** | Email/password signup & login backed by Supabase Auth |
| 📈 **Model Dashboard** | Live training metrics, cross-validation scores, and model comparisons |
| 🎨 **Premium Dark UI** | Glassmorphism design with animated nebula background, GSAP + Framer Motion |

---

## 🏗️ Architecture

```
casecast/
├── court-ai-backend/          # Python FastAPI backend
│   ├── fastapi_app.py         # App entrypoint, API routes, CORS
│   ├── model_service.py       # ML training & prediction engine
│   ├── auth.py                # Supabase Auth integration
│   ├── history_service.py     # Prediction log CRUD
│   ├── schemas.py             # Pydantic request models
│   ├── settings.py            # Environment config
│   ├── supabase_clients.py    # Supabase client factory
│   └── compas-scores-two-years.csv   # COMPAS training dataset
│
└── court-ai-frontend/         # React + Vite frontend
    └── src/
        ├── pages/
        │   ├── Login.jsx         # Authentication page
        │   ├── MainPortal.jsx    # Portal shell & navigation
        │   └── portal/
        │       ├── HomePage.jsx      # Dashboard & feature overview
        │       ├── PredictPage.jsx   # Case prediction form
        │       ├── LogsPage.jsx      # Prediction history
        │       └── ProfilePage.jsx   # User profile & model info
        ├── api/                  # API client layer
        ├── components/           # Shared UI components
        ├── hooks/                # Custom React hooks
        └── utils/                # Utility helpers
```

---

## 🧠 ML Models & Prediction Pipeline

CaseCast runs **three independent prediction tasks** using the [ProPublica COMPAS dataset](https://github.com/propublica/compas-analysis):

### Prediction Targets

| Task | Type | Target Variable |
|---|---|---|
| **Conviction / Not Convicted** | Classification | `convicted_proxy` |
| **Bailable / Non-Bailable** | Classification | `charge_degree` (F/M) |
| **Recidivism (2-Year)** | Classification | `two_year_recid` |

### Model Candidates (per task)

- Logistic Regression
- Decision Tree Classifier
- Random Forest Classifier
- Gradient Boosting (XGBoost-style GBM)

The best model per task is selected by **weighted F1 score** using a stratified 80/20 train-test split, with 5-fold cross-validation metrics also reported.

### Risk Score Regression

COMPAS decile and violent decile scores are predicted using:
- **Random Forest Regressor**
- **Gradient Boosting Regressor**

Best selected by **Mean Absolute Error (MAE)**.

### Input Features

```
age, sex, priors_count, juv_fel_count, juv_misd_count, juv_other_count,
days_b_screening_arrest, c_days_from_compas, jail_duration
```

### Risk Tier Classification

| Recidivism Probability | Risk Label |
|---|---|
| ≥ 67% | 🔴 High Risk |
| 45% – 66% | 🟡 Moderate Risk |
| < 45% | 🟢 Low Risk |

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+ & npm
- A [Supabase](https://supabase.com) project

---

### 1. Clone the Repository

```bash
git clone https://github.com/Sankirthan-R/Case-Cast.git
cd casecast
```

---

### 2. Backend Setup

```bash
cd court-ai-backend

# Create and activate virtual environment
python -m venv ../.venv
# Windows
..\.venv\Scripts\activate
# macOS/Linux
source ../.venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Configure environment variables:**

```bash
cp .env.example .env
```

Edit `.env`:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional overrides
COMPAS_CSV_PATH=./compas-scores-two-years.csv
ARTIFACT_PATH=./artifacts/compas_model_bundle.joblib
HISTORY_TABLE=prediction_history
SLOW_QUERY_MS=250
```

**Run the backend:**

```bash
uvicorn fastapi_app:app --reload --port 8000
```

> ⚡ On first launch, the model will **train automatically** from `compas-scores-two-years.csv` and cache a `.joblib` artifact for fast subsequent startups.

---

### 3. Frontend Setup

```bash
cd court-ai-frontend

# Install dependencies
npm install
```

**Configure environment variables:**

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Optional — only needed if not using the Vite proxy
# VITE_API_BASE_URL=http://127.0.0.1:8000
```

**Run the frontend:**

```bash
npm run dev
```

The app will be available at **http://localhost:5173**.

---

### 4. Supabase Setup

Create a `prediction_history` table in your Supabase project:

```sql
create table prediction_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  input_payload jsonb not null,
  output_payload jsonb not null,
  metadata jsonb,
  source text default 'model',
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table prediction_history enable row level security;

create policy "Users can view their own predictions"
  on prediction_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own predictions"
  on prediction_history for insert
  with check (auth.uid() = user_id);
```

---

## 🔌 API Reference

Base URL: `http://localhost:8000`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Health check |
| `POST` | `/api/auth/signup` | None | Register a new user |
| `POST` | `/api/auth/login` | None | Login and get access token |
| `GET` | `/api/auth/me` | Bearer | Get current user info |
| `POST` | `/api/predict` | Bearer | Run a case prediction |
| `GET` | `/api/history` | Bearer | Fetch paginated prediction history |
| `GET` | `/api/model-info` | Bearer | Get model training metrics |

### `POST /api/predict` — Request Body

```json
{
  "age": 28,
  "sex": "M",
  "priorOffenses": 3,
  "juvenileFelonyCount": 0,
  "juvenileMisdemeanorCount": 1,
  "juvenileOtherCount": 0,
  "daysBetweenArrestAndScreening": -1,
  "daysFromOffenseToScreen": 4,
  "jailDurationDays": 5
}
```

### `POST /api/predict` — Response

```json
{
  "summary": {
    "outcome": "High Risk",
    "confidence": 87.3
  },
  "autoComputedRiskScores": {
    "decileScore": 7,
    "violentDecileScore": 5
  },
  "conviction": {
    "prediction": "CONVICTED",
    "pConvicted": 87.3,
    "pNotConvicted": 12.7,
    "bestModel": "Random Forest"
  },
  "chargeSeverity": {
    "prediction": "NON-BAILABLE (NB)",
    "pNonBailable": 64.1,
    "pBailable": 35.9,
    "bestModel": "XGBoost (GBM)"
  },
  "recidivism": {
    "prediction": "LIKELY TO REOFFEND",
    "pWillReoffend": 71.8,
    "pWillNotReoffend": 28.2,
    "bestModel": "Random Forest"
  }
}
```

---

## 🛠️ Tech Stack

### Backend
| Tool | Purpose |
|---|---|
| **FastAPI** | REST API framework |
| **Uvicorn** | ASGI server |
| **scikit-learn** | ML model training & evaluation |
| **pandas / numpy** | Data processing |
| **joblib** | Model serialization & caching |
| **Supabase** | Auth + database (PostgreSQL) |
| **python-dotenv** | Environment config |

### Frontend
| Tool | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 8** | Build tool & dev server |
| **React Router v7** | Client-side routing |
| **Framer Motion** | Page & component animations |
| **GSAP** | Advanced animation sequences |
| **Three.js / React Three Fiber** | 3D nebula background |
| **Tailwind CSS v4** | Utility-first styling |
| **shadcn/ui + Radix UI** | Accessible UI primitives |
| **Supabase JS** | Auth client |
| **Lucide React** | Icon library |

---

## 📁 Environment Variables Reference

### Backend (`court-ai-backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (for admin ops) |
| `COMPAS_CSV_PATH` | Optional | Path to COMPAS CSV (default: `./compas-scores-two-years.csv`) |
| `ARTIFACT_PATH` | Optional | Path to save trained model bundle |
| `HISTORY_TABLE` | Optional | Supabase table for prediction logs |
| `SLOW_QUERY_MS` | Optional | Query latency threshold for warnings |

### Frontend (`court-ai-frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase public anon key |
| `VITE_API_BASE_URL` | Optional | Backend URL override (default: Vite proxy `/api`) |

---

## ⚠️ Ethical Disclaimer

CaseCast is built on the **COMPAS recidivism dataset** released by ProPublica. This tool is intended **strictly for academic and research purposes**.

> Automated predictions about individuals in criminal justice contexts carry significant ethical risks, including the potential to perpetuate systemic biases present in historical data. **This system should never be used as the sole basis for real-world legal decisions.**

---

## 📄 License

This project is for educational and research purposes. See [LICENSE](LICENSE) for details.

---

<p align="center">Built with ⚖️ for academic research · CaseCast Legal Intelligence System</p>
