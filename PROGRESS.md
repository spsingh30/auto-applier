# PROGRESS — AutoResumeApply

> Project ka **living tracker**. Har session ke baad yahan update karo: kya hua, kya chal raha hai, aage kya.
> README = "kaise chalaye". Ye file = "ab tak kya bana + kya pending".

**Current phase:** Step 2 — Auto-apply. **Discovery DONE** ✅ · **Fill layer (Puppeteer) DONE** ✅ · Submit = gated/manual
**Last updated:** 2026-06-29

---

## Ek line me
Resume upload karo → text extract → LLM (OpenRouter) se structured profile → SQLite → React dashboard pe profile + applications.

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
- Career-pages reference dataset (~480 companies) in `career_links.{csv,md,full.csv}` — crawler ke liye groundwork
- **OpenRouter migration** (Anthropic SDK hata diya) — key `backend/.env` me, gitignored
- **Discovery layer (Step 2, layer 1)** — 227 verified no-login/no-captcha boards (Greenhouse 109, Ashby 65, Workable 37, Lever 6, SmartRecruiters 10) ki public JSON APIs se open jobs nikaalta hai
  - `services/autoapply/boards.js` (slug config), `services/autoapply/discover.js` (fetch+normalize, rate-limit 350ms, per-board cap, keyword filter)
  - `POST /api/discover` + `GET /api/discover/boards`; dedup by `jobUrl` (`applicationModel.bulkCreateDiscovered`)
  - Schema: `Application.profileId` ab optional, `jobId`/`location` add, `jobUrl @unique`, naya status `DISCOVERED`
  - Frontend `DiscoverCard.jsx` — ATS chips + keyword + limit; table me Location column
- **Fill layer (Step 2, layer 2) — Puppeteer auto-fill** — discovered job pe ATS form khol ke standard fields + resume attach + screening answers bharta hai. **Live-tested**: Lever (Spotify) + Greenhouse (Affirm) real forms.
  - `services/autoapply/fill/browser.js` (reused browser, headed/headless via `PUPPETEER_HEADLESS`), `apply.js` (orchestrator + screenshot), `formUtils.js` (defensive fill helpers — select-all clear, checkbox/radio/file skip), `screening.js` (OpenRouter se screening-question answers, heuristic fallback)
  - Adapters: `adapters/greenhouse.js`, `adapters/lever.js`, `adapters/index.js` (ATS→adapter registry). Ashby/Workable/SmartRecruiters = TODO (template ready)
  - **Review mode default**: form bharo + full-page screenshot lo, **submit MAT karo**. Asli submit do gate ke peeche — `submit:true` body **AUR** env `ALLOW_SUBMIT=true`. (galti se real companies spam na ho)
  - Resume file ab disk pe save hoti hai (`services/fileStorage.js` → `uploads/`), `ResumeDocument.storagePath` me path — Puppeteer isi file ko attach karta hai
  - Schema add: `ResumeDocument.storagePath`, `Application.screenshotPath/fillNotes/filledAt`
  - API: `POST /api/applications/:id/apply` (body `{submit?}`), `GET /api/applications/:id/screenshot`, `GET /api/apply/info`
  - Frontend `ApplicationsTable.jsx` — per-row **Fill** (+ **Submit** jab `ALLOW_SUBMIT`), inline screenshot preview

## 🚧 In progress / decisions
- **Auto-apply design decided:** submit = **Discovery-only first** (done); fill phase me **review mode** lean; screening questions = **LLM-generate** (OpenRouter); ATS priority = sab + custom pages.
- Custom career pages (Workday/SuccessFactors/etc. — `career_links.md` ki tables) ka **uniform API nahi** → discovery se bahar; wo fill-phase me per-site Puppeteer se honge.
- LLM ab OpenRouter se chalta hai. Model `LLM_MODEL` env se badal sakte ho.
- Single-user assumption: `getLatest()` har jagah — abhi multi-user nahi.

## ⏭️ Next steps (priority order)
1. **More adapters** — Ashby + Workable + SmartRecruiters fill (template + registry ready; bas selectors map karo).
2. **Better screening** — select/radio/checkbox questions handle (abhi sirf text/textarea); combobox (e.g. Greenhouse "Country") me stray text type ho jaata hai — type-aware fill chahiye.
3. **Submit flow polish** — submit ke baad confirmation detect karke status pakka karo (abhi networkidle pe maan lete hain).
4. **Custom career pages** — per-site Puppeteer adapters (Workday etc.).
5. Profile **edit** feature.
6. **Auth** (multi-user).

## ⚠️ Known issues / tech debt
- Koi auth nahi + `cors()` fully open — sab endpoints public (local MVP ke liye theek, deploy se pehle fix)
- Email/LinkedIn/website pe `z.string()` hai, URL/email validation nahi
- `POST /api/applications` me client-diya `profileId` exist karta hai ya nahi — verify nahi hota (bad id → raw 500)
- Koi test nahi; Prisma migrations nahi (sirf `db push`)
- Project abhi **git repo nahi** hai — `git init` pending
- Teen overlapping `career_links` files — ek ko source-of-truth banao

---

## Changelog
- **2026-06-30** — **LinkedIn/GitHub/website capture from resume → 95% required-field coverage.** Problem: PDF resume me ye links clickable text/icon hote hain, actual URL extracted text me NAHI (PDF annotation layer me). Fix: `pdfjs-dist` se PDF hyperlink **annotations** nikaale (`services/pdfLinks.js`), classify (linkedin/github/website), profile me store (`Profile.github` add). resumeParser ab annotation URLs > text-regex > LLM-guess priority se links bharta hai. screeningFill ab link/url fields ko SKIP nahi karta — `type:'link'` taur pe profile URL se bharta hai (AI URL invent nahi karta). Verified: profile me linkedin/github/netlify-portfolio aaye; audit 12→4 unfilled (86%→95%). Bacha: US-state search-combobox (no valid option), Twitter (resume me nahi), 1 conditional textarea, 1 cover-letter "Attach".

- **2026-06-30** — **Required-field coverage audit + fixes (80%→86%).** 6 Greenhouse forms par audit: 87 required fields, pehle 70 filled (17 blank). Fixes: (1) combobox filter-empty bug — agar type-to-filter se list khaali ho jaaye to input clear karke full list se best/neutral option chuno (required kabhi blank na rahe); (2) chooseOption neutral regex broaden (other/international/outside/not-applicable bhi); (3) prompt: region/state dropdown me candidate ki location na ho to "Other/Outside US/International" chuno; (4) name-variants ("legal/preferred first/last name") ab SKIP me nahi — AI bharta hai (standard #first_name pehle se filled, value-check skip karta hai). Result: 75/87 filled (86%). Bacha: 10 link fields (profile me LinkedIn/GitHub/website URL nahi), 1 search-only US-state combobox (koi "Other" option hi nahi — India resident ke liye valid answer nahi, honest blank), 1 conditional textarea.

- **2026-06-30** — **Boards expand: 239 → 299.** `verified-companies.md` (421 companies) ke slugs `boards.js` me merge kiye, par PEHLE har naye slug ka JSON API live-verify kiya (verify-then-add). 362 candidate me se sirf **60 ke API kaam karte the** (302 ne 404 diya — apply-URL no-login ATS pe hai par public board JSON API expose nahi). Added: greenhouse +40 (calm, hubspot, intercom, carta, mercari, tripadvisor…), ashby +12 (motherduck, neon, render, attio, matter-labs…), lever +7 (mistral, meesho, voodoo, dreamsports, offchainlabs…), workable +1 (huggingface). Live-tested: 14 lever boards 0 fail, naye companies (Mistral/Meesho/Voodoo…) jobs de rahe hain. Sabak phir wahi: file ka "verified" = apply-host allowlisted, ≠ discovery API slug valid.

- **2026-06-29** — **Free-text questions (textarea) jo blank reh jaate the ab bharte hain.** Label detection strong ki: `labelFor()` ab field + uske ancestors ke previousElementSibling/heading me bhi label dhoondta hai (label aksar textarea ke UPAR sibling hota hai, shared wrapper me nahi → pehle skip ho jaata tha). Prompt me defaults: availability/fellowship start → "Immediately", "what job(s) applying for" → exact job title, conditional "if other, specify" → "N/A". Mock-form test: chaaron textareas sahi bhare (N/A / Immediately / Immediately / job-title).
- **2026-06-29** — **Option fields ab CHOOSE hote hain (type nahi).** `applyText` ab type karne ke baad check karta hai ki autocomplete/suggestion list aayi ya nahi — aayi to matching option **click** karta hai (typeahead text field = actually a chooser, e.g. Lever location). Option-selectors broaden kiye (`role=listbox`, `autocomplete`, `dropdown-menu`, `typeahead`). Saath: "Other website"/"Other Links" me junk ("Other") aa raha tha → website/link/url fields skip. Marketing-consent checkbox auto-tick band (sirf required agreement/terms tick hote hain; "contact me about future opportunities" type user pe chhoda). Verified Greenhouse (Affirm): Country/Pronouns/sponsorship/State/source/prev-employed sab **selected** (typed nahi), link fields blank. Limitation: **Lever forms pe hCaptcha** ("drag the shape") top fields ko overlay karta hai — headed mode me user solve kare, tabhi location autocomplete bharega.
- **2026-06-29** — **"Koi field blank na rahe" — full AI fill.** Ab har dropdown/combobox ke ASLI options pehle scrape (menu khol ke) hote hain, phir AI ko diye jaate hain → AI valid option hi chunta hai. `chooseOption()` exact→startsWith→includes→neutral("prefer not"/"other")→pehla — har option-field me kuch na kuch chunta hai. Prompt me common defaults (work-auth=Yes, sponsorship=location-based, "how did you hear"=LinkedIn, notice=Immediately, salary=Negotiable, demographic=Prefer-not-to-say). Sirf link/URL fields (LinkedIn/GitHub/Portfolio) blank rehte hain agar resume me na hon (fake URL invent nahi karte). Live (Affirm/GH): Country=India+91, Pronouns, sponsorship, State=Ontario, source=LinkedIn, prev-employed sab bhare. Note: Affirm ke "MyGreenhouse" resume-analyzer kabhi apni JS error deta hai (file phir bhi input me attached, submit pe chali jaati hai).
- **2026-06-29** — **AI full-form fill + OpenRouter live.** Key set (`openai/gpt-4o-mini`), resume ab `parsedBy: llm` (location/experience/education/summary/github/website nikalte hain → zyada fields bharte hain). Naya generic AI filler `fill/screeningFill.js`: poore form ke saare controls (text, textarea, **select, radio, checkbox, react-select combobox**) ko label+options ke saath scrape karke AI se bharta hai; combobox me menu khol ke matching option **click** karta hai; match na ho to honest **blank** chhodta hai (galat data se behtar). Greenhouse me resume **pehle** attach (analyze re-render se name clear ho raha tha — fixed). Dono adapters ab `fillRemaining()` use karte hain. Live-tested: Affirm (GH) — name/email/phone/company/preferred-name/pronouns/sponsorship/employment + resume; Spotify (Lever) — same + github/website/location. Known: Lever "Current location" autocomplete commit nahi hota; Spotify pe kabhi captcha aata hai (bot-detection) — review mode me user solve kare.
- **2026-06-29** — **Step 2 fill layer built + live-tested (Puppeteer).** Chromium auto-download (`puppeteer` dep). Greenhouse + Lever adapters: standard fields + resume attach + screening answers (OpenRouter, heuristic fallback). Review-mode default (screenshot, no submit); submit double-gated (`submit:true` + `ALLOW_SUBMIT=true`). Resume files ab `uploads/` me persist (`fileStorage.js`, `ResumeDocument.storagePath`). New API: `POST /applications/:id/apply`, `GET /applications/:id/screenshot`, `GET /apply/info`. Frontend per-row Fill/Submit + screenshot preview. **Verified:** Spotify (Lever) + Affirm (Greenhouse) real forms — name/email/phone/resume filled, FILLED status, no submit. Fixes: select-all clear (concat bug), checkbox/radio/file + link/url fields skip, screenshot settle-delay.
- **2026-06-27** — Discovery coverage expand: `career_links.md` ki Login=No companies ke slugs live-verify kiye. Galat/inferred slugs (~20: uber, shopify, razorpay, oyo, practo…) 404 nikle, isliye sirf verified add kiye → +lyft/purestorage/canonical/phonepe/coursera (GH), +cred (Lever), +Accor/LVMH/Block/Atlassian/IKEA/BNPParibas (SR). **Boards 227 → 239.** Sabak: file ka ATS column inferred hai, verify-then-add hi sahi.
- **2026-06-27** — Dummy/seed data **permanently removed**: 3 seed rows (Vercel/Linear/Notion) deleted from DB, `prisma/seed.js` deleted, `seed` npm script + README mention hata diye. Table ab sirf asli discovered jobs dikhata hai.
- **2026-06-27** — **Step 2 discovery layer built + live-tested.** 5 ATS JSON APIs probed (all 200). `boards.js` (227 slugs), `discover.js`, `discoverController.js`, `POST /api/discover` + `/discover/boards`. Schema migrated (profileId optional, jobId/location/unique jobUrl, DISCOVERED status) via `db push`. `DiscoverCard.jsx` UI. Verified: Lever 9 jobs + dedup re-run skipped all; SmartRecruiters 10/10 boards via HTTP.
- **2026-06-27** — Model id fix: `anthropic/claude-3.5-haiku` (invalid on OpenRouter) → `anthropic/claude-haiku-4.5`. Live test pass: `sample-resume.txt` → `method: llm`, name + skills + 2 experiences + 1 education sahi nikle. Key verified valid.
- **2026-06-27** — OpenRouter migration: parser ab `fetch` se OpenRouter `/chat/completions` call karta hai (`resumeParser.js`); `.env`/`.env.example`/`server.js`/`README.md` updated; `@anthropic-ai/sdk` dependency removed. `PROGRESS.md` add kiya.
- **2026-06-27** — Step 1 MVP scaffold complete (upload → parse → dashboard).
