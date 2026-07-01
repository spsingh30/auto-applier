// "Where we're applying" — a tracking table of discovered jobs + applications.
// Each row has an "Apply" button: Puppeteer fills the form (review mode — no submit).
import { useEffect, useState } from 'react';
import { getApplyInfo, applyToJob, screenshotUrl } from '../api/client';

export default function ApplicationsTable({ applications, onChanged }) {
  const [info, setInfo] = useState({ supportedATS: [], submitAllowed: false });
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState(null);
  const [shotFor, setShotFor] = useState(null); // which application's screenshot to show

  useEffect(() => {
    getApplyInfo().then(setInfo).catch(() => {});
  }, []);

  async function apply(a, submit) {
    setBusyId(a.id);
    setMsg(null);
    try {
      const r = await applyToJob(a.id, { submit });
      const attach = r.resumeAttached ? '' : ' (resume not attached — please re-upload)';
      setMsg({
        type: r.ok ? 'ok' : 'err',
        text: r.ok
          ? `✅ ${a.company}: ${r.application.status}${r.submitted ? ' — SUBMITTED' : ' — review ready'}${attach}`
          : `❌ ${a.company}: fail — ${(r.notes || []).slice(-1)[0] || 'unknown'}`,
      });
      if (r.screenshotUrl) setShotFor(a.id);
      onChanged?.();
    } catch (e) {
      setMsg({ type: 'err', text: `❌ ${a.company}: ${e.message}` });
    } finally {
      setBusyId(null);
    }
  }

  const canApply = (a) => info.supportedATS.includes((a.ats || '').toLowerCase()) && a.jobUrl;

  return (
    <div className="card">
      <h2>3 · Jobs & applications {applications?.length ? `(${applications.length})` : ''}</h2>

      <p style={{ color: 'var(--muted)', marginTop: -6 }}>
        Apply = auto-fills the form in the browser (Greenhouse · Lever).{' '}
        {info.submitAllowed
          ? 'Submit is ON — "Apply & submit" will actually submit.'
          : 'Review mode: fills the form but does not submit (check the screenshot). To enable submit, set ALLOW_SUBMIT=true in .env.'}
      </p>

      {msg && <div className={`toast ${msg.type}`} style={{ marginTop: 8 }}>{msg.text}</div>}

      {applications?.length ? (
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Location</th>
              <th>ATS</th>
              <th>Status</th>
              <th>Link</th>
              <th>Apply</th>
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
                  {canApply(a) ? (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        className="btn-primary"
                        disabled={busyId === a.id}
                        onClick={() => apply(a, false)}
                        title="Auto-fill form + screenshot (no submit)"
                      >
                        {busyId === a.id ? 'Applying…' : 'Apply'}
                      </button>
                      {info.submitAllowed && (
                        <button
                          className="btn-primary"
                          style={{ background: '#b91c1c' }}
                          disabled={busyId === a.id}
                          onClick={() => apply(a, true)}
                          title="Fill form + REAL submit"
                        >
                          Submit
                        </button>
                      )}
                      {a.screenshotPath && (
                        <button className="chip" onClick={() => setShotFor(shotFor === a.id ? null : a.id)}>
                          {shotFor === a.id ? 'hide' : 'view'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontSize: 12 }}>
                      {a.ats ? `${a.ats} soon` : '—'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty">No jobs yet. Hit "Discover" above or upload a resume.</div>
      )}

      {shotFor && (
        <div style={{ marginTop: 14 }}>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>
            Screenshot of the filled form (please review):
          </div>
          <img
            src={`${screenshotUrl(shotFor)}?t=${Date.now()}`}
            alt="filled form"
            style={{ maxWidth: '100%', border: '1px solid var(--border, #333)', borderRadius: 8 }}
          />
        </div>
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
