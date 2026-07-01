// Shows the extracted profile data — name, contact, skills, experience, education.
export default function ProfileCard({ profile }) {
  if (!profile) {
    return (
      <div className="card">
        <h2>2 · Extracted profile</h2>
        <div className="empty">No resume uploaded yet. Upload one above.</div>
      </div>
    );
  }

  const f = (v) => v || <span style={{ color: 'var(--muted)' }}>—</span>;

  function set(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }
  function addSkill() {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) set('skills', [...form.skills, s]);
    setSkillInput('');
  }
  function removeSkill(s) {
    set('skills', form.skills.filter((x) => x !== s));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await updateProfile(profile.id, form);
      setEditing(false);
      onSaved?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // ---------- EDIT MODE ----------
  if (editing && form) {
    return (
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>2 · Edit profile</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {error && <div className="toast err">{error}</div>}

        <div className="grid">
          {FIELDS.map(([key, label]) => (
            <div className="field" key={key}>
              <label>{label}</label>
              <input value={form[key]} onChange={(e) => set(key, e.target.value)} />
            </div>
          ))}
        </div>

        <div className="field" style={{ marginTop: 14 }}>
          <label>Summary</label>
          <textarea rows={3} value={form.summary} onChange={(e) => set('summary', e.target.value)} />
        </div>

        <div style={{ marginTop: 18 }}>
          <label style={labelStyle}>Skills</label>
          <div className="chips" style={{ marginBottom: 10 }}>
            {form.skills.map((s) => (
              <span key={s} className="chip">
                {s}
                <button type="button" className="chip-x" onClick={() => removeSkill(s)} aria-label="remove">×</button>
              </span>
            ))}
            {!form.skills.length && <span style={{ color: 'var(--muted)' }}>No skills — add some below</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder="New skill (e.g. Python)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
            />
            <button type="button" className="btn-ghost" onClick={addSkill}>+ Add</button>
          </div>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 14 }}>
          Note: Experience &amp; education aren't editable yet — only the fields above + skills.
        </p>
      </div>
    );
  }

  // ---------- VIEW MODE ----------
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>2 · Extracted profile</h2>
        <button className="btn-ghost" onClick={() => setEditing(true)}>✏️ Edit</button>
      </div>

      <div className="grid">
        <Field label="Full name" value={f(profile.fullName)} />
        <Field label="Email" value={f(profile.email)} />
        <Field label="Phone" value={f(profile.phone)} />
        <Field label="Location" value={f(profile.location)} />
        <Field label="LinkedIn" value={f(profile.linkedin)} />
        <Field label="Website" value={f(profile.website)} />
      </div>

      {profile.summary && (
        <div className="field" style={{ marginTop: 14 }}>
          <label>Summary</label>
          <div>{profile.summary}</div>
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <label style={labelStyle}>Skills</label>
        {profile.skills?.length ? (
          <div className="chips">
            {profile.skills.map((s) => <span key={s} className="chip">{s}</span>)}
          </div>
        ) : <span style={{ color: 'var(--muted)' }}>No skills detected</span>}
      </div>

      <div style={{ marginTop: 22 }}>
        <label style={labelStyle}>Experience</label>
        {profile.experiences?.length ? profile.experiences.map((e) => (
          <div key={e.id} className="exp-item">
            <div className="role">{e.title || 'Role'} {e.company && `· ${e.company}`}</div>
            <div className="meta">{[e.startDate, e.endDate].filter(Boolean).join(' – ')}</div>
            {e.description && <div className="desc">{e.description}</div>}
          </div>
        )) : <span style={{ color: 'var(--muted)' }}>No experience detected (will appear in AI mode)</span>}
      </div>

      <div style={{ marginTop: 22 }}>
        <label style={labelStyle}>Education</label>
        {profile.educations?.length ? profile.educations.map((ed) => (
          <div key={ed.id} className="exp-item">
            <div className="role">{ed.degree || 'Degree'} {ed.field && `· ${ed.field}`}</div>
            <div className="meta">{ed.school} {ed.endDate && `· ${ed.endDate}`}</div>
          </div>
        )) : <span style={{ color: 'var(--muted)' }}>No education detected</span>}
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: 11, textTransform: 'uppercase',
  color: 'var(--muted)', marginBottom: 10,
};

function Field({ label, value }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div>{value}</div>
    </div>
  );
}
