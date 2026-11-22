// ─── API Layer ─────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Run a prediction via the backend API.
 * Requires a valid JWT access token.
 * @param {string} token - JWT access token
 * @param {object} payload - The prediction input payload
 * @returns {Promise<object>} The prediction result
 */
export async function runPrediction(token, payload) {
  if (!token) {
    throw new Error("401 Unauthorized");
  }

  const res = await fetch(`${BASE_URL}/api/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("401 Unauthorized");
    }
    const errMsg = await res.text();
    throw new Error(`API Error ${res.status}: ${errMsg}`);
  }

  return res.json();
}

/**
 * Fetch prediction history from the backend API.
 * @param {string} token - JWT access token
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
    source: d.source || "api",
    ...d.input_payload,
  }));
}
