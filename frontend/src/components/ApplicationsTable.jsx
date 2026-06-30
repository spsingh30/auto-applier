// "Hum kahan apply kar rahe hain" — discovered jobs + applications ka tracking table.
// Har row pe "Apply" button: Puppeteer se form bharta hai (review mode — submit nahi).
import { useEffect, useState } from 'react';
import { getApplyInfo, applyToJob, screenshotUrl } from '../api/client';

export default function ApplicationsTable({ applications, onChanged }) {
  const [info, setInfo] = useState({ supportedATS: [], submitAllowed: false });
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState(null);
  const [shotFor, setShotFor] = useState(null); // kis application ka screenshot dikhana hai

  useEffect(() => {
    getApplyInfo().then(setInfo).catch(() => {});
  }, []);

  async function apply(a, submit) {
    setBusyId(a.id);
    setMsg(null);
    try {
      const r = await applyToJob(a.id, { submit });
      const attach = r.resumeAttached ? '' : ' (resume attach nahi — re-upload karo)';
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
        Apply = browser me form auto-bharta hai (Greenhouse · Lever).{' '}
        {info.submitAllowed
          ? 'Submit ON hai — "Apply & submit" asli submit karega.'
          : 'Review mode: form bharta hai, submit nahi (screenshot dekho). Submit on karne ke liye .env me ALLOW_SUBMIT=true.'}
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
                        title="Form bharo + screenshot (submit nahi)"
                      >
                        {busyId === a.id ? '…' : 'Fill'}
                      </button>
                      {info.submitAllowed && (
                        <button
                          className="btn-primary"
                          style={{ background: '#b91c1c' }}
                          disabled={busyId === a.id}
                          onClick={() => apply(a, true)}
                          title="Form bharo + ASLI submit"
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
        <div className="empty">Abhi koi job nahi. Upar "Discover" dabao ya resume upload karo.</div>
      )}

      {shotFor && (
        <div style={{ marginTop: 14 }}>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 6 }}>
            Bhare hue form ka screenshot (review karo):
          </div>
          <img
            src={`${screenshotUrl(shotFor)}?t=${Date.now()}`}
            alt="filled form"
            style={{ maxWidth: '100%', border: '1px solid var(--border, #333)', borderRadius: 8 }}
          />
        </div>
      )}
    </div>
  );
}
