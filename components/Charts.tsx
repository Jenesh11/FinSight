import React from 'react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface ChartProps {
  data: any[];
  colors?: string[];
  currency: string;
}

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

export const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-bold" style={{ color: entry.color }}>
            {entry.name}: {currency}{entry.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const BalanceTrendChart: React.FC<ChartProps> = ({ data, currency }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.2} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12, fill: '#94a3b8' }} 
          tickLine={false} 
          axisLine={false}
          minTickGap={30}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: '#94a3b8' }} 
          tickFormatter={(value) => `${currency}${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`} 
          tickLine={false} 
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip currency={currency} />} />
        <Area 
          type="monotone" 
          dataKey="balance" 
          stroke="#0ea5e9" 
          strokeWidth={3} 
          fillOpacity={1} 
          fill="url(#colorBalance)" 
          name="Net Worth"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const ExpensePieChart: React.FC<ChartProps> = ({ data, currency }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip currency={currency} />} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const IncomeDoughnutChart: React.FC<ChartProps> = ({ data, currency }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={2}
          dataKey="value"
          startAngle={180}
          endAngle={0}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip currency={currency} />} />
        <Legend verticalAlign="bottom" height={36} iconType="rect" />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const DailyBarChart: React.FC<ChartProps> = ({ data, currency }) => {
  // Take last 14 days for bar chart to avoid overcrowding
  const recentData = data.slice(-14);
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={recentData} barSize={12}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 10, fill: '#94a3b8' }} 
          tickLine={false} 
          axisLine={false} 
          interval={1}
        />
        <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip currency={currency} />} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
        <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};