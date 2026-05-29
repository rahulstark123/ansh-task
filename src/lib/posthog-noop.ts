/** PostHog disabled — no-op stubs so call sites stay safe when analytics is off. */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const noop = (..._args: unknown[]) => undefined;

export const posthog = {
  capture: noop,
  identify: noop,
  reset: noop,
  init: noop,
};

export default posthog;
