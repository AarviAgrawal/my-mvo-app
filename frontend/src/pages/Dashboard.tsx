import { AnalysisFilters } from '../lib/data';
import { Decision, AnalysisResponse } from '../types';
import DecisionCard from '../components/decisions/DecisionCard';
import { SalesByPlatformChart, AvailabilityDeltaChart, ConsumptionFrequencyChart } from '../components/charts/DashboardCharts';
import {
  TrendingUp,
  AlertCircle,
  ShoppingBag,
  Users,
  ChevronRight,
  ArrowRight,
  Loader2,
  Mic2,
  AlertTriangle,
  Zap,
  BarChart3,
  Eye,
  Target,
  Flame,
} from 'lucide-react';

interface DashboardProps {
  hotCities: any[];
  decisions: Decision[];
  analytics: AnalysisResponse | null;
  isLoading: boolean;
  onNavigateToExplore: (cityFilters: Partial<AnalysisFilters>) => void;
  onShare: (decision: Decision) => void;
  bookmarks: string[];
  onToggleBookmark: (id: string) => void;
  onViewDecision: (id: string) => void;
  userProfileName: string;
  completedDecisions: string[];
  onToggleCompleted: (id: string) => void;
}

export default function Dashboard({
  hotCities,
  decisions: allDecisions,
  analytics,
  isLoading,
  onNavigateToExplore,
  onShare,
  bookmarks,
  onToggleBookmark,
  onViewDecision,
  userProfileName,
  completedDecisions,
  onToggleCompleted
}: DashboardProps) {
  const decisions = allDecisions
    .filter(d => d.severity === 'high' || d.severity === 'medium')
    .slice(0, 4);

  const renderSparkline = (points: number[], severity: string) => {
    const strokeColor = severity === 'high' ? '#EF4444' : (severity === 'grow' ? '#22C55E' : '#F59E0B');
    const width = 120;
    const height = 30;
    const padding = 2;
    const maxVal = Math.max(...points);
    const minVal = Math.min(...points);
    const range = maxVal - minVal || 1;

    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((p - minVal) / range) * (height - padding * 2) - padding;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coords}
        />
      </svg>
    );
  };

  const getSeverityRingColor = (sev: string) => {
    switch (sev) {
      case 'high': return 'border-brand-red/30 bg-brand-white hover:border-brand-red';
      case 'grow': return 'border-brand-green/30 bg-brand-white hover:border-brand-green';
      default: return 'border-brand-amber/30 bg-brand-white hover:border-brand-amber';
    }
  };

  const formatCurrency = (val: number) => `₹${(val / 100000).toFixed(2)}L`;

  // Survey-derived calculations
  const gapPct = analytics
    ? Math.round((analytics.platformGap.blinkitPct + analytics.platformGap.zeptoPct) * 100)
    : 0;
  const highFreqPct = analytics ? Math.round(analytics.highFrequencyBuyerPct * 100) : 0;
  const unmetScore = analytics ? Math.round(analytics.unmetDemandScore * 100) : 0;

  // Conservative revenue opportunity: current pods revenue × missed multiple × 40% capture rate
  const opportunityMrp = analytics
    ? analytics.totalPodsSalesMrp * analytics.estimatedMissedRevenueMultiple * 0.4
    : 0;

  // Avg skip rate across all cities
  const avgSkipPct = analytics && analytics.skipRateByCity.length > 0
    ? Math.round(
        analytics.skipRateByCity.reduce((s, r) => s + r.skipRate, 0) /
        analytics.skipRateByCity.length * 100
      )
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 bg-brand-lavender-tint">
        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
        <p className="font-mono text-xs uppercase tracking-wider text-brand-purple/75 animate-pulse">
          Analyzing PODs distribution & Customer survey responses...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-brand-near-black">

      {/* 1. GREETING HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-brand-purple p-6 rounded-2xl shadow-md border border-brand-purple/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-white/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <h1 className="font-fredoka font-bold text-2xl md:text-3xl tracking-tight text-brand-white">
            Namaste, {userProfileName}!
          </h1>
          <p className="font-display text-[12px] text-brand-lavender-tint/90 mt-1">
            Intelligence powered by ecom data + live customer survey signals.
          </p>
          {/* Data source badges */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-brand-white/15 text-white border border-brand-white/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
              E-com PODs Data
            </span>
            <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-brand-white/15 text-white border border-brand-white/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse" />
              Customer Survey · {analytics?.totalSurveyResponses ?? 0} responses
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-brand-white/15 px-4 py-2 rounded-full border border-brand-white/20 self-start md:self-auto shrink-0">
          <span className="w-2 h-2 rounded-full bg-brand-live animate-pulse" />
          <span className="text-[10px] font-mono font-bold text-white tracking-wider uppercase">
            Timeline: Apr–May 2026
          </span>
        </div>
      </div>

      {/* 2. HOT CITIES STRIP */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-extrabold text-xs md:text-sm uppercase tracking-wider text-brand-purple/85">
            High-Priority Regional Signals
          </h2>
          <span className="text-[10px] font-mono text-brand-purple/60 uppercase tracking-widest">Swipe horizontally ➜</span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-3.5 pt-1 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar snap-x snap-mandatory">
          {hotCities.map((item, idx) => (
            <div
              key={idx}
              id={`hot-city-card-${item.city}`}
              onClick={() => onNavigateToExplore({ state: item.state, city: item.city })}
              className={`flex-none w-72 p-5 rounded-2xl border-2 shadow-xs cursor-pointer transition-all duration-300 snap-start select-none flex flex-col justify-between gap-4 ${getSeverityRingColor(item.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-extrabold text-base text-brand-near-black uppercase tracking-tight">{item.city}</h3>
                  <p className="text-[9px] font-mono font-bold text-brand-near-black/50 uppercase tracking-widest mt-0.5">{item.state}</p>
                </div>
                {renderSparkline(item.sparkline, item.severity)}
              </div>

              <div className="pt-3 border-t border-brand-lavender/20">
                <p className="text-xs font-sans text-brand-near-black/75 leading-relaxed line-clamp-2">
                  {item.whyItIsHot}
                </p>
                <div className="flex items-center justify-end text-[10px] font-mono font-bold uppercase tracking-wider text-brand-purple mt-3 gap-1">
                  <span>Explore City</span>
                  <ChevronRight className="w-3.5 h-3.5 text-brand-purple" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. PLATFORM GAP ALERT — moved above decisions so it's seen first */}
      {analytics?.platformGap && gapPct > 0 && (
        <div className="flex items-start gap-4 bg-brand-red/5 border-2 border-brand-red/25 rounded-2xl p-5">
          <AlertTriangle className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono font-bold text-brand-red uppercase tracking-wider">
              Survey Alert — Distribution Blindspot
            </p>
            <p className="text-sm font-sans text-brand-near-black/85 mt-1.5 leading-relaxed">
              <strong>{gapPct}%</strong> of surveyed customers shop on{' '}
              <strong>Blinkit</strong> ({Math.round(analytics.platformGap.blinkitPct * 100)}%) or{' '}
              <strong>Zepto</strong> ({Math.round(analytics.platformGap.zeptoPct * 100)}%){' '}
              — platforms where <strong>MadMix has zero sales</strong>. This demand is captured in survey data and invisible to ecom reporting alone.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[9px] font-mono text-brand-near-black/40 uppercase tracking-wider">Conservative Opportunity</p>
            <p className="font-fredoka font-bold text-xl text-brand-red">{formatCurrency(opportunityMrp)}</p>
            <p className="text-[9px] font-mono text-brand-near-black/40 uppercase tracking-wider">per month</p>
          </div>
        </div>
      )}

      {/* 4. INTELLIGENCE CENTER — Decisions + Survey-Integrated KPIs */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">

        {/* Left: Top Recommended Decisions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-extrabold text-xs md:text-sm uppercase tracking-wider text-brand-purple/85">
              Top Recommended Operations
            </h2>
            <button
              onClick={() => onNavigateToExplore({})}
              className="text-[10px] font-display font-bold text-brand-purple uppercase tracking-wider hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
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
        </div>

        {/* Right: Survey-Integrated KPIs */}
        <div className="lg:col-span-5 space-y-5">
          <h2 className="font-display font-extrabold text-xs md:text-sm uppercase tracking-wider text-brand-purple/85">
            Combined Signal KPIs
          </h2>

          {/* KPI Grid — survey-first metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-brand-white p-5 rounded-2xl border border-brand-lavender/30 shadow-xs flex flex-col justify-between stat-box">
              <div className="flex items-center justify-between text-brand-near-black/50 font-mono text-[9px] uppercase tracking-wider">
                <span>Sales Volume</span>
                <ShoppingBag className="w-3.5 h-3.5 text-brand-purple" />
              </div>
              <div className="mt-3">
                <span className="font-fredoka font-bold text-2xl text-brand-purple font-tabular block leading-none">
                  {formatCurrency(analytics?.totalSalesMrp || 0)}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[8px] font-mono font-bold text-brand-green bg-brand-green/10 border border-brand-green/20 px-2 py-0.5 rounded-full mt-2.5">
                  <TrendingUp className="w-2.5 h-2.5" /> +14% Apr→May
                </span>
              </div>
            </div>

            <div className="bg-brand-red/5 p-5 rounded-2xl border border-brand-red/20 shadow-xs flex flex-col justify-between stat-box">
              <div className="flex items-center justify-between text-brand-near-black/50 font-mono text-[9px] uppercase tracking-wider">
                <span>Survey Opportunity</span>
                <Target className="w-3.5 h-3.5 text-brand-red" />
              </div>
              <div className="mt-3">
                <span className="font-fredoka font-bold text-2xl text-brand-red font-tabular block leading-none">
                  {formatCurrency(opportunityMrp)}
                </span>
                <p className="text-[8px] font-mono text-brand-near-black/50 uppercase mt-2.5 leading-tight">
                  Conservative / month from gap
                </p>
              </div>
            </div>

            <div className="bg-brand-white p-5 rounded-2xl border border-brand-lavender/30 shadow-xs flex flex-col justify-between stat-box">
              <div className="flex items-center justify-between text-brand-near-black/50 font-mono text-[9px] uppercase tracking-wider">
                <span>Loyal Core Buyers</span>
                <Flame className="w-3.5 h-3.5 text-brand-amber" />
              </div>
              <div className="mt-3">
                <span className="font-fredoka font-bold text-2xl text-brand-purple font-tabular block leading-none">
                  {highFreqPct}%
                </span>
                <p className="text-[8px] font-mono text-brand-near-black/50 uppercase mt-2.5 leading-tight">
                  Buy daily / few times a week
                </p>
              </div>
            </div>

            <div className="bg-brand-white p-5 rounded-2xl border border-brand-lavender/30 shadow-xs flex flex-col justify-between stat-box">
              <div className="flex items-center justify-between text-brand-near-black/50 font-mono text-[9px] uppercase tracking-wider">
                <span>Unmet Demand Score</span>
                <Zap className="w-3.5 h-3.5 text-brand-amber" />
              </div>
              <div className="mt-3">
                <span className="font-fredoka font-bold text-2xl text-brand-amber font-tabular block leading-none">
                  {unmetScore}/100
                </span>
                <div className="w-full h-1.5 bg-brand-lavender-tint/40 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-brand-amber rounded-full" style={{ width: `${unmetScore}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* "3 Things Survey Unlocked" Narrative Panel */}
          <div className="bg-brand-purple/5 border border-brand-purple/20 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-brand-purple shrink-0" />
              <h3 className="font-display font-extrabold text-[11px] uppercase tracking-wider text-brand-purple">
                3 Signals Only Survey Data Revealed
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-brand-red/15 border border-brand-red/30 text-brand-red text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <div>
                  <p className="text-[11px] font-display font-bold text-brand-near-black uppercase tracking-tight">Demand Exists Where Sales Show Zero</p>
                  <p className="text-[10px] font-sans text-brand-near-black/65 mt-0.5 leading-relaxed">
                    {avgSkipPct}% of customers <em>tried</em> to buy but couldn't find MadMix. Ecom data shows a decline — survey data confirms it's a supply failure, not a demand failure.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-brand-amber/15 border border-brand-amber/30 text-brand-amber text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <div>
                  <p className="text-[11px] font-display font-bold text-brand-near-black uppercase tracking-tight">Platform Blindspot Quantified</p>
                  <p className="text-[10px] font-sans text-brand-near-black/65 mt-0.5 leading-relaxed">
                    {gapPct}% of your surveyed customers are actively shopping on Blinkit & Zepto. Without customer data, this segment is completely invisible in ecom reporting.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-brand-green/15 border border-brand-green/30 text-brand-green text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <div>
                  <p className="text-[11px] font-display font-bold text-brand-near-black uppercase tracking-tight">Loyal Core Identified</p>
                  <p className="text-[10px] font-sans text-brand-near-black/65 mt-0.5 leading-relaxed">
                    {highFreqPct}% of customers are Daily or Weekly buyers — your retention-priority segment. SKU sales data alone cannot identify loyalty without survey frequency data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SALES & OPERATIONS CHARTS */}
      <div className="space-y-4 pt-2">
        <h2 className="font-display font-extrabold text-xs md:text-sm uppercase tracking-wider text-brand-purple/85">
          Quick Sales & Operations Pulse
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-brand-white p-6 rounded-2xl border border-brand-lavender/30 shadow-xs space-y-4">
            <div>
              <h3 className="font-display font-extrabold text-sm text-brand-purple uppercase tracking-tight">Sales by Platform (Ecom)</h3>
              <p className="text-[10px] font-mono text-brand-near-black/50 uppercase tracking-wider">Revenue split — only Big Basket, Instamart, Amazon</p>
            </div>
            {analytics?.salesByPlatform && (
              <SalesByPlatformChart data={analytics.salesByPlatform} />
            )}
          </div>

          <div className="bg-brand-white p-6 rounded-2xl border border-brand-lavender/30 shadow-xs space-y-4">
            <div>
              <h3 className="font-display font-extrabold text-sm text-brand-purple uppercase tracking-tight">April vs May Revenue by Platform</h3>
              <p className="text-[10px] font-mono text-brand-near-black/50 uppercase tracking-wider">Month-over-month platform sales comparison</p>
            </div>
            {analytics?.podsSalesDelta && analytics.podsSalesDelta.length > 0 && (
              <AvailabilityDeltaChart data={analytics.podsSalesDelta} />
            )}
          </div>
        </div>
      </div>

      {/* 6. CUSTOMER INTELLIGENCE — deep survey breakdown */}
      <div className="space-y-5 pt-2">
        <div className="flex items-center gap-2">
          <Mic2 className="w-4 h-4 text-brand-purple" />
          <h2 className="font-display font-extrabold text-xs md:text-sm uppercase tracking-wider text-brand-purple/85">
            Customer Intelligence — Survey Deep-Dive
          </h2>
          <span className="text-[9px] font-mono font-bold bg-brand-purple/10 text-brand-purple px-2 py-0.5 rounded-full border border-brand-purple/20 uppercase tracking-wider">
            {analytics?.totalSurveyResponses ?? 0} respondents · Pack QR scan
          </span>
        </div>

        {/* Top row: Demographic + Frequency */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-brand-white p-6 rounded-2xl border border-brand-lavender/30 shadow-xs space-y-4">
            <div>
              <h3 className="font-display font-extrabold text-sm text-brand-purple uppercase tracking-tight">Customer Age Groups</h3>
              <p className="text-[10px] font-mono text-brand-near-black/50 uppercase tracking-wider">
                Demographic composition of survey respondents
              </p>
            </div>
            {analytics?.ageGroupBreakdown && analytics.ageGroupBreakdown.length > 0 ? (
              <ConsumptionFrequencyChart data={analytics.ageGroupBreakdown} />
            ) : (
              <div className="h-40 flex items-center justify-center text-[10px] font-mono text-brand-near-black/40 uppercase tracking-wider">
                No age group data available
              </div>
            )}
          </div>

          <div className="bg-brand-white p-6 rounded-2xl border border-brand-lavender/30 shadow-xs space-y-4">
            <div>
              <h3 className="font-display font-extrabold text-sm text-brand-purple uppercase tracking-tight">Purchase Frequency</h3>
              <p className="text-[10px] font-mono text-brand-near-black/50 uppercase tracking-wider">
                How often customers buy — {highFreqPct}% are Daily/Weekly buyers
              </p>
            </div>
            {analytics?.consumptionFrequencyBreakdown && analytics.consumptionFrequencyBreakdown.length > 0 ? (
              <ConsumptionFrequencyChart data={analytics.consumptionFrequencyBreakdown} />
            ) : (
              <div className="h-40 flex items-center justify-center text-[10px] font-mono text-brand-near-black/40 uppercase tracking-wider">
                No frequency data available
              </div>
            )}
          </div>
        </div>

        {/* Bottom row: Platform breakdown + Skip Rate + Revenue Opportunity callout */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Platform Gap Detail */}
          <div className="bg-brand-white p-6 rounded-2xl border border-brand-lavender/30 shadow-xs space-y-4">
            <div>
              <h3 className="font-display font-extrabold text-sm text-brand-purple uppercase tracking-tight">Where Customers Shop</h3>
              <p className="text-[10px] font-mono text-brand-near-black/50 uppercase tracking-wider">
                vs. where MadMix sells
              </p>
            </div>
            {analytics?.platformGap && (
              <div className="space-y-3">
                {[
                  { label: 'Blinkit', pct: Math.round(analytics.platformGap.blinkitPct * 100), color: 'bg-brand-red', sells: false },
                  { label: 'Zepto', pct: Math.round(analytics.platformGap.zeptoPct * 100), color: 'bg-brand-amber', sells: false },
                  { label: 'BB / Instamart / Amazon', pct: Math.round(analytics.platformGap.otherPct * 100), color: 'bg-brand-green', sells: true },
                ].map(({ label, pct, color, sells }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <span className="text-brand-near-black/70">{label}</span>
                        {!sells && (
                          <span className="text-[8px] bg-brand-red/10 text-brand-red border border-brand-red/20 px-1.5 py-0.5 rounded-full">No listing</span>
                        )}
                        {sells && (
                          <span className="text-[8px] bg-brand-green/10 text-brand-green border border-brand-green/20 px-1.5 py-0.5 rounded-full">Active</span>
                        )}
                      </div>
                      <span className="text-brand-purple font-extrabold">{pct}%</span>
                    </div>
                    <div className="h-2 w-full bg-brand-lavender-tint/50 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Skip Rate by City */}
          <div className="bg-brand-white p-6 rounded-2xl border border-brand-lavender/30 shadow-xs space-y-4">
            <div>
              <h3 className="font-display font-extrabold text-sm text-brand-purple uppercase tracking-tight">Availability Skip Rate</h3>
              <p className="text-[10px] font-mono text-brand-near-black/50 uppercase tracking-wider">
                % who skipped buying due to product unavailability
              </p>
            </div>
            <div className="space-y-2">
              {analytics?.skipRateByCity
                ?.filter(r => r.totalRespondents >= 3)
                .slice(0, 6)
                .map((item) => (
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
                    <div className="h-1.5 w-full bg-brand-lavender-tint/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.skipRate > 0.3 ? 'bg-brand-red' : 'bg-brand-green'}`}
                        style={{ width: `${Math.round(item.skipRate * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              {!analytics?.skipRateByCity?.filter(r => r.totalRespondents >= 3).length && (
                <span className="text-brand-near-black/40 text-[10px] font-mono">No city with sufficient sample (n≥3)</span>
              )}
            </div>
          </div>

          {/* Revenue Opportunity Callout */}
          <div className="bg-brand-purple p-6 rounded-2xl shadow-xs space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-lavender-tint shrink-0" />
              <h3 className="font-display font-extrabold text-[11px] uppercase tracking-wider text-brand-lavender-tint">
                Survey-Revealed Opportunity
              </h3>
            </div>

            <div>
              <p className="font-fredoka font-bold text-3xl text-brand-white">{formatCurrency(opportunityMrp)}</p>
              <p className="text-[9px] font-mono text-brand-lavender-tint/70 uppercase tracking-wider mt-1">conservative / month</p>
            </div>

            <div className="space-y-1.5 border-t border-brand-white/15 pt-3">
              <p className="text-[9px] font-mono text-brand-lavender-tint/70 uppercase tracking-wider leading-relaxed">
                Estimate: current ecom revenue × {analytics ? (analytics.estimatedMissedRevenueMultiple * 100).toFixed(0) : 0}% gap ratio × 40% conservative capture rate
              </p>
              <p className="text-[10px] font-sans text-brand-white/85 leading-relaxed">
                This number is <strong>invisible without survey data</strong> — ecom reporting shows ₹0 on Blinkit/Zepto. Only customer interviews reveal the addressable demand.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-brand-white/10 border border-brand-white/20 rounded-xl px-3 py-2 mt-1">
              <AlertCircle className="w-3.5 h-3.5 text-brand-lavender-tint shrink-0" />
              <p className="text-[9px] font-mono font-bold text-brand-lavender-tint/80 uppercase tracking-wider leading-snug">
                Unmet demand score: {unmetScore}/100
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-3 h-3 text-brand-lavender-tint/60" />
              <p className="text-[9px] font-mono text-brand-lavender-tint/60 uppercase tracking-wider">
                Based on {analytics?.totalSurveyResponses ?? 0} customer responses
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
