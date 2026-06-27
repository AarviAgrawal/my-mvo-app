import { RawDataRef } from '../../types';

interface RawDataTableProps {
  rawDataRefs: RawDataRef[];
}

export default function RawDataTable({ rawDataRefs }: RawDataTableProps) {
  
  const formatCell = (val: string | number) => {
    if (typeof val === 'number') {
      // If it looks like Sales MRP
      if (val > 1000) {
        return `₹${val.toLocaleString('en-IN')}`;
      }
      return val.toString();
    }
    return val;
  };

  const cleanHeader = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      <h4 className="font-mono font-bold text-[10px] uppercase tracking-wider text-brand-purple/70">
        Database Ground-Truth Tables
      </h4>
      
      {rawDataRefs.map((ref, idx) => {
        const rows = ref.rows;
        if (!rows || rows.length === 0) return null;
        
        // Extract headers from the keys of the first row
        const headers = Object.keys(rows[0]);

        return (
          <div key={idx} className="bg-brand-white rounded-2xl border border-brand-lavender/30 overflow-hidden shadow-xs">
            {/* Header / Source Name */}
            <div className="px-4 py-3 bg-brand-lavender-tint/20 border-b border-brand-lavender/25 flex items-center justify-between">
              <span className="font-mono font-bold text-xs text-brand-purple uppercase tracking-wider">
                Source Table: {ref.source}
              </span>
              <span className="text-[10px] font-mono font-bold text-brand-near-black/50 uppercase tracking-wider">
                {rows.length} record{rows.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-lavender-tint/10 border-b border-brand-lavender/25">
                    {headers.map((header) => (
                      <th 
                        key={header} 
                        className="p-3 font-mono font-bold text-[10px] text-brand-near-black/60 uppercase tracking-widest whitespace-nowrap"
                      >
                        {cleanHeader(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-lavender/20 font-mono text-[11px]">
                  {rows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-brand-lavender-tint/15 transition-colors">
                      {headers.map((header) => {
                        const cellVal = row[header];
                        const isNum = typeof cellVal === 'number';
                        return (
                          <td 
                            key={header} 
                            className={`p-3 whitespace-nowrap ${
                              isNum ? 'text-brand-purple font-bold' : 'text-brand-near-black/80'
                            }`}
                          >
                            {formatCell(cellVal)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
