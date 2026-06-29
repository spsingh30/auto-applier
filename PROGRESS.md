# PROGRESS — AutoResumeApply

> Project ka **living tracker**. Har session ke baad yahan update karo: kya hua, kya chal raha hai, aage kya.
> README = "kaise chalaye". Ye file = "ab tak kya bana + kya pending".

**Current phase:** Step 2 — Auto-apply. **Discovery layer DONE** ✅ · Fill/submit = next
**Last updated:** 2026-06-27

---

## Ek line me
Resume upload karo → text extract → LLM (OpenRouter) se structured profile → SQLite → React dashboard pe profile + applications.

## Stack
- **Backend:** Node + Express (MVC), Prisma + SQLite, multer, pdf-parse, mammoth, zod
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
- Career-pages reference dataset (~480 companies) in `career_links.{csv,md,full.csv}` — crawler ke liye groundwork
- **OpenRouter migration** (Anthropic SDK hata diya) — key `backend/.env` me, gitignored
- **Discovery layer (Step 2, layer 1)** — 227 verified no-login/no-captcha boards (Greenhouse 109, Ashby 65, Workable 37, Lever 6, SmartRecruiters 10) ki public JSON APIs se open jobs nikaalta hai
  - `services/autoapply/boards.js` (slug config), `services/autoapply/discover.js` (fetch+normalize, rate-limit 350ms, per-board cap, keyword filter)
  - `POST /api/discover` + `GET /api/discover/boards`; dedup by `jobUrl` (`applicationModel.bulkCreateDiscovered`)
  - Schema: `Application.profileId` ab optional, `jobId`/`location` add, `jobUrl @unique`, naya status `DISCOVERED`
  - Frontend `DiscoverCard.jsx` — ATS chips + keyword + limit; table me Location column

## 🚧 In progress / decisions
- **Auto-apply design decided:** submit = **Discovery-only first** (done); fill phase me **review mode** lean; screening questions = **LLM-generate** (OpenRouter); ATS priority = sab + custom pages.
- Custom career pages (Workday/SuccessFactors/etc. — `career_links.md` ki tables) ka **uniform API nahi** → discovery se bahar; wo fill-phase me per-site Puppeteer se honge.
- LLM ab OpenRouter se chalta hai. Model `LLM_MODEL` env se badal sakte ho.
- Single-user assumption: `getLatest()` har jagah — abhi multi-user nahi.

## ⏭️ Next steps (priority order)
1. **Fill layer (Puppeteer)** — adapters per ATS: `fill(page, profile, job)` standard fields + resume upload; screenshot; status FILLED. Start: Greenhouse + Lever (stable selectors).
2. **Screening-question answering** — OpenRouter se job description + profile par answers draft (review zaroori).
3. **Custom career pages** — per-site Puppeteer adapters (Workday etc.).
4. Profile **edit** feature.
5. **Auth** (multi-user).

## ⚠️ Known issues / tech debt
- Koi auth nahi + `cors()` fully open — sab endpoints public (local MVP ke liye theek, deploy se pehle fix)
- Email/LinkedIn/website pe `z.string()` hai, URL/email validation nahi
- `POST /api/applications` me client-diya `profileId` exist karta hai ya nahi — verify nahi hota (bad id → raw 500)
- Koi test nahi; Prisma migrations nahi (sirf `db push`)
- Project abhi **git repo nahi** hai — `git init` pending
- Teen overlapping `career_links` files — ek ko source-of-truth banao

---

## Changelog
- **2026-06-27** — Discovery coverage expand: `career_links.md` ki Login=No companies ke slugs live-verify kiye. Galat/inferred slugs (~20: uber, shopify, razorpay, oyo, practo…) 404 nikle, isliye sirf verified add kiye → +lyft/purestorage/canonical/phonepe/coursera (GH), +cred (Lever), +Accor/LVMH/Block/Atlassian/IKEA/BNPParibas (SR). **Boards 227 → 239.** Sabak: file ka ATS column inferred hai, verify-then-add hi sahi.
- **2026-06-27** — Dummy/seed data **permanently removed**: 3 seed rows (Vercel/Linear/Notion) deleted from DB, `prisma/seed.js` deleted, `seed` npm script + README mention hata diye. Table ab sirf asli discovered jobs dikhata hai.
- **2026-06-27** — **Step 2 discovery layer built + live-tested.** 5 ATS JSON APIs probed (all 200). `boards.js` (227 slugs), `discover.js`, `discoverController.js`, `POST /api/discover` + `/discover/boards`. Schema migrated (profileId optional, jobId/location/unique jobUrl, DISCOVERED status) via `db push`. `DiscoverCard.jsx` UI. Verified: Lever 9 jobs + dedup re-run skipped all; SmartRecruiters 10/10 boards via HTTP.
- **2026-06-27** — Model id fix: `anthropic/claude-3.5-haiku` (invalid on OpenRouter) → `anthropic/claude-haiku-4.5`. Live test pass: `sample-resume.txt` → `method: llm`, name + skills + 2 experiences + 1 education sahi nikle. Key verified valid.
- **2026-06-27** — OpenRouter migration: parser ab `fetch` se OpenRouter `/chat/completions` call karta hai (`resumeParser.js`); `.env`/`.env.example`/`server.js`/`README.md` updated; `@anthropic-ai/sdk` dependency removed. `PROGRESS.md` add kiya.
- **2026-06-27** — Step 1 MVP scaffold complete (upload → parse → dashboard).
