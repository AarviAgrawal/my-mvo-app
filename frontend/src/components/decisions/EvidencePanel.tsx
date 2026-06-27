import { EvidenceItem } from '../../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Database, 
  Users, 
  Activity,
  ShoppingBag
} from 'lucide-react';

interface EvidencePanelProps {
  evidence: EvidenceItem[];
}

export default function EvidencePanel({ evidence }: EvidencePanelProps) {
  
  // Icon selector based on source type
  const getSourceIcon = (source: EvidenceItem['source']) => {
    switch (source) {
      case 'Customer Survey':
        return <Users className="w-3.5 h-3.5 text-brand-purple" />;
      case 'PODs Availability':
        return <Activity className="w-3.5 h-3.5 text-brand-purple" />;
      case 'PODs Sales':
        return <ShoppingBag className="w-3.5 h-3.5 text-brand-green" />;
      case 'Sales vs Spends':
        return <Database className="w-3.5 h-3.5 text-brand-amber" />;
      default:
        return <Database className="w-3.5 h-3.5 text-brand-near-black/50" />;
    }
  };

  // Trend icon selector
  const getTrendBadge = (trend?: EvidenceItem['trend']) => {
    if (!trend) return null;
    switch (trend) {
      case 'up':
        return (
          <span className="flex items-center gap-1 text-[10px] text-brand-green bg-brand-green/10 border border-brand-green/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
            <TrendingUp className="w-3 h-3 text-brand-green animate-pulse" /> Up
          </span>
        );
      case 'down':
        return (
          <span className="flex items-center gap-1 text-[10px] text-brand-red bg-brand-red/10 border border-brand-red/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
            <TrendingDown className="w-3 h-3 text-brand-red" /> Down
          </span>
        );
      case 'flat':
        return (
          <span className="flex items-center gap-1 text-[10px] text-brand-amber bg-brand-amber/10 border border-brand-amber/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
            <Minus className="w-3 h-3 text-brand-amber" /> Flat
          </span>
        );
    }
  };

  return (
    <div className="space-y-3 text-brand-near-black">
      <h4 className="font-mono font-bold text-[10px] uppercase tracking-wider text-brand-near-black/50">
        Supporting Evidence
      </h4>
      <div className="grid gap-3 sm:grid-cols-2">
        {evidence.map((item, idx) => (
          <div 
            key={idx} 
            className="p-5 bg-brand-white border border-brand-lavender/30 rounded-2xl flex flex-col justify-between gap-3 shadow-xs hover:border-brand-purple/40 transition-all duration-200"
          >
            <div>
              <p className="font-display font-extrabold text-sm text-brand-near-black uppercase tracking-tight">
                {item.label}
              </p>
              <p className="font-sans text-xs text-brand-near-black/75 mt-1.5 leading-relaxed">
                {item.detail}
              </p>
            </div>
            
            <div className="flex items-center justify-between mt-1 pt-2 border-t border-brand-lavender-tint/40">
              <div className="flex items-center gap-1.5 bg-brand-lavender-tint/30 px-2 py-1 rounded-full border border-brand-lavender/20 text-[9px] font-mono font-bold uppercase tracking-wider text-brand-near-black/70">
                {getSourceIcon(item.source)}
                <span>{item.source}</span>
              </div>
              {getTrendBadge(item.trend)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
