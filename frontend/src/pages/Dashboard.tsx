import { useEffect, useState } from 'react';
import { 
  getHotCities, 
  getAnalysis, 
  getDecisions, 
  AnalysisFilters
} from '../lib/data';
import { Decision } from '../types';
import DecisionCard from '../components/decisions/DecisionCard';
import { SalesByPlatformChart, AvailabilityDeltaChart } from '../components/charts/DashboardCharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  ShoppingBag, 
  Users, 
  Heart, 
  Percent,
  ChevronRight,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface DashboardProps {
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
  onNavigateToExplore, 
  onShare, 
  bookmarks, 
  onToggleBookmark,
  onViewDecision,
  userProfileName,
  completedDecisions,
  onToggleCompleted
}: DashboardProps) {
  const [hotCities, setHotCities] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const [citiesList, decisionsList, analyticsData] = await Promise.all([
          getHotCities(),
          getDecisions(),
          getAnalysis({ state: '', city: '', pincode: '', platform: '', flavour: '' })
        ]);
        setHotCities(citiesList);
        
        // Filter for high/medium severity decisions as hero elements
        const priorityActions = decisionsList.filter(d => d.severity === 'high' || d.severity === 'medium');
        setDecisions(priorityActions.slice(0, 4));
        
        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Inline sparkline generator using tiny SVG
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
      case 'high':
        return 'border-brand-red/30 bg-brand-white hover:border-brand-red';
      case 'grow':
        return 'border-brand-green/30 bg-brand-white hover:border-brand-green';
      default:
        return 'border-brand-amber/30 bg-brand-white hover:border-brand-amber';
    }
  };

  const formatCurrency = (val: number) => {
    return `₹${(val / 100000).toFixed(2)}L`;
  };

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
            Get updates on fun stuff you probably want in your inbox! Millet operations are steady.
          </p>
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

      {/* 3. HERO DECISIONS & KEY KPIS */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        
        {/* Left Side: Hero Recommended Actions (Col span 7) */}
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

        {/* Right Side: Key Metrics & At-a-glance KPIs (Col span 5) */}
        <div className="lg:col-span-5 space-y-6">
          <h2 className="font-display font-extrabold text-xs md:text-sm uppercase tracking-wider text-brand-purple/85">
            Financial & Feedback KPI Summary
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {/* Sales Stat */}
            <div className="bg-brand-white p-5 rounded-2xl border border-brand-lavender/30 shadow-xs flex flex-col justify-between stat-box">
              <div className="flex items-center justify-between text-brand-near-black/50 font-mono text-[9px] uppercase tracking-wider">
                <span>Sales Volume</span>
                <ShoppingBag className="w-3.5 h-3.5 text-brand-purple" />
              </div>
              <div className="mt-3">
                <span className="font-fredoka font-bold text-2xl text-brand-purple font-tabular block leading-none">
                  {formatCurrency(analytics?.totalSales || 0)}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[8px] font-mono font-bold text-brand-green bg-brand-green/10 border border-brand-green/20 px-2 py-0.5 rounded-full mt-2.5">
                  <TrendingUp className="w-2.5 h-2.5" /> +14% Apr➜May
                </span>
              </div>
            </div>

            {/* Surveys Count Stat */}
            <div className="bg-brand-white p-5 rounded-2xl border border-brand-lavender/30 shadow-xs flex flex-col justify-between stat-box">
              <div className="flex items-center justify-between text-brand-near-black/50 font-mono text-[9px] uppercase tracking-wider">
                <span>Survey Responses</span>
                <Users className="w-3.5 h-3.5 text-brand-purple" />
              </div>
              <div className="mt-3">
                <span className="font-fredoka font-bold text-2xl text-brand-purple font-tabular block leading-none">
                  {analytics?.totalSurveys || 0}
                </span>
                <p className="text-[9px] font-mono text-brand-near-black/50 uppercase mt-2.5 leading-tight">
                  Scanned via product packs
                </p>
              </div>
            </div>

            {/* Customer Satisfaction Stat */}
            <div className="bg-brand-white p-5 rounded-2xl border border-brand-lavender/30 shadow-xs flex flex-col justify-between stat-box">
              <div className="flex items-center justify-between text-brand-near-black/50 font-mono text-[9px] uppercase tracking-wider">
                <span>Repurchase Intent</span>
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              </div>
              <div className="mt-3">
                <span className="font-fredoka font-bold text-2xl text-brand-purple font-tabular block leading-none">
                  {analytics?.avgRepurchaseIntent || 0}%
                </span>
                <p className="text-[9px] font-mono text-brand-near-black/50 uppercase mt-2.5 leading-tight">
                  Answering 'Definitely'
                </p>
              </div>
            </div>

            {/* Advertising Efficiency Stat */}
            <div className="bg-brand-white p-5 rounded-2xl border border-brand-lavender/30 shadow-xs flex flex-col justify-between stat-box">
              <div className="flex items-center justify-between text-brand-near-black/50 font-mono text-[9px] uppercase tracking-wider">
                <span>Worst A2S Platform</span>
                <Percent className="w-3.5 h-3.5 text-brand-amber" />
              </div>
              <div className="mt-3">
                <span className="font-fredoka font-bold text-xl text-brand-purple font-tabular truncate block leading-none uppercase">
                  {analytics?.worstA2SPlatform?.platform || 'None'}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[8px] font-mono font-bold text-brand-red bg-brand-red/10 border border-brand-red/20 px-2 py-0.5 rounded-full mt-2.5">
                  A2S Ratio: {analytics?.worstA2SPlatform?.ratio || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Quick Informational Box */}
          <div className="bg-brand-white p-5 rounded-2xl border border-brand-lavender/30 shadow-xs flex gap-3">
            <AlertCircle className="w-4 h-4 text-brand-purple shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-brand-near-black/80">
              <p className="font-display font-bold text-brand-purple uppercase tracking-wider">Be in the know:</p>
              <p className="mt-1 font-sans text-[11px] leading-relaxed">
                Our operations logic correlates real-time shelf availability ("PODs data") with direct customer feedback to minimize stuck capital in underperforming channels.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ANALYTICS QUICK CHARTS ROW */}
      <div className="space-y-4 pt-2">
        <h2 className="font-display font-extrabold text-xs md:text-sm uppercase tracking-wider text-brand-purple/85">
          Quick Sales & Operations Pulse
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Sales by platform */}
          <div className="bg-brand-white p-6 rounded-2xl border border-brand-lavender/30 shadow-xs space-y-4">
            <div>
              <h3 className="font-display font-extrabold text-sm text-brand-purple uppercase tracking-tight">Sales Distribution by Platform</h3>
              <p className="text-[10px] font-mono text-brand-near-black/50 uppercase tracking-wider">Gross revenue split across commercial outlets</p>
            </div>
            {analytics?.salesByPlatform && (
              <SalesByPlatformChart data={analytics.salesByPlatform} />
            )}
          </div>

          {/* Monthly Availability Delta */}
          <div className="bg-brand-white p-6 rounded-2xl border border-brand-lavender/30 shadow-xs space-y-4">
            <div>
              <h3 className="font-display font-extrabold text-sm text-brand-purple uppercase tracking-tight">Availability Delta (April vs May)</h3>
              <p className="text-[10px] font-mono text-brand-near-black/50 uppercase tracking-wider">Diverging indicators mapping regional stock dropouts</p>
            </div>
            {analytics?.availabilityDelta && (
              <AvailabilityDeltaChart data={analytics.availabilityDelta} />
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
