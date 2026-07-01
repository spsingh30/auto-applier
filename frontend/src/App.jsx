import { useEffect, useState, useCallback } from 'react';
import UploadCard from './components/UploadCard';
import ProfileCard from './components/ProfileCard';
import ApplicationsTable from './components/ApplicationsTable';
import DiscoverCard from './components/DiscoverCard';
import PreferencesCard from './components/PreferencesCard';
import { getProfile, getApplications } from './api/client';

export default function App() {
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState(null);

  // Fetch fresh data from the backend.
  const refresh = useCallback(async () => {
    try {
      const [p, apps] = await Promise.all([getProfile(), getApplications()]);
      setProfile(p);
      setApplications(apps);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="app">
      <header>
        <h1>AutoResumeApply</h1>
        <p>Upload your resume → data gets extracted → the dashboard shows where applications are being sent.</p>
      </header>

      {error && <div className="toast err">{error}</div>}

      <UploadCard onUploaded={refresh} />
      <ProfileCard profile={profile} />
      <PreferencesCard />
      <DiscoverCard profile={profile} onDiscovered={refresh} />
      <ApplicationsTable applications={applications} onChanged={refresh} />
    </div>
  );
}
