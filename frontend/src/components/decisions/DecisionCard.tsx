import { useState } from 'react';
import { Decision } from '../../types';
import { 
  Bookmark, 
  Share2, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  ArrowRight,
  TrendingDown,
  Trash2,
  TrendingUp,
  Sliders,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import EvidencePanel from './EvidencePanel';
import RawDataTable from './RawDataTable';

interface DecisionCardProps {
  key?: any;
  decision: Decision;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onShare: (decision: Decision) => void;
  onViewDetails?: (id: string) => void;
  compact?: boolean;
  isCompleted?: boolean;
  onToggleCompleted?: (id: string) => void;
}

export default function DecisionCard({ 
  decision, 
  isBookmarked, 
  onToggleBookmark, 
  onShare,
  onViewDetails,
  compact = false,
  isCompleted = false,
  onToggleCompleted
}: DecisionCardProps) {
  // Helper to resolve style mappings based on decision type
  const getTypeMeta = (type: Decision['type']) => {
    switch (type) {
      case 'grow':
        return {
          label: 'Grow / Stock Up',
          bg: 'bg-brand-green/10 text-brand-green border-brand-green/20',
          dot: 'bg-brand-green',
          icon: TrendingUp,
          accent: 'border-l-4 border-l-brand-green',
          hoverBg: 'hover:bg-brand-lavender-tint/10'
        };
      case 'reduce':
        return {
          label: 'Reduce Stock',
          bg: 'bg-brand-amber/10 text-brand-amber border-brand-amber/20',
          dot: 'bg-brand-amber',
          icon: TrendingDown,
          accent: 'border-l-4 border-l-brand-amber',
          hoverBg: 'hover:bg-brand-lavender-tint/10'
        };
      case 'remove':
        return {
          label: 'Remove SKU',
          bg: 'bg-brand-red/10 text-brand-red border-brand-red/20',
          dot: 'bg-brand-red',
          icon: Trash2,
          accent: 'border-l-4 border-l-brand-red',
          hoverBg: 'hover:bg-brand-lavender-tint/10'
        };
      case 'monitor':
        return {
          label: 'Monitor closely',
          bg: 'bg-brand-purple/10 text-brand-purple border-brand-purple/20',
          dot: 'bg-brand-purple',
          icon: Sliders,
          accent: 'border-l-4 border-l-brand-purple',
          hoverBg: 'hover:bg-brand-lavender-tint/10'
        };
      case 'spend':
        return {
          label: 'Optimize Spend',
          bg: 'bg-brand-purple/10 text-brand-purple border-brand-purple/20',
          dot: 'bg-brand-purple',
          icon: Zap,
          accent: 'border-l-4 border-l-brand-purple',
          hoverBg: 'hover:bg-brand-lavender-tint/10'
        };
    }
  };

  const getSeverityBadge = (sev: Decision['severity']) => {
    switch (sev) {
      case 'high':
        return (
          <span className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-brand-red/10 text-brand-red px-2.5 py-0.5 rounded-full border border-brand-red/20">
            <AlertTriangle className="w-3 h-3 text-brand-red shrink-0" /> Critical
          </span>
        );
      case 'medium':
        return (
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-brand-amber/10 text-brand-amber px-2.5 py-0.5 rounded-full border border-brand-amber/20">
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-brand-lavender-tint/40 text-brand-near-black/60 px-2.5 py-0.5 rounded-full border border-brand-lavender/30">
            Low Priority
          </span>
        );
    }
  };

  const meta = getTypeMeta(decision.type);
  const TypeIcon = meta.icon;

  return (
    <div 
      className={`bg-brand-white rounded-2xl border border-brand-lavender/30 shadow-xs ${meta.accent} ${meta.hoverBg} transition-all duration-300 flex flex-col overflow-hidden`}
    >
      {/* CARD BODY */}
      <div className="p-5 md:p-6 flex-1 space-y-4">
        
        {/* Header Badges & Confidence */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-lavender-tint/30 pb-3.5">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] uppercase tracking-wider font-mono font-bold ${meta.bg}`}>
              <TypeIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{meta.label}</span>
            </span>
            {getSeverityBadge(decision.severity)}
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[9px] font-mono font-bold text-brand-near-black/50 uppercase tracking-widest">
              CONFIDENCE:
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-2 bg-brand-lavender-tint/50 rounded-full overflow-hidden border border-brand-lavender/30">
                <div 
                  className="h-full bg-brand-purple rounded-full" 
                  style={{ width: `${decision.confidence}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-brand-purple font-tabular">
                {decision.confidence}%
              </span>
            </div>
          </div>
        </div>

        {/* Action Title & Rationale */}
        <div className="space-y-2">
          <h3 
            onClick={() => onViewDetails && onViewDetails(decision.id)}
            className={`font-display font-extrabold text-base md:text-lg text-brand-near-black leading-snug tracking-tight transition-colors uppercase ${
              onViewDetails ? 'cursor-pointer hover:text-brand-purple' : ''
            }`}
          >
            {decision.action}
          </h3>
          <p className="font-sans text-xs md:text-sm text-brand-near-black/75 leading-relaxed">
            {decision.reasoning}
          </p>
        </div>

        {/* Scope Metadata Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {decision.city && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-brand-lavender-tint/30 text-brand-near-black/60 px-3 py-1 rounded-full border border-brand-lavender/25">
              📍 City: <b className="text-brand-near-black">{decision.city}</b>
            </span>
          )}
          {decision.platform && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-brand-lavender-tint/30 text-brand-near-black/60 px-3 py-1 rounded-full border border-brand-lavender/25">
              🛒 Platform: <b className="text-brand-near-black">{decision.platform}</b>
            </span>
          )}
          {decision.flavour && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-brand-lavender-tint/30 text-brand-near-black/60 px-3 py-1 rounded-full border border-brand-lavender/25 truncate max-w-xs">
              🍪 Flavor: <b className="text-brand-near-black">{decision.flavour}</b>
            </span>
          )}
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="bg-brand-lavender-tint/15 border-t border-brand-lavender/25 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Grounding Label instead of expanders */}
        <span className="text-[10px] font-mono font-bold text-brand-near-black/50 uppercase tracking-widest">
          Ground Truth Evidence Included
        </span>

        {/* Global actions (Bookmark, Share, Full View) */}
        <div className="flex items-center gap-2 flex-wrap">
          {onToggleCompleted && (
            <button
              id={`complete-btn-${decision.id}`}
              onClick={() => onToggleCompleted(decision.id)}
              title={isCompleted ? "Mark incomplete" : "Mark as completed"}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[10px] font-mono uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                isCompleted 
                  ? 'bg-brand-green/10 text-brand-green border-brand-green/30' 
                  : 'bg-brand-white text-brand-near-black/60 border-brand-lavender/30 hover:text-brand-green hover:text-brand-green'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'fill-current text-brand-green' : 'text-brand-near-black/60'}`} />
              <span>{isCompleted ? 'Completed' : 'Complete'}</span>
            </button>
          )}

          <button
            id={`bookmark-btn-${decision.id}`}
            onClick={() => onToggleBookmark(decision.id)}
            title="Bookmark this action"
            className={`p-2.5 rounded-full border transition-all cursor-pointer ${
              isBookmarked 
                ? 'bg-brand-purple/10 text-brand-purple border-brand-purple/30' 
                : 'bg-brand-white text-brand-near-black/60 border-brand-lavender/30 hover:text-brand-purple hover:border-brand-purple'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-brand-purple' : ''}`} />
          </button>

          <button
            id={`share-btn-${decision.id}`}
            onClick={() => onShare(decision)}
            title="Share with team"
            className="p-2.5 rounded-full bg-brand-white border border-brand-lavender/30 text-brand-near-black/60 hover:text-brand-purple hover:border-brand-purple transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {onViewDetails && (
            <button
              id={`view-details-btn-${decision.id}`}
              onClick={() => onViewDetails(decision.id)}
              className="flex items-center gap-1 px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-white text-[10px] font-mono uppercase tracking-wider font-extrabold rounded-full transition-all border border-transparent shadow-sm cursor-pointer"
            >
              <span>Full View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* AUTOMATIC EVIDENCE */}
      <div className="border-t border-brand-lavender/25 bg-brand-lavender-tint/10 p-5 md:p-6">
        <EvidencePanel evidence={decision.evidence} />
      </div>

      {/* AUTOMATIC RAW DATA */}
      <div className="border-t border-brand-lavender/25 bg-brand-lavender-tint/10 p-5 md:p-6 overflow-hidden">
        <RawDataTable rawDataRefs={decision.rawDataRefs} />
      </div>
    </div>
  );
}
