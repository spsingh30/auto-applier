// "Where we're applying" — discovered jobs + AI auto-fill (Puppeteer).
import { useState } from 'react';
import { autofillJob } from '../api/client';

export default function ApplicationsTable({ applications, discovering }) {
  const [busyId, setBusyId] = useState(null);
  const [result, setResult] = useState(null); // { job, data } — to display in the modal
  const [error, setError] = useState(null);

  async function fill(job) {
    setBusyId(job.id);
    setError(null);
    try {
      const data = await autofillJob(job.jobUrl);
      setResult({ job, data });
    } catch (e) {
      setError(`${job.company}: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="card">
      <h2>3 · Jobs & applications {applications?.length ? `(${applications.length})` : ''}</h2>

      {error && <div className="toast err">{error}</div>}

      {discovering ? (
        <div className="empty">⏳ Discovering the jobs… (new results coming in)</div>
      ) : applications?.length ? (
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Location</th>
              <th>ATS</th>
              <th>Status</th>
              <th>Link</th>
              <th>AI Fill</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => (
              <tr key={a.id}>
                <td>{a.company}</td>
                <td>{a.jobTitle}</td>
                <td>{a.location || '—'}</td>
                <td><span className="badge">{a.ats || '—'}</span></td>
                <td><span className={`status ${a.status}`}>{a.status}</span></td>
                <td>{a.jobUrl ? <a href={a.jobUrl} target="_blank" rel="noreferrer">open ↗</a> : '—'}</td>
                <td>
                  <button
                    className="btn-ghost"
                    style={{ padding: '5px 10px', fontSize: 13 }}
                    disabled={!a.jobUrl || busyId === a.id}
                    onClick={() => fill(a)}
                  >
                    {busyId === a.id ? 'Filling…' : '🤖 Fill'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty">No jobs yet. Click "Find jobs" above or upload a resume.</div>
      )}

      {result && <FillResult result={result} onClose={() => setResult(null)} />}
    </div>
  );
}

// Shows what the AI filled in + a screenshot of the filled form.
function FillResult({ result, onClose }) {
  const { job, data } = result;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>🤖 Auto-filled · {job.company}</h3>
          <button className="btn-ghost" onClick={onClose}>Close</button>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          The AI filled {data.filled.length} / {data.fieldCount} fields (not submitted — fill only).
        </p>

        <div style={{ fontSize: 13, marginBottom: 8 }}>
          📎 Resume: {data.resumeUploaded ? '✅ attached' : '— no file field found in this form / not attached'}
        </div>

        {data.required && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: data.required.filled === data.required.total ? 'var(--accent-2)' : 'var(--warn)' }}>
              ⭐ Required fields: {data.required.filled} / {data.required.total} filled
            </div>
            {data.required.empty?.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                Still empty (fill manually): {data.required.empty.join(', ')}
              </div>
            )}
          </div>
        )}

        {data.filled.length ? (
          <table style={{ marginBottom: 14 }}>
            <thead><tr><th>Field</th><th>Value</th></tr></thead>
            <tbody>
              {data.filled.map((f, i) => (
                <tr key={i}>
                  <td style={{ color: 'var(--muted)', fontSize: 12 }}>{f.selector}</td>
                  <td>{f.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty">The AI didn't find any field it could confidently fill.</div>}

        {data.screenshot && (
          <img src={data.screenshot} alt="filled form" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)' }} />
        )}
      </div>
    </div>
  );
}
