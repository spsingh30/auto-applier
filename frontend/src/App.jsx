import { useEffect, useState, useCallback } from 'react';
import UploadCard from './components/UploadCard';
import ProfileCard from './components/ProfileCard';
import ApplicationsTable from './components/ApplicationsTable';
import DiscoverCard from './components/DiscoverCard';
import { getProfile, getApplications } from './api/client';

export default function App() {
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState(null);

  // Fetch the latest data from the backend.
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

  // When discovery starts, wipe the old data and enter the "discovering" state.
  const onDiscoverStart = useCallback(() => {
    setApplications([]);
    setDiscovering(true);
  }, []);

  // Discovery finished — fetch the new jobs and exit the discovering state.
  const onDiscovered = useCallback(async () => {
    await refresh();
    setDiscovering(false);
  }, [refresh]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="app">
      <header>
        <h1>AutoResumeApply</h1>
        <p>Upload your resume → we extract your data → the dashboard shows where you're applying.</p>
      </header>

      {error && <div className="toast err">{error}</div>}

      <UploadCard onUploaded={refresh} />
      <ProfileCard profile={profile} onSaved={refresh} />
      <DiscoverCard profile={profile} onDiscoverStart={onDiscoverStart} onDiscovered={onDiscovered} />
      <ApplicationsTable applications={applications} discovering={discovering} />
    </div>
  );
}
