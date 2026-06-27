import { useState, useEffect } from 'react';
import { 
  AnalysisFilters, 
  getUserProfile, 
  updateUserProfile, 
  getBookmarkedDecisionIds, 
  toggleBookmarkDecision,
  shareAnalysis,
  getCompletedDecisionIds,
  toggleCompletedDecision
} from './lib/data';
import { UserProfile, Decision, SharedAnalysis } from './types';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import Shared from './pages/Shared';
import Saved from './pages/Saved';
import Completed from './pages/Completed';
import Profile from './pages/Profile';
import Import from './pages/Import';
import DecisionDetail from './pages/DecisionDetail';
import Auth from './pages/Auth';
import ShareDialog from './components/ui/ShareDialog';

export default function App() {
  // 1. Session / Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('madmix_session_active') === 'true';
  });

  // 2. Profile & Bookmark States
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [completedDecisions, setCompletedDecisions] = useState<string[]>([]);
  
  // 3. Navigation Routing State
  const [activeTab, setActiveTab] = useState<string>('home');
  const [previousTab, setPreviousTab] = useState<string>('home');
  const [activeDecisionId, setActiveDecisionId] = useState<string>('');

  // 4. Shared Filter Scope States
  const [exploreFilters, setExploreFilters] = useState<AnalysisFilters>({
    state: '',
    city: '',
    pincode: '',
    platform: '',
    flavour: ''
  });

  // 5. Global Sharing Overlays State
  const [shareTarget, setShareTarget] = useState<Decision | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Synchronize configuration on login success
  useEffect(() => {
    if (isAuthenticated) {
      async function syncUserData() {
        const [profile, savedIds, completedIds] = await Promise.all([
          getUserProfile(),
          getBookmarkedDecisionIds(),
          getCompletedDecisionIds()
        ]);
        setUserProfile(profile);
        setBookmarks(savedIds);
        setCompletedDecisions(completedIds);
      }
      syncUserData();
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = (email: string, name: string) => {
    localStorage.setItem('madmix_session_active', 'true');
    setIsAuthenticated(true);
    // Trigger initial profile save
    const initialProfile: UserProfile = {
      name,
      email,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
      watchedCities: ['Bangalore', 'Ahmedabad'],
      watchedFlavours: ['Aloo Sev Millet Bhujia', 'BBQ Blast Millet Bhujia']
    };
    setUserProfile(initialProfile);
    localStorage.setItem('madmix_user_profile', JSON.stringify(initialProfile));
  };

  const handleLogout = () => {
    localStorage.removeItem('madmix_session_active');
    setIsAuthenticated(false);
    setUserProfile(null);
    setBookmarks([]);
    setCompletedDecisions([]);
    setActiveTab('home');
  };

  const handleUpdateProfile = async (updated: UserProfile) => {
    const fresh = await updateUserProfile(updated);
    setUserProfile(fresh);
  };

  const handleToggleBookmark = async (id: string) => {
    await toggleBookmarkDecision(id);
    const freshIds = await getBookmarkedDecisionIds();
    setBookmarks(freshIds);
  };

  const handleToggleCompleted = async (id: string) => {
    await toggleCompletedDecision(id);
    const freshIds = await getCompletedDecisionIds();
    setCompletedDecisions(freshIds);
  };

  // Navigates directly to /explore pre-filtered to a specific scope
  const handleNavigateToExplore = (filters: Partial<AnalysisFilters>) => {
    const fullFilters: AnalysisFilters = {
      state: filters.state || '',
      city: filters.city || '',
      pincode: filters.pincode || '',
      platform: filters.platform || '',
      flavour: filters.flavour || ''
    };
    setExploreFilters(fullFilters);
    setPreviousTab(activeTab);
    setActiveTab('explore');
  };

  // Click handler on Shared items: loads filter scope AND opens details/workbench
  const handleLoadSharedScope = (filterScope: SharedAnalysis['filterScope'], decisionId?: string) => {
    const fullFilters: AnalysisFilters = {
      state: filterScope.state || '',
      city: filterScope.city || '',
      pincode: filterScope.pincode || '',
      platform: filterScope.platform || '',
      flavour: filterScope.flavour || ''
    };
    setExploreFilters(fullFilters);
    
    if (decisionId) {
      setActiveDecisionId(decisionId);
      setPreviousTab('shared');
      setActiveTab('decision-detail');
    } else {
      setPreviousTab('shared');
      setActiveTab('explore');
    }
  };

  const handleViewDecisionDetails = (id: string) => {
    setActiveDecisionId(id);
    setPreviousTab(activeTab);
    setActiveTab('decision-detail');
  };

  const handleTriggerShare = (decision: Decision) => {
    setShareTarget(decision);
    setIsShareOpen(true);
  };

  const handleConfirmShare = async (title: string, note: string) => {
    if (!shareTarget) return;
    
    const filterScope = {
      state: shareTarget.state || '',
      city: shareTarget.city || '',
      pincode: '',
      platform: shareTarget.platform || '',
      flavour: shareTarget.flavour || ''
    };

    await shareAnalysis(
      title,
      note,
      filterScope,
      'decision',
      null,
      shareTarget.id
    );

    setIsShareOpen(false);
    setShareTarget(null);
    setActiveTab('shared'); // take to shared feed to show post
  };

  if (!isAuthenticated || !userProfile) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="w-full">
      <AppShell
        activeTab={activeTab === 'decision-detail' ? previousTab : activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'decision-detail') {
            setPreviousTab(tab);
          }
        }}
        userProfile={userProfile}
        onLogout={handleLogout}
        savedCount={bookmarks.length}
        completedCount={completedDecisions.length}
      >
        {activeTab === 'home' && (
          <Dashboard 
            onNavigateToExplore={handleNavigateToExplore}
            onShare={handleTriggerShare}
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            onViewDecision={handleViewDecisionDetails}
            userProfileName={userProfile.name}
            completedDecisions={completedDecisions}
            onToggleCompleted={handleToggleCompleted}
          />
        )}

        {activeTab === 'explore' && (
          <Explore 
            initialFilters={exploreFilters}
            onShare={handleTriggerShare}
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            onViewDecision={handleViewDecisionDetails}
            completedDecisions={completedDecisions}
            onToggleCompleted={handleToggleCompleted}
          />
        )}

        {activeTab === 'shared' && (
          <Shared onLoadSharedScope={handleLoadSharedScope} />
        )}

        {activeTab === 'saved' && (
          <Saved 
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            onShare={handleTriggerShare}
            onViewDecision={handleViewDecisionDetails}
            onNavigateToExplore={() => setActiveTab('explore')}
          />
        )}

        {activeTab === 'completed' && (
          <Completed 
            completedIds={completedDecisions}
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            onToggleCompleted={handleToggleCompleted}
            onShare={handleTriggerShare}
            onViewDecision={handleViewDecisionDetails}
            onNavigateToExplore={() => setActiveTab('explore')}
          />
        )}

        {activeTab === 'import' && (
          <Import />
        )}

        {activeTab === 'profile' && (
          <Profile 
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            onLogout={handleLogout}
          />
        )}

        {activeTab === 'decision-detail' && (
          <DecisionDetail 
            decisionId={activeDecisionId}
            onBack={() => setActiveTab(previousTab)}
            isBookmarked={bookmarks.includes(activeDecisionId)}
            onToggleBookmark={handleToggleBookmark}
            onShare={handleTriggerShare}
            onNavigateToExplore={handleNavigateToExplore}
            isCompleted={completedDecisions.includes(activeDecisionId)}
            onToggleCompleted={handleToggleCompleted}
          />
        )}
      </AppShell>

      {/* Global Share Dialog Modal */}
      {shareTarget && (
        <ShareDialog
          isOpen={isShareOpen}
          onClose={() => {
            setIsShareOpen(false);
            setShareTarget(null);
          }}
          onConfirm={handleConfirmShare}
          itemName={shareTarget.action}
        />
      )}
    </div>
  );
}
