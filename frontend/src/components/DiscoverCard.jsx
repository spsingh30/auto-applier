import { useEffect, useState } from 'react';
import { getBoards, getKeywords, discoverJobs } from '../api/client';

const ATS_LABELS = {
  greenhouse: 'Greenhouse',
  ashby: 'Ashby',
  workable: 'Workable',
  lever: 'Lever',
  smartrecruiters: 'SmartRecruiters',
};

// Verified ATS boards se open jobs discover karta hai (no login / no captcha).
// Resume se suggested keywords dikhata hai — user select kare, unhi se jobs filter hoti hain.
export default function DiscoverCard({ profile, onDiscovered }) {
  const [boards, setBoards] = useState(null);
  const [selected, setSelected] = useState(['lever']); // default chhota — fast test
  const [suggested, setSuggested] = useState([]); // resume se aaye keywords
  const [picked, setPicked] = useState([]); // user ne jo keywords chune
  const [loadingKw, setLoadingKw] = useState(false);
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(15);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getBoards().then(setBoards).catch(() => {});
  }, []);

  // Profile aane/badalne par suggested keywords le aao.
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
        setPicked(kw.slice(0, 3)); // pehle 3 default select — quick start
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
      <h2>0 · Jobs discover karo</h2>
      <p style={{ color: 'var(--muted)', marginTop: -6 }}>
        Verified ATS boards (no login · no captcha) se open jobs nikaal ke neeche table me daalta hai.
      </p>

      {error && <div className="toast err">{error}</div>}

      {/* --- Resume se suggested keywords --- */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Resume ke hisaab se suggested keywords</label>
        {!profile?.id ? (
          <span style={{ color: 'var(--muted)' }}>Pehle resume upload karo — phir keywords aayenge.</span>
        ) : loadingKw ? (
          <span style={{ color: 'var(--muted)' }}>Keywords nikaal rahe hain…</span>
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
              {picked.length} selected — inhi keywords wali jobs dhoondi jaayengi.
            </small>
          </>
        ) : (
          <span style={{ color: 'var(--muted)' }}>Koi keyword suggest nahi hua.</span>
        )}
      </div>

      <label style={labelStyle}>Boards (kahaan dhoondhein)</label>
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
          {busy ? 'Dhoondh raha hai…' : `Find jobs (${slugCount} boards)`}
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

const labelStyle = {
  display: 'block', fontSize: 11, textTransform: 'uppercase',
  color: 'var(--muted)', marginBottom: 10,
};
