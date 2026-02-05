'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

interface HAIChartProps {
  className?: string;
}

// Mock HAI score history data
const haiHistoryData = [
  { date: 'Jan', score: 6500, compliance: 6200, assetBacking: 6800 },
  { date: 'Feb', score: 6700, compliance: 6400, assetBacking: 7000 },
  { date: 'Mar', score: 6900, compliance: 6600, assetBacking: 7200 },
  { date: 'Apr', score: 6800, compliance: 6500, assetBacking: 7100 },
  { date: 'May', score: 7000, compliance: 6700, assetBacking: 7300 },
  { date: 'Jun', score: 7100, compliance: 6800, assetBacking: 7400 },
  { date: 'Jul', score: 7200, compliance: 6900, assetBacking: 7500 },
];

const componentData = [
  { name: 'Compliance', value: 6900, fullMark: 10000, color: '#047857' },
  { name: 'Asset Backing', value: 7500, fullMark: 10000, color: '#d97706' },
  { name: 'Economic Value', value: 7100, fullMark: 10000, color: '#0d9488' },
  { name: 'Validation', value: 7300, fullMark: 10000, color: '#f59e0b' },
];

export function HAIChart({ className }: HAIChartProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Main HAI Score Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={haiHistoryData}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#047857" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#047857" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 10000]}
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value / 100}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [`${(value / 100).toFixed(0)}%`, 'HAI Score']}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#047857"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorScore)"
              name="HAI Score"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Component Breakdown */}
      <div>
        <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-4">
          Score Components
        </h4>
        <div className="space-y-3">
          {componentData.map((component) => (
            <div key={component.name} className="flex items-center gap-4">
              <div className="w-28 text-sm text-neutral-600 dark:text-neutral-400">
                {component.name}
              </div>
              <div className="flex-1 h-4 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(component.value / component.fullMark) * 100}%`,
                    backgroundColor: component.color,
                  }}
                />
              </div>
              <div className="w-16 text-right text-sm font-medium text-neutral-900 dark:text-white">
                {(component.value / 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-700">{(haiHistoryData[haiHistoryData.length - 1].score / 100).toFixed(0)}%</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">Current Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-success-600">+7%</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">This Month</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-neutral-900 dark:text-white">{haiHistoryData.length}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">Snapshots</div>
        </div>
      </div>
    </div>
  );
}
