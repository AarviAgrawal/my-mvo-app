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
  Legend,
} from 'recharts';
import { PodsDeltaItem } from '../../types';

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
            {formattedData.map((_entry, index) => {
              const colors = ['#4A2466', '#BB9CC9', '#22C55E', '#F59E0B'];
              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. Availability Delta — Apr vs May grouped bar, aggregated by platform
export function AvailabilityDeltaChart({ data }: { data: PodsDeltaItem[] }) {
  const formatMrp = (val: number) => `₹${(val / 1000).toFixed(0)}k`;
  const formatTooltipVal = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  const chartData = data.map(d => ({
    platform: d.platform,
    'Apr MRP': Math.round(d.aprMrp),
    'May MRP': Math.round(d.mayMrp),
    deltaPct: d.deltaPct,
  }));

  return (
    <div className="w-full h-64 bg-brand-white p-4 border border-brand-lavender/30 rounded-2xl shadow-xs">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8DFEE" vertical={false} />
          <XAxis
            dataKey="platform"
            tick={{ fill: '#2A1B33', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatMrp}
            tick={{ fill: '#2A1B33', opacity: 0.6, fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip formatter={formatTooltipVal} />} />
          <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', color: '#2A1B33' }} />
          <Bar dataKey="Apr MRP" fill="#BB9CC9" radius={[4, 4, 0, 0]} barSize={24} />
          <Bar dataKey="May MRP" fill="#4A2466" radius={[4, 4, 0, 0]} barSize={24} />
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
  const top5 = data.slice(0, 5);
  const formatXAxis = (tick: number) => `₹${(tick / 1000).toFixed(0)}k`;
  const formatTooltipVal = (val: number) => `₹${val.toLocaleString('en-IN')}`;

  return (
    <div className="w-full h-64 bg-brand-white p-4 border border-brand-lavender/30 rounded-2xl shadow-xs">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={top5}
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

  const getThemeColor = (name: string) => {
    switch (name.toLowerCase()) {
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
                <Pie data={processedData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="count">
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
                  <span className="font-bold text-brand-purple">{item.count} ({percentage}%)</span>
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
          <Line yAxisId="left" type="monotone" dataKey="salesValue" name="Daily Revenue" stroke="#4A2466" strokeWidth={3} dot={false} />
          <Line yAxisId="left" type="monotone" dataKey="spendValue" name="Ad Spend" stroke="#BB9CC9" strokeWidth={2} strokeDasharray="4 4" dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="a2sPercentage" name="A2S Ratio" stroke="#EF4444" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// 6. Consumption Frequency Horizontal Bar
interface ConsumptionFreqChartProps {
  data: Array<{ name: string; value: number }>;
}
export function ConsumptionFrequencyChart({ data }: ConsumptionFreqChartProps) {
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const FREQ_COLORS: Record<string, string> = {
    'Daily': '#22C55E',
    'Few times a week': '#4A2466',
    'Weekly': '#BB9CC9',
    'Monthly': '#F59E0B',
    'Rarely': '#EF4444',
    'Unknown': '#9CA3AF',
  };
  const enriched = data.map(d => ({
    ...d,
    pct: total > 0 ? Math.round((d.value / total) * 100) : 0,
    fill: FREQ_COLORS[d.name] || '#9CA3AF',
  }));

  return (
    <div className="w-full h-56 bg-brand-white p-4 border border-brand-lavender/30 rounded-2xl shadow-xs">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={enriched}
          layout="vertical"
          margin={{ top: 4, right: 40, left: 10, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8DFEE" />
          <XAxis
            type="number"
            tick={{ fill: '#2A1B33', opacity: 0.6, fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: '#2A1B33', fontSize: 9, fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-brand-white p-3 border border-brand-lavender/30 rounded-xl shadow-lg font-mono text-[10px] uppercase tracking-wider">
                  <p className="font-bold text-brand-purple">{d.name}</p>
                  <p className="text-brand-near-black/70 mt-1">{d.value} respondents ({d.pct}%)</p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" name="Respondents" radius={[0, 4, 4, 0]} barSize={14}>
            {enriched.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
