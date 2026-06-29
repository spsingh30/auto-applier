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

// Available ATS boards ka summary.
export async function getBoards() {
  const res = await fetch(`${BASE}/discover/boards`);
  if (!res.ok) throw new Error('Boards load nahi hue');
  return res.json();
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
