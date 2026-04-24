export const MISSING_AUTH_MESSAGE =
  "I need your Peoplesafe Auth Token and Subscription Key to proceed.";

export interface AuthOverrideInput {
  authToken?: string | undefined;
  subscriptionKey?: string | undefined;
}

export interface PeoplesafeAuthHeaders {
  authToken: string;
  subscriptionKey: string;
}

export function resolveAuthHeaders(input: AuthOverrideInput): PeoplesafeAuthHeaders | null {
  const authToken = input.authToken?.trim() || process.env.PEOPLESAFE_AUTH_TOKEN?.trim();
  const subscriptionKey =
    input.subscriptionKey?.trim() || process.env.PEOPLESAFE_SUBSCRIPTION_KEY?.trim();

  if (!authToken || !subscriptionKey) {
    return null;
  }

  return {
    authToken,
    subscriptionKey
  };
}
