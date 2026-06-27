import { useState } from 'react';
import { X, Send, Users } from 'lucide-react';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (title: string, note: string) => void;
  itemName: string;
}

export default function ShareDialog({ isOpen, onClose, onConfirm, itemName }: ShareDialogProps) {
  const [note, setNote] = useState('');
  const [title, setTitle] = useState(`Analysis on ${itemName}`);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(['Sneha Kulkarni', 'Rohan Sharma']);

  const mockRoster = [
    { name: 'Sneha Kulkarni', role: 'Growth Lead', avatar: '👩‍💻' },
    { name: 'Rohan Sharma', role: 'Brand Mgr', avatar: '👨‍💼' },
    { name: 'Ameya Patil', role: 'Operations', avatar: '📦' },
    { name: 'Priyanka Shah', role: 'West India Lead', avatar: '👩‍💼' }
  ];

  const handleMemberToggle = (name: string) => {
    if (selectedMembers.includes(name)) {
      setSelectedMembers(selectedMembers.filter(m => m !== name));
    } else {
      setSelectedMembers([...selectedMembers, name]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-brand-near-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-brand-near-black">
      <div className="bg-brand-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-brand-lavender/30 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-brand-lavender-tint/40 flex items-center justify-between bg-brand-lavender-tint/20">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-purple" />
            <span className="font-fredoka font-bold text-sm md:text-base text-brand-purple">Share with MadMix Team</span>
          </div>
          <button 
            id="close-share-dialog-btn"
            onClick={onClose} 
            className="p-1 hover:bg-brand-lavender-tint/40 border border-brand-lavender/25 rounded-full transition-all cursor-pointer"
          >
            <X className="w-4 h-4 text-brand-near-black/70" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 flex-1">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold text-brand-near-black/50 uppercase tracking-widest block">Subject / Title</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-brand-lavender-tint/20 border border-brand-lavender/25 text-brand-near-black rounded-2xl text-xs font-mono focus:border-brand-purple outline-none focus:ring-1 focus:ring-brand-purple"
              placeholder="e.g., Ahmedabad BBQ blast drop"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold text-brand-near-black/50 uppercase tracking-widest block">Add a note for the team (Optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 bg-brand-lavender-tint/20 border border-brand-lavender/25 text-brand-near-black rounded-2xl text-xs font-mono focus:border-brand-purple outline-none focus:ring-1 focus:ring-brand-purple resize-none"
              placeholder="Provide optional context on why this needs attention..."
            />
          </div>

          {/* Roster list */}
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold text-brand-near-black/50 uppercase tracking-widest block">
              Select team members to ping
            </label>
            <div className="grid grid-cols-2 gap-2">
              {mockRoster.map(m => {
                const isSelected = selectedMembers.includes(m.name);
                return (
                  <button
                    key={m.name}
                    id={`member-select-${m.name.replace(/\s+/g, '-')}`}
                    onClick={() => handleMemberToggle(m.name)}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-brand-purple bg-brand-purple/10 text-brand-purple shadow-xs' 
                        : 'border-brand-lavender/25 hover:border-brand-lavender/50 bg-brand-lavender-tint/10 text-brand-near-black/75'
                    }`}
                  >
                    <span className="text-sm">{m.avatar}</span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-display font-extrabold uppercase tracking-tight truncate">{m.name}</p>
                      <p className="text-[8px] font-mono font-bold text-brand-near-black/50 uppercase tracking-wider truncate">{m.role}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-brand-lavender-tint/20 border-t border-brand-lavender-tint/30 flex justify-end gap-3 shrink-0">
          <button
            id="cancel-share-btn"
            onClick={onClose}
            className="px-4 py-2.5 text-brand-near-black/60 hover:text-brand-purple text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          <button
            id="confirm-share-btn"
            disabled={!title.trim()}
            onClick={() => onConfirm(title, note)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-purple hover:bg-brand-purple/90 disabled:opacity-50 text-white text-xs font-mono uppercase tracking-wider font-extrabold rounded-full transition-all shadow-md cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-white" />
            <span>Send to Feed</span>
          </button>
        </div>
      </div>
    </div>
  );
}
