import React from 'react';
import { 
  Home, 
  Compass, 
  Share2, 
  User, 
  LogOut, 
  Bookmark,
  CheckSquare,
  Upload
} from 'lucide-react';
import { UserProfile } from '../../types';

interface AppShellProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: UserProfile;
  onLogout: () => void;
  savedCount: number;
  completedCount: number;
}

export default function AppShell({ 
  children, 
  activeTab, 
  setActiveTab, 
  userProfile, 
  onLogout,
  savedCount,
  completedCount
}: AppShellProps) {
  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'explore', label: 'Explore & Analyze', icon: Compass },
    { id: 'shared', label: 'Shared Feed', icon: Share2 },
    { id: 'saved', label: 'Saved Actions', icon: Bookmark, badge: savedCount },
    { id: 'completed', label: 'Completed Actions', icon: CheckSquare, badge: completedCount },
    { id: 'import', label: 'Import Data', icon: Upload },
    { id: 'profile', label: 'Team Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-brand-lavender-tint flex flex-col md:flex-row antialiased text-brand-near-black font-sans">
      {/* 1. DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:w-64 bg-brand-purple text-white flex-col shrink-0 border-r border-brand-purple/20">
        
        {/* Playful Bubbly Logo Box */}
        <div className="bg-brand-white rounded-2xl p-4 mx-4 mt-6 mb-4 flex flex-col items-center justify-center border border-brand-lavender/30 shadow-md">
          <span className="font-fredoka text-2xl font-bold tracking-tight text-brand-purple lowercase flex items-center">
            madmix
            <span className="text-[10px] font-sans font-medium tracking-normal text-brand-purple align-super ml-0.5">®</span>
          </span>
          <span className="text-[9px] uppercase tracking-[0.15em] text-brand-purple/70 font-mono font-bold mt-1">
            Insights Portal
          </span>
        </div>

        {/* Navigation Items with generous rounded corners */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all font-display text-xs uppercase tracking-wider font-bold shadow-xs cursor-pointer ${
                  isActive 
                    ? 'bg-brand-white text-brand-purple font-black shadow-md' 
                    : 'text-brand-lavender-tint hover:bg-brand-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-purple' : 'text-brand-lavender-tint/80'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isActive 
                      ? 'bg-brand-purple text-white border-brand-purple' 
                      : 'bg-brand-purple/50 text-brand-lavender-tint border-brand-lavender/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout inside sidebar */}
        <div className="p-4 border-t border-brand-white/10 flex flex-col gap-3 bg-brand-purple/95">
          <div className="flex items-center gap-3 bg-brand-white/10 p-3 rounded-2xl border border-brand-white/10">
            {userProfile.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-2xl border-2 border-brand-lavender object-cover shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 rounded-2xl border-2 border-brand-lavender bg-brand-lavender/30 flex items-center justify-center shadow-sm shrink-0">
                <span className="font-fredoka font-bold text-sm text-white uppercase">{userProfile.name?.[0] ?? '?'}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-display font-extrabold text-xs uppercase tracking-wider truncate text-white">{userProfile.name}</p>
              <p className="font-mono text-[10px] text-brand-lavender-tint/80 truncate">{userProfile.email}</p>
            </div>
          </div>
          
          <button
            id="desktop-logout-btn"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-white/10 text-brand-lavender-tint hover:text-white hover:bg-brand-white/20 text-xs font-display uppercase tracking-wider font-bold transition-all border border-brand-white/10 hover:border-brand-white/25 shadow-xs cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE HEADER BAR */}
      <header className="md:hidden h-16 bg-brand-purple text-white flex items-center justify-between px-4 shrink-0 border-b border-brand-purple/20 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2 bg-brand-white px-3 py-1.5 rounded-xl border border-brand-lavender/30">
          <span className="font-fredoka text-xl font-bold tracking-tight text-brand-purple lowercase leading-none flex items-center">
            madmix
            <span className="text-[8px] font-sans font-medium text-brand-purple align-super ml-0.5">®</span>
          </span>
        </div>
        
        {/* Simple Avatar display */}
        <div className="flex items-center gap-3">
          {savedCount > 0 && (
            <button 
              id="mobile-bookmark-indicator"
              onClick={() => setActiveTab('saved')} 
              className="relative p-1 text-brand-lavender-tint hover:text-white transition-colors cursor-pointer"
            >
              <Bookmark className="w-5 h-5 fill-current text-brand-lavender" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-white text-brand-purple rounded-full text-[9px] flex items-center justify-center font-bold font-mono border border-brand-purple shadow-sm">
                {savedCount}
              </span>
            </button>
          )}
          {userProfile.avatar ? (
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              referrerPolicy="no-referrer"
              onClick={() => setActiveTab('profile')}
              className="w-8 h-8 rounded-full border-2 border-brand-lavender object-cover cursor-pointer shadow-sm"
            />
          ) : (
            <div
              onClick={() => setActiveTab('profile')}
              className="w-8 h-8 rounded-full border-2 border-brand-lavender bg-brand-lavender/30 flex items-center justify-center cursor-pointer shadow-sm shrink-0"
            >
              <span className="font-fredoka font-bold text-sm text-white uppercase">{userProfile.name?.[0] ?? '?'}</span>
            </div>
          )}
        </div>
      </header>

      {/* 3. MAIN WORKSPACE CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0 overflow-y-auto bg-brand-lavender-tint">
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* 4. MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-brand-purple border-t border-brand-purple/20 flex items-center justify-around px-2 z-40 shadow-xl">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className="relative flex flex-col items-center justify-center w-14 h-full cursor-pointer"
            >
              <Icon className={`w-4 h-4 mb-1 transition-colors ${
                isActive ? 'text-white scale-110' : 'text-brand-lavender-tint/70'
              }`} />
              <span className={`text-[8px] font-mono font-extrabold uppercase tracking-wider transition-colors ${
                isActive ? 'text-white' : 'text-brand-lavender-tint/70'
              }`}>
                {item.label === 'Explore & Analyze' ? 'Explore' : (item.label === 'Shared Feed' ? 'Shared' : (item.label === 'Saved Actions' ? 'Saved' : (item.label === 'Completed Actions' ? 'Completed' : (item.label === 'Import Data' ? 'Import' : (item.label === 'Team Profile' ? 'Profile' : item.label)))))}
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-2 right-2 w-3.5 h-3.5 bg-brand-white text-brand-purple rounded-full text-[8px] flex items-center justify-center font-bold font-mono border border-brand-purple shadow-sm">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
