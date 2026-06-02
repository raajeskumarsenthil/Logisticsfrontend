import axios from 'axios';

export function getErrorMessage(error: unknown, defaultMessage = 'An unexpected error occurred'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (data && typeof data.message === 'string') {
      return data.message;
    }
    if (data && Array.isArray(data.message) && data.message.length > 0) {
      return String(data.message[0]);
    }
    return error.message || defaultMessage;
  }
  return error instanceof Error ? error.message : defaultMessage;
}
