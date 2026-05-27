<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into ANSH Task, a Next.js 16 App Router workspace management SaaS. PostHog is initialized via `instrumentation-client.ts` (the correct approach for Next.js 15.3+), with a reverse proxy configured in `next.config.ts` so analytics traffic routes through `/ingest` rather than directly to PostHog's servers. Server-side tracking uses `posthog-node` via a shared `src/lib/posthog-server.ts` helper. Users are identified on both the client (email/password login, Google OAuth, signup) and server (onboarding completion) so sessions are correctly attributed.

## Events tracked

| Event | Description | File |
|-------|-------------|------|
| `user_signed_up` | User successfully creates a new account via email+password | `src/app/signup/page.tsx` |
| `google_auth_started` | User initiates Google OAuth flow (signup or login page) | `src/app/signup/page.tsx`, `src/app/login/page.tsx` |
| `user_logged_in` | User successfully authenticates via email+password | `src/app/login/page.tsx` |
| `onboarding_completed` | User finishes the onboarding wizard; workspace provisioned | `src/app/onboarding/page.tsx` |
| `task_created` | User creates a new task via the Add Task modal | `src/components/tasks/AddTaskModal.tsx` |
| `task_updated` | User saves changes to an existing task via the Edit Task modal | `src/components/tasks/AddTaskModal.tsx` |
| `upgrade_checkout_opened` | User opens the Pro plan checkout modal | `src/app/(app)/settings/billing/page.tsx` |
| `upgrade_completed` | User successfully completes payment; workspace upgraded to Pro | `src/app/(app)/settings/billing/page.tsx` |
| `upgrade_failed` | User's Pro plan payment returns an error | `src/app/(app)/settings/billing/page.tsx` |
| `payment_order_created` | [Server] Razorpay order created for a Pro plan checkout | `src/app/api/billing/checkout/order/route.ts` |
| `payment_verified` | [Server] Razorpay payment verified; workspace upgraded to Pro | `src/app/api/billing/checkout/verify/route.ts` |
| `workspace_created` | [Server] Workspace, owner, first project and seed tasks created | `src/app/api/onboarding/route.ts` |
| `team_member_added` | [Server] New team member added to a workspace | `src/app/api/team/route.ts` |
| `team_member_removed` | [Server] Team member removed from a workspace | `src/app/api/team/route.ts` |

## Files created / modified

| File | Change |
|------|--------|
| `instrumentation-client.ts` | **Created** — PostHog client-side init (Next.js 15.3+ pattern) |
| `src/lib/posthog-server.ts` | **Created** — Singleton `posthog-node` client for API routes |
| `next.config.ts` | **Modified** — Added `/ingest` reverse proxy rewrites + `skipTrailingSlashRedirect` |
| `.env.local` | **Modified** — Added `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` |
| `src/app/signup/page.tsx` | **Modified** — `google_auth_started`, `user_signed_up`, `posthog.identify()` |
| `src/app/login/page.tsx` | **Modified** — `google_auth_started`, `user_logged_in`, `posthog.identify()` |
| `src/app/onboarding/page.tsx` | **Modified** — `onboarding_completed`, `posthog.identify()` with profile traits |
| `src/components/tasks/AddTaskModal.tsx` | **Modified** — `task_created`, `task_updated` with rich properties |
| `src/app/(app)/settings/billing/page.tsx` | **Modified** — `upgrade_checkout_opened`, `upgrade_completed`, `upgrade_failed` |
| `src/app/api/billing/checkout/order/route.ts` | **Modified** — `payment_order_created` (server) |
| `src/app/api/billing/checkout/verify/route.ts` | **Modified** — `payment_verified` (server) |
| `src/app/api/onboarding/route.ts` | **Modified** — `workspace_created` (server) |
| `src/app/api/team/route.ts` | **Modified** — `team_member_added`, `team_member_removed` (server) |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1634718)
- [New User Signups & Logins](/insights/Cyt5yLHc) — Daily trend of signups vs logins
- [Signup → Onboarding Completion Funnel](/insights/Lu4WE5y1) — Conversion from signup to workspace creation
- [Pro Upgrade Conversion Funnel](/insights/jOS32zDB) — Checkout opened → payment completed
- [Task Creation Rate](/insights/1hYpbU1h) — Daily active users creating tasks
- [Pro Payments Verified (Revenue Events)](/insights/WZKMmBuo) — Server-confirmed successful payments

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
