import { useState, useEffect, useRef } from 'react';
import { AnalysisFilters } from '../lib/data';
import { Decision, AnalysisResponse } from '../types';
import FilterBar from '../components/filters/FilterBar';
import DecisionCard from '../components/decisions/DecisionCard';
import CityBreakdown from '../components/decisions/CityBreakdown';
import {
  SalesByFlavourChart,
  A2SOverTimeChart,
  ConsumptionFrequencyChart,
} from '../components/charts/DashboardCharts';
import {
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
  MapPin,
  Flame,
  Zap,
  Users,
} from 'lucide-react';

interface ExploreProps {
  initialFilters: AnalysisFilters;
  cachedDecisions: Decision[] | null;
  cachedAnalytics: AnalysisResponse | null;
  loadedFilters: AnalysisFilters | null;
  isLoading: boolean;
  onFetchData: (filters: AnalysisFilters) => void;
  onShare: (decision: Decision) => void;
  bookmarks: string[];
  onToggleBookmark: (id: string) => void;
  onViewDecision: (id: string) => void;
  completedDecisions: string[];
  onToggleCompleted: (id: string) => void;
}

const ENGINE_MESSAGES = [
  'Querying database for local sales metrics...',
  'Compiling packet scans & customer survey scores...',
  'Assessing Daily Ad-to-Sales (A2S) ratios against limits...',
  'Scanning city-level PODs availability dropouts...',
  'Invoking rules pipeline for grow, reduce, and remove triggers...',
  'Formatting decision evidence & database rows...'
];

function filtersEqual(a: AnalysisFilters, b: AnalysisFilters) {
  return a.state === b.state && a.city === b.city && a.pincode === b.pincode &&
    a.platform === b.platform && a.flavour === b.flavour;
}

export default function Explore({
  initialFilters,
  cachedDecisions,
  cachedAnalytics,
  loadedFilters,
  isLoading,
  onFetchData,
  onShare,
  bookmarks,
  onToggleBookmark,
  onViewDecision,
  completedDecisions,
  onToggleCompleted
}: ExploreProps) {
  const [filters, setFilters] = useState<AnalysisFilters>({ ...initialFilters });
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const prevFiltersRef = useRef<AnalysisFilters | null>(null);

  // Fetch on first mount (if no cache) or when initialFilters change to a different scope
  useEffect(() => {
    const filtersChanged = !loadedFilters || !filtersEqual(initialFilters, loadedFilters);
    const firstMount = prevFiltersRef.current === null;

    if (firstMount || filtersChanged) {
      setFilters({ ...initialFilters });
      if (!cachedDecisions || filtersChanged) {
        onFetchData(initialFilters);
      }
    }
    prevFiltersRef.current = initialFilters;
  }, [initialFilters]);

  const handleApplyFilters = (updated: AnalysisFilters) => {
    setFilters(updated);
    onFetchData(updated);
  };

  const handleClearFilters = () => {
    const cleared: AnalysisFilters = { state: '', city: '', pincode: '', platform: '', flavour: '' };
    setFilters(cleared);
    onFetchData(cleared);
  };

  const handleGenerateAnalysis = () => {
    setIsGenerating(true);
    setGenStep(0);

    const interval = setInterval(() => {
      setGenStep(prev => {
        if (prev >= ENGINE_MESSAGES.length - 1) { clearInterval(interval); return prev; }
        return prev + 1;
      });
    }, 450);

    setTimeout(() => {
      clearInterval(interval);
      onFetchData(filters);
      setIsGenerating(false);
    }, 2800);
  };

  const getActiveFilterLabel = () => {
    const active = Object.entries(filters)
      .filter(([_, v]) => v !== '')
      .map(([k, v]) => `${k.toUpperCase()}: ${v}`);
    return active.length > 0 ? active.join(' | ') : 'ALL INDIA OPERATIONS';
  };

  const decisions = cachedDecisions ?? [];
  const analytics = cachedAnalytics;
  const showLoading = isLoading && !cachedDecisions;

  return (
    <div className="space-y-6 animate-fade-in text-brand-near-black">

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-lavender/30 pb-5">
        <div>
          <h1 className="font-fredoka font-bold text-2xl tracking-tight text-brand-purple">Explore & Analyze</h1>
          <p className="font-display text-[11px] uppercase tracking-wider text-brand-near-black/60 mt-1">
            Query distribution metrics, cross-analyze consumer survey replies, and generate plain-English actions.
          </p>
        </div>

        <button
          id="trigger-live-generate-btn"
          disabled={isGenerating || isLoading}
          onClick={handleGenerateAnalysis}
          className="flex items-center justify-center gap-2 bg-brand-purple hover:bg-brand-purple/90 disabled:opacity-50 text-white text-[11px] font-mono uppercase tracking-wider font-extrabold px-5 py-3 rounded-full transition-all shadow-md shrink-0 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-white shrink-0" />
          <span>Regenerate Actions</span>
        </button>
      </div>

      {/* FILTER BAR DRAWER */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {/* ACTIVE SCOPE INFO BAR */}
      <div className="flex items-center gap-2.5 text-xs font-mono font-bold uppercase tracking-wider text-brand-purple bg-brand-purple/10 px-4 py-3.5 rounded-2xl border-l-4 border-l-brand-purple border border-brand-lavender/20 shadow-xs">
        <span className="w-2 h-2 rounded-full bg-brand-live animate-pulse" />
        <span>Scope:</span>
        <span className="text-brand-purple font-black truncate">{getActiveFilterLabel()}</span>
      </div>

      {/* ENGINE PROCESSING SCREEN */}
      {isGenerating ? (
        <div className="min-h-[50vh] bg-brand-white rounded-2xl border border-brand-lavender/30 shadow-md flex flex-col items-center justify-center p-8 space-y-6">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-brand-lavender/30 border-t-brand-purple rounded-full animate-spin" />
            <Sparkles className="w-6 h-6 text-brand-purple absolute animate-pulse" />
          </div>

          <div className="text-center space-y-3 max-w-sm">
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-brand-purple">Processing Live Ruleset</h3>
            <p className="text-[10px] font-mono uppercase tracking-wider text-brand-near-black/70 min-h-[32px] transition-all">
              {ENGINE_MESSAGES[genStep]}
            </p>
          </div>

          <div className="w-48 h-2 bg-brand-lavender-tint/50 border border-brand-lavender/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-purple rounded-full transition-all duration-300"
              style={{ width: `${((genStep + 1) / ENGINE_MESSAGES.length) * 100}%` }}
            />
          </div>
        </div>
      ) : showLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
          <p className="text-[10px] font-mono uppercase tracking-wider text-brand-near-black/60">Fetching latest metrics database...</p>
        </div>
      ) : (
        <div className="space-y-8">

          {filters.city && (
            <div className="animate-fade-in">
              <CityBreakdown cityName={filters.city} />
            </div>
          )}

          {/* DECISION CARDS */}
          <div className="space-y-4">
            <h2 className="font-display font-extrabold text-xs md:text-sm uppercase tracking-wider text-brand-purple/85">
              Recommended Decisions for this Scope
            </h2>

            {decisions.length === 0 ? (
              <div className="bg-brand-white p-6 rounded-2xl border border-brand-lavender/30 shadow-xs flex items-center gap-4">
                <CheckCircle2 className="w-6 h-6 text-brand-green shrink-0" />
                <div>
                  <h4 className="font-display font-extrabold text-sm text-brand-near-black uppercase">All Metrics Within Limits</h4>
                  <p className="text-xs text-brand-near-black/75 font-sans mt-1">
                    No critical drops or supply issues identified in this region. Operations are executing at optimum yield.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {decisions.map((decision) => (
                  <DecisionCard
                    key={decision.id}
                    decision={decision}
                    isBookmarked={bookmarks.includes(decision.id)}
                    onToggleBookmark={onToggleBookmark}
                    onShare={onShare}
                    onViewDetails={onViewDecision}
                    isCompleted={completedDecisions.includes(decision.id)}
                    onToggleCompleted={onToggleCompleted}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ANALYTICS METRICS ROW */}
          <div className="grid gap-6 md:grid-cols-12">

            <div className="md:col-span-8 space-y-6">
              <div className="bg-brand-white p-6 rounded-2xl border border-brand-lavender/30 shadow-xs space-y-4">
                <div>
                  <h3 className="font-display font-extrabold text-sm text-brand-purple uppercase tracking-tight">Sales Revenue by SKU</h3>
                  <p className="text-[10px] font-mono text-brand-near-black/50 uppercase tracking-wider">Financial output rankings across product lines</p>
                </div>
                {analytics?.salesByFlavour && (
                  <SalesByFlavourChart data={analytics.salesByFlavour} />
                )}
              </div>

              <div className="bg-brand-white p-6 rounded-2xl border border-brand-lavender/30 shadow-xs space-y-4">
                <div>
                  <h3 className="font-display font-extrabold text-sm text-brand-purple uppercase tracking-tight">Advertising to Sales Elasticity (A2S)</h3>
                  <p className="text-[10px] font-mono text-brand-near-black/50 uppercase tracking-wider">Cross-comparing daily marketing spends with revenue spikes</p>
                </div>
                {analytics?.a2sOverTime && (
                  <A2SOverTimeChart data={analytics.a2sOverTime} />
                )}
              </div>
            </div>

            <div className="md:col-span-4 space-y-6">
              <div className="bg-brand-white p-6 rounded-2xl border border-brand-lavender/30 shadow-xs space-y-4">
                <div>
                  <h3 className="font-display font-extrabold text-sm text-brand-purple uppercase tracking-tight">Platform Gap</h3>
                  <p className="text-[10px] font-mono text-brand-near-black/50 uppercase tracking-wider">Where customers shop vs where MadMix sells</p>
                </div>
                {analytics?.platformGap && (
                  <div className="space-y-3">
                    <div className="h-3 w-full bg-brand-lavender-tint rounded-full overflow-hidden flex border border-brand-lavender/20">
                      <div className="bg-brand-green h-full" style={{ width: `${analytics.platformGap.blinkitPct * 100}%` }} title={`Blinkit: ${Math.round(analytics.platformGap.blinkitPct * 100)}%`} />
                      <div className="bg-brand-purple h-full" style={{ width: `${analytics.platformGap.zeptoPct * 100}%` }} title={`Zepto: ${Math.round(analytics.platformGap.zeptoPct * 100)}%`} />
                      <div className="bg-brand-lavender h-full" style={{ width: `${analytics.platformGap.otherPct * 100}%` }} title={`Other: ${Math.round(analytics.platformGap.otherPct * 100)}%`} />
                    </div>
                    <div className="flex flex-col gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider">
                      <span className="text-brand-green flex items-center justify-between">
                        <span className="flex items-center gap-1.5">Blinkit <span className="text-[8px] bg-brand-red/10 text-brand-red border border-brand-red/20 px-1.5 py-0.5 rounded-full normal-case font-medium">Not listed</span></span>
                        <span>{Math.round(analytics.platformGap.blinkitPct * 100)}%</span>
                      </span>
                      <span className="text-brand-purple flex items-center justify-between border-t border-brand-lavender-tint/40 pt-1">
                        <span className="flex items-center gap-1.5">Zepto <span className="text-[8px] bg-brand-red/10 text-brand-red border border-brand-red/20 px-1.5 py-0.5 rounded-full normal-case font-medium">Not listed</span></span>
                        <span>{Math.round(analytics.platformGap.zeptoPct * 100)}%</span>
                      </span>
                      <span className="text-brand-near-black/60 flex items-center justify-between border-t border-brand-lavender-tint/40 pt-1">
                        <span className="flex items-center gap-1.5">BB / Instamart / Amazon <span className="text-[8px] bg-brand-green/10 text-brand-green border border-brand-green/20 px-1.5 py-0.5 rounded-full normal-case font-medium">Active</span></span>
                        <span>{Math.round(analytics.platformGap.otherPct * 100)}%</span>
                      </span>
                    </div>
                    <p className="text-[10px] font-sans text-brand-near-black/60 leading-relaxed border-t border-brand-lavender-tint/40 pt-2">
                      {analytics.platformGap.insight}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-display font-extrabold text-xs md:text-sm uppercase tracking-wider text-brand-purple/85">Customer Survey Signals</h3>

                {/* Unmet Demand Score + High Freq Buyers + Pincode */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-brand-amber/8 border border-brand-amber/25 rounded-xl p-3 text-center">
                    <Zap className="w-3.5 h-3.5 text-brand-amber mx-auto mb-1" />
                    <p className="font-fredoka font-bold text-lg text-brand-amber leading-none">
                      {analytics?.unmetDemandScore != null ? Math.round(analytics.unmetDemandScore * 100) : '—'}
                    </p>
                    <p className="text-[8px] font-mono text-brand-near-black/45 uppercase tracking-wider mt-0.5 leading-tight">Unmet Demand /100</p>
                  </div>
                  <div className="bg-brand-purple/5 border border-brand-purple/20 rounded-xl p-3 text-center">
                    <Flame className="w-3.5 h-3.5 text-brand-purple mx-auto mb-1" />
                    <p className="font-fredoka font-bold text-lg text-brand-purple leading-none">
                      {analytics?.highFrequencyBuyerPct != null ? `${Math.round(analytics.highFrequencyBuyerPct * 100)}%` : '—'}
                    </p>
                    <p className="text-[8px] font-mono text-brand-near-black/45 uppercase tracking-wider mt-0.5 leading-tight">Loyal Core</p>
                  </div>
                  <div className="bg-brand-white border border-brand-lavender/30 rounded-xl p-3 text-center">
                    <MapPin className="w-3.5 h-3.5 text-brand-purple mx-auto mb-1" />
                    <p className="font-fredoka font-bold text-lg text-brand-purple leading-none">
                      {analytics?.pincodeAvailabilityRate != null ? `${Math.round(analytics.pincodeAvailabilityRate * 100)}%` : '—'}
                    </p>
                    <p className="text-[8px] font-mono text-brand-near-black/45 uppercase tracking-wider mt-0.5 leading-tight">Pincode Found</p>
                  </div>
                </div>

                {/* Skip Rate by City */}
                <div className="bg-brand-white p-5 rounded-2xl border border-brand-lavender/30 shadow-xs space-y-3 stat-box">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-brand-red shrink-0" />
                    <span className="text-[10px] font-mono font-bold text-brand-near-black/50 uppercase tracking-widest">
                      Skipped Due to Unavailability
                    </span>
                  </div>
                  <div className="w-full space-y-1.5">
                    {analytics?.skipRateByCity?.filter((r: any) => r.totalRespondents >= 3).slice(0, 5).map((item: any) => (
                      <div key={item.city} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider">
                          <span className="text-brand-near-black/70">
                            {item.city}
                            <span className="font-normal text-brand-near-black/35 ml-1">({item.totalRespondents})</span>
                          </span>
                          <span className={item.skipRate > 0.3 ? 'text-brand-red' : 'text-brand-green'}>
                            {Math.round(item.skipRate * 100)}%
                          </span>
                        </div>
                        <div className="h-1 w-full bg-brand-lavender-tint/40 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.skipRate > 0.3 ? 'bg-brand-red' : 'bg-brand-green'}`}
                            style={{ width: `${Math.round(item.skipRate * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {!analytics?.skipRateByCity?.filter((r: any) => r.totalRespondents >= 3).length && (
                      <span className="text-brand-near-black/50 text-[10px] font-mono">No city with sufficient sample (n≥3)</span>
                    )}
                  </div>
                </div>

                {/* Purchase Frequency */}
                <div className="bg-brand-white p-5 rounded-2xl border border-brand-lavender/30 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-brand-purple shrink-0" />
                    <span className="text-[10px] font-mono font-bold text-brand-near-black/50 uppercase tracking-widest">
                      Purchase Frequency
                    </span>
                  </div>
                  {analytics?.consumptionFrequencyBreakdown && analytics.consumptionFrequencyBreakdown.length > 0 ? (
                    <ConsumptionFrequencyChart data={analytics.consumptionFrequencyBreakdown} />
                  ) : (
                    <span className="text-brand-near-black/40 text-[10px] font-mono block py-4 text-center">No frequency data</span>
                  )}
                </div>

                {/* Age Group Breakdown */}
                <div className="bg-brand-white p-5 rounded-2xl border border-brand-lavender/30 shadow-xs space-y-3">
                  <span className="text-[10px] font-mono font-bold text-brand-near-black/50 uppercase tracking-widest block">
                    Customer Demographics
                  </span>
                  {analytics?.ageGroupBreakdown && analytics.ageGroupBreakdown.length > 0 ? (
                    <ConsumptionFrequencyChart data={analytics.ageGroupBreakdown} />
                  ) : (
                    <span className="text-brand-near-black/40 text-[10px] font-mono block py-4 text-center">No age group data</span>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
