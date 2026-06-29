import { useEffect, useState } from 'react';
import { getBoards, discoverJobs } from '../api/client';

const ATS_LABELS = {
  greenhouse: 'Greenhouse',
  ashby: 'Ashby',
  workable: 'Workable',
  lever: 'Lever',
  smartrecruiters: 'SmartRecruiters',
};

// Verified ATS boards se open jobs discover karta hai (no login / no captcha).
export default function DiscoverCard({ onDiscovered }) {
  const [boards, setBoards] = useState(null);
  const [selected, setSelected] = useState(['lever']); // default chhota — fast test
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(15);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getBoards().then(setBoards).catch(() => {});
  }, []);

  function toggle(ats) {
    setSelected((prev) => (prev.includes(ats) ? prev.filter((a) => a !== ats) : [...prev, ats]));
  }

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await discoverJobs({ ats: selected, limitPerBoard: Number(limit), query: query.trim() });
      setResult(r);
      onDiscovered?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const slugCount = boards
    ? selected.reduce((sum, a) => sum + (boards.ats[a] || 0), 0)
    : 0;

  return (
    <div className="card">
      <h2>0 · Jobs discover karo</h2>
      <p style={{ color: 'var(--muted)', marginTop: -6 }}>
        Verified ATS boards (no login · no captcha) se open jobs nikaal ke neeche table me daalta hai.
      </p>

      {error && <div className="toast err">{error}</div>}

      <div className="chips" style={{ marginBottom: 14 }}>
        {Object.keys(ATS_LABELS).map((a) => (
          <button
            key={a}
            type="button"
            className={`chip ${selected.includes(a) ? 'chip-on' : ''}`}
            onClick={() => toggle(a)}
          >
            {ATS_LABELS[a]} {boards ? `(${boards.ats[a] ?? 0})` : ''}
          </button>
        ))}
      </div>

      <div className="discover-controls">
        <label>
          Keyword (optional)
          <input
            type="text"
            placeholder="e.g. engineer, frontend"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Max jobs / board
          <input type="number" min="1" max="100" value={limit} onChange={(e) => setLimit(e.target.value)} />
        </label>
        <button className="btn-primary" disabled={busy || !selected.length} onClick={run}>
          {busy ? 'Dhoondh raha hai…' : `Discover (${slugCount} boards)`}
        </button>
      </div>

      {busy && (
        <div className="empty" style={{ marginTop: 12 }}>
          {slugCount} boards scan ho rahe hain… (polite rate-limit, thoda ruko)
        </div>
      )}

      {result && (
        <div className="toast ok" style={{ marginTop: 12 }}>
          ✅ {result.discovered} jobs mile · {result.added} naye add · {result.skipped} pehle se the ·{' '}
          {result.boardsHit} boards OK{result.boardsFailed ? `, ${result.boardsFailed} fail` : ''}
        </div>
      )}
    </div>
  );
}
