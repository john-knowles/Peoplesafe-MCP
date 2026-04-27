export const MISSING_CONTEXT_MESSAGE =
  "I need your Peoplesafe API Base URL, Auth Token, and Subscription Key to proceed.";

export interface ApiContextInput {
  baseUrl?: string | undefined;
}

export interface PeoplesafeApiContext {
  baseUrl: string;
  authToken: string;
  subscriptionKey: string;
}

export function resolveApiContext(input: ApiContextInput): PeoplesafeApiContext | null {
  const baseUrl = input.baseUrl?.trim() || process.env.PEOPLESAFE_BASE_URL?.trim();
  const authToken = process.env.PEOPLESAFE_AUTH_TOKEN?.trim();
  const subscriptionKey = process.env.PEOPLESAFE_SUBSCRIPTION_KEY?.trim();

  if (!baseUrl || !authToken || !subscriptionKey) {
    return null;
  }

  return {
    baseUrl,
    authToken,
    subscriptionKey
  };
}
