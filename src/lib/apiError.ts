/** Pull a human-readable message out of an Axios-style error. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { message?: string; details?: Array<{ message?: string }> } } })?.response?.data;
  return data?.details?.[0]?.message || data?.message || fallback;
}
