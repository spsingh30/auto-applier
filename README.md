# AutoResumeApply

Upload a resume → extract structured data → discover open jobs → let AI auto-fill the application forms.

## Architecture (MVC)

```
backend/  (Node + Express, MVC)
  src/
    routes/        → which URL goes to which controller
    controllers/   → handle requests (C)
    models/        → Prisma DB access (M)
    services/      → resume text extraction + LLM parse + discovery + autofill (business logic)
    middleware/    → file upload (multer), error handling
    config/        → prisma client
  prisma/schema.prisma → DB tables (SQLite)

frontend/ (React + Vite)
  src/
    api/client.js  → backend API calls
    components/     → UploadCard, ProfileCard, DiscoverCard, ApplicationsTable
    App.jsx         → dashboard (V)
```

### Flow
1. React `UploadCard` POSTs the file to the backend at `/api/resume/upload`.
2. `fileExtractor` pulls raw text out of the PDF/DOCX.
3. `resumeParser` turns that text into structured JSON (LLM if an API key is set, otherwise a heuristic fallback). It also stores the original file on disk for later attachment.
4. `profileModel` saves it to the DB via Prisma.
5. The React dashboard reads data from `/api/profile` and `/api/applications`.
6. `DiscoverCard` finds open jobs from verified ATS boards and adds them to the table.
7. From the table, the AI auto-fills a job's form (and attaches the resume) — it does **not** submit.

## Running it

### Backend
```bash
cd backend
npm install
npx prisma db push      # creates the SQLite DB
npm run dev             # http://localhost:4000
```

To enable LLM features, create `backend/.env` (copy from `.env.example`) and set:
```
OPENROUTER_API_KEY=...                         # https://openrouter.ai/keys
PARSE_MODEL=anthropic/claude-3.5-sonnet        # accurate; runs once per resume
FILL_MODEL=google/gemini-2.0-flash-001         # cheap; runs per job
```
Without a key the app still runs, just with a lower-accuracy heuristic fallback.

### Frontend
```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

Open **http://localhost:5173** in your browser and upload a resume.

> Note: there is no dummy/seed data. Jobs appear in the table via the **Discover** button (pulled from real ATS boards).

## API endpoints
| Method | Path | Purpose |
|--------|------|------|
| POST | `/api/resume/upload` | upload + parse a resume (field: `resume`) |
| GET  | `/api/profile` | latest extracted profile |
| PATCH| `/api/profile/:id` | edit the profile |
| GET  | `/api/applications` | all applications |
| POST | `/api/applications` | add a new application |
| PATCH| `/api/applications/:id/status` | update status |
| GET  | `/api/discover/boards` | available ATS boards |
| GET  | `/api/discover/keywords` | suggested job keywords from the resume |
| POST | `/api/discover` | discover open jobs from ATS boards |
| POST | `/api/autofill` | AI fills a job form (does not submit) |

## Next steps
- **Submit** the application (currently it only fills + screenshots).
- Browser **extension** for real autofill in the user's own browser.
- Auth (multi-user).
