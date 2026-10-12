import { useEffect, useState } from 'react';

interface StoredUser { organisation?: { enabledFeatures?: string[] } | null }

const read = (key: string): boolean => {
  try {
    const u: StoredUser | null = JSON.parse(localStorage.getItem('userInfo') || 'null');
    return u?.organisation?.enabledFeatures?.includes(key) === true;
  } catch {
    return false;
  }
};

/** Whether the platform Super Admin has switched a feature on for the user's organisation. */
export function useFeatureEnabled(key: string): boolean {
  const [enabled, setEnabled] = useState(() => read(key));
  useEffect(() => {
    const refresh = () => setEnabled(read(key));
    window.addEventListener('auth-refresh', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('auth-refresh', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [key]);
  return enabled;
}

export const useWhatsAppEnabled = () => useFeatureEnabled('whatsapp');
