import { useEffect, useState } from 'react';
import { Decision } from '../types';
import { getDecisionById } from '../lib/data';
import { 
  ArrowLeft, 
  Bookmark, 
  Share2, 
  AlertTriangle, 
  Clock, 
  Lightbulb, 
  ShieldCheck,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import EvidencePanel from '../components/decisions/EvidencePanel';
import RawDataTable from '../components/decisions/RawDataTable';

interface DecisionDetailProps {
  decisionId: string;
  onBack: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onShare: (decision: Decision) => void;
  onNavigateToExplore: (filters: any) => void;
  isCompleted?: boolean;
  onToggleCompleted?: (id: string) => void;
}

export default function DecisionDetail({ 
  decisionId, 
  onBack, 
  isBookmarked, 
  onToggleBookmark,
  onShare,
  onNavigateToExplore,
  isCompleted = false,
  onToggleCompleted
}: DecisionDetailProps) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDecision() {
      setIsLoading(true);
      const data = await getDecisionById(decisionId);
      if (data) setDecision(data);
      setIsLoading(false);
    }
    loadDecision();
  }, [decisionId]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 bg-brand-lavender-tint">
        <div className="w-8 h-8 border-4 border-brand-lavender/30 border-t-brand-purple rounded-full animate-spin" />
        <p className="text-[10px] font-mono uppercase tracking-wider text-brand-purple/75">Loading ground-truth metrics for decision...</p>
      </div>
    );
  }

  if (!decision) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4 bg-brand-white rounded-2xl p-8 border border-brand-lavender/30 shadow-md max-w-lg mx-auto text-center">
        <AlertTriangle className="w-10 h-10 text-brand-red animate-pulse" />
        <p className="font-display font-black text-sm uppercase tracking-wider text-brand-near-black">Decision Not Found</p>
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-mono font-bold text-brand-purple uppercase tracking-wider hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto text-brand-near-black">
      
      {/* 1. TOP NAVIGATION / ACTION BAR */}
      <div className="flex items-center justify-between border-b border-brand-lavender/30 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-white border border-brand-lavender/30 text-brand-near-black/80 hover:text-brand-purple hover:border-brand-purple/50 transition-all text-[10px] font-mono uppercase tracking-wider font-bold rounded-full shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-brand-purple" />
          <span>Back to Feed</span>
        </button>

        <div className="flex items-center gap-2">
          {onToggleCompleted && (
            <button
              id="detail-complete-btn"
              onClick={() => onToggleCompleted(decision.id)}
              className={`flex items-center gap-1.5 px-4 py-2 border text-[10px] font-mono uppercase tracking-wider font-extrabold rounded-full transition-all cursor-pointer ${
                isCompleted 
                  ? 'bg-brand-green/10 text-brand-green border-brand-green/30' 
                  : 'bg-brand-white text-brand-near-black/60 border-brand-lavender/30 hover:text-brand-green hover:border-brand-green'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'fill-current text-brand-green' : 'text-brand-near-black/60'}`} />
              <span>{isCompleted ? 'Completed' : 'Complete'}</span>
            </button>
          )}

          <button
            id="detail-bookmark-btn"
            onClick={() => onToggleBookmark(decision.id)}
            className={`p-2.5 rounded-full border transition-all cursor-pointer bg-brand-white border-brand-lavender/30 ${
              isBookmarked 
                ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/30' 
                : 'text-brand-near-black/60 hover:text-brand-purple hover:border-brand-purple/50'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-brand-purple' : ''}`} />
          </button>

          <button
            id="detail-share-btn"
            onClick={() => onShare(decision)}
            className="p-2.5 rounded-full bg-brand-white border border-brand-lavender/30 text-brand-near-black/60 hover:text-brand-purple hover:border-brand-purple/50 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. HERO HEADLINE CARD */}
      <div className="bg-brand-white rounded-2xl border border-brand-lavender/30 p-6 md:p-8 shadow-xs space-y-6">
        
        {/* Severity badge & timestamp */}
        <div className="flex items-center justify-between border-b border-brand-lavender-tint/40 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-brand-red/10 text-brand-red px-2.5 py-0.5 rounded-full border border-brand-red/20">
              {decision.severity} Priority
            </span>
            <span className="flex items-center gap-1.5 text-[9px] font-mono text-brand-near-black/50 font-bold uppercase tracking-widest">
              <Clock className="w-3.5 h-3.5 text-brand-purple" /> Generated 2 days ago
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold text-brand-near-black/50 uppercase tracking-widest">
              CONFIDENCE:
            </span>
            <span className="font-fredoka font-bold text-sm text-brand-purple font-tabular">
              {decision.confidence}%
            </span>
          </div>
        </div>

        {/* Action title */}
        <div className="space-y-4">
          <h1 className="font-fredoka font-bold text-2xl md:text-3xl text-brand-purple uppercase tracking-tight leading-none">
            {decision.action}
          </h1>
          
          <div className="flex items-start gap-3 bg-brand-lavender-tint/20 p-5 rounded-2xl border border-brand-lavender/25">
            <Lightbulb className="w-5 h-5 text-brand-purple shrink-0 mt-0.5" />
            <div>
              <h3 className="font-mono font-bold text-[10px] uppercase tracking-wider text-brand-purple/70">Executive Summary Rationale</h3>
              <p className="font-sans text-sm text-brand-near-black/85 leading-relaxed mt-1.5">
                {decision.reasoning}
              </p>
            </div>
          </div>
        </div>

        {/* Target metadata chips */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-lavender-tint/30">
          {decision.city && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-brand-lavender-tint/30 text-brand-near-black/60 px-3 py-1.5 rounded-full border border-brand-lavender/25">
              <span>Region:</span>
              <strong className="text-brand-purple font-extrabold">{decision.city}</strong>
            </div>
          )}
          {decision.platform && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-brand-lavender-tint/30 text-brand-near-black/60 px-3 py-1.5 rounded-full border border-brand-lavender/25">
              <span>Channel:</span>
              <strong className="text-brand-purple font-extrabold">{decision.platform}</strong>
            </div>
          )}
          {decision.flavour && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-brand-lavender-tint/30 text-brand-near-black/60 px-3 py-1.5 rounded-full border border-brand-lavender/25 truncate max-w-sm">
              <span>Flavor:</span>
              <strong className="text-brand-purple font-extrabold">{decision.flavour}</strong>
            </div>
          )}
        </div>

      </div>

      {/* 3. EVIDENCE SUBSECTION */}
      <div className="bg-brand-white rounded-2xl border border-brand-lavender/30 p-6 md:p-8 shadow-xs">
        <EvidencePanel evidence={decision.evidence} />
      </div>

      {/* 4. GROUND TRUTH TABLES */}
      <div className="bg-brand-white rounded-2xl border border-brand-lavender/30 p-6 md:p-8 shadow-xs">
        <RawDataTable rawDataRefs={decision.rawDataRefs} />
      </div>

      {/* 5. EXPLORATION CALLOUT */}
      <div className="bg-brand-purple text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md border border-brand-purple/10">
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-lavender" />
            <h3 className="font-fredoka font-bold text-sm uppercase tracking-wider">Verify the Numbers Live</h3>
          </div>
          <p className="font-sans text-xs text-brand-lavender-tint/90 max-w-xl leading-relaxed">
            Interested in comparing this city's performance against alternative regions? Transition directly to the analytics workbench pre-configured to this regional profile.
          </p>
        </div>

        <button
          id="detail-navigate-explore-btn"
          onClick={() => onNavigateToExplore({
            state: decision.state || '',
            city: decision.city || '',
            pincode: '',
            platform: decision.platform || '',
            flavour: decision.flavour || ''
          })}
          className="flex items-center justify-center gap-1.5 px-6 py-3.5 bg-brand-white hover:bg-brand-lavender-tint text-brand-purple text-xs font-mono font-bold uppercase tracking-wider rounded-full transition-all shadow-md shrink-0 cursor-pointer"
        >
          <span>Open in Workbench</span>
          <ArrowRight className="w-4 h-4 text-brand-purple" />
        </button>
      </div>

    </div>
  );
}
