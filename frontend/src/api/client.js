// Backend ke saath baat karne ke saare functions ek jagah.
const BASE = '/api';

export async function uploadResume(file) {
  const form = new FormData();
  form.append('resume', file);
  const res = await fetch(`${BASE}/resume/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error((await res.json()).error || 'Upload fail hua');
  return res.json();
}

export async function getProfile() {
  const res = await fetch(`${BASE}/profile`);
  if (res.status === 404) return null; // abhi koi resume nahi
  if (!res.ok) throw new Error('Profile load nahi hua');
  return (await res.json()).profile;
}

export async function getApplications() {
  const res = await fetch(`${BASE}/applications`);
  if (!res.ok) throw new Error('Applications load nahi hue');
  return (await res.json()).applications;
}

// Saari jobs clear karo (clean slate). Returns { cleared }.
export async function clearApplications() {
  const res = await fetch(`${BASE}/applications`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Jobs clear nahi hui');
  return res.json();
}

// Available ATS boards ka summary.
export async function getBoards() {
  const res = await fetch(`${BASE}/discover/boards`);
  if (!res.ok) throw new Error('Boards load nahi hue');
  return res.json();
}

// Latest resume se suggested job keywords.
export async function getKeywords() {
  const res = await fetch(`${BASE}/discover/keywords`);
  if (!res.ok) throw new Error('Keywords load nahi hue');
  return (await res.json()).keywords;
}

// Discovery chalu karo. opts: { ats: string[], limitPerBoard, query }
export async function discoverJobs(opts = {}) {
  const res = await fetch(`${BASE}/discover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Discovery fail hui');
  return res.json();
}

// Apply phase info: kaunse ATS supported + submit on/off.
export async function getApplyInfo() {
  const res = await fetch(`${BASE}/apply/info`);
  if (!res.ok) throw new Error('Apply info load nahi hua');
  return res.json();
}

// Ek job pe apply form bharo (Puppeteer). submit:true tabhi submit (env ALLOW_SUBMIT bhi chahiye).
export async function applyToJob(id, { submit = false } = {}) {
  const res = await fetch(`${BASE}/applications/${id}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submit }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Apply fail hui');
  return res.json();
}

// Bhare hue form ke screenshot ka URL (review ke liye).
export function screenshotUrl(id) {
  return `${BASE}/applications/${id}/screenshot`;
}
