import { useEffect, useState } from 'react';
import { SharedAnalysis } from '../types';
import { getSharedAnalyses } from '../lib/data';
import { 
  Share2, 
  Clock, 
  MessageSquare, 
  ArrowRight, 
  Loader2
} from 'lucide-react';

interface SharedProps {
  onLoadSharedScope: (filters: SharedAnalysis['filterScope'], decisionId?: string) => void;
}

export default function Shared({ onLoadSharedScope }: SharedProps) {
  const [sharedList, setSharedList] = useState<SharedAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFeed() {
      setIsLoading(true);
      const data = await getSharedAnalyses();
      setSharedList(data);
      setIsLoading(false);
    }
    loadFeed();
  }, []);

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScopePreview = (scope: SharedAnalysis['filterScope']) => {
    const items = [];
    if (scope.state) items.push(scope.state.toUpperCase());
    if (scope.city) items.push(scope.city.toUpperCase());
    if (scope.platform) items.push(scope.platform.toUpperCase());
    if (scope.flavour) items.push(scope.flavour.toUpperCase());
    return items.length > 0 ? items.join(' | ') : 'ALL INDIA DATABASE';
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 bg-brand-lavender-tint">
        <Loader2 className="w-8 h-8 animate-spin text-brand-purple" />
        <p className="text-[10px] font-mono uppercase tracking-wider text-brand-purple/75">Loading operations shared feed...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto text-brand-near-black">
      
      {/* Header */}
      <div className="border-b border-brand-lavender/30 pb-5">
        <h1 className="font-fredoka font-bold text-2xl tracking-tight text-brand-purple">Teammate Collaborations</h1>
        <p className="font-display text-[11px] uppercase tracking-wider text-brand-near-black/60 mt-1">
          Review operational notes, dashboard presets, and findings shared by other MadMix managers.
        </p>
      </div>

      {sharedList.length === 0 ? (
        <div className="bg-brand-white rounded-2xl border border-brand-lavender/30 p-12 text-center space-y-4 shadow-xs">
          <Share2 className="w-12 h-12 text-brand-purple mx-auto animate-bounce animate-duration-1000" />
          <div className="space-y-2">
            <h3 className="font-display font-extrabold text-base uppercase text-brand-near-black">No Shares on the Wall</h3>
            <p className="text-xs text-brand-near-black/70 max-w-xs mx-auto leading-relaxed">
              When analyzing a metric in the Explore page or viewing a Decision card, click the share icon to post your findings here!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {sharedList.map((item) => (
            <div 
              key={item.id} 
              className="bg-brand-white rounded-2xl border border-brand-lavender/30 p-5 shadow-xs space-y-4 hover:border-brand-purple/40 transition-all duration-300"
            >
              
              {/* Author header */}
              <div className="flex items-center justify-between border-b border-brand-lavender-tint/30 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-brand-lavender text-brand-purple border border-brand-lavender/20 font-fredoka font-bold rounded-full flex items-center justify-center text-xs uppercase shadow-xs">
                    {item.sharedBy.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-sm text-brand-near-black uppercase tracking-tight">{item.sharedBy}</h3>
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-brand-near-black/50 uppercase tracking-widest font-bold">
                      <Clock className="w-3.5 h-3.5 text-brand-purple opacity-80" />
                      <span>{formatTime(item.sharedAt)}</span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold bg-brand-lavender-tint/40 border border-brand-lavender/25 text-brand-near-black/60 px-2.5 py-0.5 rounded-full">
                  ID: {item.id}
                </span>
              </div>

              {/* Title & Note body */}
              <div className="space-y-2.5">
                <h4 className="font-display font-extrabold text-base text-brand-near-black uppercase tracking-tight">
                  {item.title}
                </h4>
                
                {item.note && item.note.trim() && (
                  <div className="flex gap-2.5 bg-brand-lavender-tint/20 p-4 rounded-2xl border border-brand-lavender/25 text-xs leading-relaxed text-brand-near-black/85 font-sans">
                    <MessageSquare className="w-4 h-4 text-brand-purple shrink-0 mt-0.5" />
                    <p>{item.note}</p>
                  </div>
                )}
              </div>

              {/* Shared Scope tags */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-near-black/50">
                  <span>Scope Preset:</span>
                  <span className="text-brand-purple bg-brand-purple/10 border border-brand-lavender/20 px-3 py-1 rounded-full font-mono font-bold ml-1.5">
                    {getScopePreview(item.filterScope)}
                  </span>
                </div>

                <button
                  id={`load-shared-analysis-btn-${item.id}`}
                  onClick={() => onLoadSharedScope(item.filterScope, item.decisionId)}
                  className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-white text-xs font-mono uppercase tracking-wider font-extrabold rounded-full transition-all shadow-md self-end sm:self-auto cursor-pointer"
                >
                  <span>Replicate Scope</span>
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
