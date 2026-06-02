import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Rider {
  id: string;
  name: string;
  email: string;
  status: 'available' | 'offline';
  activeOrders: number;
  totalDelivered: number;
  totalFailed: number;
  avgDeliveryTime: number;
  location?: {
    lat: number;
    lng: number;
    updatedAt: string;
  };
}

interface RidersState {
  riders: Rider[];
  loading: boolean;
  error: string | null;
}

const initialState: RidersState = {
  riders: [],
  loading: false,
  error: null,
};

const ridersSlice = createSlice({
  name: 'riders',
  initialState,
  reducers: {
    setRiders: (state, action: PayloadAction<Rider[]>) => {
      state.riders = action.payload;
    },
    updateRiderStatusInList: (state, action: PayloadAction<{ riderId: string; status: 'available' | 'offline' }>) => {
      const idx = state.riders.findIndex((r) => r.id === action.payload.riderId);
      if (idx !== -1) {
        state.riders[idx].status = action.payload.status;
      }
    },
    updateRiderLocationInList: (state, action: PayloadAction<{ riderId: string; lat: number; lng: number }>) => {
      const idx = state.riders.findIndex((r) => r.id === action.payload.riderId);
      if (idx !== -1) {
        state.riders[idx].location = {
          lat: action.payload.lat,
          lng: action.payload.lng,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setRiders,
  updateRiderStatusInList,
  updateRiderLocationInList,
  setLoading,
  setError,
} = ridersSlice.actions;
export default ridersSlice.reducer;
