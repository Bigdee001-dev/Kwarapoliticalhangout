import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCircle, Save, Bell, BellOff, Trash2 } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { usePushNotifications } from '../hooks/usePushNotifications';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, updateProfile, initial } = useProfile();
  const { isSubscribed, subscribe, unsubscribe, isLoading } = usePushNotifications();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [notifications, setNotifications] = useState(profile.notificationsEnabled);
  const [savedMessage, setSavedMessage] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, email, notificationsEnabled: notifications });
    setSavedMessage('Profile saved successfully!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset the app? This will clear all your saved data and preferences.')) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-20 font-sans text-kph-charcoal selection:bg-kph-red/10 selection:text-kph-red">
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="text-zinc-600 p-2 -ml-2 hover:bg-zinc-100 rounded-full transition-colors active:scale-95"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-zinc-900 absolute left-1/2 -translate-x-1/2">Profile & Settings</h1>
        <div className="w-8"></div> {/* Spacer for centering */}
      </header>

      <main className="max-w-xl mx-auto p-4 sm:p-6 mt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-6 flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-4xl mb-4 shadow-inner">
            {initial}
          </div>
          <h2 className="text-xl font-bold">{name || 'Your Profile'}</h2>
          <p className="text-zinc-500 text-sm">{email || 'No email set'}</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-5 space-y-4">
            <h3 className="font-bold text-lg text-zinc-900 border-b border-zinc-100 pb-2 mb-4">Personal Details</h3>
            
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-semibold text-zinc-700 block">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-kph-red/20 focus:border-kph-red transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-zinc-700 block">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-kph-red/20 focus:border-kph-red transition-all"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-5">
            <h3 className="font-bold text-lg text-zinc-900 border-b border-zinc-100 pb-2 mb-4">Settings</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600">
                  {notifications ? <Bell size={20} /> : <BellOff size={20} />}
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-800">Push Notifications</h4>
                  <p className="text-xs text-zinc-500">Receive breaking news alerts</p>
                </div>
              </div>
              
              <button
                type="button"
                role="switch"
                disabled={isLoading}
                aria-checked={isSubscribed || notifications}
                onClick={async () => {
                  if (isSubscribed) {
                    await unsubscribe();
                    setNotifications(false);
                  } else {
                    await subscribe();
                    setNotifications(true);
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(isSubscribed || notifications) ? 'bg-kph-red' : 'bg-zinc-300'} ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(isSubscribed || notifications) ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className="pt-4 pb-12">
            <button
              type="submit"
              className="w-full bg-kph-red hover:bg-red-800 text-white font-bold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all flex justify-center items-center gap-2"
            >
              <Save size={20} /> Save Profile
            </button>
            
            {savedMessage && (
              <p className="text-green-600 text-center text-sm font-semibold mt-4 animate-fade-in">
                {savedMessage}
              </p>
            )}

            <div className="mt-8 pt-6 border-t border-zinc-200">
              <button
                type="button"
                onClick={handleResetData}
                className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold py-3.5 rounded-xl active:scale-[0.98] transition-all flex justify-center items-center gap-2"
              >
                <Trash2 size={20} /> Reset App Data
              </button>
              <p className="text-xs text-zinc-500 text-center mt-3">
                This will clear all saved preferences and restart the app.
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ProfilePage;

