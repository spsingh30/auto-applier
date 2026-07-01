# PROGRESS — AutoResumeApply

> The project's **living tracker**. Update it after every session: what happened, what's in progress, what's next.
> README = "how to run it". This file = "what's built so far + what's pending".

**Current phase:** Step 2 — Auto-apply. **Discovery DONE** ✅ · **Fill layer (Puppeteer) DONE** ✅ · Submit = gated/manual
**Last updated:** 2026-06-29

---

## In one line
Upload a resume → extract text → structured profile via LLM (OpenRouter) → SQLite → profile + applications on the React dashboard.

## Stack
- **Backend:** Node + Express (MVC), Prisma + SQLite, multer, pdf-parse, mammoth, zod, **puppeteer** (fill phase)
- **LLM:** OpenRouter (OpenAI-compatible `/chat/completions`), default model `anthropic/claude-3.5-haiku`
- **Frontend:** React + Vite (proxy `/api` → `:4000`)

---

## ✅ Done
- MVC backend: routes → controllers → models (Prisma) + services (extract/parse) + middleware (upload/error)
- File text extraction: PDF / DOCX / TXT (`services/fileExtractor.js`)
- Resume parsing with Zod-validated output + heuristic regex fallback (`services/resumeParser.js`)
- DB schema: Profile, WorkExperience, Education, ResumeDocument, Application (`prisma/schema.prisma`)
- API: `POST /api/resume/upload`, `GET /api/profile`, `GET /api/applications`, `POST /api/applications`, `PATCH /api/applications/:id/status`
- React dashboard: UploadCard, ProfileCard, ApplicationsTable
- Seed script for dummy applications (`prisma/seed.js`)
- Career-pages reference dataset (~480 companies) in `career_links.{csv,md,full.csv}` — groundwork for the crawler
- **OpenRouter migration** (removed the Anthropic SDK) — key in `backend/.env`, gitignored
- **Discovery layer (Step 2, layer 1)** — pulls open jobs from the public JSON APIs of 227 verified no-login/no-captcha boards (Greenhouse 109, Ashby 65, Workable 37, Lever 6, SmartRecruiters 10)
  - `services/autoapply/boards.js` (slug config), `services/autoapply/discover.js` (fetch+normalize, rate-limit 350ms, per-board cap, keyword filter)
  - `POST /api/discover` + `GET /api/discover/boards`; dedup by `jobUrl` (`applicationModel.bulkCreateDiscovered`)
  - Schema: `Application.profileId` is now optional, added `jobId`/`location`, `jobUrl @unique`, new status `DISCOVERED`
  - Frontend `DiscoverCard.jsx` — ATS chips + keyword + limit; Location column in the table
- **Fill layer (Step 2, layer 2) — Puppeteer auto-fill** — opens the ATS form on a discovered job and fills standard fields + attaches the resume + fills screening answers. **Live-tested**: Lever (Spotify) + Greenhouse (Affirm) real forms.
  - `services/autoapply/fill/browser.js` (reused browser, headed/headless via `PUPPETEER_HEADLESS`), `apply.js` (orchestrator + screenshot), `formUtils.js` (defensive fill helpers — select-all clear, checkbox/radio/file skip), `screening.js` (screening-question answers via OpenRouter, heuristic fallback)
  - Adapters: `adapters/greenhouse.js`, `adapters/lever.js`, `adapters/index.js` (ATS→adapter registry). Ashby/Workable/SmartRecruiters = TODO (template ready)
  - **Review mode default**: fill the form + take a full-page screenshot, do **NOT** submit. A real submit sits behind two gates — `submit:true` in the body **AND** env `ALLOW_SUBMIT=true`. (so real companies don't get spammed by accident)
  - The resume file is now saved to disk (`services/fileStorage.js` → `uploads/`), with the path in `ResumeDocument.storagePath` — Puppeteer attaches this file
  - Schema additions: `ResumeDocument.storagePath`, `Application.screenshotPath/fillNotes/filledAt`
  - API: `POST /api/applications/:id/apply` (body `{submit?}`), `GET /api/applications/:id/screenshot`, `GET /api/apply/info`
  - Frontend `ApplicationsTable.jsx` — per-row **Fill** (+ **Submit** when `ALLOW_SUBMIT`), inline screenshot preview

## 🚧 In progress / decisions
- **Auto-apply design decided:** submit = **Discovery-only first** (done); lean toward **review mode** in the fill phase; screening questions = **LLM-generate** (OpenRouter); ATS priority = all + custom pages.
- Custom career pages (Workday/SuccessFactors/etc. — the tables in `career_links.md`) have **no uniform API** → out of scope for discovery; they'll be handled per-site with Puppeteer in the fill phase.
- The LLM now runs via OpenRouter. You can change the model via the `LLM_MODEL` env var.
- Single-user assumption: `getLatest()` everywhere — no multi-user yet.

## ⏭️ Next steps (priority order)
1. **More adapters** — Ashby + Workable + SmartRecruiters fill (template + registry ready; just map the selectors).
2. **Better screening** — handle select/radio/checkbox questions (currently text/textarea only); comboboxes (e.g. Greenhouse "Country") get stray text typed into them — need type-aware fill.
3. **Submit flow polish** — after submit, detect the confirmation to confirm the status for sure (currently we assume it on networkidle).
4. **Custom career pages** — per-site Puppeteer adapters (Workday etc.).
5. Profile **edit** feature.
6. **Auth** (multi-user).

## ⚠️ Known issues / tech debt
- No auth + `cors()` fully open — all endpoints public (fine for a local MVP, fix before deploy)
- Email/LinkedIn/website use `z.string()`, with no URL/email validation
- `POST /api/applications` doesn't verify whether the client-supplied `profileId` exists (bad id → raw 500)
- No tests; no Prisma migrations (only `db push`)
- The project is **not a git repo** yet — `git init` pending
- Three overlapping `career_links` files — make one the source of truth

---

## Changelog
- **2026-06-30** — **Preferences questionnaire + speed + deterministic name/Apply button.** (1) New `Preferences` feature: 15 common application questions (work-auth, sponsorship, relocate, work-setting, notice, salary, experience, pronouns, gender, race, veteran, disability, source, 18+) — the user fills them out once (`PreferencesCard`, `PUT/GET /api/preferences`, QUESTIONS + matcher in `services/autoapply/preferences.js`). The fill phase now uses the user's answer via matchPreference first (not an AI guess) → fixes wrong data + reduces AI calls. (2) **Name fields are now deterministic** — "Preferred/legal first/last name" are filled from the profile name (the AI was giving something wrong like "LinkedIn" → fixed). (3) **Speed**: trimmed combobox/screenshot/analyze delays (~25s→~22s; the more pref-matched, the more the savings). (4) Frontend: "Fill" button → **"Apply"**, new Preferences card with Save. Schema: `Preferences` model.

- **2026-06-30** — **LinkedIn/GitHub/website capture from resume → 95% required-field coverage.** Problem: in a PDF resume these links are clickable text/icons, and the actual URL is NOT in the extracted text (it's in the PDF annotation layer). Fix: extract PDF hyperlink **annotations** with `pdfjs-dist` (`services/pdfLinks.js`), classify (linkedin/github/website), store in the profile (added `Profile.github`). resumeParser now fills links by priority: annotation URLs > text-regex > LLM-guess. screeningFill no longer SKIPS link/url fields — it fills them from the profile URL as `type:'link'` (the AI doesn't invent URLs). Verified: linkedin/github/netlify-portfolio showed up in the profile; audit went 12→4 unfilled (86%→95%). Remaining: US-state search-combobox (no valid option), Twitter (not in the resume), 1 conditional textarea, 1 cover-letter "Attach".

- **2026-06-30** — **Required-field coverage audit + fixes (80%→86%).** Audit across 6 Greenhouse forms: 87 required fields, previously 70 filled (17 blank). Fixes: (1) combobox filter-empty bug — if type-to-filter empties the list, clear the input and pick the best/neutral option from the full list (a required field should never stay blank); (2) broadened the chooseOption neutral regex (also other/international/outside/not-applicable); (3) prompt: if the region/state dropdown doesn't contain the candidate's location, pick "Other/Outside US/International"; (4) name variants ("legal/preferred first/last name") are no longer SKIPPED — the AI fills them (the standard #first_name is already filled, and skips the value-check). Result: 75/87 filled (86%). Remaining: 10 link fields (no LinkedIn/GitHub/website URL in the profile), 1 search-only US-state combobox (no "Other" option at all — not a valid answer for an India resident, honest blank), 1 conditional textarea.

- **2026-06-30** — **Boards expand: 239 → 299.** Merged slugs from `verified-companies.md` (421 companies) into `boards.js`, but FIRST live-verified each new slug's JSON API (verify-then-add). Of 362 candidates only **60 had working APIs** (302 returned 404 — the apply URL is on a no-login ATS but the public board JSON API isn't exposed). Added: greenhouse +40 (calm, hubspot, intercom, carta, mercari, tripadvisor…), ashby +12 (motherduck, neon, render, attio, matter-labs…), lever +7 (mistral, meesho, voodoo, dreamsports, offchainlabs…), workable +1 (huggingface). Live-tested: 14 lever boards 0 failures, new companies (Mistral/Meesho/Voodoo…) returning jobs. Same lesson again: "verified" in the file = apply-host allowlisted, ≠ valid discovery API slug.

- **2026-06-29** — **Free-text questions (textarea) that were left blank now get filled.** Strengthened label detection: `labelFor()` now also looks for the label in the field's + its ancestors' previousElementSibling/heading (the label is often a sibling ABOVE the textarea, not in a shared wrapper → previously it got skipped). Prompt defaults: availability/fellowship start → "Immediately", "what job(s) applying for" → the exact job title, conditional "if other, specify" → "N/A". Mock-form test: all four textareas filled correctly (N/A / Immediately / Immediately / job-title).
- **2026-06-29** — **Option fields are now CHOSEN (not typed).** `applyText` now checks, after typing, whether an autocomplete/suggestion list appeared — if it did, it **clicks** the matching option (a typeahead text field is actually a chooser, e.g. Lever location). Broadened the option-selectors (`role=listbox`, `autocomplete`, `dropdown-menu`, `typeahead`). Also: junk ("Other") was landing in "Other website"/"Other Links" → skip website/link/url fields. Disabled auto-ticking the marketing-consent checkbox (only required agreement/terms get ticked; "contact me about future opportunities" type is left to the user). Verified Greenhouse (Affirm): Country/Pronouns/sponsorship/State/source/prev-employed all **selected** (not typed), link fields blank. Limitation: **hCaptcha on Lever forms** ("drag the shape") overlays the top fields — in headed mode the user should solve it, only then will the location autocomplete fill.
- **2026-06-29** — **"No field left blank" — full AI fill.** Now the REAL options of every dropdown/combobox are scraped first (by opening the menu), then given to the AI → the AI only picks a valid option. `chooseOption()` — exact→startsWith→includes→neutral("prefer not"/"other")→first — picks something in every option field. Common defaults in the prompt (work-auth=Yes, sponsorship=location-based, "how did you hear"=LinkedIn, notice=Immediately, salary=Negotiable, demographic=Prefer-not-to-say). Only link/URL fields (LinkedIn/GitHub/Portfolio) stay blank if they're not in the resume (we don't invent fake URLs). Live (Affirm/GH): Country=India+91, Pronouns, sponsorship, State=Ontario, source=LinkedIn, prev-employed all filled. Note: Affirm's "MyGreenhouse" resume-analyzer sometimes throws its own JS error (the file is still attached to the input and goes through on submit).
- **2026-06-29** — **AI full-form fill + OpenRouter live.** Key set (`openai/gpt-4o-mini`), resume is now `parsedBy: llm` (extracts location/experience/education/summary/github/website → fills more fields). New generic AI filler `fill/screeningFill.js`: scrapes all of the form's controls (text, textarea, **select, radio, checkbox, react-select combobox**) along with their labels+options and fills them via the AI; for a combobox it opens the menu and **clicks** the matching option; if there's no match it leaves an honest **blank** (better than wrong data). In Greenhouse the resume is attached **first** (the analyze re-render was clearing the name — fixed). Both adapters now use `fillRemaining()`. Live-tested: Affirm (GH) — name/email/phone/company/preferred-name/pronouns/sponsorship/employment + resume; Spotify (Lever) — same + github/website/location. Known: Lever "Current location" autocomplete doesn't commit; Spotify sometimes shows a captcha (bot-detection) — the user should solve it in review mode.
- **2026-06-29** — **Step 2 fill layer built + live-tested (Puppeteer).** Chromium auto-download (`puppeteer` dep). Greenhouse + Lever adapters: standard fields + resume attach + screening answers (OpenRouter, heuristic fallback). Review-mode default (screenshot, no submit); submit double-gated (`submit:true` + `ALLOW_SUBMIT=true`). Resume files now persist in `uploads/` (`fileStorage.js`, `ResumeDocument.storagePath`). New API: `POST /applications/:id/apply`, `GET /applications/:id/screenshot`, `GET /apply/info`. Frontend per-row Fill/Submit + screenshot preview. **Verified:** Spotify (Lever) + Affirm (Greenhouse) real forms — name/email/phone/resume filled, FILLED status, no submit. Fixes: select-all clear (concat bug), skip checkbox/radio/file + link/url fields, screenshot settle-delay.
- **2026-06-27** — Discovery coverage expand: live-verified the slugs of the Login=No companies in `career_links.md`. Wrong/inferred slugs (~20: uber, shopify, razorpay, oyo, practo…) came back 404, so only verified ones were added → +lyft/purestorage/canonical/phonepe/coursera (GH), +cred (Lever), +Accor/LVMH/Block/Atlassian/IKEA/BNPParibas (SR). **Boards 227 → 239.** Lesson: the file's ATS column is inferred, verify-then-add is the right approach.
- **2026-06-27** — Dummy/seed data **permanently removed**: 3 seed rows (Vercel/Linear/Notion) deleted from the DB, `prisma/seed.js` deleted, `seed` npm script + README mention removed. The table now shows only real discovered jobs.
- **2026-06-27** — **Step 2 discovery layer built + live-tested.** Probed 5 ATS JSON APIs (all 200). `boards.js` (227 slugs), `discover.js`, `discoverController.js`, `POST /api/discover` + `/discover/boards`. Schema migrated (profileId optional, jobId/location/unique jobUrl, DISCOVERED status) via `db push`. `DiscoverCard.jsx` UI. Verified: Lever 9 jobs + a dedup re-run skipped all; SmartRecruiters 10/10 boards via HTTP.
- **2026-06-27** — Model id fix: `anthropic/claude-3.5-haiku` (invalid on OpenRouter) → `anthropic/claude-haiku-4.5`. Live test passed: `sample-resume.txt` → `method: llm`, name + skills + 2 experiences + 1 education extracted correctly. Key verified valid.
- **2026-06-27** — OpenRouter migration: the parser now calls OpenRouter `/chat/completions` via `fetch` (`resumeParser.js`); `.env`/`.env.example`/`server.js`/`README.md` updated; `@anthropic-ai/sdk` dependency removed. Added `PROGRESS.md`.
- **2026-06-27** — Step 1 MVP scaffold complete (upload → parse → dashboard).
