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

type RangeKey = '6M' | '1Y' | '2Y' | '5Y' | 'ALL';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '6M', label: '半年' },
  { key: '1Y', label: '一年' },
  { key: '2Y', label: '两年' },
  { key: '5Y', label: '五年' },
  { key: 'ALL', label: '全部' },
];

function subtractMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setMonth(date.getMonth() - months);
  return date.toISOString().split('T')[0];
}

function filterByRange(data: ChartData[], range: RangeKey): ChartData[] {
  if (data.length === 0) return [];

  const latest = data[data.length - 1].date;
  const [ly, lm, ld] = latest.split('-').map(Number);

  switch (range) {
    case '6M': {
      const cutoff = subtractMonths(latest, 6);
      return data.filter((d) => d.date >= cutoff);
    }
    case '1Y': {
      const cutoff = subtractMonths(latest, 12);
      return data.filter((d) => d.date >= cutoff);
    }
    case '2Y': {
      const cutoff = subtractMonths(latest, 24);
      return data.filter((d) => d.date >= cutoff);
    }
    case '5Y': {
      const cutoff = subtractMonths(latest, 60);
      return data.filter((d) => d.date >= cutoff);
    }
    case 'ALL':
    default:
      return data;
  }
}

export default function Home() {
  const [rawData, setRawData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>('1Y');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
          setRawData(marketData);
        }
      })
      .catch(() => setError('数据加载失败，请刷新重试'))
      .finally(() => setLoading(false));
  }, []);

  const data = filterByRange(rawData, range);

  const formatDate = (dateStr: string) => {
    const [, m, day] = dateStr.split('-');
    return `${m}-${day}`;
  };

  const formatFullDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${y}年${m}月${d}日`;
  };

  const latest = data[data.length - 1];
  const latestSp500 = latest?.sp500;
  const latestVix = latest?.vix;

  const chartHeight = isMobile ? 300 : 500;
  const chartMargin = isMobile
    ? { top: 10, right: 20, left: -10, bottom: 0 }
    : { top: 10, right: 60, left: 0, bottom: 0 };

  const tickInterval =
    data.length <= 30 ? 4 : data.length <= 90 ? 14 : data.length <= 180 ? 30 : 60;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-3">
        <h1 className="text-lg font-semibold text-white">S&P 500 vs VIX</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          标普500 与 VIX恐慌指数 · Yahoo Finance
        </p>
      </header>

      {/* Main Chart */}
      <main className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-gray-500 text-sm animate-pulse">加载中...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          </div>
        ) : (
          <>
            {/* Range Selector */}
            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
              {RANGES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setRange(key)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    range === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
              <span className="ml-auto text-xs text-gray-600 flex-shrink-0 whitespace-nowrap">
                {data.length > 0 ? `${data[0].date} ~ ${data[data.length - 1].date}` : ''}
              </span>
            </div>

            {/* Chart */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-3 sm:p-6">
              <ResponsiveContainer width="100%" height={chartHeight}>
                <ComposedChart data={data} margin={chartMargin}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#6b7280"
                    tick={{ fill: '#9ca3af', fontSize: isMobile ? 10 : 12 }}
                    interval={tickInterval}
                  />
                  <YAxis
                    yAxisId="sp500"
                    orientation="left"
                    stroke="#60a5fa"
                    tick={{ fill: '#9ca3af', fontSize: isMobile ? 10 : 12 }}
                    tickFormatter={(v) => v.toLocaleString()}
                    domain={['auto', 'auto']}
                    width={isMobile ? 50 : 60}
                  />
                  <YAxis
                    yAxisId="vix"
                    orientation="right"
                    stroke="#f97316"
                    tick={{ fill: '#9ca3af', fontSize: isMobile ? 10 : 12 }}
                    domain={[0, 'auto']}
                    width={isMobile ? 40 : 50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#e5e7eb',
                      fontSize: isMobile ? 12 : 14,
                    }}
                    labelFormatter={(label) => `📅 ${formatFullDate(label as string)}`}
                    cursor={{ stroke: '#374151', strokeWidth: 1, strokeDasharray: '4 4' }}
                    formatter={(value) => {
                      const v = value as number;
                      return [v.toLocaleString(), ''];
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      color: '#9ca3af',
                      paddingTop: isMobile ? '10px' : '20px',
                      fontSize: isMobile ? 11 : 13,
                    }}
                    formatter={(value) => (value === 'sp500' ? 'S&P 500' : 'VIX')}
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

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <p className="text-gray-400 text-xs sm:text-sm">S&P 500 最新</p>
                <p className="text-xl sm:text-2xl font-semibold text-blue-400 mt-1">
                  {latestSp500 ? latestSp500.toLocaleString() : '-'}
                </p>
              </div>
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <p className="text-gray-400 text-xs sm:text-sm">VIX 恐慌指数</p>
                <p className="text-xl sm:text-2xl font-semibold text-orange-400 mt-1">
                  {latestVix ? latestVix.toFixed(2) : '-'}
                </p>
              </div>
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <p className="text-gray-400 text-xs sm:text-sm">当前显示</p>
                <p className="text-base sm:text-lg font-medium text-gray-300 mt-1">
                  {data.length > 0 ? `${data.length} 个交易日` : '-'}
                </p>
              </div>
            </div>
          </>
        )}

        {/* 数据说明 */}
        <div className="mt-4 p-4 bg-gray-900 rounded-xl border border-gray-800">
          <h3 className="text-white font-medium text-sm mb-2">📡 数据来源</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• <span className="text-blue-400">Yahoo Finance</span> 实时/历史行情</li>
            <li>• <span className="text-blue-400">^GSPC</span> — S&P 500 &nbsp;&nbsp; <span className="text-blue-400">^VIX</span> — CBOE VIX</li>
          </ul>
          <p className="text-gray-600 text-xs mt-3">⚠️ 数据仅供参考，不构成投资建议</p>
        </div>
      </main>
    </div>
  );
}
