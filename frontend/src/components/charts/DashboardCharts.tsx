import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

// Custom Tooltip component for consistent Bold Typography branding
const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-brand-white p-4 border border-brand-lavender/30 rounded-2xl shadow-xl font-mono text-[11px] space-y-2 uppercase tracking-wider text-brand-near-black">
        <p className="font-fredoka font-bold text-brand-purple border-b border-brand-lavender-tint/40 pb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-brand-near-black/70">{entry.name}:</span>
            </div>
            <span className="font-bold text-brand-near-black font-tabular">
              {formatter ? formatter(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// 1. Sales by Platform Bar Chart
interface SalesByPlatformChartProps {
  data: Array<{ name: string; value: number }>;
}
export function SalesByPlatformChart({ data }: SalesByPlatformChartProps) {
  const formattedData = data.map(item => ({
    ...item,
    formattedValue: `₹${(item.value / 1000).toFixed(1)}k`
  }));

  const formatYAxis = (tick: number) => `₹${(tick / 1000).toFixed(0)}k`;
  const formatTooltipVal = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div className="w-full h-64 bg-brand-white p-4 border border-brand-lavender/30 rounded-2xl shadow-xs">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DFEE" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#2A1B33', fontSize: 10, fontFamily: 'monospace' }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            tickFormatter={formatYAxis} 
            tick={{ fill: '#2A1B33', opacity: 0.6, fontSize: 9, fontFamily: 'monospace' }} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip content={<CustomTooltip formatter={formatTooltipVal} />} />
          <Bar dataKey="value" name="Sales MRP" radius={[4, 4, 0, 0]}>
            {formattedData.map((entry, index) => {
              const colors = ['#4A2466', '#BB9CC9', '#22C55E', '#F59E0B'];
              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. Availability Delta Diverging Bar Chart
interface AvailabilityDeltaChartProps {
  data: Array<{ platform: string; apr: number; may: number; delta: number }>;
}
export function AvailabilityDeltaChart({ data }: AvailabilityDeltaChartProps) {
  const formatTooltipVal = (val: number) => `${val > 0 ? '+' : ''}${val}%`;

  return (
    <div className="w-full h-64 bg-brand-white p-4 border border-brand-lavender/30 rounded-2xl shadow-xs">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8DFEE" vertical={false} />
          <XAxis 
            dataKey="platform" 
            tick={{ fill: '#2A1B33', fontSize: 10, fontFamily: 'monospace' }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            tick={{ fill: '#2A1B33', opacity: 0.6, fontSize: 9, fontFamily: 'monospace' }} 
            axisLine={false} 
            tickLine={false} 
            tickFormatter={(tick) => `${tick}%`}
          />
          <Tooltip content={<CustomTooltip formatter={formatTooltipVal} />} />
          <Bar dataKey="delta" name="Apr ➜ May Delta" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => {
              const isNegative = entry.delta < 0;
              return <Cell key={`cell-${index}`} fill={isNegative ? '#EF4444' : '#4A2466'} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 3. Sales by Flavor Horizontal Bar Chart
interface SalesByFlavourChartProps {
  data: Array<{ name: string; value: number }>;
}
export function SalesByFlavourChart({ data }: SalesByFlavourChartProps) {
  const top10Data = data.slice(0, 5); // display top 5 to keep readable
  const formatXAxis = (tick: number) => `₹${(tick / 1000).toFixed(0)}k`;
  const formatTooltipVal = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div className="w-full h-64 bg-brand-white p-4 border border-brand-lavender/30 rounded-2xl shadow-xs">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={top10Data} 
          layout="vertical" 
          margin={{ top: 10, right: 10, left: 35, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8DFEE" />
          <XAxis 
            type="number" 
            tickFormatter={formatXAxis} 
            tick={{ fill: '#2A1B33', opacity: 0.6, fontSize: 9, fontFamily: 'monospace' }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            tick={{ fill: '#2A1B33', fontSize: 9 }} 
            axisLine={false} 
            tickLine={false} 
            width={100}
          />
          <Tooltip content={<CustomTooltip formatter={formatTooltipVal} />} />
          <Bar dataKey="value" name="Sales MRP" fill="#4A2466" radius={[0, 4, 4, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 4. Taste Sentiment Pie Chart
interface TasteSentimentChartProps {
  data: Array<{ name: string; count: number; color: string }>;
}
export function TasteSentimentChart({ data }: TasteSentimentChartProps) {
  const activeData = data.filter(d => d.count > 0);
  
  // Custom color mapping to Bold Typography theme
  const getThemeColor = (name: string) => {
    switch(name.toLowerCase()) {
      case 'loved it': return '#22C55E';
      case 'okay': return '#BB9CC9';
      default: return '#EF4444';
    }
  };

  const processedData = activeData.map(item => ({
    ...item,
    color: getThemeColor(item.name)
  }));
  
  return (
    <div className="w-full h-64 bg-brand-white p-4 border border-brand-lavender/30 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-center gap-4">
      {processedData.length === 0 ? (
        <p className="text-xs font-mono uppercase tracking-wider text-brand-near-black/50">No survey reviews filed</p>
      ) : (
        <>
          <div className="w-full sm:w-1/2 h-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {processedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex-1 space-y-2 w-full font-mono text-[10px] uppercase tracking-wider text-brand-near-black">
            {processedData.map((item, index) => {
              const totalCount = processedData.reduce((sum, d) => sum + d.count, 0);
              const percentage = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-brand-near-black/70">{item.name}</span>
                  </div>
                  <span className="font-bold text-brand-purple">
                    {item.count} ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// 5. Ad-to-Sales over time Line Chart
interface A2SOverTimeChartProps {
  data: Array<{ date: string; spend: number; sales: number; a2s: number }>;
}
export function A2SOverTimeChart({ data }: A2SOverTimeChartProps) {
  const formattedData = data.map(item => {
    const d = new Date(item.date);
    return {
      ...item,
      shortDate: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      spendValue: Math.round(item.spend),
      salesValue: Math.round(item.sales),
      a2sPercentage: Number((item.a2s * 100).toFixed(1))
    };
  });

  const formatYAxisVal = (tick: number) => `₹${(tick / 1000).toFixed(0)}k`;
  const formatA2STick = (tick: number) => `${tick}%`;

  return (
    <div className="w-full h-72 bg-brand-white p-4 border border-brand-lavender/30 rounded-2xl shadow-xs">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8DFEE" vertical={false} />
          <XAxis 
            dataKey="shortDate" 
            tick={{ fill: '#2A1B33', fontSize: 9, fontFamily: 'monospace' }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            yAxisId="left"
            tickFormatter={formatYAxisVal} 
            tick={{ fill: '#4A2466', fontSize: 9, fontFamily: 'monospace' }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            tickFormatter={formatA2STick} 
            tick={{ fill: '#EF4444', fontSize: 9, fontFamily: 'monospace' }} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', color: '#2A1B33' }} />
          <Line 
            yAxisId="left" 
            type="monotone" 
            dataKey="salesValue" 
            name="Daily Revenue" 
            stroke="#4A2466" 
            strokeWidth={3}
            dot={false} 
          />
          <Line 
            yAxisId="left" 
            type="monotone" 
            dataKey="spendValue" 
            name="Ad Spend" 
            stroke="#BB9CC9" 
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false} 
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="a2sPercentage" 
            name="A2S Ratio" 
            stroke="#EF4444" 
            strokeWidth={2}
            dot={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
