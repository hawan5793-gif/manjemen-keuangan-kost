import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { clearAuthSession, claimLocalData, getAuthToken, requestCurrentUser } from '../../lib/auth.js';
import { useAppStore } from '../../store/app.store';
import { KostkasMark } from '../ui/Icons';

export default function AuthGuard() {
  const [status, setStatus] = useState(() => getAuthToken() ? 'checking' : 'signed-out');
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    const token = getAuthToken();
    if (!token) return () => { alive = false; };

    requestCurrentUser()
      .then(async (session) => {
        const accountChanged = await claimLocalData(session);
        if (accountChanged) useAppStore.getState().resetForNewSession();
        if (alive) setStatus('authenticated');
      })
      .catch((error) => {
        if (!alive) return;
        if ([401, 403].includes(error.response?.status)) clearAuthSession();
        setStatus('signed-out');
      });

    return () => { alive = false; };
  }, []);

  if (status === 'signed-out') return <Navigate to="/login" replace state={{ from: location }} />;
  if (status === 'authenticated') return <Outlet />;

  return <main className="auth-check-screen"><span className="auth-check-mark"><KostkasMark /></span><span>Memeriksa sesi amanmu...</span></main>;
}
