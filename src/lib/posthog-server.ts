import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export function getPostHogClient() {
  if (!posthogClient) {
    posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}

type ServerEvent = {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
};

export async function captureServerEvent(payload: ServerEvent) {
  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: payload.distinctId,
    event: payload.event,
    properties: payload.properties ?? {},
  });
  // Force flush in short-lived/serverless request lifecycles.
  await posthog.shutdown();
}
