export interface RiderPerformance {
  riderName: string;
  delivered: number;
  failed: number;
  avgTime: number;
  rating: number;
}

export interface ZoneSummary {
  zone: string;
  totalOrders: number;
  successRate: number;
}

export interface AnalyticsSummary {
  totalOrders: number;
  delivered: number;
  failed: number;
  pending: number;
  avgDeliveryTime: number;
  successRate: number;
  peakHour: string;
  riderPerformance: RiderPerformance[];
  zoneWiseSummary: ZoneSummary[];
}

export interface AnalyticsState {
  summary: AnalyticsSummary | null;
  loading: boolean;
  error: string | null;
}
