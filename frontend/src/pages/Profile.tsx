import React, { useState } from 'react';
import { UserProfile } from '../types';
import { 
  User, 
  Mail, 
  MapPin, 
  Tag, 
  Bell, 
  LogOut, 
  Save, 
  Check
} from 'lucide-react';

interface ProfileProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onLogout: () => void;
}

export default function Profile({ userProfile, onUpdateProfile, onLogout }: ProfileProps) {
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [avatar, setAvatar] = useState(userProfile.avatar);
  const [citiesInput, setCitiesInput] = useState(userProfile.watchedCities.join(', '));
  const [flavoursInput, setFlavoursInput] = useState(userProfile.watchedFlavours.join(', '));
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Alert toggles (mocked in state)
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedCities = citiesInput
      .split(',')
      .map(c => c.trim())
      .filter(c => c !== '');
      
    const parsedFlavours = flavoursInput
      .split(',')
      .map(f => f.trim())
      .filter(f => f !== '');

    const updated: UserProfile = {
      name,
      email,
      avatar,
      watchedCities: parsedCities,
      watchedFlavours: parsedFlavours
    };

    onUpdateProfile(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto text-brand-near-black">
      
      {/* Header */}
      <div className="border-b border-brand-lavender/30 pb-5">
        <h1 className="font-fredoka font-bold text-2xl tracking-tight text-brand-purple">Manager Settings & Profile</h1>
        <p className="font-display text-[11px] uppercase tracking-wider text-brand-near-black/60 mt-1">
          Modify your watchlists, configure notification alerts, and manage your operational profile.
        </p>
      </div>

      <div className="bg-brand-white rounded-2xl border border-brand-lavender/30 p-6 md:p-8 shadow-xs">
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Avatar Section */}
          <div className="flex items-center gap-5 pb-5 border-b border-brand-lavender-tint/40">
            <img 
              src={avatar} 
              alt={name} 
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl border-2 border-brand-lavender object-cover bg-brand-lavender-tint shadow-xs"
            />
            <div className="space-y-1.5 flex-1">
              <label className="text-[10px] font-mono font-bold text-brand-near-black/50 uppercase tracking-widest block">Avatar URL</label>
              <input 
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full max-w-md px-3.5 py-2.5 bg-brand-lavender-tint/20 border border-brand-lavender/25 text-brand-near-black rounded-2xl text-xs font-mono focus:border-brand-purple outline-none focus:ring-1 focus:ring-brand-purple"
                placeholder="Image URL"
              />
            </div>
          </div>

          {/* Identity Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-black text-brand-near-black/50 uppercase tracking-widest flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-purple" /> Full Name
              </label>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-brand-lavender-tint/20 border border-brand-lavender/25 text-brand-near-black text-xs font-mono uppercase tracking-wider rounded-2xl focus:border-brand-purple outline-none focus:ring-1 focus:ring-brand-purple"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-black text-brand-near-black/50 uppercase tracking-widest flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-purple" /> Work Email
              </label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-brand-lavender-tint/20 border border-brand-lavender/25 text-brand-near-black text-xs font-mono rounded-2xl focus:border-brand-purple outline-none focus:ring-1 focus:ring-brand-purple"
              />
            </div>
          </div>

          {/* Regional & Inventory Watches */}
          <div className="space-y-4 pt-4 border-t border-brand-lavender-tint/40">
            <h3 className="font-display font-extrabold text-xs md:text-sm uppercase tracking-wider text-brand-purple">Subscription Focus (Watchlists)</h3>

            {/* Watched Cities */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-black text-brand-near-black/50 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-purple" /> Watched Cities (comma-separated)
              </label>
              <input 
                type="text"
                value={citiesInput}
                onChange={(e) => setCitiesInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-brand-lavender-tint/20 border border-brand-lavender/25 text-brand-near-black text-xs font-mono uppercase tracking-wider rounded-2xl focus:border-brand-purple outline-none focus:ring-1 focus:ring-brand-purple"
                placeholder="Mumbai, Bangalore, Surat"
              />
              <span className="text-[10px] font-mono text-brand-near-black/50 uppercase tracking-wider block">
                We will prioritize flagging cities listed here in your regional analysis dashboards.
              </span>
            </div>

            {/* Watched Flavours */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-black text-brand-near-black/50 uppercase tracking-widest flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand-purple" /> Watched Flavors (comma-separated)
              </label>
              <input 
                type="text"
                value={flavoursInput}
                onChange={(e) => setFlavoursInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-brand-lavender-tint/20 border border-brand-lavender/25 text-brand-near-black text-xs font-mono uppercase tracking-wider rounded-2xl focus:border-brand-purple outline-none focus:ring-1 focus:ring-brand-purple"
                placeholder="Aloo Sev Millet Bhujia, Tangy Twist Bhujia"
              />
            </div>
          </div>

          {/* Alerts / Notifications Settings */}
          <div className="space-y-4 pt-4 border-t border-brand-lavender-tint/40">
            <h3 className="font-display font-extrabold text-xs md:text-sm uppercase tracking-wider text-brand-purple flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-brand-purple" /> Operational Notifications
            </h3>

            <div className="space-y-3.5">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 text-brand-purple bg-brand-lavender-tint border-brand-lavender/40 rounded focus:ring-brand-purple mt-0.5 cursor-pointer"
                />
                <div className="text-xs leading-tight">
                  <p className="font-mono font-bold text-brand-near-black uppercase tracking-wider">Email Notifications</p>
                  <p className="text-brand-near-black/60 mt-1 font-sans">Alert me when a high-severity decision appears in my watched cities</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={slackAlerts}
                  onChange={(e) => setSlackAlerts(e.target.checked)}
                  className="w-4 h-4 text-brand-purple bg-brand-lavender-tint border-brand-lavender/40 rounded focus:ring-brand-purple mt-0.5 cursor-pointer"
                />
                <div className="text-xs leading-tight">
                  <p className="font-mono font-bold text-brand-near-black uppercase tracking-wider">Slack / Teams Ping</p>
                  <p className="text-brand-near-black/60 mt-1 font-sans">Push critical alerts directly to #millet-ops channel</p>
                </div>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between border-t border-brand-lavender-tint/40 pt-5">
            <button
              type="button"
              id="profile-logout-btn"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-brand-red/30 bg-brand-red/10 hover:bg-brand-red/20 text-brand-red font-mono font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>

            <button
              type="submit"
              id="profile-save-btn"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-full transition-all shadow-md cursor-pointer"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Profile Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
