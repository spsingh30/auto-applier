// "Hum kahan apply kar rahe hain" — discovered jobs + applications ka tracking table.
export default function ApplicationsTable({ applications }) {
  return (
    <div className="card">
      <h2>3 · Jobs & applications {applications?.length ? `(${applications.length})` : ''}</h2>
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
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty">Abhi koi job nahi. Upar "Discover" dabao ya resume upload karo.</div>
      )}
    </div>
  );
}
