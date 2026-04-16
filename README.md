<div align="center">

# ⚖️ CaseCast
**AI-powered Legal Intelligence System**

[![React](https://img.shields.io/badge/React-19.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
[![Vite](https://img.shields.io/badge/Vite-8.0-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.116-109989?style=for-the-badge&logo=FASTAPI&logoColor=white)](#)
[![Python](https://img.shields.io/badge/Python-3.10+-FFD43B?style=for-the-badge&logo=python&logoColor=blue)](#)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-181818?style=for-the-badge&logo=supabase&logoColor=white)](#)

*Predict case outcomes, charge severity, and recidivism risk with ensemble machine learning.*

[Features](#-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [Tech Stack](#-tech-stack)

</div>

---

## 📸 Overview

CaseCast is a full-stack web application that combines a **FastAPI Python backend** with a **React + Vite frontend** to provide legal professionals and researchers with structured, data-driven predictions based on defendant profile inputs. Built on the ProPublica COMPAS dataset, it delivers predictions through a premium, dark-themed SaaS interface with interactive 3D visualizations and fluid animations.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔮 **Smart Predictions** | Predicts conviction likelihood, charge severity (Bailable/Non-Bailable), and 2-year recidivism. |
| 🤖 **AutoML Pipeline** | Automatically trains Logistic Regression, Decision Trees, Random Forests, and GBMs — selecting the best model per task based on F1 score. |
| 📊 **Risk Scoring** | Auto-computes COMPAS-style decile and violent decile scores. |
| 🧾 **Prediction Logs** | Full paginated dashboard of past predictions stored securely via Supabase. |
| 🔐 **Authentication** | Secure email/password login and user management backed by Supabase Auth. |
| 📈 **Model Telemetry** | View live training metrics, cross-validation scores, and model performance comparisons directly in the UI. |
| 🎨 **Premium UI/UX** | Built with Tailwind CSS, Framer Motion, and GSAP, featuring a glassmorphism design and an interactive 3D nebula background. |

---

## 🧠 Machine Learning Engine

CaseCast executes **three independent classification tasks** alongside two regression tasks for risk scoring.

### Prediction Targets

| Task | Type | Target Variable | Candidate Models |
|---|---|---|---|
| **Conviction** | Classification | `convicted_proxy` | LR, Decision Tree, RF, XGBoost |
| **Bail Eligibility** | Classification | `charge_degree` (F/M) | LR, Decision Tree, RF, XGBoost |
| **Recidivism** | Classification | `two_year_recid` | LR, Decision Tree, RF, XGBoost |

The ML pipeline performs an 80/20 train-test split, evaluates models via 5-fold cross-validation, and selects the optimal model automatically using the **weighted F1 Score**.

### Risk Tier Classification

| Recidivism Probability | Risk Label |
|---|---|
| ≥ 67% | 🔴 High Risk |
| 45% – 66% | 🟡 Moderate Risk |
| < 45% | 🟢 Low Risk |

---

## 🏗️ Architecture

```text
casecast/
├── court-ai-backend/          # Python FastAPI backend
│   ├── fastapi_app.py         # App entrypoint, API routes (auth, predict, history)
│   ├── model_service.py       # ML Pipeline, model training & prediction logic
│   ├── history_service.py     # Supabase CRUD for prediction logs
│   ├── auth.py                # Supabase Auth integration logic
│   ├── requirements.txt       # Python dependencies
│   └── compas-scores-two-years.csv # Training dataset
│
└── court-ai-frontend/         # React 19 + Vite frontend
    └── src/
        ├── pages/             # Auth Pages (Login)
        │   └── portal/        # Main Application Shell
        │       ├── HomePage.jsx      # Dashboard overview
        │       ├── PredictPage.jsx   # Interactive prediction form
        │       ├── LogsPage.jsx      # Historical data table view
        │       └── ProfilePage.jsx   # User details & ML telemetry info
        ├── components/        # Reusable UI elements (Radix UI / shadcn)
        ├── hooks/             # Custom state management (usePredictionHistory)
        └── index.css          # Tailwind and global styling configurations
```

---

## 🛠️ Tech Stack

<div align="center">
  <table>
    <tr>
      <td align="center"><h3>🎨 Frontend</h3></td>
      <td align="center"><h3>⚙️ Backend</h3></td>
      <td align="center"><h3>☁️ Infrastructure</h3></td>
    </tr>
    <tr>
      <td valign="top">
        <ul>
          <li><b>Core:</b> React 19, Vite</li>
          <li><b>Routing:</b> React Router v7</li>
          <li><b>Styling:</b> Tailwind CSS v4</li>
          <li><b>Components:</b> Radix UI, shadcn</li>
          <li><b>Animations:</b> Framer Motion, GSAP</li>
          <li><b>3D Effects:</b> Three.js, R3F</li>
        </ul>
      </td>
      <td valign="top">
        <ul>
          <li><b>Framework:</b> FastAPI, Uvicorn</li>
          <li><b>Machine Learning:</b> Scikit-learn</li>
          <li><b>Data Processing:</b> Pandas, Numpy</li>
          <li><b>Persistence:</b> Joblib</li>
          <li><b>Validation:</b> Pydantic</li>
        </ul>
      </td>
      <td valign="top">
        <ul>
          <li><b>Database:</b> PostgreSQL (Supabase)</li>
          <li><b>Auth:</b> Supabase Auth</li>
          <li><b>Environment:</b> python-dotenv</li>
        </ul>
      </td>
    </tr>
  </table>
</div>

---

## 🚀 Getting Started

### Prerequisites
- **Python** 3.10+
- **Node.js** 18+
- A [Supabase](https://supabase.com) project

### 1. Setup the Database (Supabase)
Create the `prediction_history` table in the Supabase SQL editor:

<details>
<summary><b>Click to view SQL schema for setup</b></summary>
<br>

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

alter table prediction_history enable row level security;

create policy "Users can view their own predictions"
  on prediction_history for select using (auth.uid() = user_id);

create policy "Users can insert their own predictions"
  on prediction_history for insert with check (auth.uid() = user_id);
```
</details>

### 2. Backend Setup

```bash
cd court-ai-backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
```

**Ensure the following `.env` settings are populated:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Run the API Server:**
```bash
uvicorn fastapi_app:app --reload --port 8000
```
> *Note: On first launch, the system will read the CSV, perform an automated training/evaluation loop, and serialize a `.joblib` model artifact.*

### 3. Frontend Setup

```bash
cd court-ai-frontend

# Install node modules
npm install

# Create environment file
cp .env.example .env
```

**Ensure the following `.env` settings are populated:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Run the Application:**
```bash
npm run dev
```
Navigate to **http://localhost:5173** to log in and use the portal!

---

## 🔌 API Ecosystem

The system communicates primarily over the Vite proxy `/api` which intercepts standard REST calls to the backend:

- `POST /api/auth/login` — Authenticate and retrieve JWT session details.
- `POST /api/predict` — Submit defendant parameters to run through the AutoML prediction pipeline.
- `GET /api/history` — Fetch paginated prediction logs for the authenticated user.
- `GET /api/model-info` — Retrieve detailed metrics, validation scores, and dataset properties loaded into the ML engine.

---

## ⚠️ Ethical Disclaimer

CaseCast is built on the **COMPAS recidivism dataset** released by ProPublica. This tool is strictly for **academic and research demonstration purposes**. Automated predictions in criminal justice contexts carry significant ethical risks and may perpetuate systemic biases present in historical data. **This system should never be used as a basis for real-world legal decision-making.**
