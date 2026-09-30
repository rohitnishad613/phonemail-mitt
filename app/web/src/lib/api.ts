const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getErrorMessage(data: any): string {
  if (!data) {
    return "Something went wrong. Please try again.";
  }

  if (Array.isArray(data.message)) {
    return data.message.join(", ");
  }

  if (typeof data.message === "string") {
    return data.message;
  }

  return "Something went wrong. Please try again.";
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1${path}`,
    {
      ...options,
      credentials: "include", // because your NestJS backend uses an HttpOnly session cookie.
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(data),
      response.status,
      data,
    );
  }

  return data as T;
}

export async function apiMultipart<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1${path}`,
    {
      method: 'POST',
      credentials: 'include',
      body: formData,
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(data),
      response.status,
      data,
    );
  }

  return data as T;
}