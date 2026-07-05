import { LANDING_FAQS, WHAT_ANSH_TASKS_DOES } from "@/lib/landing-seo";
import { COMPANY_NAME, COMPANY_URL, SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * Server-rendered crawlable content for search engines and no-JS clients.
 * The interactive landing (LandingPageClient) hydrates on top; this ensures
 * Google indexes what ANSH Tasks does even before JavaScript runs.
 */
export function LandingSeoContent() {
  return (
    <noscript>
      <article
        style={{
          maxWidth: "48rem",
          margin: "0 auto",
          padding: "2rem 1.5rem",
          fontFamily: "system-ui, sans-serif",
          lineHeight: 1.6,
          color: "#18181b",
        }}
      >
        <h1>
          {SITE_NAME} — Task &amp; Project Management for MSME Teams
        </h1>
        <p>{WHAT_ANSH_TASKS_DOES}</p>
        <p>
          Visit <a href={SITE_URL}>{SITE_URL}</a> or explore the full{" "}
          <a href={COMPANY_URL}>{COMPANY_NAME}</a> product suite.
        </p>
        <h2>What does {SITE_NAME} do?</h2>
        <ul>
          <li>Kanban task boards for daily operations and project tracking</li>
          <li>Brain Board visual whiteboard for brainstorming and planning</li>
          <li>Team activity feed and pinned workspace announcements (Pro)</li>
          <li>Role-based team permissions and project management</li>
          <li>Integrated support ticketing from your dashboard</li>
          <li>Free plan for micro teams; Pro at ₹199/user/month</li>
        </ul>
        <h2>Frequently asked questions</h2>
        {LANDING_FAQS.map((faq) => (
          <section key={faq.question}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </section>
        ))}
        <p>
          <a href="/signup">Start free</a> · <a href="/login">Sign in</a> ·{" "}
          <a href="/contact">Contact</a>
        </p>
      </article>
    </noscript>
  );
}
