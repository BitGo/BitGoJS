// TODO (SDKT-9): reverse engineer and add options
// export interface LatestOptions {}
export type LatestOptions = any;

// TODO (SDKT-9): reverse engineer and add options
// export interface YesterdayOptions {}
export type YesterdayOptions = any;

export interface LastDaysOptions {
  currencyName: string;
  days?: string;
}

export interface IMarkets {
  latest(params: LatestOptions): Promise<any>;
  yesterday(params: YesterdayOptions): Promise<any>;
  lastDays(params: LastDaysOptions): Promise<any>;
}
