'use client';

import { useState, useEffect, Suspense } from 'react';
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

type ThemeKey = 'classic' | 'dark' | 'minimal';
type RangeKey = '6M' | '1Y' | '2Y' | '5Y' | 'ALL';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '6M', label: '半年' },
  { key: '1Y', label: '一年' },
  { key: '2Y', label: '两年' },
  { key: '5Y', label: '五年' },
  { key: 'ALL', label: '全部' },
];

const THEMES: Record<ThemeKey, {
  bg: string; card: string; text: string; muted: string; border: string;
  sp500: string; vix: string; grid: string; accent: string; headerBorder: string;
}> = {
  classic: {
    bg: '#f5f3ef',
    card: '#ffffff',
    text: '#1a1a1a',
    muted: '#6b6b6b',
    border: '#d4cfc5',
    sp500: '#2563a8',
    vix: '#c0392b',
    grid: '#e0dbd3',
    accent: '#1a1a1a',
    headerBorder: '#d4cfc5',
  },
  dark: {
    bg: '#0d1b2a',
    card: '#1a2d42',
    text: '#e8e8e8',
    muted: '#8a9db0',
    border: '#2a4a6b',
    sp500: '#4a9eff',
    vix: '#ff6b6b',
    grid: '#1e3a5f',
    accent: '#ffd700',
    headerBorder: '#2a4a6b',
  },
  minimal: {
    bg: '#ffffff',
    card: '#ffffff',
    text: '#111111',
    muted: '#999999',
    border: '#eeeeee',
    sp500: '#111111',
    vix: '#cc0000',
    grid: '#f0f0f0',
    accent: '#cc0000',
    headerBorder: '#eeeeee',
  },
};

function subtractMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setMonth(date.getMonth() - months);
  return date.toISOString().split('T')[0];
}

function filterByRange(data: ChartData[], range: RangeKey): ChartData[] {
  if (data.length === 0) return [];
  const latest = data[data.length - 1].date;
  switch (range) {
    case '6M': return data.filter((d) => d.date >= subtractMonths(latest, 6));
    case '1Y': return data.filter((d) => d.date >= subtractMonths(latest, 12));
    case '2Y': return data.filter((d) => d.date >= subtractMonths(latest, 24));
    case '5Y': return data.filter((d) => d.date >= subtractMonths(latest, 60));
    default: return data;
  }
}

function ChartPage({ themeKey }: { themeKey: ThemeKey }) {
  const [rawData, setRawData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeKey>('1Y');
  const [isMobile, setIsMobile] = useState(false);
  const t = THEMES[themeKey];

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetch('/api/market-data')
      .then((res) => { if (!res.ok) throw new Error('Failed to fetch'); return res.json(); })
      .then((marketData: ChartData[]) => {
        if (!marketData || marketData.length === 0) setError('数据加载失败，请刷新重试');
        else setRawData(marketData);
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
  const margin = isMobile
    ? { top: 10, right: 5, left: -20, bottom: 0 }
    : { top: 10, right: 20, left: 10, bottom: 0 };

  return (
    <div style={{ backgroundColor: t.bg }} className="min-h-screen">
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${t.headerBorder}`, padding: '12px 16px', backgroundColor: t.card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: t.text, fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '-0.3px' }}>
              S&amp;P 500 vs VIX
            </h1>
            <p style={{ fontSize: 11, color: t.muted, marginTop: 2, fontFamily: 'Georgia, "Times New Roman", serif' }}>
              标普500 指数 与 CBOE VIX恐慌指数
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: t.muted, fontFamily: 'Georgia, "Times New Roman", serif' }}>
              {latest ? latest.date : '-'}
            </div>
            <div style={{ fontSize: 11, color: t.muted, fontFamily: 'Georgia, "Times New Roman", serif' }}>
              {data.length} 个交易日
            </div>
          </div>
        </div>
      </header>

      <main style={{ padding: '12px 8px' }}>
        {/* Range Selector */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {RANGES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              style={{
                flexShrink: 0,
                padding: '4px 10px',
                fontSize: 11,
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontWeight: range === key ? 700 : 400,
                backgroundColor: range === key ? t.accent : 'transparent',
                color: range === key ? '#fff' : t.muted,
                border: `1px solid ${range === key ? t.accent : t.border}`,
                borderRadius: 2,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
            <div style={{ width: 32, height: 32, border: `4px solid ${t.muted}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: t.muted, fontSize: 13, fontFamily: 'Georgia, serif' }}>加载中...</p>
          </div>
        ) : error ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <p style={{ color: '#ef4444', fontSize: 14 }}>{error}</p>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div style={{ backgroundColor: t.card, border: `1px solid ${t.border}`, borderRadius: 2, padding: '12px 4px 8px' }}>
              <ResponsiveContainer width="100%" height={isMobile ? 280 : 420}>
                <ComposedChart data={data} margin={margin}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke={t.muted}
                    tick={{ fill: t.muted, fontSize: 10, fontFamily: 'Georgia, "Times New Roman", serif' }}
                    interval={data.length <= 60 ? 4 : data.length <= 180 ? 14 : 30}
                    tickLine={false}
                    axisLine={{ stroke: t.border }}
                  />
                  <YAxis
                    yAxisId="sp500"
                    orientation="left"
                    stroke={t.sp500}
                    tick={{ fill: t.muted, fontSize: 10, fontFamily: 'Georgia, "Times New Roman", serif' }}
                    tickFormatter={(v) => v.toLocaleString()}
                    domain={['auto', 'auto']}
                    width={isMobile ? 40 : 65}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="vix"
                    orientation="right"
                    stroke={t.vix}
                    tick={{ fill: t.muted, fontSize: 10, fontFamily: 'Georgia, "Times New Roman", serif' }}
                    domain={[0, 'auto']}
                    width={isMobile ? 30 : 45}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: t.card,
                      border: `1px solid ${t.border}`,
                      borderRadius: 2,
                      color: t.text,
                      fontSize: 12,
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      boxShadow: 'none',
                    }}
                    labelFormatter={(label) => `📅 ${formatFullDate(label as string)}`}
                    cursor={{ stroke: t.muted, strokeWidth: 1, strokeDasharray: '3 3' }}
                    formatter={(value) => {
                      const v = value as number;
                      return [v.toLocaleString(), ''];
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      color: t.muted,
                      fontSize: 11,
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      paddingTop: 10,
                      fontWeight: 500,
                    }}
                    formatter={(value) => (value === 'sp500' ? 'S&P 500' : 'VIX恐慌指数')}
                    iconType="plainline"
                    iconSize={16}
                  />
                  <Line yAxisId="sp500" type="monotone" dataKey="sp500" stroke={t.sp500} strokeWidth={1.8} dot={false} name="sp500" connectNulls />
                  <Line yAxisId="vix" type="monotone" dataKey="vix" stroke={t.vix} strokeWidth={1.8} dot={false} name="vix" connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Info cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
              <div style={{ backgroundColor: t.card, border: `1px solid ${t.border}`, borderRadius: 2, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, color: t.muted, fontFamily: 'Georgia, serif' }}>S&P 500 最新</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: t.sp500, fontFamily: 'Georgia, serif', marginTop: 2 }}>
                  {latest?.sp500 ? latest.sp500.toLocaleString() : '-'}
                </p>
              </div>
              <div style={{ backgroundColor: t.card, border: `1px solid ${t.border}`, borderRadius: 2, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, color: t.muted, fontFamily: 'Georgia, serif' }}>VIX 恐慌指数</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: t.vix, fontFamily: 'Georgia, serif', marginTop: 2 }}>
                  {latest?.vix ? latest.vix.toFixed(2) : '-'}
                </p>
              </div>
              <div style={{ backgroundColor: t.card, border: `1px solid ${t.border}`, borderRadius: 2, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, color: t.muted, fontFamily: 'Georgia, serif' }}>数据范围</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: t.text, fontFamily: 'Georgia, serif', marginTop: 4 }}>
                  {data.length > 0 ? `${data[0].date} ~ ${data[data.length - 1].date}` : '-'}
                </p>
              </div>
            </div>

            {/* Data source */}
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${t.border}` }}>
              <p style={{ fontSize: 9, color: t.muted, fontFamily: 'Georgia, serif' }}>
                数据来源：Yahoo Finance · ^GSPC S&P 500 指数 · ^VIX CBOE恐慌指数 · 仅供参考，不构成投资建议
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function ThemePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center"><p className="text-gray-400">加载中...</p></div>}>
      <ThemePageInner />
    </Suspense>
  );
}

function ThemePageInner() {
  const [themeKey, setThemeKey] = useState<ThemeKey>('classic');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('theme') as ThemeKey;
    if (t && THEMES[t]) setThemeKey(t);
  }, []);

  return <ChartPage themeKey={themeKey} />;
}
