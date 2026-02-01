const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  "http://localhost:3000";

interface ApiError extends Error {
  status?: number;
  details?: string;
}

async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string;
  } = {}
): Promise<T> {
  const { method = "GET", body, token } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: ApiError = new Error(errorData.error || "Request failed");
    error.status = response.status;
    error.details = errorData.error;
    throw error;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export { API_URL, apiRequest };
