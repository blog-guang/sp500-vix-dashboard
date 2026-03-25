declare module 'yfinance' {
  export interface HistoryData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    adjclose?: number;
  }

  export interface GetHistoryOptions {
    period1?: string;
    period2?: string;
    interval?: string;
  }

  export function getHistorical(
    symbol: string,
    options?: GetHistoryOptions
  ): Promise<HistoryData[]>;

  export default {
    getHistorical,
  };
}
