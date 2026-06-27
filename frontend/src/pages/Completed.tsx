import { useEffect, useState } from 'react';
import { Decision } from '../types';
import { getDecisions } from '../lib/data';
import DecisionCard from '../components/decisions/DecisionCard';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

interface CompletedProps {
  completedIds: string[];
  bookmarks: string[];
  onToggleBookmark: (id: string) => void;
  onToggleCompleted: (id: string) => void;
  onShare: (decision: Decision) => void;
  onViewDecision: (id: string) => void;
  onNavigateToExplore: () => void;
}

export default function Completed({ 
  completedIds,
  bookmarks, 
  onToggleBookmark, 
  onToggleCompleted,
  onShare,
  onViewDecision,
  onNavigateToExplore 
}: CompletedProps) {
  const [completedDecisions, setCompletedDecisions] = useState<Decision[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCompleted() {
      setIsLoading(true);
      const all = await getDecisions();
      const filtered = all.filter(d => completedIds.includes(d.id));
      setCompletedDecisions(filtered);
      setIsLoading(false);
    }
    loadCompleted();
  }, [completedIds]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 bg-brand-lavender-tint">
        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
        <p className="text-[10px] font-mono uppercase tracking-wider text-brand-purple/75">Retrieving completed actions database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto text-brand-near-black">
      
      {/* Header */}
      <div className="border-b border-brand-lavender/30 pb-5">
        <h1 className="font-fredoka font-bold text-2xl tracking-tight text-brand-purple">Completed Recommended Actions</h1>
        <p className="font-display text-[11px] uppercase tracking-wider text-brand-near-black/60 mt-1">
          Review recommended operations that your team has successfully marked as executed or resolved.
        </p>
      </div>

      {completedDecisions.length === 0 ? (
        <div className="bg-brand-white rounded-2xl border border-brand-lavender/30 p-12 text-center space-y-4 shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-brand-purple mx-auto animate-pulse" />
          <div className="space-y-2">
            <h3 className="font-display font-extrabold text-base uppercase text-brand-near-black">No Completed Actions</h3>
            <p className="text-xs text-brand-near-black/70 max-w-xs mx-auto leading-relaxed">
              When viewing actions in Dashboard or Explore, click the "Complete" button to log and archive completed operations.
            </p>
          </div>
          <button
            id="completed-start-explore-btn"
            onClick={onNavigateToExplore}
            className="inline-flex items-center gap-1.5 px-6 py-3 bg-brand-purple hover:bg-brand-purple/90 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer shadow-md mt-4"
          >
            <span>Explore Workbench</span>
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {completedDecisions.map((decision) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              isBookmarked={bookmarks.includes(decision.id)}
              onToggleBookmark={onToggleBookmark}
              isCompleted={true}
              onToggleCompleted={onToggleCompleted}
              onShare={onShare}
              onViewDetails={onViewDecision}
            />
          ))}
        </div>
      )}

    </div>
  );
}
