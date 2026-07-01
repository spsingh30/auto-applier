import { useEffect, useState } from 'react';
import { getBoards, getKeywords, discoverJobs } from '../api/client';

const ATS_LABELS = {
  greenhouse: 'Greenhouse',
  ashby: 'Ashby',
  workable: 'Workable',
  lever: 'Lever',
  smartrecruiters: 'SmartRecruiters',
};

// Discovers open jobs from verified ATS boards (no login / no captcha).
// Shows suggested keywords from the resume — the user selects them, and jobs are filtered by those.
export default function DiscoverCard({ profile, onDiscovered }) {
  const [boards, setBoards] = useState(null);
  const [selected, setSelected] = useState(['lever']); // small default — fast test
  const [suggested, setSuggested] = useState([]); // keywords from the resume
  const [picked, setPicked] = useState([]); // keywords the user picked
  const [loadingKw, setLoadingKw] = useState(false);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(15);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getBoards().then(setBoards).catch(() => {});
  }, []);

  // Fetch suggested keywords when the profile arrives/changes.
  useEffect(() => {
    if (!profile?.id) {
      setSuggested([]);
      setPicked([]);
      return;
    }
    setLoadingKw(true);
    getKeywords()
      .then((kw) => {
        setSuggested(kw);
        setPicked(kw.slice(0, 3)); // select the first 3 by default — quick start
      })
      .catch(() => setSuggested([]))
      .finally(() => setLoadingKw(false));
  }, [profile?.id]);

  function toggle(ats) {
    setSelected((prev) => (prev.includes(ats) ? prev.filter((a) => a !== ats) : [...prev, ats]));
  }

  function togglePick(kw) {
    setPicked((prev) => (prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]));
  }

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await discoverJobs({
        ats: selected,
        limitPerBoard: Number(limit),
        queries: picked, // selected keywords
        query: query.trim(), // extra manual keyword (optional)
        clear: true, // remove all old jobs before a new search (clean slate)
      });
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
      <h2>0 · Discover jobs</h2>
      <p style={{ color: 'var(--muted)', marginTop: -6 }}>
        Pulls open jobs from verified ATS boards (no login · no captcha) and adds them to the table below.
        <br />
        <strong>Note:</strong> all old jobs are cleared before every new search (clean slate).
      </p>

      {error && <div className="toast err">{error}</div>}

      {/* --- Suggested keywords from the resume --- */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Suggested keywords based on your resume</label>
        {!profile?.id ? (
          <span style={{ color: 'var(--muted)' }}>Upload a resume first — then keywords will appear.</span>
        ) : loadingKw ? (
          <span style={{ color: 'var(--muted)' }}>Extracting keywords…</span>
        ) : suggested.length ? (
          <>
            <div className="chips">
              {suggested.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  className={`chip ${picked.includes(kw) ? 'chip-on' : ''}`}
                  onClick={() => togglePick(kw)}
                >
                  {kw}
                </button>
              ))}
            </div>
            <small style={{ color: 'var(--muted)' }}>
              {picked.length} selected — jobs matching these keywords will be searched.
            </small>
          </>
        ) : (
          <span style={{ color: 'var(--muted)' }}>No keywords suggested.</span>
        )}
      </div>

      <label style={labelStyle}>Boards (where to search)</label>
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
          Extra keyword (optional)
          <input
            type="text"
            placeholder="e.g. remote, senior"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Max jobs / board
          <input type="number" min="1" max="100" value={limit} onChange={(e) => setLimit(e.target.value)} />
        </label>
        <button className="btn-primary" disabled={busy || !selected.length} onClick={run}>
          {busy ? 'Searching…' : `Find jobs (${slugCount} boards)`}
        </button>
      </div>

      {busy && (
        <div className="empty" style={{ marginTop: 12 }}>
          Scanning {slugCount} boards… (polite rate-limit, hang on a moment)
        </div>
      )}

      {result && (
        <div className="toast ok" style={{ marginTop: 12 }}>
          ✅ {result.cleared ? `${result.cleared} old jobs cleared · ` : ''}
          {result.discovered} jobs found · {result.added} newly added ·{' '}
          {result.boardsHit} boards OK{result.boardsFailed ? `, ${result.boardsFailed} failed` : ''}
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: 11, textTransform: 'uppercase',
  color: 'var(--muted)', marginBottom: 10,
};
