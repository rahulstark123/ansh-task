/** PostHog disabled — server analytics are no-ops for now. */

type ServerEvent = {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
};

export async function captureServerEvent(_payload: ServerEvent) {
  return;
}
