# AutoResumeApply

Resume upload → data extraction → profile + applications on the dashboard.

## Architecture (MVC)

```
backend/  (Node + Express, MVC)
  src/
    routes/        → which URL goes to which controller
    controllers/   → handle requests (C)
    models/        → Prisma DB access (M)
    services/      → resume text extraction + LLM parse (business logic)
    middleware/    → file upload (multer), error handling
    config/        → prisma client
  prisma/schema.prisma → DB tables (SQLite)

frontend/ (React + Vite)
  src/
    api/client.js  → backend API calls
    components/     → UploadCard, ProfileCard, ApplicationsTable
    App.jsx         → dashboard (V)
```

### Flow
1. React `UploadCard` → POSTs the file to the backend at `/api/resume/upload`
2. `fileExtractor` extracts text from the PDF/DOCX
3. `resumeParser` turns text → structured JSON (LLM if an API key is present, otherwise heuristic)
4. `profileModel` → saves to the DB via Prisma
5. The React dashboard displays data from `/api/profile` + `/api/applications`

## How to run

### Backend
```bash
cd backend
npm install
npx prisma db push      # creates the SQLite DB
npm run dev             # http://localhost:4000
```
To enable LLM parsing: add `OPENROUTER_API_KEY=...` to `.env` (copy from `.env.example`). Get a key here: https://openrouter.ai/keys

### Frontend
```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

Open **http://localhost:5173** in your browser → upload a resume.

> Note: there is no longer any dummy/seed data. Jobs appear in the table via the **Discover** button (from real ATS boards).

## API endpoints
| Method | Path | Purpose |
|--------|------|--------|
| POST | `/api/resume/upload` | resume upload + parse (field: `resume`) |
| GET  | `/api/profile` | latest extracted profile |
| GET  | `/api/applications` | all applications |
| POST | `/api/applications` | add a new application |
| PATCH| `/api/applications/:id/status` | status update |
| POST | `/api/discover` | discover jobs from ATS boards |
| POST | `/api/applications/:id/apply` | **auto-fill** the form (Puppeteer); body `{submit?}` |
| GET  | `/api/applications/:id/screenshot` | screenshot of the filled form |
| GET  | `/api/apply/info` | supported ATS + submit on/off |

## Auto-apply (Fill phase — Puppeteer)

Click **Fill** in the table on a discovered job → the backend opens a browser, fills the ATS form
(name/email/phone), **attaches the resume**, and drafts answers to **screening questions**
using the LLM. Then it takes a **screenshot** and sets the status to `FILLED`.

- Chromium downloads automatically as soon as `puppeteer` is installed (no separate setup).
- **Default = review mode**: it fills the form but does **not** submit — you review the screenshot.
- **A real submit** sits behind two gates (so nothing is spammed by accident): UI/API `submit:true` **AND** `ALLOW_SUBMIT=true` in `.env`.
- To see the browser, set `PUPPETEER_HEADLESS=false` in `.env` (default); for background use, set it to `true`.
- Currently supported ATS: **Greenhouse, Lever** (Ashby/Workable/SmartRecruiters = coming).

## What's next (next steps)
- Fill adapters for the remaining ATS (Ashby/Workable/SmartRecruiters)
- Select/radio/checkbox screening questions (currently text only)
- Profile **edit** feature; custom career pages (Workday); Auth (multi-user)
