'use client';

import { useState, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  date: string;
  sp500: number | null;
  vix: number | null;
}

export default function Home() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/market-data')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then((marketData: ChartData[]) => {
        if (!marketData || marketData.length === 0) {
          setError('数据加载失败，请刷新重试');
        } else {
          setData(marketData);
        }
      })
      .catch(() => setError('数据加载失败，请刷新重试'))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${year}-${month}`;
  };

  const latest = data[data.length - 1];
  const latestSp500 = latest?.sp500;
  const latestVix = latest?.vix;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <h1 className="text-xl font-semibold text-white">S&P 500 vs VIX</h1>
        <p className="text-sm text-gray-400 mt-1">
          标普500指数 与 CBOE VIX恐慌指数 · 实时数据来源 Yahoo Finance
        </p>
      </header>

      {/* Main Chart */}
      <main className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-gray-500 animate-pulse">正在从 Yahoo Finance 加载数据...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-3">
              {error}
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <ResponsiveContainer width="100%" height={500}>
              <ComposedChart data={data} margin={{ top: 10, right: 60, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  stroke="#6b7280"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  interval={30}
                />
                <YAxis
                  yAxisId="sp500"
                  orientation="left"
                  stroke="#60a5fa"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(v) => v.toLocaleString()}
                  domain={['auto', 'auto']}
                />
                <YAxis
                  yAxisId="vix"
                  orientation="right"
                  stroke="#f97316"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#e5e7eb',
                  }}
                  labelFormatter={(label) => `📅 ${label}`}
                  formatter={(value) => {
                    const v = value as number;
                    return [v.toLocaleString(), ''];
                  }}
                />
                <Legend
                  wrapperStyle={{ color: '#9ca3af', paddingTop: '20px' }}
                  formatter={(value) =>
                    value === 'sp500' ? 'S&P 500 (标普500)' : 'VIX (恐慌指数)'
                  }
                />
                <Line
                  yAxisId="sp500"
                  type="monotone"
                  dataKey="sp500"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={false}
                  name="sp500"
                  connectNulls
                />
                <Line
                  yAxisId="vix"
                  type="monotone"
                  dataKey="vix"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  name="vix"
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <p className="text-gray-400 text-sm">S&P 500 最新</p>
            <p className="text-2xl font-semibold text-blue-400 mt-1">
              {latestSp500 ? latestSp500.toLocaleString() : '-'}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <p className="text-gray-400 text-sm">VIX 恐慌指数最新</p>
            <p className="text-2xl font-semibold text-orange-400 mt-1">
              {latestVix ? latestVix.toFixed(2) : '-'}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <p className="text-gray-400 text-sm">数据覆盖范围</p>
            <p className="text-lg font-medium text-gray-300 mt-1">
              {data.length > 0
                ? `${data[0].date} → ${data[data.length - 1].date}`
                : '-'}
            </p>
          </div>
        </div>

        {/* 数据说明 */}
        <div className="mt-6 p-4 bg-gray-900 rounded-xl border border-gray-800">
          <h3 className="text-white font-medium mb-2">📡 数据来源说明</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• <span className="text-blue-400">Yahoo Finance</span> 提供实时/历史行情</li>
            <li>• <span className="text-blue-400">^GSPC</span> — S&P 500 指数</li>
            <li>• <span className="text-blue-400">^VIX</span> — CBOE 恐慌指数（波动率）</li>
          </ul>
          <p className="text-gray-600 text-xs mt-3">
            ⚠️ 数据仅供参考，不构成投资建议
          </p>
        </div>
      </main>
    </div>
  );
}
