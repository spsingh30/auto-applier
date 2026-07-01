// Common application questions — the user fills these once, and these answers are used during the fill phase
// (instead of AI guessing). This fixes wrong data + makes filling faster.
import { useEffect, useState } from 'react';
import { getPreferences, savePreferences } from '../api/client';

export default function PreferencesCard({ onSaved }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    getPreferences()
      .then(({ questions, answers }) => {
        setQuestions(questions);
        setAnswers(answers || {});
      })
      .catch(() => {});
  }, []);

  const set = (key, val) => setAnswers((prev) => ({ ...prev, [key]: val }));
  const filledCount = Object.values(answers).filter((v) => v && String(v).trim()).length;

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const saved = await savePreferences(answers);
      setAnswers(saved);
      setMsg({ type: 'ok', text: `✅ ${Object.keys(saved).length} answers saved — forms will now be filled from these.` });
      onSaved?.();
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>1 · Application answers (fill once)</span>
        <button className="chip" onClick={() => setOpen((o) => !o)}>
          {open ? 'hide' : `edit (${filledCount}/${questions.length})`}
        </button>
      </h2>
      <p style={{ color: 'var(--muted)', marginTop: -6 }}>
        These are the questions most companies ask. Fill them in — while filling, the bot
        won't guess with AI, it'll use the answers you provided (correct data + faster).
      </p>

      {msg && <div className={`toast ${msg.type}`} style={{ marginBottom: 10 }}>{msg.text}</div>}

      {open && (
        <>
          <div className="pref-grid">
            {questions.map((q) => (
              <label key={q.key} className="pref-field">
                <span>{q.label}</span>
                {q.type === 'select' ? (
                  <select value={answers[q.key] || ''} onChange={(e) => set(q.key, e.target.value)}>
                    <option value="">— choose —</option>
                    {q.options.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder={q.placeholder || ''}
                    value={answers[q.key] || ''}
                    onChange={(e) => set(q.key, e.target.value)}
                  />
                )}
              </label>
            ))}
          </div>
          <button className="btn-primary" disabled={busy} onClick={save} style={{ marginTop: 14 }}>
            {busy ? 'Saving…' : 'Save answers'}
          </button>
        </>
      )}
    </div>
  );
}
