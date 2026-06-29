// Extracted profile data dikhata hai — naam, contact, skills, experience, education.
export default function ProfileCard({ profile }) {
  if (!profile) {
    return (
      <div className="card">
        <h2>2 · Extracted profile</h2>
        <div className="empty">Abhi koi resume upload nahi hua. Upar upload karo.</div>
      </div>
    );
  }

  const f = (v) => v || <span style={{ color: 'var(--muted)' }}>—</span>;

  return (
    <div className="card">
      <h2>2 · Extracted profile</h2>

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
        ) : <span style={{ color: 'var(--muted)' }}>Koi skill detect nahi hui</span>}
      </div>

      <div style={{ marginTop: 22 }}>
        <label style={labelStyle}>Experience</label>
        {profile.experiences?.length ? profile.experiences.map((e) => (
          <div key={e.id} className="exp-item">
            <div className="role">{e.title || 'Role'} {e.company && `· ${e.company}`}</div>
            <div className="meta">{[e.startDate, e.endDate].filter(Boolean).join(' – ')}</div>
            {e.description && <div className="desc">{e.description}</div>}
          </div>
        )) : <span style={{ color: 'var(--muted)' }}>Experience detect nahi hua (AI mode me aayega)</span>}
      </div>

      <div style={{ marginTop: 22 }}>
        <label style={labelStyle}>Education</label>
        {profile.educations?.length ? profile.educations.map((ed) => (
          <div key={ed.id} className="exp-item">
            <div className="role">{ed.degree || 'Degree'} {ed.field && `· ${ed.field}`}</div>
            <div className="meta">{ed.school} {ed.endDate && `· ${ed.endDate}`}</div>
          </div>
        )) : <span style={{ color: 'var(--muted)' }}>Education detect nahi hua</span>}
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
