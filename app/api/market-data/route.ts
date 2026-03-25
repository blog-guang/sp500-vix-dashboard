import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

interface ChartData {
  date: string;
  sp500: number | null;
  vix: number | null;
}

// Fallback sample data — used when API fails
const FALLBACK_DATA: ChartData[] = generateSampleData();

function generateSampleData(): ChartData[] {
  const data: ChartData[] = [];
  const startDate = new Date('2024-01-01');
  let sp500 = 4750;
  let vix = 14;

  for (let i = 0; i < 365; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    sp500 += (Math.random() - 0.48) * 50;
    sp500 = Math.max(sp500, 4000);
    vix += (Math.random() - 0.5) * 2;
    vix += (14 - vix) * 0.05;
    vix = Math.max(10, Math.min(35, vix));

    data.push({
      date: d.toISOString().split('T')[0],
      sp500: Math.round(sp500 * 100) / 100,
      vix: Math.round(vix * 100) / 100,
    });
  }
  return data;
}

async function fetchWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 8000
): Promise<T | null> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('timeout')), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } catch {
    return null;
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

export async function GET() {
  try {
    const yf = new YahooFinance();

    const [sp500Result, vixResult] = await Promise.all([
      fetchWithTimeout(
        yf.chart('^GSPC', {
          period1: '2023-01-01',
          period2: '2026-03-25',
          interval: '1d',
        }),
        8000
      ),
      fetchWithTimeout(
        yf.chart('^VIX', {
          period1: '2023-01-01',
          period2: '2026-03-25',
          interval: '1d',
        }),
        8000
      ),
    ]);

    // If either fetch failed/timed out, use fallback
    if (!sp500Result || !vixResult) {
      console.warn('Yahoo Finance fetch failed/timed out, returning fallback data');
      return NextResponse.json(FALLBACK_DATA);
    }

    const sp500Map = new Map(
      sp500Result.quotes.map((q) => {
        const date = new Date(q.date as Date).toISOString().split('T')[0];
        return [date, q.close];
      })
    );

    const vixMap = new Map(
      vixResult.quotes.map((q) => {
        const date = new Date(q.date as Date).toISOString().split('T')[0];
        return [date, q.close];
      })
    );

    const allDates = new Set([...sp500Map.keys(), ...vixMap.keys()]);
    const sortedDates = [...allDates].sort();

    const data: ChartData[] = sortedDates.map((date) => ({
      date,
      sp500: sp500Map.get(date) ?? null,
      vix: vixMap.get(date) ?? null,
    }));

    return NextResponse.json(data);
  } catch (err) {
    console.error('Failed to fetch market data:', err);
    // Return fallback data instead of error
    return NextResponse.json(FALLBACK_DATA);
  }
}
