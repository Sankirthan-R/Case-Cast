# court-ai-backend

Flask backend for COMPAS-style prediction.

## What it does
- Trains models once and saves them to `artifacts/compas_model_bundle.joblib`
- Serves predictions through `POST /api/predict`
- Serves best-model summary through `GET /api/model-info`
- Can retrain with `POST /api/train`

## Setup
1. Put your CSV at `court-ai-backend/compas-scores-two-years.csv`.
2. Create environment and install:
   ```bash
   pip install -r requirements.txt
   ```
3. Run backend:
   ```bash
   python app.py
   ```

Optional environment variable:
- `COMPAS_CSV_PATH` to point to CSV in another location.

## API
### `POST /api/predict`
Request JSON:
```json
{
  "age": 20,
  "sex": "M",
  "priorOffenses": 0,
  "juvenileFelonyCount": 0,
  "juvenileMisdemeanorCount": 0,
  "juvenileOtherCount": 0,
  "daysBetweenArrestAndScreening": -1,
  "daysFromOffenseToScreen": 2,
  "jailDurationDays": 10
}
```

Response includes:
- `summary`
- `autoComputedRiskScores`
- `conviction`
- `chargeSeverity`
- `recidivism`
- `modelInfo`

### `GET /api/model-info`
Returns best-model summary and training logs.

### `GET /api/training-logs`
Returns only training logs:
- decile regressor table
- violent decile regressor table
- classifier tables for conviction, charge severity, recidivism
