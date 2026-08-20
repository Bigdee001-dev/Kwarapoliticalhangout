import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export interface UserProfile {
  name: string;
  email: string;
  bio?: string;
  notificationsEnabled: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  email: '',
  bio: '',
  notificationsEnabled: true,
};

const PROFILE_STORAGE_KEY = 'kph_user_profile';
const DEVICE_ID_KEY = 'kph_device_id';

export const getDeviceId = () => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

export const useProfile = () => {
  const [profile, setProfileState] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to parse profile from local storage', e);
    }
    return DEFAULT_PROFILE;
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const deviceId = getDeviceId();

  useEffect(() => {
    let mounted = true;
    const loadProfileFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('pwa_profiles')
          .select('*')
          .eq('id', deviceId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile from Supabase:', error);
          return;
        }

        if (data && mounted) {
          const loadedProfile: UserProfile = {
            name: data.name || '',
            email: data.email || '',
            bio: data.bio || '',
            notificationsEnabled: data.notifications_enabled ?? true,
          };
          setProfileState(loadedProfile);
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(loadedProfile));
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        if (mounted) setIsLoaded(true);
      }
    };

    loadProfileFromSupabase();
    
    return () => {
      mounted = false;
    };
  }, [deviceId]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    // Optimistic UI update
    const newProfile = { ...profile, ...updates };
    setProfileState(newProfile);
    
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
    } catch (e) {
      console.error('Failed to save profile to local storage', e);
    }

    // Sync to Supabase
    try {
      const { error } = await supabase
        .from('pwa_profiles')
        .upsert({
          id: deviceId,
          name: newProfile.name,
          email: newProfile.email,
          bio: newProfile.bio,
          notifications_enabled: newProfile.notificationsEnabled,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) {
        console.error('Error saving profile to Supabase:', error);
      }
    } catch (err) {
      console.error('Failed to sync profile to Supabase:', err);
    }
  };

  return {
    profile,
    updateProfile,
    isLoaded,
    initial: profile.name ? profile.name.charAt(0).toUpperCase() : 'A',
  };
};
