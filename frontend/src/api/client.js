// All the functions for talking to the backend, in one place.
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

export async function getApplications() {
  const res = await fetch(`${BASE}/applications`);
  if (!res.ok) throw new Error('Failed to load applications');
  return (await res.json()).applications;
}

// Clear all jobs (clean slate). Returns { cleared }.
export async function clearApplications() {
  const res = await fetch(`${BASE}/applications`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear jobs');
  return res.json();
}

// Summary of available ATS boards.
export async function getBoards() {
  const res = await fetch(`${BASE}/discover/boards`);
  if (!res.ok) throw new Error('Failed to load boards');
  return res.json();
}

// Suggested job keywords from the latest resume.
export async function getKeywords() {
  const res = await fetch(`${BASE}/discover/keywords`);
  if (!res.ok) throw new Error('Failed to load keywords');
  return (await res.json()).keywords;
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

// Preferences (common application answers) — questions + saved answers.
export async function getPreferences() {
  const res = await fetch(`${BASE}/preferences`);
  if (!res.ok) throw new Error('Failed to load preferences');
  return res.json(); // { questions, answers }
}

export async function savePreferences(answers) {
  const res = await fetch(`${BASE}/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error('Failed to save preferences');
  return (await res.json()).answers;
}

// Apply phase info: which ATS are supported + submit on/off.
export async function getApplyInfo() {
  const res = await fetch(`${BASE}/apply/info`);
  if (!res.ok) throw new Error('Failed to load apply info');
  return res.json();
}

// Fill the apply form for one job (Puppeteer). submit:true actually submits (also needs env ALLOW_SUBMIT).
export async function applyToJob(id, { submit = false } = {}) {
  const res = await fetch(`${BASE}/applications/${id}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submit }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Apply failed');
  return res.json();
}

// URL of the filled form's screenshot (for review).
export function screenshotUrl(id) {
  return `${BASE}/applications/${id}/screenshot`;
}
