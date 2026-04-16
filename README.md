<div align="center">

# ⚖️ CaseCast
**AI-powered Legal Intelligence System**

[![React](https://img.shields.io/badge/React-19.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
[![Vite](https://img.shields.io/badge/Vite-8.0-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.116-109989?style=for-the-badge&logo=FASTAPI&logoColor=white)](#)
[![Python](https://img.shields.io/badge/Python-3.10+-FFD43B?style=for-the-badge&logo=python&logoColor=blue)](#)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-181818?style=for-the-badge&logo=supabase&logoColor=white)](#)

*Predict case outcomes, charge severity, and recidivism risk with machine learning.*

[Features](#-features) • [Installation](#-quick-start) • [Tech Stack](#-tech-stack)

</div>

---

## ✨ Features

- **🔮 Smart Predictions:** Evaluates conviction likelihood, bail eligibility, and 2-year recidivism using the ProPublica COMPAS dataset.
- **🤖 AutoML Pipeline:** Automatically trains and selects the best model (Random Forest, XGBoost, etc.) based on F1 score.
- **📊 Real-time Analytics:** Interactive dashboard to view model confidence, risk deciles, and performance metrics.
- **🎨 Premium Interface:** Beautiful dark-themed UI featuring glassmorphism, fluid animations (GSAP/Framer), and an interactive 3D nebula background.
- **🔐 Secure Access:** Full authentication and prediction history logging via Supabase.

---

## 🚀 Quick Start

### 1. Backend Environment

```bash
cd court-ai-backend

# Setup virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt

# Configure settings
cp .env.example .env

# Start the API
uvicorn fastapi_app:app --reload --port 8000
```

### 2. Frontend Interface

```bash
cd court-ai-frontend

# Install dependencies
npm install

# Configure settings
cp .env.example .env

# Start the portal
npm run dev
```

Visit **http://localhost:5173** and login to start using CaseCast!

---

## 🛠️ Tech Stack

<div align="center">
  <table>
    <tr>
      <td align="center"><b>Frontend</b><br>React, Vite, Tailwind CSS, Framer Motion, GSAP, Radix UI</td>
      <td align="center"><b>Backend</b><br>FastAPI, Scikit-learn, Pandas, Numpy, Joblib</td>
      <td align="center"><b>Infrastructure</b><br>Supabase (Auth & PostgreSQL Database)</td>
    </tr>
  </table>
</div>

---

## ⚠️ Disclaimer

Not for legal use. Built strictly for academic research and evaluation of the COMPAS dataset. Predictions are subject to historical data biases.
