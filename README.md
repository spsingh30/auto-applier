# AutoResumeApply — Step 1

Resume upload → data extract → dashboard pe profile + applications.

## Architecture (MVC)

```
backend/  (Node + Express, MVC)
  src/
    routes/        → kaunsa URL kaunse controller pe jaaye
    controllers/   → request handle karte hain (C)
    models/        → Prisma DB access (M)
    services/      → resume text extract + LLM parse (business logic)
    middleware/    → file upload (multer), error handling
    config/        → prisma client
  prisma/schema.prisma → DB tables (SQLite)

frontend/ (React + Vite)
  src/
    api/client.js  → backend ke API calls
    components/     → UploadCard, ProfileCard, ApplicationsTable
    App.jsx         → dashboard (V)
```

### Flow
1. React `UploadCard` → file backend ko POST `/api/resume/upload`
2. `fileExtractor` PDF/DOCX se text nikaalta hai
3. `resumeParser` text → structured JSON (LLM agar API key ho, warna heuristic)
4. `profileModel` → Prisma se DB me save
5. React dashboard `/api/profile` + `/api/applications` se data dikhata hai

## Chalane ka tareeka

### Backend
```bash
cd backend
npm install
npx prisma db push      # SQLite DB banaye
npm run dev             # http://localhost:4000
```
LLM parsing on karne ke liye: `.env` me `OPENROUTER_API_KEY=...` daalo (`.env.example` copy karke). Key yahan se: https://openrouter.ai/keys

### Frontend
```bash
cd frontend
npm install
npm run dev             # http://localhost:5173
```

Browser me **http://localhost:5173** kholo → resume upload karo.

> Note: ab koi dummy/seed data nahi hai. Table me jobs **Discover** button se aati hain (asli ATS boards se).

## API endpoints
| Method | Path | Kaam |
|--------|------|------|
| POST | `/api/resume/upload` | resume upload + parse (field: `resume`) |
| GET  | `/api/profile` | latest extracted profile |
| GET  | `/api/applications` | saari applications |
| POST | `/api/applications` | nayi application add |
| PATCH| `/api/applications/:id/status` | status update |
| POST | `/api/discover` | ATS boards se jobs discover |
| POST | `/api/applications/:id/apply` | **auto-fill** form (Puppeteer); body `{submit?}` |
| GET  | `/api/applications/:id/screenshot` | bhare hue form ka screenshot |
| GET  | `/api/apply/info` | supported ATS + submit on/off |

## Auto-apply (Fill phase — Puppeteer)

Discover ki hui job pe table me **Fill** dabao → backend ek browser kholta hai, ATS form
(naam/email/phone) bhar deta hai, **resume attach** karta hai, aur **screening questions**
ke jawaab LLM se draft karta hai. Phir **screenshot** le ke status `FILLED` kar deta hai.

- `puppeteer` install hote hi Chromium khud download ho jaata hai (alag setup nahi).
- **Default = review mode**: form bharta hai par **submit nahi** karta — tum screenshot dekho.
- **Asli submit** do gate ke peeche (galti se spam na ho): UI/API `submit:true` **AUR** `.env` me `ALLOW_SUBMIT=true`.
- Browser dikhe to `.env` me `PUPPETEER_HEADLESS=false` (default), background ke liye `true`.
- Supported ATS abhi: **Greenhouse, Lever** (Ashby/Workable/SmartRecruiters = aage).

## Aage kya (next steps)
- Baaki ATS (Ashby/Workable/SmartRecruiters) ke fill adapters
- Select/radio/checkbox screening questions (abhi sirf text)
- Profile **edit** feature; custom career pages (Workday); Auth (multi-user)
