import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

interface ChartData {
  date: string;
  sp500: number | null;
  vix: number | null;
}

export async function GET() {
  try {
    const yf = new YahooFinance();

    const [sp500Result, vixResult] = await Promise.all([
      yf.chart('^GSPC', {
        period1: '2023-01-01',
        period2: '2026-03-25',
        interval: '1d',
      }),
      yf.chart('^VIX', {
        period1: '2023-01-01',
        period2: '2026-03-25',
        interval: '1d',
      }),
    ]);

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
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
