// S&P 500 vs VIX — Economist Style Chart v2
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

const T = {
  bg: '#f5f3ef',
  text: '#1a1a1a',
  muted: '#767676',
  accent: '#9b9b9b',
  sp500: '#2563a8',
  vix: '#c0392b',
  grid: '#e0dbd3',
  rule: '#d4cfc5',
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
      .then((res) => { if (!res.ok) throw new Error('Failed to fetch'); return res.json(); })
      .then((marketData: ChartData[]) => {
        if (!marketData || marketData.length === 0) setError('数据加载失败，请刷新重试');
        else setRawData(marketData);
      })
      .catch(() => setError('数据加载失败，请刷新重试'))
      .finally(() => setLoading(false));
  }, []);

  const data = filterByRange(rawData, range);
  const latest = data[data.length - 1];

  const formatDate = (dateStr: string) => {
    const [, m, day] = dateStr.split('-');
    return `${m}-${day}`;
  };

  const formatFullDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${y}年${m}月${d}日`;
  };

  const margin = isMobile
    ? { top: 8, right: 8, left: 0, bottom: 0 }
    : { top: 12, right: 4, left: 0, bottom: 0 };

  return (
    <div style={{ backgroundColor: T.bg, minHeight: '100vh' }}>
      <style>{`body{margin:0;padding:0}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
        {/* ── Header ── */}
        <header style={{ paddingTop: 32, paddingBottom: 12 }}>
          {/* Title block */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
            <div>
              <h1 style={{
                fontSize: isMobile ? 20 : 26,
                fontWeight: 400,
                color: T.text,
                fontFamily: 'Georgia, "Times New Roman", serif',
                letterSpacing: '-0.5px',
                margin: 0,
                lineHeight: 1.1,
              }}>
                S&amp;P 500 vs VIX
              </h1>
              <p style={{
                fontSize: 11,
                color: T.muted,
                margin: '4px 0 0',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
              }}>
                标普500指数与VIX恐慌指数
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 11, color: T.muted, fontFamily: 'Georgia, serif' }}>
                {latest ? latest.date : '-'}
              </span>
            </div>
          </div>

          {/* Thin rule */}
          <div style={{ height: 1, backgroundColor: T.rule }} />

          {/* Inline data strip */}
          {!loading && !error && latest && (
            <div style={{ display: 'flex', gap: 24, paddingTop: 10 }}>
              <div>
                <span style={{ fontSize: 10, color: T.muted, fontFamily: 'Georgia, serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>S&P 500 </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.sp500, fontFamily: 'Georgia, serif' }}>
                  {latest.sp500 ? (latest.sp500 >= 1000 ? `${(latest.sp500/1000).toFixed(1)}k` : latest.sp500.toLocaleString()) : '-'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: 10, color: T.muted, fontFamily: 'Georgia, serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>VIX </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.vix, fontFamily: 'Georgia, serif' }}>{latest.vix?.toFixed(2)}</span>
              </div>
              <div>
                <span style={{ fontSize: 10, color: T.muted, fontFamily: 'Georgia, serif', textTransform: 'uppercase', letterSpacing: '0.5px' }}>范围 </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.text, fontFamily: 'Georgia, serif' }}>{data.length}天</span>
              </div>
            </div>
          )}
        </header>

        {/* ── Range selector + Chart ── */}
        <section style={{ paddingTop: 16 }}>
          {/* Range selector — Economist style, small uppercase text */}
          <div style={{ display: 'flex', gap: 3, marginBottom: 12 }}>
            {RANGES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setRange(key)}
                style={{
                  padding: '3px 10px',
                  fontSize: 10,
                  fontFamily: 'Georgia, serif',
                  fontWeight: range === key ? 700 : 400,
                  backgroundColor: 'transparent',
                  color: range === key ? T.text : T.muted,
                  border: 'none',
                  borderBottom: range === key ? `2px solid ${T.text}` : `2px solid transparent`,
                  cursor: 'pointer',
                  letterSpacing: '0.3px',
                  transition: 'border-color 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Chart */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, gap: 12 }}>
              <div style={{ width: 24, height: 24, border: `3px solid ${T.rule}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ color: T.muted, fontSize: 12, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>加载中</p>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
              <p style={{ color: '#c0392b', fontSize: 13 }}>{error}</p>
            </div>
          ) : (
            <div style={{ width: '100%' }}>
              <ResponsiveContainer width="100%" height={isMobile ? 260 : 380}>
                <ComposedChart data={data} margin={margin}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.grid} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke={T.muted}
                    tick={{ fill: T.muted, fontSize: 9, fontFamily: 'Georgia, serif' }}
                    tickLine={false}
                    axisLine={false}
                    padding={{ left: 0, right: 0 }}
                    allowDataOverflow={false}
                  />
                  <YAxis
                    yAxisId="sp500"
                    orientation="left"
                    stroke={T.sp500}
                    tick={{ fill: T.muted, fontSize: 9, fontFamily: 'Georgia, serif' }}
                    tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)}
                    domain={['dataMin - 50', 'dataMax + 50']}
                    width={isMobile ? 32 : 52}
                    tickLine={false}
                    axisLine={false}
                    tickCount={6}
                    padding={{ top: 0, bottom: 0 }}
                  />
                  <YAxis
                    yAxisId="vix"
                    orientation="right"
                    stroke={T.vix}
                    tick={{ fill: T.muted, fontSize: 9, fontFamily: 'Georgia, serif' }}
                    domain={[0, 'dataMax + 2']}
                    width={isMobile ? 28 : 36}
                    tickLine={false}
                    axisLine={false}
                    tickCount={6}
                    padding={{ top: 0, bottom: 0 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: T.bg,
                      border: 'none',
                      borderRadius: 0,
                      color: T.text,
                      fontSize: 11,
                      fontFamily: 'Georgia, serif',
                      boxShadow: 'none',
                      padding: '6px 10px',
                    }}
                    labelFormatter={(label) => formatFullDate(label as string)}
                    cursor={{ stroke: T.accent, strokeWidth: 1, strokeDasharray: '3 3' }}
                    formatter={(value, name) => {
                      const v = value as number;
                      if (name === 'sp500') return [v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toLocaleString(), ''];
                      return [v.toFixed(2), ''];
                    }}
                  />
                  <Legend
                    wrapperStyle={{
                      color: T.muted,
                      fontSize: 10,
                      fontFamily: 'Georgia, serif',
                      paddingTop: 8,
                      letterSpacing: '0.3px',
                    }}
                    formatter={(value) => (value === 'sp500' ? 'S&P 500' : 'VIX恐慌指数')}
                    iconType="plainline"
                    iconSize={18}
                  />
                  <Line yAxisId="sp500" type="monotone" dataKey="sp500" stroke={T.sp500} strokeWidth={1.8} dot={false} name="sp500" connectNulls />
                  <Line yAxisId="vix" type="monotone" dataKey="vix" stroke={T.vix} strokeWidth={1.8} dot={false} name="vix" connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bottom rule + source */}
          <div style={{ marginTop: 12, borderTop: `1px solid ${T.rule}`, paddingTop: 6 }}>
            <p style={{ fontSize: 9, color: T.accent, fontFamily: 'Georgia, serif', margin: 0, fontStyle: 'italic' }}>
              数据来源：Yahoo Finance · ^GSPC 标普500指数 · ^VIX CBOE恐慌指数 · 仅供参考，不构成投资建议
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
