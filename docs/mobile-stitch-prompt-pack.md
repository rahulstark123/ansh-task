# ANSH Tasks — Stitch Per-Screen Prompt Pack

Use this with Google Stitch (or similar).  
1. Paste **Shared system prompt** once at the start of a session.  
2. Paste **one screen prompt** at a time.  
3. Keep the same brand tokens across all generations.

**App:** ANSH Tasks · MSME workspace · India-first  
**Platform:** iOS + Android mobile (phone-first)  
**Web reference:** https://tasks.anshapps.com

---

## Shared system prompt (paste first, every session)

```
You are designing ANSH Tasks, a mobile productivity app for MSME teams in India.

Product: Kanban/list tasks, projects, Brain Board sticky notes, teams with HR-depth profiles, announcements, activity feed, support tickets, Free/Trial/Pro billing (INR via Razorpay).

Roles: Owner, Admin, Editor, Observer.
Free limits: 2 members, 3 projects, 50 tasks/month. Pro ~₹199/user/month.

Visual system (strict):
- Brand gradient: #00c6ff → #7000ff → #e040fb (use sparingly on CTAs/hero, not whole UI)
- Surfaces: zinc neutrals, soft borders, rounded-xl / 2xl
- Accent: teal as default primary; also allow blue / indigo / violet / rose
- Status: zinc=todo, teal=in progress, amber=on hold, rose=blocked, red=overdue, emerald=done
- Priority: rose=high/urgent, amber=medium/normal, emerald=low
- Light + dark mode friendly
- Typography: modern professional (not Inter/Roboto/Arial defaults if avoidable)
- Avoid: purple-kitsch overload, cream+#terracotta serif look, newspaper dense columns, emoji decoration, heavy glow, pill-stat strips, card spam in heroes

Mobile UX patterns:
- Bottom tab bar: Home | Tasks | Projects | Brain | More
- FAB for primary create actions
- Bottom sheets for filters, upgrade, confirmations
- Full-screen detail pages (not desktop modals)
- Swipe actions on list rows where useful
- Clear empty states with one CTA
- Safe areas, 44pt+ tap targets, readable hierarchy

Tone: trustworthy MSME tool — clean, calm, capable. Not playful consumer social.
```

---

## Screen checklist

| # | Screen | Priority | Notes |
|---|--------|----------|-------|
| 01 | Landing | MVP | Marketing |
| 02 | Login | MVP | |
| 03 | Signup | MVP | |
| 04 | Forgot password | MVP | |
| 05 | Reset password | MVP | |
| 06 | Onboarding — Profile | MVP | Step 1/4 |
| 07 | Onboarding — Workspace | MVP | Step 2/4 |
| 08 | Onboarding — First project | MVP | Step 3/4 |
| 09 | Onboarding — Seed tasks / completing | MVP | Step 4 + loader |
| 10 | Dashboard (Home) | MVP | |
| 11 | Tasks list | MVP | My / All |
| 12 | Tasks board (Kanban) | MVP | Horizontal columns |
| 13 | Task filters sheet | MVP | |
| 14 | Task detail | MVP | |
| 15 | Add / Edit task | MVP | |
| 16 | Projects list | MVP | |
| 17 | Project detail | MVP | Details + Tasks tabs |
| 18 | Add / Edit project | MVP | |
| 19 | Brain Board canvas | MVP | |
| 20 | Sticky note editor sheet | MVP | |
| 21 | More menu | MVP | Hub |
| 22 | Teams list | Phase 2 | |
| 23 | Add teammate wizard | Phase 2 | 3 steps |
| 24 | Member detail | Phase 2 | |
| 25 | Announcements | Phase 2 | Pro |
| 26 | Activity feed | Phase 2 | Pro |
| 27 | Support list | MVP | |
| 28 | Create ticket | MVP | |
| 29 | Ticket detail + replies | MVP | |
| 30 | Settings hub | MVP | |
| 31 | Profile settings | MVP | |
| 32 | Company settings | Phase 2 | |
| 33 | Workspace lookups | Phase 2 | |
| 34 | Permissions matrix | Phase 2 | |
| 35 | Task defaults | Phase 2 | |
| 36 | Billing | Phase 2 | |
| 37 | Appearance sheet | MVP | |
| 38 | Upgrade / plan limit sheet | MVP | |
| 39 | Permission denied sheet | MVP | |
| 40 | Empty / error / offline | MVP | Shared states |

---

## 01 — Landing

```
Design the mobile Landing screen for ANSH Tasks.

One composition first viewport: brand name "ANSH Tasks" as hero-level signal, one short headline about MSME workspace (tasks + Brain Board + team ops), one supporting sentence, CTA group (Sign up primary, Log in secondary). Full-bleed atmospheric background (subtle gradient/pattern, not flat white). No cards in hero. No stats, pricing, or feature grids in the first viewport.

Below fold (separate sections, one job each):
1) Features: Kanban tasks, Brain Board, Teams — simple, not card spam
2) Pricing tease: Free vs Pro
3) Trust: Udyam MSME / India-first
4) Footer: Contact / WhatsApp / Privacy / Terms

Light mode. Phone frame. Clean MSME productivity aesthetic.
```

---

## 02 — Login

```
Design the mobile Login screen for ANSH Tasks.

Top: small brand mark + "Welcome back".
Form: Email, Password with show/hide, primary "Log in" button.
Secondary: "Continue with Google" button (outlined).
Links: Forgot password? · Create account.
Space for inline error banner (rose/subtle).
Clean single-column form, generous spacing, no split desktop marketing panel.
Light mode. Include a dark mode variant if possible.
```

---

## 03 — Signup

```
Design the mobile Signup screen for ANSH Tasks.

Title: Create your account.
Fields: Full name, Email, Password (with strength meter), Confirm password, checkbox "I accept Terms & Privacy".
Primary CTA: Create account.
Secondary: Continue with Google.
Link: Already have an account? Log in.
Single column, mobile keyboard-friendly. Light mode.
```

---

## 04 — Forgot password

```
Design Forgot Password for ANSH Tasks mobile.

Title + short help text.
Field: Email.
Primary CTA: Send reset link.
Back to login link.
Success state variant: confirmation message that email was sent.
```

---

## 05 — Reset password

```
Design Reset Password for ANSH Tasks mobile.

Fields: New password, Confirm password (show/hide).
Primary CTA: Update password.
Simple, secure, calm UI. Success → redirect hint to login.
```

---

## 06 — Onboarding · Profile (step 1/4)

```
Design Onboarding step 1/4 — Profile — for ANSH Tasks.

Stepper at top: Profile · Workspace · Project · Tasks (step 1 active).
Fields: First name, Last name, Email (may be prefilled/read-only), Phone (required), Job title, Department.
Checkbox: Accept terms.
Primary CTA: Continue.
Avatar placeholder with generated default hint.
Clean wizard layout, progress clear.
```

---

## 07 — Onboarding · Workspace (step 2/4)

```
Design Onboarding step 2/4 — Workspace — for ANSH Tasks.

Stepper: step 2 active.
Fields: Workspace name, Company size (select), Industry (select).
Primary: Continue. Secondary: Back.
One purpose: create the company workspace.
```

---

## 08 — Onboarding · First project (step 3/4)

```
Design Onboarding step 3/4 — First project — for ANSH Tasks.

Stepper: step 3 active.
Fields: Project name, Category, Priority (Urgent/High/Normal/Low with color chips).
Primary: Continue. Secondary: Back.
```

---

## 09 — Onboarding · Seed tasks + Completing

```
Design two related screens for ANSH Tasks onboarding:

A) Step 4/4 — Seed 3 starter tasks: simple list of 3 editable task titles with checkmarks, CTA "Finish setup".
B) Completing state: full-screen calm loader/animation "Setting up your workspace…" then transition to Dashboard.

Keep brand accent subtle. No clutter.
```

---

## 10 — Dashboard (Home tab)

```
Design the Home / Dashboard tab for ANSH Tasks mobile.

Top bar: greeting "Good Morning, {FirstName}", plan chip (Free/Trial/Pro), avatar.
Summary row (not a dashboard card wall): Projects count, Tasks completion, Members, Open tickets — compact metrics.
Sections:
1) Recent tasks (list rows with status/priority)
2) Projects (name + progress bar + health dot)
3) Recent support tickets

Pro-locked teaser block: "Advanced analytics" with lock + Upgrade.
Bottom tab bar active on Home.
Empty-friendly if no data. Light mode + note dark mode.
```

---

## 11 — Tasks list (Tasks tab)

```
Design Tasks list screen for ANSH Tasks mobile.

Top: title Tasks, segment control My | All, search icon, filter icon.
List rows: title, priority chip, status, due date, assignee avatars, labels (max 2 +n).
Swipe actions: Done / Edit / Delete.
FAB: Add task (bottom-right).
Bottom tab active on Tasks.
Empty state: "No tasks to show" + Create task CTA.
Include filter-active chip row example.
```

---

## 12 — Tasks board (Kanban)

```
Design mobile Kanban board for ANSH Tasks.

Horizontal scroll columns: To Do | In Progress | On Hold | Blocked | Overdue | Done.
Each column: header with count, compact task cards (title, priority, due, avatars).
Toggle in header: List | Board (Board selected).
FAB Add task.
Phone-friendly column width (~80% screen), snap scroll.
Status colors per system tokens.
```

---

## 13 — Task filters sheet

```
Design a bottom sheet for Task filters in ANSH Tasks.

Sections: Priority, Status, Labels, Assignee, Category — multi-select chips.
Actions: Clear all · Apply filters.
Handle/grabber, 70–85% height, scrollable content.
```

---

## 14 — Task detail

```
Design full-screen Task Detail for ANSH Tasks.

Header: back, title editable feel, overflow (Edit/Delete).
Blocks:
- Description
- Meta grid: Status, Priority, Due, Estimate, Category
- Labels chips
- Project link row
- Assignees (multi avatars + add)
- Attachments list (upload button, file rows)
- Notes thread (bubbles/list with author + time, composer at bottom)

Primary status control easy to tap. Delete confirm via sheet.
```

---

## 15 — Add / Edit task

```
Design Add Task (and Edit Task same layout) full-screen form for ANSH Tasks.

Fields: Title, Description, Category, Priority chips (Urgent/High/Normal/Low), Status select, Due date picker, Labels multi, Assignees multi, Estimate, Project select, Attachments.
CTA: Save task (sticky bottom).
Cancel in header.
Keyboard-aware mobile form. Validation error example on title.
```

---

## 16 — Projects list

```
Design Projects list for ANSH Tasks mobile.

Search + filter (status/priority).
Rows/cards (prefer list over heavy cards): name, short description, progress bar, priority, status, health dot, due, member avatars.
FAB: Add project.
Empty: "No projects — create your first".
Free plan hint if at 3/3 projects.
Bottom tab active on Projects.
```

---

## 17 — Project detail

```
Design Project Detail with tabs: Details | Tasks.

Details tab: name, description, progress slider/bar, start/due dates, priority, status (Discovery/Planning/Active/Review/Completed/On Hold), health, owner, estimated hours, category, members.
Tasks tab: task list for this project + Add task.
Header overflow: Edit / Delete.
```

---

## 18 — Add / Edit project

```
Design Add/Edit Project form for ANSH Tasks.

Fields matching project model: name, description, progress, dates, priority, status, health, owner, estimated hours, category, members multi-select.
Sticky Save. Clean mobile form.
```

---

## 19 — Brain Board canvas

```
Design Brain Board screen for ANSH Tasks — infinite sticky-note canvas on mobile.

Toolbar: Search, Zoom −/+, Recenter, New sticky.
Canvas: scattered colored stickies (Yellow/Blue/Purple/Green/Rose) with title + short body; slight rotation ok.
Empty state centered: "Create your first sticky" + CTA.
Bottom tab active on Brain.
Gesture-friendly; avoid tiny controls.
```

---

## 20 — Sticky note editor sheet

```
Design bottom sheet to create/edit a Brain Board sticky.

Fields: Title, Body, Color picker (5 colors).
Actions: Save · Delete (edit mode, destructive).
Compact, focused, one job.
```

---

## 21 — More menu

```
Design More tab hub for ANSH Tasks.

List rows with icons:
- Teams
- Announcements (Pro badge)
- Activity (Pro badge)
- Support
- Settings
- Appearance
- Billing
- Log out (destructive)

User header: avatar, name, role, plan chip.
Bottom tab active on More.
```

---

## 22 — Teams list

```
Design Teams / Members list for ANSH Tasks.

Member rows: avatar, name, role chip, department, phone/email secondary.
FAB or header CTA: Add teammate.
Free limit banner if 2/2 members.
Empty CTA to invite first teammate.
```

---

## 23 — Add teammate wizard (3 steps)

```
Design a 3-step Add Teammate wizard for ANSH Tasks (mobile).

Step 1 Identity: name, email, phone, temporary password.
Step 2 Job: designation, role (admin/editor/observer), department, branch, reports-to, joining date, employment status, work location, reporting HR.
Step 3 Emergency: personal email, blood group, emergency contact name/phone.

Stepper + Continue / Back / Finish.
HR-depth but not overwhelming — grouped sections, clear labels.
```

---

## 24 — Member detail

```
Design Member Detail profile for ANSH Tasks.

Header: avatar, name, role, department, contact actions (call/mail).
Sections: Job info, HR/emergency (collapsible), Assigned tasks list, Recent activity.
Actions: Edit · Remove member.
```

---

## 25 — Announcements (Pro)

```
Design Announcements screen for ANSH Tasks (Pro).

Segment: Active | Archived.
Cards/rows: title, body preview, pin badge, author, date.
Header CTA: New announcement.
Actions on item: Pin, Archive/Restore, Edit, Delete.
Empty Active: "No announcements yet".
Locked Free variant: blur/lock + Upgrade sheet entry.
```

---

## 26 — Activity feed (Pro)

```
Design Activity feed for ANSH Tasks (Pro).

Filter chips: All | Tasks | Projects | Team | Support.
Timeline rows: category icon, action text, badge, relative time, chevron deep link.
Pull-to-refresh affordance.
Empty: "No activity yet".
Free locked variant with Upgrade.
```

---

## 27 — Support list

```
Design Support Center list for ANSH Tasks.

Tabs: All | Open | In Progress | Resolved.
Ticket rows: subject, category, priority chip, status, updated time.
CTA: New ticket.
Empty state with create CTA.
```

---

## 28 — Create ticket

```
Design Create Support Ticket form.

Fields: Subject, Category (Technical/Billing/General/Feedback), Priority, Description, image attachments.
CTA: Submit ticket.
Success flash/confirmation state.
```

---

## 29 — Ticket detail + replies

```
Design Ticket Detail with reply thread.

Top: subject, status, category, priority, description, attachments.
Thread: user vs admin reply bubbles (author, time).
Composer: reply field + send (disabled if Resolved).
Status visible; Resolved shows closed state.
```

---

## 30 — Settings hub

```
Design Settings hub list for ANSH Tasks.

Rows: Profile, Company, Workspace, Permissions, Task defaults, Billing, Appearance, Support.
Simple grouped list. Back to More.
```

---

## 31 — Profile settings

```
Design Profile settings form.

Avatar upload, First/Last name, email, phone, bio, job title, department, designation, timezone, language.
HR fields in secondary section: employee code, blood group, emergency contacts, branch, joining date, etc.
Role shown read-only.
Save CTA.
```

---

## 32 — Company settings

```
Design Company settings for workspace owner/admin.

Fields: Company name, domain, industry, size, address, city/country, website, billing email, logo.
Save CTA. Permission-aware (others see read-only or denied).
```

---

## 33 — Workspace lookups

```
Design Workspace settings to manage lists: Departments, Designations, Work locations.

Each section: list of items + Add + swipe delete/edit.
Simple CRUD mobile pattern.
```

---

## 34 — Permissions matrix

```
Design Permissions settings for ANSH Tasks.

Role cards: Owner (locked full access), Admin, Editor, Observer.
Below: searchable toggle matrix for permissions:
Workspace admin, Announcements, Team Space chat, Tasks & projects, Billing, Brain Board.
Save / Reset.
Mobile: horizontal scroll for roles OR accordion per role with toggles — pick the clearer phone pattern.
```

---

## 35 — Task defaults

```
Design Task Defaults settings.

Default priority, status, category, labels.
Links/rows to manage: Statuses (Kanban columns), Categories, Labels.
Explain briefly these apply to new tasks.
```

---

## 36 — Billing

```
Design Billing screen for ANSH Tasks (INR).

Current plan card: Free / Trial / Pro + expiry if trial.
Compare Free vs Pro features.
Seat stepper (users count).
Billing cycle: Monthly | Yearly (~19% off).
Price summary in ₹.
CTA: Upgrade with Razorpay / Manage seats.
Subscription status + invoices hint.
Trustworthy finance UI — clear numbers, no clutter.
```

---

## 37 — Appearance sheet

```
Design Appearance bottom sheet.

Color mode: Light | Dark | System (segmented).
Accent colors: Blue, Indigo, Violet, Teal, Rose (swatches).
Apply immediately preview strip.
```

---

## 38 — Upgrade / plan limit sheet

```
Design Upgrade bottom sheet shown when Free limits hit or Pro feature tapped.

Headline variants:
- "You've reached the Free plan limit"
- "This feature is on Pro"

Show what limit was hit (members/projects/tasks) OR feature name.
Short Free vs Pro compare.
CTA: Upgrade to Pro → Billing.
Secondary: Not now.
```

---

## 39 — Permission denied sheet

```
Design Permission denied bottom sheet.

Icon + "You don't have access".
Message: Contact your Admin or Owner.
CTA: Got it.
Calm, not alarming.
```

---

## 40 — Empty / error / offline states

```
Design a set of shared mobile empty and error states for ANSH Tasks:

1) Empty tasks
2) Empty projects
3) Empty Brain Board
4) Empty announcements
5) Empty activity
6) Empty teams
7) Search no results
8) Offline / Something went wrong + Retry button

Consistent illustration style (simple geometric, not cartoon mascot spam), one short line, one CTA where relevant.
```

---

## How to use in Stitch (workflow)

1. Start a new Stitch project named **ANSH Tasks Mobile**.
2. Paste **Shared system prompt**.
3. Generate screens in order **01 → 21** for MVP.
4. After each screen, pin/save favorites that match tokens.
5. When asking for the next screen, add:  
   `Match the visual system and components of the previous ANSH Tasks screens.`
6. Generate Phase 2 screens **22–36** after MVP is consistent.
7. Export frames → hand to engineering (Flutter / React Native / Expo).

### Consistency add-on (append to every screen prompt)

```
Match ANSH Tasks mobile design system: zinc surfaces, teal primary accent, status/priority color tokens, rounded-xl, bottom tabs, FAB where noted, bottom sheets for secondary flows. Phone frame, light mode primary; keep dark-mode compatible contrast.
```

---

## Optional CSV checklist

Copy into a spreadsheet:

```csv
id,screen,priority,tab,prompt_section,status
01,Landing,MVP,Auth,01,
02,Login,MVP,Auth,02,
03,Signup,MVP,Auth,03,
04,Forgot password,MVP,Auth,04,
05,Reset password,MVP,Auth,05,
06,Onboarding Profile,MVP,Auth,06,
07,Onboarding Workspace,MVP,Auth,07,
08,Onboarding Project,MVP,Auth,08,
09,Onboarding Completing,MVP,Auth,09,
10,Dashboard,MVP,Home,10,
11,Tasks list,MVP,Tasks,11,
12,Tasks board,MVP,Tasks,12,
13,Task filters sheet,MVP,Tasks,13,
14,Task detail,MVP,Tasks,14,
15,Add Edit task,MVP,Tasks,15,
16,Projects list,MVP,Projects,16,
17,Project detail,MVP,Projects,17,
18,Add Edit project,MVP,Projects,18,
19,Brain Board,MVP,Brain,19,
20,Sticky editor sheet,MVP,Brain,20,
21,More menu,MVP,More,21,
22,Teams list,Phase2,More,22,
23,Add teammate wizard,Phase2,More,23,
24,Member detail,Phase2,More,24,
25,Announcements,Phase2,More,25,
26,Activity feed,Phase2,More,26,
27,Support list,MVP,More,27,
28,Create ticket,MVP,More,28,
29,Ticket detail,MVP,More,29,
30,Settings hub,MVP,More,30,
31,Profile settings,MVP,More,31,
32,Company settings,Phase2,More,32,
33,Workspace lookups,Phase2,More,33,
34,Permissions matrix,Phase2,More,34,
35,Task defaults,Phase2,More,35,
36,Billing,Phase2,More,36,
37,Appearance sheet,MVP,Global,37,
38,Upgrade sheet,MVP,Global,38,
39,Permission denied,MVP,Global,39,
40,Empty error states,MVP,Global,40,
```
