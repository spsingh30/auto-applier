import { useEffect, useState, useCallback } from 'react';
import UploadCard from './components/UploadCard';
import ProfileCard from './components/ProfileCard';
import ApplicationsTable from './components/ApplicationsTable';
import DiscoverCard from './components/DiscoverCard';
import { getProfile, getApplications } from './api/client';

export default function App() {
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState(null);

  // Backend se taaza data le aao.
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
        <p>Resume upload karo → data extract hoga → dashboard pe dikhega kahan apply ho raha hai.</p>
      </header>

      {error && <div className="toast err">{error}</div>}

      <UploadCard onUploaded={refresh} />
      <ProfileCard profile={profile} />
      <DiscoverCard profile={profile} onDiscovered={refresh} />
      <ApplicationsTable applications={applications} />
    </div>
  );
}
