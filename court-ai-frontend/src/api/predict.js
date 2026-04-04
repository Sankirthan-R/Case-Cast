// ─── API Layer ─────────────────────────────────────────────────────────────────

const BASE_URL = "http://127.0.0.1:8000";

/**
 * Run a prediction via the backend API.
 * @param {string} token - Supabase JWT access token
 * @param {object} payload - The prediction input payload
 * @returns {Promise<object>} The prediction result
 */
export async function runPrediction(token, payload) {
  const res = await fetch(`${BASE_URL}/api/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errMsg = await res.text();
    throw new Error(`API Error ${res.status}: ${errMsg}`);
  }

  return res.json();
}

/**
 * Fetch prediction history from the backend API.
 * @param {string} token - Supabase JWT access token
 * @param {number} pageSize - Number of records to fetch
 * @returns {Promise<object[]>} Array of history items
 */
export async function fetchHistory(token, pageSize = 50) {
  const res = await fetch(`${BASE_URL}/api/history?page=1&page_size=${pageSize}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`History fetch failed: ${res.status}`);

  const json = await res.json();
  return (json.items || []).map((d) => ({
    id: d.id,
    createdAt: d.created_at,
    outcome: d.outcome,
    confidence: d.confidence,
    source: d.source,
    ...d.input_payload,
  }));
}
