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

type ThemeKey = 'classic' | 'dark' | 'minimal';
type RangeKey = '6M' | '1Y' | '2Y' | '5Y' | 'ALL';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '6M', label: '半年' },
  { key: '1Y', label: '一年' },
  { key: '2Y', label: '两年' },
  { key: '5Y', label: '五年' },
  { key: 'ALL', label: '全部' },
];

const THEMES: Record<ThemeKey, { name: string; desc: string; bg: string; card: string; text: string; muted: string; border: string; sp500: string; vix: string; grid: string; accent: string }> = {
  classic: {
    name: '经典经济学人',
    desc: '米白底色，蓝灰主调，权威严谨',
    bg: '#f5f3ef',
    card: '#ffffff',
    text: '#1a1a1a',
    muted: '#6b6b6b',
    border: '#d4cfc5',
    sp500: '#2563a8',
    vix: '#c0392b',
    grid: '#e0dbd3',
    accent: '#1a1a1a',
  },
  dark: {
    name: '金融时报',
    desc: '深蓝黑底，高对比度，专业沉稳',
    bg: '#0d1b2a',
    card: '#1a2d42',
    text: '#e8e8e8',
    muted: '#8a9db0',
    border: '#2a4a6b',
    sp500: '#4a9eff',
    vix: '#ff6b6b',
    grid: '#1e3a5f',
    accent: '#ffd700',
  },
  minimal: {
    name: '极简数据',
    desc: '纯白底色，单色强调，数据优先',
    bg: '#ffffff',
    card: '#ffffff',
    text: '#111111',
    muted: '#999999',
    border: '#eeeeee',
    sp500: '#111111',
    vix: '#cc0000',
    grid: '#f0f0f0',
    accent: '#cc0000',
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

function ChartView({ data, range, theme }: { data: ChartData[]; range: RangeKey; theme: ThemeKey }) {
  const t = THEMES[theme];
  const filtered = filterByRange(data, range);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const formatDate = (dateStr: string) => {
    const [, m, day] = dateStr.split('-');
    return `${m}-${day}`;
  };

  const formatFullDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${y}年${m}月${d}日`;
  };

  const latest = filtered[filtered.length - 1];
  const margin = isMobile
    ? { top: 10, right: 5, left: -20, bottom: 0 }
    : { top: 10, right: 20, left: 10, bottom: 0 };

  return (
    <div style={{ backgroundColor: t.bg }} className="min-h-screen">
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${t.border}`, padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: t.text, fontFamily: 'Georgia, serif', letterSpacing: '-0.3px' }}>
              S&amp;P 500 vs VIX
            </h1>
            <p style={{ fontSize: 11, color: t.muted, marginTop: 2, fontFamily: 'Georgia, serif' }}>
              {THEMES[theme].name} &middot; 标普500 恐慌指数
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: t.muted, fontFamily: 'Georgia, serif' }}>
              {latest ? `${latest.date}` : '-'}
            </div>
            <div style={{ fontSize: 11, color: t.muted, fontFamily: 'Georgia, serif' }}>
              {filtered.length} 个交易日
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 8px' }}>
        {/* Range buttons */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 10, overflowX: 'auto', paddingBottom: 4 }}>
          {RANGES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {}}
              style={{
                flexShrink: 0,
                padding: '4px 10px',
                fontSize: 11,
                fontFamily: 'Georgia, serif',
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

        {/* Chart */}
        <div style={{ backgroundColor: t.card, border: `1px solid ${t.border}`, borderRadius: 2, padding: '12px 4px 8px' }}>
          <ResponsiveContainer width="100%" height={isMobile ? 260 : 380}>
            <ComposedChart data={filtered} margin={margin}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke={t.muted}
                tick={{ fill: t.muted, fontSize: 10, fontFamily: 'Georgia, serif' }}
                interval={filtered.length <= 60 ? 4 : filtered.length <= 180 ? 14 : 30}
                tickLine={false}
                axisLine={{ stroke: t.border }}
              />
              <YAxis
                yAxisId="sp500"
                orientation="left"
                stroke={t.sp500}
                tick={{ fill: t.muted, fontSize: 10, fontFamily: 'Georgia, serif' }}
                tickFormatter={(v) => v.toLocaleString()}
                domain={['auto', 'auto']}
                width={isMobile ? 40 : 60}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="vix"
                orientation="right"
                stroke={t.vix}
                tick={{ fill: t.muted, fontSize: 10, fontFamily: 'Georgia, serif' }}
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
                  fontFamily: 'Georgia, serif',
                  boxShadow: 'none',
                }}
                labelFormatter={(label) => formatFullDate(label as string)}
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
                  fontFamily: 'Georgia, serif',
                  paddingTop: 8,
                  fontWeight: 500,
                }}
                formatter={(value) => (value === 'sp500' ? 'S&P 500' : 'VIX恐慌指数')}
                iconType="plainline"
                iconSize={16}
              />
              <Line yAxisId="sp500" type="monotone" dataKey="sp500" stroke={t.sp500} strokeWidth={1.5} dot={false} name="sp500" connectNulls />
              <Line yAxisId="vix" type="monotone" dataKey="vix" stroke={t.vix} strokeWidth={1.5} dot={false} name="vix" connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Data source */}
        <div style={{ marginTop: 8, padding: '6px 0', borderTop: `1px solid ${t.border}` }}>
          <p style={{ fontSize: 9, color: t.muted, fontFamily: 'Georgia, serif' }}>
            数据来源：Yahoo Finance · ^GSPC S&P 500 指数 · ^VIX CBOE恐慌指数 · 仅供参考，不构成投资建议
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [rawData, setRawData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>('classic');
  const [range, setRange] = useState<RangeKey>('1Y');

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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Theme selector header */}
      <header className="border-b border-gray-800 px-4 py-3">
        <h1 className="text-lg font-semibold">选择图表风格</h1>
        <p className="text-xs text-gray-400 mt-1">经济学人风格系列 — 选择你喜欢的样式</p>
      </header>

      {/* Theme cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        {(Object.keys(THEMES) as ThemeKey[]).map((key) => {
          const t = THEMES[key];
          return (
            <div
              key={key}
              onClick={() => setSelectedTheme(key)}
              className={`cursor-pointer rounded-xl border-2 transition-all ${selectedTheme === key ? 'border-blue-500' : 'border-gray-700 hover:border-gray-500'}`}
            >
              {/* Mini preview */}
              <div style={{ height: 180, overflow: 'hidden', borderRadius: '8px 8px 0 0' }}>
                <ChartView data={rawData.length > 0 ? rawData : [{ date: '2024-01-01', sp500: 4700, vix: 14 }, { date: '2024-03-01', sp500: 5000, vix: 18 }, { date: '2024-06-01', sp500: 5400, vix: 12 }, { date: '2024-09-01', sp500: 5700, vix: 20 }, { date: '2025-01-01', sp500: 6000, vix: 15 }]} range={range} theme={key} />
              </div>
              {/* Theme info */}
              <div className="p-3 bg-gray-900 rounded-b-xl">
                <div className="flex items-center gap-2">
                  <div
                    onClick={() => setSelectedTheme(key)}
                    className={`flex-1 text-sm font-medium ${selectedTheme === key ? 'text-blue-400' : 'text-gray-300'}`}
                  >
                    {t.name}
                  </div>
                  {selectedTheme === key && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">已选择</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
                {/* Color swatches */}
                <div className="flex gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.sp500 }} />
                    <span className="text-xs text-gray-500">SP500</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.vix }} />
                    <span className="text-xs text-gray-500">VIX</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full border border-gray-600" style={{ backgroundColor: t.bg }} />
                    <span className="text-xs text-gray-500">底色</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm button */}
      <div className="p-4">
        <button
          onClick={() => {
            const confirmed = confirm(`确定使用「${THEMES[selectedTheme].name}」风格？`);
            if (confirmed) {
              const link = document.createElement('a');
              link.href = `/?theme=${selectedTheme}`;
              link.click();
            }
          }}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-colors text-sm"
        >
          应用「{THEMES[selectedTheme].name}」到网站
        </button>
      </div>
    </div>
  );
}
