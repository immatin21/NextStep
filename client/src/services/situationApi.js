import api from "../configs/axios";

const tokenMap = new Map();

export function setSituationToken(situationId, token) {
  if (situationId && token) {
    tokenMap.set(situationId, token);
    try {
      sessionStorage.setItem(`token_${situationId}`, token);
    } catch {
      console.error("Failed to set situation token in sessionStorage");
    }
  }
}

export function getSituationToken(situationId) {
  if (!situationId) return null;
  return tokenMap.get(situationId) || sessionStorage.getItem(`token_${situationId}`);
}

export function removeSituationToken(situationId) {
  if (!situationId) return;
  tokenMap.delete(situationId);
  try {
    sessionStorage.removeItem(`token_${situationId}`);
  } catch {
    console.error("Failed to remove situation token from sessionStorage");
  }
}

export function generateIdempotencyKey() {
  return "idemp_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();
}

export function getClientLocalTime() {
  return new Date().toISOString();
}

export async function createSituation({ text }) {
  const idempotencyKey = generateIdempotencyKey();
  const candidateId = import.meta.env.VITE_CANDIDATE_EMAIL;
  const headers = {
    "X-Idempotency-Key": idempotencyKey,
    "X-Candidate-Id": candidateId,
  };

  const response = await api.post(
    "/api/v1/situations",
    {
      text,
      client_time: getClientLocalTime(),
      locale: "en-IN",
    },
    { headers }
  );

  if (response.data?.situation_id && response.data?.access_token) {
    setSituationToken(response.data.situation_id, response.data.access_token);
  }

  return response.data;
}

export async function getSituation(situationId) {
  const token = getSituationToken(situationId);
  const headers = token ? { "X-Access-Token": token } : {};
  const response = await api.get(`/api/v1/situations/${situationId}`, { headers });
  return response.data;
}

export async function updateSituation(situationId, text) {
  const token = getSituationToken(situationId);
  const headers = token ? { "X-Access-Token": token } : {};
  const response = await api.post(
    `/api/v1/situations/${situationId}/updates`,
    {
      text,
      client_time: getClientLocalTime(),
    },
    { headers }
  );
  return response.data;
}

export async function answerQuestions(situationId, answers) {
  const token = getSituationToken(situationId);
  const headers = token ? { "X-Access-Token": token } : {};
  const response = await api.post(
    `/api/v1/situations/${situationId}/answers`,
    {
      answers,
    },
    { headers }
  );
  return response.data;
}

export async function deleteSituation(situationId) {
  const token = getSituationToken(situationId);
  const headers = token ? { "X-Access-Token": token } : {};
  const response = await api.delete(`/api/v1/situations/${situationId}`, { headers });
  removeSituationToken(situationId);
  return response.data;
}

export const purgeSituation = deleteSituation;
