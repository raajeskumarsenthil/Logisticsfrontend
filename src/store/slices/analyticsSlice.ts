import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

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

interface AnalyticsState {
  summary: AnalyticsSummary | null;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  summary: null,
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setSummary: (state, action: PayloadAction<AnalyticsSummary>) => {
      state.summary = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    incrementTotalOrders: (state) => {
      if (state.summary) {
        state.summary.totalOrders += 1;
        state.summary.pending += 1;
      }
    },
    updateSummaryOnStatusChange: (
      state,
      action: PayloadAction<{ previousStatus: string; status: string; timeTaken?: number; zone?: string }>
    ) => {
      if (!state.summary) return;

      const { previousStatus, status, timeTaken, zone } = action.payload;

      // Adjust pending count
      const wasPending = ['pending', 'assigned', 'picked_up'].includes(previousStatus);
      const isPending = ['pending', 'assigned', 'picked_up'].includes(status);

      if (wasPending && !isPending) {
        state.summary.pending = Math.max(0, state.summary.pending - 1);
      } else if (!wasPending && isPending) {
        state.summary.pending += 1;
      }

      // Adjust delivered/failed counts
      if (status === 'delivered') {
        state.summary.delivered += 1;
        if (timeTaken) {
          const totalDel = state.summary.delivered;
          state.summary.avgDeliveryTime = Math.round(
            ((state.summary.avgDeliveryTime * (totalDel - 1)) + timeTaken) / totalDel
          );
        }
      } else if (status === 'failed') {
        state.summary.failed += 1;
      }

      // Re-calculate overall success rate
      const totalFinished = state.summary.delivered + state.summary.failed;
      state.summary.successRate = totalFinished > 0
        ? Math.round((state.summary.delivered / totalFinished) * 100)
        : 100;

      // Re-calculate zone success rate if zone matches
      if (zone) {
        const zoneIdx = state.summary.zoneWiseSummary.findIndex((z) => z.zone.toLowerCase() === zone.toLowerCase());
        if (zoneIdx !== -1) {
          const zItem = state.summary.zoneWiseSummary[zoneIdx];
          zItem.totalOrders += (previousStatus === 'pending' && status === 'assigned') ? 1 : 0;
          // Note: simplify zone updates for real-time
        }
      }
    },
  },
});

export const {
  setSummary,
  setLoading,
  setError,
  incrementTotalOrders,
  updateSummaryOnStatusChange,
} = analyticsSlice.actions;
export default analyticsSlice.reducer;
