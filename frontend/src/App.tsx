import { useState, useEffect, useCallback } from 'react';
import {
  AnalysisFilters,
  getUserProfile,
  updateUserProfile,
  getBookmarkedDecisionIds,
  toggleBookmarkDecision,
  shareAnalysis,
  getCompletedDecisionIds,
  toggleCompletedDecision,
  getHotCities,
  getDecisions,
  getAnalysis,
  getDecisionById,
} from './lib/data';
import { supabase } from './lib/supabase';
import { UserProfile, Decision, SharedAnalysis, AnalysisResponse } from './types';
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

const EMPTY_FILTERS: AnalysisFilters = { state: '', city: '', pincode: '', platform: '', flavour: '' };

export default function App() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // ── User data ─────────────────────────────────────────────────────────────
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [completedDecisions, setCompletedDecisions] = useState<string[]>([]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('home');
  const [previousTab, setPreviousTab] = useState('home');
  const [activeDecisionId, setActiveDecisionId] = useState('');
  const [exploreFilters, setExploreFilters] = useState<AnalysisFilters>(EMPTY_FILTERS);

  // ── Dashboard cache (fetched once after login) ────────────────────────────
  const [dashboardHotCities, setDashboardHotCities] = useState<any[] | null>(null);
  const [dashboardDecisions, setDashboardDecisions] = useState<Decision[] | null>(null);
  const [dashboardAnalytics, setDashboardAnalytics] = useState<AnalysisResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // ── Explore cache (null until first load; only Regenerate clears it) ──────
  const [exploreDecisions, setExploreDecisions] = useState<Decision[] | null>(null);
  const [exploreAnalytics, setExploreAnalytics] = useState<AnalysisResponse | null>(null);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [loadedFilters, setLoadedFilters] = useState<AnalysisFilters | null>(null);

  // ── Decision detail cache (id → Decision) ─────────────────────────────────
  const [decisionCache, setDecisionCache] = useState<Record<string, Decision>>({});

  // ── Share dialog ──────────────────────────────────────────────────────────
  const [shareTarget, setShareTarget] = useState<Decision | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // ── Supabase session ──────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (!session) {
        setUserProfile(null);
        setBookmarks([]);
        setCompletedDecisions([]);
        setActiveTab('home');
        // Clear data caches on logout
        setDashboardHotCities(null);
        setDashboardDecisions(null);
        setDashboardAnalytics(null);
        setExploreDecisions(null);
        setExploreAnalytics(null);
        setDecisionCache({});
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Load user profile + bookmarks after login ─────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    async function syncUserData() {
      setProfileLoading(true);
      try {
        const [profile, savedIds, completedIds] = await Promise.all([
          getUserProfile(),
          getBookmarkedDecisionIds(),
          getCompletedDecisionIds(),
        ]);
        setUserProfile(profile);
        setBookmarks(savedIds);
        setCompletedDecisions(completedIds);
      } catch {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const email = data.session.user.email ?? '';
          setUserProfile({
            name: data.session.user.user_metadata?.full_name || email.split('@')[0],
            email,
            avatar: '',
            watchedCities: [],
            watchedFlavours: [],
          });
        }
      } finally {
        setProfileLoading(false);
      }
    }
    syncUserData();
  }, [isAuthenticated]);

  // ── Fetch dashboard data once after first login ───────────────────────────
  useEffect(() => {
    if (!isAuthenticated || dashboardHotCities !== null) return;
    fetchDashboardData();
  }, [isAuthenticated]);

  async function fetchDashboardData() {
    setDashboardLoading(true);
    try {
      const [cities, decs, analytics] = await Promise.all([
        getHotCities(),
        getDecisions(),
        getAnalysis(EMPTY_FILTERS),
      ]);
      setDashboardHotCities(cities);
      setDashboardDecisions(decs);
      setDashboardAnalytics(analytics);
      seedDecisionCache(decs);
    } catch (e) {
      console.error('Dashboard fetch failed', e);
    } finally {
      setDashboardLoading(false);
    }
  }

  // ── Fetch explore data (on filter change or Regenerate) ───────────────────
  const fetchExploreData = useCallback(async (filters: AnalysisFilters) => {
    setExploreLoading(true);
    try {
      const [decs, analytics] = await Promise.all([
        getDecisions(filters),
        getAnalysis(filters),
      ]);
      setExploreDecisions(decs);
      setExploreAnalytics(analytics);
      setLoadedFilters(filters);
      seedDecisionCache(decs);
    } catch (e) {
      console.error('Explore fetch failed', e);
    } finally {
      setExploreLoading(false);
    }
  }, []);

  function seedDecisionCache(decs: Decision[]) {
    setDecisionCache(prev => {
      const next = { ...prev };
      decs.forEach(d => { next[d.id] = d; });
      return next;
    });
  }

  async function ensureDecisionCached(id: string) {
    if (decisionCache[id]) return;
    try {
      const d = await getDecisionById(id);
      if (d) setDecisionCache(prev => ({ ...prev, [id]: d }));
    } catch (e) {
      console.error('Decision fetch failed', e);
    }
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLoginSuccess = () => {};

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleUpdateProfile = async (updated: UserProfile) => {
    const fresh = await updateUserProfile(updated);
    setUserProfile(fresh);
  };

  const handleToggleBookmark = async (id: string) => {
    await toggleBookmarkDecision(id);
    setBookmarks(await getBookmarkedDecisionIds());
  };

  const handleToggleCompleted = async (id: string) => {
    await toggleCompletedDecision(id);
    setCompletedDecisions(await getCompletedDecisionIds());
  };

  const handleNavigateToExplore = (filters: Partial<AnalysisFilters>) => {
    const next: AnalysisFilters = {
      state: filters.state || '',
      city: filters.city || '',
      pincode: filters.pincode || '',
      platform: filters.platform || '',
      flavour: filters.flavour || '',
    };
    setExploreFilters(next);
    setPreviousTab(activeTab);
    setActiveTab('explore');
  };

  const handleLoadSharedScope = (filterScope: SharedAnalysis['filterScope'], decisionId?: string) => {
    const next: AnalysisFilters = {
      state: filterScope.state || '',
      city: filterScope.city || '',
      pincode: filterScope.pincode || '',
      platform: filterScope.platform || '',
      flavour: filterScope.flavour || '',
    };
    setExploreFilters(next);
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
    ensureDecisionCached(id);
  };

  const handleTriggerShare = (decision: Decision) => {
    setShareTarget(decision);
    setIsShareOpen(true);
  };

  const handleConfirmShare = async (title: string, note: string) => {
    if (!shareTarget) return;
    await shareAnalysis(
      title, note,
      { state: shareTarget.state || '', city: shareTarget.city || '', pincode: '', platform: shareTarget.platform || '', flavour: shareTarget.flavour || '' },
      'decision', null, shareTarget.id,
    );
    setIsShareOpen(false);
    setShareTarget(null);
    setActiveTab('shared');
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!authChecked || profileLoading) return null;
  if (!isAuthenticated || !userProfile) return <Auth onLoginSuccess={handleLoginSuccess} />;

  return (
    <div className="w-full">
      <AppShell
        activeTab={activeTab === 'decision-detail' ? previousTab : activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'decision-detail') setPreviousTab(tab);
        }}
        userProfile={userProfile}
        onLogout={handleLogout}
        savedCount={bookmarks.length}
        completedCount={completedDecisions.length}
      >
        {activeTab === 'home' && (
          <Dashboard
            hotCities={dashboardHotCities ?? []}
            decisions={dashboardDecisions ?? []}
            analytics={dashboardAnalytics}
            isLoading={dashboardLoading}
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
            cachedDecisions={exploreDecisions}
            cachedAnalytics={exploreAnalytics}
            loadedFilters={loadedFilters}
            isLoading={exploreLoading}
            onFetchData={fetchExploreData}
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

        {activeTab === 'import' && <Import />}

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
            cachedDecision={decisionCache[activeDecisionId] ?? null}
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

      {shareTarget && (
        <ShareDialog
          isOpen={isShareOpen}
          onClose={() => { setIsShareOpen(false); setShareTarget(null); }}
          onConfirm={handleConfirmShare}
          itemName={shareTarget.action}
        />
      )}
    </div>
  );
}
