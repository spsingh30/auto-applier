// All the functions for talking to the backend in one place.
const BASE = '/api';

export async function uploadResume(file) {
  const form = new FormData();
  form.append('resume', file);
  const res = await fetch(`${BASE}/resume/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
  return res.json();
}

export async function getProfile() {
  const res = await fetch(`${BASE}/profile`);
  if (res.status === 404) return null; // no resume yet
  if (!res.ok) throw new Error('Failed to load profile');
  return (await res.json()).profile;
}

// Save profile edits. data: { fullName, email, ..., skills: string[] }
export async function updateProfile(id, data) {
  const res = await fetch(`${BASE}/profile/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to save profile');
  return (await res.json()).profile;
}

export async function getApplications() {
  const res = await fetch(`${BASE}/applications`);
  if (!res.ok) throw new Error('Failed to load applications');
  return (await res.json()).applications;
}

// Summary of the available ATS boards.
export async function getBoards() {
  const res = await fetch(`${BASE}/discover/boards`);
  if (!res.ok) throw new Error('Failed to load boards');
  return res.json();
}

// Latest resume se suggested job keywords.
export async function getKeywords() {
  const res = await fetch(`${BASE}/discover/keywords`);
  if (!res.ok) throw new Error('Failed to load keywords');
  return (await res.json()).keywords;
}

// Auto-fill a job form using AI + Puppeteer (no submit). Returns { filled, screenshot, fieldCount }.
export async function autofillJob(jobUrl) {
  const res = await fetch(`${BASE}/autofill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobUrl }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Auto-fill failed');
  return res.json();
}

// Start discovery. opts: { ats: string[], limitPerBoard, query }
export async function discoverJobs(opts = {}) {
  const res = await fetch(`${BASE}/discover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Discovery failed');
  return res.json();
}
